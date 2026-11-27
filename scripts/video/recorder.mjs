/**
 * Auto-records a Storvv user-guide video from a step script: drives the demo in Chromium, speaks
 * each step's narration, keeps the screen in time with the voice, then joins video, voice and
 * captions into one MP4 with ffmpeg.
 *
 * Usage:
 *   node scripts/video/record.mjs 03-quick-sale
 *   VOICE=Daniel RATE=170 BASE_URL=http://localhost:3000 node scripts/video/record.mjs 03-quick-sale
 *   NO_CAPTIONS=1 ...   (keep captions as a separate .srt instead of burning them in)
 *
 * Needs: the dev server running, Playwright's Chromium (npx playwright install chromium), ffmpeg
 * (brew install ffmpeg) and the macOS `say` command (or TTS=elevenlabs + ELEVENLABS_API_KEY).
 */
import { execFile } from 'node:child_process'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'
import { chromium } from 'playwright'

const run = promisify(execFile)

export const SIZE = { width: 1440, height: 900 }
const VOICE = process.env.VOICE || 'Daniel'
const RATE = process.env.RATE || '172'
/** Silence after each line before the next step starts, so speech never runs together. */
const GAP_MS = 450

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// ── Narration ───────────────────────────────────────────────────────────────

async function speak(text, file) {
  if (process.env.TTS === 'elevenlabs') return speakElevenLabs(text, file)
  const aiff = file.replace(/\.wav$/, '.aiff')
  await run('say', ['-v', VOICE, '-r', RATE, '-o', aiff, text])
  await run('ffmpeg', ['-y', '-loglevel', 'error', '-i', aiff, '-ar', '48000', '-ac', '1', file])
  await rm(aiff, { force: true })
}

async function speakElevenLabs(text, file) {
  const key = process.env.ELEVENLABS_API_KEY
  const voice = process.env.ELEVENLABS_VOICE_ID
  if (!key || !voice) throw new Error('Set ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID')
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}`, {
    method: 'POST',
    headers: { 'xi-api-key': key, 'content-type': 'application/json', accept: 'audio/mpeg' },
    body: JSON.stringify({ text, model_id: 'eleven_multilingual_v2' }),
  })
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`)
  const mp3 = file.replace(/\.wav$/, '.mp3')
  await writeFile(mp3, Buffer.from(await res.arrayBuffer()))
  await run('ffmpeg', ['-y', '-loglevel', 'error', '-i', mp3, '-ar', '48000', '-ac', '1', file])
  await rm(mp3, { force: true })
}

async function durationMs(file) {
  const { stdout } = await run('ffprobe', [
    '-v',
    'error',
    '-show_entries',
    'format=duration',
    '-of',
    'csv=p=0',
    file,
  ])
  return Math.round(parseFloat(stdout.trim()) * 1000)
}

// ── A visible cursor (recorded browsers don't draw the mouse) ───────────────

const CURSOR_SCRIPT = `
(() => {
  const install = () => {
    if (document.getElementById('__rec_cursor')) return
    const c = document.createElement('div')
    c.id = '__rec_cursor'
    c.innerHTML = '<svg width="26" height="26" viewBox="0 0 26 26"><path d="M4 2l17 10.5-7.4 1.6 4.3 8.2-3.3 1.6-4.3-8.2L4 21z" fill="#111" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>'
    Object.assign(c.style, { position: 'fixed', left: '0', top: '0', zIndex: 2147483647, pointerEvents: 'none', transform: 'translate(-200px,-200px)', filter: 'drop-shadow(0 2px 3px rgba(0,0,0,.35))' })
    document.documentElement.appendChild(c)
    window.addEventListener('mousemove', (e) => { c.style.transform = 'translate(' + (e.clientX - 4) + 'px,' + (e.clientY - 2) + 'px)' }, true)
    window.addEventListener('mousedown', (e) => {
      const r = document.createElement('div')
      Object.assign(r.style, { position: 'fixed', left: e.clientX - 18 + 'px', top: e.clientY - 18 + 'px', width: '36px', height: '36px', borderRadius: '50%', border: '2px solid rgba(61,99,242,.9)', background: 'rgba(61,99,242,.18)', zIndex: 2147483646, pointerEvents: 'none', transition: 'transform .45s ease-out, opacity .45s ease-out', transform: 'scale(.4)', opacity: '1' })
      document.documentElement.appendChild(r)
      requestAnimationFrame(() => { r.style.transform = 'scale(1.4)'; r.style.opacity = '0' })
      setTimeout(() => r.remove(), 500)
    }, true)
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install)
  else install()
})()`

// ── The actions a step uses ─────────────────────────────────────────────────

export function actions(page) {
  let mouse = { x: SIZE.width / 2, y: SIZE.height / 2 }

  async function pointAt(locator) {
    await locator.waitFor({ state: 'visible', timeout: 15_000 })
    await locator.scrollIntoViewIfNeeded()
    await sleep(250)
    const box = await locator.boundingBox()
    if (!box) throw new Error('Element has no box')
    return { x: box.x + Math.min(box.width / 2, 120), y: box.y + box.height / 2 }
  }

  /** Glide the cursor to an element, at an easy pace for viewers. */
  async function hover(locator) {
    const to = await pointAt(locator)
    const dist = Math.hypot(to.x - mouse.x, to.y - mouse.y)
    await page.mouse.move(to.x, to.y, { steps: Math.max(12, Math.round(dist / 14)) })
    mouse = to
    await sleep(350)
  }

  async function click(locator) {
    await hover(locator)
    await page.mouse.down()
    await sleep(90)
    await page.mouse.up()
    await sleep(500)
  }

  async function type(locator, text) {
    await click(locator)
    await locator.pressSequentially(text, { delay: 75 })
    await sleep(300)
  }

  return { page, hover, click, type, wait: sleep }
}

// ── Recording ───────────────────────────────────────────────────────────────

export async function recordVideo(script, { root }) {
  const base = process.env.BASE_URL || 'http://localhost:3000'
  const outDir = path.join(root, 'scripts/video/out')
  const work = path.join(outDir, `.work-${script.id}`)
  await rm(work, { recursive: true, force: true })
  await mkdir(work, { recursive: true })

  // 1. Narration first, so every step knows how long it has
  console.log(`Narrating ${script.steps.length} steps with "${VOICE}"…`)
  const clips = []
  for (const [i, step] of script.steps.entries()) {
    const file = path.join(work, `line-${String(i).padStart(2, '0')}.wav`)
    await speak(step.say, file)
    clips.push({ file, ms: await durationMs(file), text: step.say })
  }

  // 2. Drive the demo, capturing sharp frames straight from the browser
  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: SIZE,
    deviceScaleFactor: 1,
    colorScheme: 'light',
    locale: 'en-GB',
  })
  await context.addInitScript(CURSOR_SCRIPT)
  // The demo's sign-up nudges would pop up mid-video: mark them as already shown
  await context.addInitScript(() => {
    try {
      sessionStorage.setItem('storvv-demo-prompted', '1')
      sessionStorage.setItem('storvv-demo-signup-nudge-shown', '1')
    } catch {
      // Storage blocked: the nudge may show, the recording still works
    }
  })
  const page = await context.newPage()
  const act = actions(page)

  // Off camera: whatever the video needs to exist first (stock, staff, the right page)
  console.log('Preparing the demo…')
  await script.setup(act, base)
  await sleep(600)

  const frames = await startCapture(context, page)
  const t0 = Date.now()

  const timeline = []
  for (const [i, step] of script.steps.entries()) {
    const start = Date.now() - t0
    process.stdout.write(`  ${String(i + 1).padStart(2)}. ${step.say.slice(0, 60)}…\n`)
    // The voice, the captions and the actions run together; the step ends when all are done.
    // Actions start a moment after the line begins, so the voice leads the hand.
    const lead = step.lead ?? 500
    await Promise.all([
      step.run ? sleep(lead).then(() => step.run(act)) : Promise.resolve(),
      showCaptions(page, step.say, clips[i].ms),
    ])
    await setCaption(page, '')
    timeline.push({ start, ms: clips[i].ms, text: step.say })
    await sleep(GAP_MS)
  }
  await sleep(1200)
  const endMs = Date.now() - t0
  await frames.stop()
  await browser.close()

  // 3. One narration track, placed at each step's start
  console.log('Mixing the narration…')
  const narration = path.join(work, 'narration.wav')
  const inputs = clips.flatMap((c) => ['-i', c.file])
  const delays = timeline
    .map((t, i) => `[${i}:a]adelay=${Math.max(0, t.start)}|${Math.max(0, t.start)}[a${i}]`)
    .join(';')
  const mix = `${delays};${timeline.map((_, i) => `[a${i}]`).join('')}amix=inputs=${
    timeline.length
  }:normalize=0,apad,atrim=0:${(endMs / 1000).toFixed(2)}[out]`
  await run('ffmpeg', [
    '-y',
    '-loglevel',
    'error',
    ...inputs,
    '-filter_complex',
    mix,
    '-map',
    '[out]',
    narration,
  ])

  // 4. Captions: each line split into sentences, timed by length
  const srtFile = path.join(outDir, `${script.id}.srt`)
  await writeFile(srtFile, toSrt(timeline))

  // 5. Frames + voice → MP4 (each frame held until the next one arrived)
  console.log(`Encoding ${frames.list.length} frames…`)
  const list = await frames.writeConcat(work, t0, endMs)
  const mp4 = path.join(outDir, `${script.id}.mp4`)
  await run('ffmpeg', [
    '-y',
    '-loglevel',
    'error',
    '-f',
    'concat',
    '-safe',
    '0',
    '-i',
    list,
    '-i',
    narration,
    '-vf',
    'fps=30,format=yuv420p',
    '-map',
    '0:v',
    '-map',
    '1:a',
    '-c:v',
    'libx264',
    '-preset',
    'slow',
    '-crf',
    '16',
    '-tune',
    'stillimage',
    '-c:a',
    'aac',
    '-b:a',
    '160k',
    '-shortest',
    '-movflags',
    '+faststart',
    mp4,
  ])
  if (!process.env.KEEP_WORK) await rm(work, { recursive: true, force: true })
  return { mp4, srt: srtFile, seconds: Math.round(endMs / 1000) }
}

// ── Frame capture (Chrome screencast: crisp, full-resolution frames) ────────

async function startCapture(context, page) {
  const cdp = await context.newCDPSession(page)
  const list = []
  cdp.on('Page.screencastFrame', async ({ data, metadata, sessionId }) => {
    list.push({ at: metadata.timestamp * 1000, data })
    await cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {})
  })
  await cdp.send('Page.startScreencast', {
    format: 'jpeg',
    quality: 92,
    maxWidth: SIZE.width,
    maxHeight: SIZE.height,
  })
  return {
    list,
    async stop() {
      await cdp.send('Page.stopScreencast').catch(() => {})
    },
    /** Frames to disk plus an ffmpeg concat list giving each frame its on-screen time. */
    async writeConcat(dir, t0, endMs) {
      const kept = list.filter((f) => f.at - t0 <= endMs)
      if (kept.length === 0) throw new Error('No frames were captured')
      const lines = []
      for (const [i, f] of kept.entries()) {
        const file = path.join(dir, `frame-${String(i).padStart(5, '0')}.jpg`)
        await writeFile(file, Buffer.from(f.data, 'base64'))
        const from = i === 0 ? 0 : Math.max(0, f.at - t0)
        const to = i + 1 < kept.length ? Math.max(0, kept[i + 1].at - t0) : endMs
        lines.push(`file '${file}'`, `duration ${Math.max(0.001, (to - from) / 1000).toFixed(3)}`)
      }
      // The concat format needs the last file repeated for its duration to count
      lines.push(
        `file '${path.join(dir, `frame-${String(kept.length - 1).padStart(5, '0')}.jpg`)}'`
      )
      const listFile = path.join(dir, 'frames.txt')
      await writeFile(listFile, lines.join('\n'))
      return listFile
    },
  }
}

// ── Captions drawn in the page, so they are filmed with it ─────────────────

/** A line of narration split into sentences, each given a share of the clip by its length. */
function sentenceTimings(text, ms) {
  const sentences = text.match(/[^.!?]+[.!?]+["')]*\s*|[^.!?]+$/g) ?? [text]
  const total = sentences.reduce((n, s) => n + s.length, 0)
  return sentences.map((s) => ({ text: s.trim(), ms: Math.round((s.length / total) * ms) }))
}

async function setCaption(page, text) {
  if (process.env.NO_CAPTIONS) return
  await page
    .evaluate((t) => {
      let el = document.getElementById('__rec_caption')
      if (!el) {
        el = document.createElement('div')
        el.id = '__rec_caption'
        Object.assign(el.style, {
          position: 'fixed',
          left: '50%',
          bottom: '34px',
          transform: 'translateX(-50%)',
          maxWidth: '1000px',
          padding: '10px 18px',
          borderRadius: '12px',
          background: 'rgba(17,18,22,.86)',
          color: '#fff',
          zIndex: 2147483645,
          font: '500 22px/1.4 Inter, "Helvetica Neue", Arial, sans-serif',
          textAlign: 'center',
          pointerEvents: 'none',
          boxShadow: '0 8px 24px rgba(0,0,0,.25)',
          transition: 'opacity .15s',
        })
        document.documentElement.appendChild(el)
      }
      el.textContent = t
      el.style.opacity = t ? '1' : '0'
      // A side drawer's footer (its summary and buttons) sits at the bottom right: when one is
      // open, centre the caption in the free space to its left so it never covers them
      const drawer = [...document.querySelectorAll('[role="dialog"]')]
        .map((d) => d.getBoundingClientRect())
        .find((r) => r.width > 0 && r.width < innerWidth * 0.8 && r.right >= innerWidth - 40)
      if (drawer && drawer.left > 360) {
        el.style.left = `${drawer.left / 2}px`
        el.style.maxWidth = `${drawer.left - 48}px`
      } else {
        el.style.left = '50%'
        el.style.maxWidth = '1000px'
      }
    }, text)
    .catch(() => {})
}

async function showCaptions(page, text, ms) {
  for (const s of sentenceTimings(text, ms)) {
    await setCaption(page, s.text)
    await sleep(s.ms)
  }
}

function stamp(ms) {
  const t = Math.max(0, Math.round(ms))
  const h = String(Math.floor(t / 3_600_000)).padStart(2, '0')
  const m = String(Math.floor((t % 3_600_000) / 60_000)).padStart(2, '0')
  const s = String(Math.floor((t % 60_000) / 1000)).padStart(2, '0')
  return `${h}:${m}:${s},${String(t % 1000).padStart(3, '0')}`
}

function toSrt(timeline) {
  const cues = []
  for (const line of timeline) {
    let at = line.start
    for (const s of sentenceTimings(line.text, line.ms)) {
      cues.push({ from: at, to: at + s.ms, text: s.text })
      at += s.ms
    }
  }
  return cues.map((c, i) => `${i + 1}\n${stamp(c.from)} --> ${stamp(c.to)}\n${c.text}\n`).join('\n')
}
