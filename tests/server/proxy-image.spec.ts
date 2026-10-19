import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const runtime = vi.hoisted(() => ({
  public: {
    firebase: { projectId: 'storvv', storageBucket: 'storvv.firebasestorage.app' },
    cloudinaryCloudName: 'storvv-cloud',
  } as Record<string, unknown>,
}))
vi.stubGlobal('useRuntimeConfig', () => runtime)

import { assertAllowedProxyUrl, type ProxyImageAllowConfig } from '~/server/utils/proxy-image-url'
import {
  getProxiedImageForUrl,
  PROXY_IMAGE_MAX_BYTES,
  readBodyWithLimit,
} from '~/server/utils/proxyImage'

const ALLOW: ProxyImageAllowConfig = {
  storageBucket: 'storvv.firebasestorage.app',
  cloudinaryCloudName: 'storvv-cloud',
}

const FIREBASE_URL =
  'https://firebasestorage.googleapis.com/v0/b/storvv.firebasestorage.app/o/logos%2Fa.png?alt=media&token=t'

function statusOf(fn: () => unknown): number | undefined {
  try {
    fn()
  } catch (err) {
    return (err as { statusCode?: number }).statusCode
  }
  return undefined
}

describe('assertAllowedProxyUrl', () => {
  it('allows our bucket and cloud only', () => {
    expect(() => assertAllowedProxyUrl(FIREBASE_URL, ALLOW)).not.toThrow()
    expect(() =>
      assertAllowedProxyUrl(
        'https://storage.googleapis.com/storvv.firebasestorage.app/receipts/a.jpg',
        ALLOW
      )
    ).not.toThrow()
    expect(() =>
      assertAllowedProxyUrl('https://res.cloudinary.com/storvv-cloud/image/upload/v1/a.png', ALLOW)
    ).not.toThrow()
  })

  it('refuses other buckets and clouds on allowed hosts', () => {
    expect(
      statusOf(() =>
        assertAllowedProxyUrl(
          'https://firebasestorage.googleapis.com/v0/b/someone-else.appspot.com/o/x.png',
          ALLOW
        )
      )
    ).toBe(403)
    expect(
      statusOf(() =>
        assertAllowedProxyUrl('https://storage.googleapis.com/evil-bucket/x.png', ALLOW)
      )
    ).toBe(403)
    expect(
      statusOf(() =>
        assertAllowedProxyUrl('https://res.cloudinary.com/evil/image/upload/x.png', ALLOW)
      )
    ).toBe(403)
    // Same cloud, but fetch mode instead of upload (fetch would proxy any remote URL).
    expect(
      statusOf(() =>
        assertAllowedProxyUrl(
          'https://res.cloudinary.com/storvv-cloud/image/fetch/https://evil.example/x.png',
          ALLOW
        )
      )
    ).toBe(403)
  })

  it('cannot escape the prefix with dot segments or a longer bucket name', () => {
    expect(
      statusOf(() =>
        assertAllowedProxyUrl(
          'https://storage.googleapis.com/storvv.firebasestorage.app/../evil-bucket/x.png',
          ALLOW
        )
      )
    ).toBe(403)
    expect(
      statusOf(() =>
        assertAllowedProxyUrl(
          'https://storage.googleapis.com/storvv.firebasestorage.app.evil/x.png',
          ALLOW
        )
      )
    ).toBe(403)
  })

  it('refuses a host whose configured value is missing', () => {
    expect(
      statusOf(() =>
        assertAllowedProxyUrl('https://res.cloudinary.com/storvv-cloud/image/upload/a.png', {
          ...ALLOW,
          cloudinaryCloudName: '',
        })
      )
    ).toBe(403)
    expect(
      statusOf(() => assertAllowedProxyUrl(FIREBASE_URL, { ...ALLOW, storageBucket: '' }))
    ).toBe(403)
  })

  it('refuses private hosts, other hosts and bad schemes', () => {
    expect(statusOf(() => assertAllowedProxyUrl('http://127.0.0.1/x.png', ALLOW))).toBe(403)
    expect(statusOf(() => assertAllowedProxyUrl('https://evil.example/x.png', ALLOW))).toBe(403)
    expect(statusOf(() => assertAllowedProxyUrl('file:///etc/passwd', ALLOW))).toBe(400)
    expect(statusOf(() => assertAllowedProxyUrl('not a url', ALLOW))).toBe(400)
  })

  it('reads the bucket and cloud from runtime config by default', () => {
    expect(() => assertAllowedProxyUrl(FIREBASE_URL)).not.toThrow()
    expect(
      statusOf(() =>
        assertAllowedProxyUrl('https://firebasestorage.googleapis.com/v0/b/other/o/x.png')
      )
    ).toBe(403)
  })
})

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0])

describe('getProxiedImageForUrl', () => {
  const fetchMock = vi.fn()
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
  })
  afterEach(() => {
    fetchMock.mockReset()
  })

  it('fetches without following redirects and with a timeout', async () => {
    fetchMock.mockResolvedValue(new Response(PNG, { headers: { 'content-type': 'image/png' } }))
    const result = await getProxiedImageForUrl(FIREBASE_URL)
    expect(result.contentType).toBe('image/png')
    expect(result.buffer.equals(PNG)).toBe(true)
    const init = fetchMock.mock.calls[0][1] as RequestInit
    expect(init.redirect).toBe('manual')
    expect(init.signal).toBeInstanceOf(AbortSignal)
  })

  it('treats a redirect as a failed fetch', async () => {
    fetchMock.mockResolvedValue(
      new Response(null, { status: 302, headers: { location: 'http://169.254.169.254/' } })
    )
    await expect(getProxiedImageForUrl(FIREBASE_URL)).rejects.toMatchObject({ statusCode: 502 })
  })

  it('treats a network error or timeout as a failed fetch', async () => {
    fetchMock.mockRejectedValue(new DOMException('timed out', 'TimeoutError'))
    await expect(getProxiedImageForUrl(FIREBASE_URL)).rejects.toMatchObject({ statusCode: 502 })
  })

  it('refuses a declared content-length over the cap', async () => {
    fetchMock.mockResolvedValue(
      new Response(PNG, {
        headers: { 'content-type': 'image/png', 'content-length': String(3 * 1024 * 1024) },
      })
    )
    await expect(getProxiedImageForUrl(FIREBASE_URL)).rejects.toMatchObject({ statusCode: 413 })
  })

  it('stops reading a body that grows past the cap without a content-length', async () => {
    const chunk = new Uint8Array(512 * 1024)
    let sent = 0
    const body = new ReadableStream<Uint8Array>({
      pull(controller) {
        sent += 1
        controller.enqueue(chunk)
        if (sent > 100) controller.close()
      },
    })
    fetchMock.mockResolvedValue(new Response(body, { headers: { 'content-type': 'image/png' } }))
    await expect(getProxiedImageForUrl(FIREBASE_URL)).rejects.toMatchObject({ statusCode: 413 })
    expect(sent).toBeLessThan(10)
  })

  it('refuses a URL outside the allowed paths before fetching', async () => {
    await expect(
      getProxiedImageForUrl('https://storage.googleapis.com/evil-bucket/x.png')
    ).rejects.toMatchObject({ statusCode: 403 })
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('readBodyWithLimit', () => {
  it('returns the whole body when it fits', async () => {
    const buf = await readBodyWithLimit(new Response(PNG), PROXY_IMAGE_MAX_BYTES)
    expect(buf.equals(PNG)).toBe(true)
  })

  it('throws 413 once the limit is passed', async () => {
    await expect(readBodyWithLimit(new Response(PNG), 4)).rejects.toMatchObject({
      statusCode: 413,
    })
  })
})
