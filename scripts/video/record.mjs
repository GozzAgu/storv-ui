/**
 * Record one or more user-guide videos:
 *   node scripts/video/record.mjs 03-quick-sale
 *   node scripts/video/record.mjs all
 * Output: scripts/video/out/<id>.mp4 and <id>.srt. See recorder.mjs for options.
 */
import { readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { recordVideo } from './recorder.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(here, '../..')
const videosDir = path.join(here, 'videos')

const wanted = process.argv.slice(2)
if (wanted.length === 0) {
  console.error('Usage: node scripts/video/record.mjs <video-id | all>')
  process.exit(1)
}

const available = (await readdir(videosDir)).filter((f) => f.endsWith('.mjs')).sort()
const files = wanted.includes('all')
  ? available
  : wanted.map((id) => {
      const file = available.find((f) => f.startsWith(id))
      if (!file) throw new Error(`No script for "${id}". Have: ${available.join(', ')}`)
      return file
    })

for (const file of files) {
  const script = (await import(path.join(videosDir, file))).default
  console.log(`\n▶ ${script.id} · ${script.title}`)
  const started = Date.now()
  const result = await recordVideo(script, { root })
  console.log(
    `✔ ${path.relative(root, result.mp4)} (${result.seconds}s of video, took ${Math.round(
      (Date.now() - started) / 1000
    )}s)`
  )
}
