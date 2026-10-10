import { describe, expect, it } from 'vitest'
import {
  IMAGE_UPLOAD_MAX_BYTES,
  fitWithin,
  isUploadReadyImage,
  isWebpBytes,
  nextShrink,
  prepareImageUpload,
} from '~/utils/image-upload'

const bytes = (text: string) => new TextEncoder().encode(text)

describe('image upload rule', () => {
  it('is 30 KB', () => {
    expect(IMAGE_UPLOAD_MAX_BYTES).toBe(30 * 1024)
  })

  it('recognises real WebP bytes, not just the declared type', () => {
    expect(isWebpBytes(bytes('RIFF\x10\x00\x00\x00WEBPVP8 '))).toBe(true)
    expect(isWebpBytes(bytes('\x89PNG\r\n\x1a\n\x00\x00\x00\x0d'))).toBe(false)
    expect(isWebpBytes(bytes('RIFF\x10\x00\x00\x00WAVE'))).toBe(false)
    expect(isWebpBytes(bytes('RIFF'))).toBe(false)
  })

  it('only WebP within 30 KB skips re-encoding', () => {
    const webp = (size: number) => new Blob([new Uint8Array(size)], { type: 'image/webp' })
    expect(isUploadReadyImage(webp(30 * 1024))).toBe(true)
    expect(isUploadReadyImage(webp(30 * 1024 + 1))).toBe(false)
    expect(isUploadReadyImage(webp(0))).toBe(false)
    expect(isUploadReadyImage(new Blob([new Uint8Array(10)], { type: 'image/jpeg' }))).toBe(false)
  })

  it('fits the longest edge without upscaling', () => {
    expect(fitWithin(4032, 3024, 1200)).toEqual({ width: 1200, height: 900 })
    expect(fitWithin(3024, 4032, 512)).toEqual({ width: 384, height: 512 })
    expect(fitWithin(300, 200, 1200)).toEqual({ width: 300, height: 200 })
  })

  it('shrinks harder the further over the limit, within bounds', () => {
    expect(nextShrink(31 * 1024, 30 * 1024)).toBe(0.85)
    expect(nextShrink(60 * 1024, 30 * 1024)).toBeCloseTo(0.672, 3)
    expect(nextShrink(10 * 1024 * 1024, 30 * 1024)).toBe(0.5)
  })

  it('refuses files that are not images', async () => {
    const pdf = new File(['%PDF-1.7'], 'statement.pdf', { type: 'application/pdf' })
    await expect(prepareImageUpload(pdf)).rejects.toThrow('Choose a photo')
  })
})
