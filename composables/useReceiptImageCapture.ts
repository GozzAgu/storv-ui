import { nextTick } from 'vue'
import { blobToDataUrl } from '~/utils/file-share'

const TRANSPARENT_1X1_GIF =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

const PROXY_MAX_GET_STRING_CHARS = 1800

function resolveImgHttpUrl(src: string): string | null {
  const trimmed = src.trim()
  if (!trimmed || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) return null
  if (trimmed.startsWith('//')) {
    if (import.meta.client && typeof window !== 'undefined') {
      return `${window.location.protocol}${trimmed}`
    }
    return `https:${trimmed}`
  }
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed
  return null
}

function sanitizeUnsupportedColorFunctions(cssText: string): string {
  return cssText.replace(/oklch\([^)]+\)/gi, '#000')
}

function forcePrintThemeOnClone(cloneDocument: Document, cloneRoot: HTMLElement) {
  cloneDocument.documentElement.classList.remove('dark')
  cloneDocument.body.classList.remove('dark')
  cloneDocument.documentElement.style.colorScheme = 'light'
  cloneDocument.body.style.colorScheme = 'light'
  cloneRoot.classList.add('pdf-export')
  cloneRoot.style.backgroundColor = '#ffffff'
  cloneRoot.style.color = '#111827'
  cloneRoot.style.borderColor = '#e5e7eb'
  cloneRoot.querySelectorAll<HTMLElement>('*').forEach((node) => {
    const bg = node.style.backgroundColor?.trim().toLowerCase()
    if (!bg || bg === 'transparent') node.style.backgroundColor = '#ffffff'
    const color = node.style.color?.trim().toLowerCase()
    if (!color) node.style.color = '#111827'
  })
}

function prepareHtml2CanvasClone(cloneDocument: Document, cloneRoot: HTMLElement) {
  cloneRoot.querySelectorAll('img').forEach((img) => {
    const s = (img.getAttribute('src') || '').trim()
    if (!s || s.startsWith('data:') || s.startsWith('blob:')) return
    if (s.startsWith('http://') || s.startsWith('https://') || s.startsWith('//')) {
      img.setAttribute('src', TRANSPARENT_1X1_GIF)
    }
  })
  cloneRoot.querySelectorAll<HTMLElement>('[style]').forEach((node) => {
    const style = node.getAttribute('style')
    if (!style || !/oklch\(/i.test(style)) return
    node.setAttribute('style', sanitizeUnsupportedColorFunctions(style))
  })
  cloneDocument.querySelectorAll<HTMLStyleElement>('style').forEach((styleEl) => {
    if (!styleEl.textContent || !/oklch\(/i.test(styleEl.textContent)) return
    styleEl.textContent = sanitizeUnsupportedColorFunctions(styleEl.textContent)
  })
  forcePrintThemeOnClone(cloneDocument, cloneRoot)
}

async function fetchProxyImageDataUrl(absoluteUrl: string): Promise<string> {
  const usePost = absoluteUrl.length > PROXY_MAX_GET_STRING_CHARS
  const res = usePost
    ? await fetch('/api/proxy-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: absoluteUrl }),
      })
    : await fetch(`/api/proxy-image?url=${encodeURIComponent(absoluteUrl)}`)
  if (!res.ok) throw new Error(`Image proxy ${res.status}`)
  const blob = await res.blob()
  return await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

async function injectDataUrlsForImages(el: HTMLElement): Promise<void> {
  const images = el.querySelectorAll<HTMLImageElement>('img')
  await Promise.all(
    Array.from(images).map(async (img) => {
      const attr = img.getAttribute('src')
      const url = resolveImgHttpUrl(attr || img.currentSrc || img.src)
      if (!url) return
      try {
        img.src = await fetchProxyImageDataUrl(url)
        try {
          await img.decode()
        } catch {
          /* ignore */
        }
      } catch {
        img.setAttribute('src', TRANSPARENT_1X1_GIF)
      }
    })
  )
}

function createDetachedCaptureNode(el: HTMLElement): { target: HTMLElement; cleanup: () => void } {
  if (!import.meta.client || typeof document === 'undefined') {
    return { target: el, cleanup: () => {} }
  }
  const wrapper = document.createElement('div')
  wrapper.style.cssText =
    'position:fixed;left:0;top:0;margin:0;padding:0;background:#fff;pointer-events:none;z-index:-1;overflow:visible'
  const clone = el.cloneNode(true) as HTMLElement
  clone.classList.add('pdf-export')
  clone.style.margin = '0'
  clone.style.transform = 'none'
  clone.style.position = 'static'
  wrapper.appendChild(clone)
  document.body.appendChild(wrapper)
  return {
    target: clone,
    cleanup: () => wrapper.remove(),
  }
}

async function html2CanvasReceipt(el: HTMLElement, scale: number): Promise<HTMLCanvasElement> {
  if (import.meta.client && document.fonts?.ready) await document.fonts.ready
  const { default: html2canvas } = await import('html2canvas')
  const captureWidth = Math.max(1, Math.ceil(el.scrollWidth || el.clientWidth))
  const captureHeight = Math.max(1, Math.ceil(el.scrollHeight || el.clientHeight))
  return html2canvas(el, {
    scale,
    useCORS: true,
    allowTaint: false,
    logging: false,
    backgroundColor: '#ffffff',
    width: captureWidth,
    height: captureHeight,
    x: 0,
    y: 0,
    scrollX: 0,
    scrollY: 0,
    windowWidth: captureWidth + 32,
    windowHeight: captureHeight + 32,
    onclone: prepareHtml2CanvasClone,
    foreignObjectRendering: false,
  })
}

function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Failed to create image'))),
      'image/png',
      0.92
    )
  })
}

/** Capture receipt DOM as PNG (matches on-screen receipt). */
export async function captureReceiptElementAsPng(el: HTMLElement): Promise<Blob> {
  await nextTick()
  await injectDataUrlsForImages(el)
  const { target, cleanup } = createDetachedCaptureNode(el)
  try {
    const scales = [2, 1.75, 1.5]
    let lastError: unknown
    for (const scale of scales) {
      try {
        const canvas = await html2CanvasReceipt(target, scale)
        return await canvasToPngBlob(canvas)
      } catch (e) {
        lastError = e
      }
    }
    throw lastError instanceof Error ? lastError : new Error('Could not capture receipt image')
  } finally {
    cleanup()
  }
}

/** Single-page PDF from receipt visual (PNG embedded). */
export async function captureReceiptElementAsPdf(el: HTMLElement): Promise<Blob> {
  const pngBlob = await captureReceiptElementAsPng(el)
  const dataUrl = await blobToDataUrl(pngBlob)
  const { default: jsPDF } = await import('jspdf')

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load receipt image'))
    img.src = dataUrl
  })

  const pdf = new jsPDF('p', 'mm', 'a4')
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 10
  const maxW = pageWidth - margin * 2
  const maxH = pageHeight - margin * 2
  const imgRatio = image.width / image.height
  let w = maxW
  let h = w / imgRatio
  if (h > maxH) {
    h = maxH
    w = h * imgRatio
  }
  const x = (pageWidth - w) / 2
  const y = margin
  pdf.addImage(dataUrl, 'PNG', x, y, w, h, undefined, 'FAST')
  return pdf.output('blob')
}
