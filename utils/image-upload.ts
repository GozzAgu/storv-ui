/**
 * Every image Storvv uploads is re-encoded on the device as WebP of at most 30 KB.
 * Re-encoding also drops EXIF (GPS, camera) and applies the photo's rotation.
 */
import { IMAGE_UPLOAD_MAX_BYTES, IMAGE_UPLOAD_TYPE } from './image-upload-rules'

export {
  IMAGE_CACHE_CONTROL,
  IMAGE_UPLOAD_MAX_BYTES,
  IMAGE_UPLOAD_TYPE,
  isWebpBytes,
} from './image-upload-rules'

const QUALITIES = [0.8, 0.65, 0.5, 0.38]
const MAX_ROUNDS = 8
const MIN_EDGE = 64

export interface PrepareImageOptions {
  /** Longest edge in pixels before any shrinking for size. */
  maxEdge?: number
  maxBytes?: number
  /** File name without extension; defaults to the picked file's name. */
  name?: string
}

export function isUploadReadyImage(file: Blob): boolean {
  return file.type === IMAGE_UPLOAD_TYPE && file.size > 0 && file.size <= IMAGE_UPLOAD_MAX_BYTES
}

export function fitWithin(
  width: number,
  height: number,
  maxEdge: number
): { width: number; height: number } {
  const scale = Math.min(1, maxEdge / Math.max(width, height))
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

/** Size grows roughly with pixel area, so shrink each edge by about sqrt(target / actual). */
export function nextShrink(size: number, maxBytes: number): number {
  return Math.min(0.85, Math.max(0.5, Math.sqrt(maxBytes / size) * 0.95))
}

function baseName(name: string): string {
  const stem = name.replace(/\.[^.]*$/, '').replace(/[^a-zA-Z0-9-]+/g, '_')
  return stem.slice(0, 60) || 'image'
}

let nativeWebp: Promise<boolean> | null = null

/** Safari (and the iOS app) cannot encode WebP from a canvas; it silently returns PNG. */
function canvasEncodesWebp(): Promise<boolean> {
  nativeWebp ??= new Promise((resolve) => {
    const probe = document.createElement('canvas')
    probe.width = 1
    probe.height = 1
    probe.toBlob((blob) => resolve(blob?.type === IMAGE_UPLOAD_TYPE), IMAGE_UPLOAD_TYPE)
  })
  return nativeWebp
}

async function encodeWebp(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  if (await canvasEncodesWebp()) {
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, IMAGE_UPLOAD_TYPE, quality)
    )
    if (blob?.type === IMAGE_UPLOAD_TYPE) return blob
  }
  const { default: encode } = await import('@jsquash/webp/encode')
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not prepare the photo on this device.')
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const buffer = await encode(pixels, { quality: Math.round(quality * 100) })
  return new Blob([buffer], { type: IMAGE_UPLOAD_TYPE })
}

interface DecodedImage {
  source: CanvasImageSource
  width: number
  height: number
  close: () => void
}

async function decodeImage(file: Blob): Promise<DecodedImage> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        close: () => bitmap.close(),
      }
    } catch {
      // Older WebKit rejects some formats here but can still decode them through <img>.
    }
  }
  const url = URL.createObjectURL(file)
  const img = new Image()
  img.src = url
  try {
    await img.decode()
  } catch (err) {
    URL.revokeObjectURL(url)
    throw err
  }
  return {
    source: img,
    width: img.naturalWidth,
    height: img.naturalHeight,
    close: () => URL.revokeObjectURL(url),
  }
}

export async function prepareImageUpload(
  file: File,
  options: PrepareImageOptions = {}
): Promise<File> {
  if (file.type && !file.type.startsWith('image/')) {
    throw new Error('Choose a photo (JPEG, PNG, WebP or HEIC).')
  }
  const maxBytes = options.maxBytes ?? IMAGE_UPLOAD_MAX_BYTES
  let image: DecodedImage
  try {
    image = await decodeImage(file)
  } catch {
    throw new Error('This photo could not be opened. Try a JPEG or PNG.')
  }

  try {
    let { width, height } = fitWithin(image.width, image.height, options.maxEdge ?? 1200)
    const canvas = document.createElement('canvas')
    for (let round = 0; round < MAX_ROUNDS; round++) {
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Could not prepare the photo on this device.')
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(image.source, 0, 0, width, height)

      let last = 0
      for (const quality of QUALITIES) {
        const blob = await encodeWebp(canvas, quality)
        if (blob.size <= maxBytes) {
          return new File([blob], `${baseName(options.name ?? file.name)}.webp`, {
            type: IMAGE_UPLOAD_TYPE,
            lastModified: Date.now(),
          })
        }
        last = blob.size
        // Far too big: lowering quality alone will not get there, so shrink straight away.
        if (blob.size > maxBytes * 4) break
      }

      const shrink = nextShrink(last, maxBytes)
      if (Math.max(width, height) * shrink < MIN_EDGE) break
      width = Math.max(1, Math.round(width * shrink))
      height = Math.max(1, Math.round(height * shrink))
    }
  } finally {
    image.close()
  }
  throw new Error(`This photo could not be shrunk to ${Math.round(maxBytes / 1024)} KB.`)
}

/** Leaves files that already meet the rule alone, so callers can prepare once up front. */
export async function ensureImageUpload(
  file: File,
  options: PrepareImageOptions = {}
): Promise<File> {
  return isUploadReadyImage(file) ? file : prepareImageUpload(file, options)
}
