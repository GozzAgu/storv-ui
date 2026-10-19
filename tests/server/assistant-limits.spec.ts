import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { H3Event } from 'h3'

const m = vi.hoisted(() => ({ uid: 'user-1', generate: vi.fn() }))

vi.mock('h3', async (importOriginal) => ({
  ...(await importOriginal<typeof import('h3')>()),
  readBody: async () => ({ messages: [{ role: 'user', content: 'How do I add stock?' }] }),
}))
vi.mock('~/server/utils/store-auth', () => ({ requireAuth: async () => ({ uid: m.uid }) }))
vi.mock('~/server/utils/gemini-assistant', () => ({
  generateGeminiAssistantReply: m.generate,
}))
vi.mock('~/server/utils/gemini-config', () => ({
  getGeminiApiKey: () => 'key',
  getGeminiModel: () => 'secret-model-name',
  isAssistantEnabled: () => true,
  isGeminiAssistantConfigured: () => true,
}))

import chatHandler from '~/server/api/assistant/chat.post'
import statusHandler from '~/server/api/assistant/status.get'

function makeEvent(): H3Event {
  return {
    node: { req: { headers: {}, socket: { remoteAddress: '10.0.0.1' } } },
  } as unknown as H3Event
}

async function send(): Promise<number> {
  try {
    await chatHandler(makeEvent())
    return 200
  } catch (err) {
    return (err as { statusCode?: number }).statusCode ?? 500
  }
}

describe('assistant chat limits', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    m.generate.mockResolvedValue('Open Inventory and tap Add.')
    vi.stubEnv('KV_REST_API_URL', '')
    vi.stubEnv('KV_REST_API_TOKEN', '')
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '')
    vi.stubEnv('VERCEL_ENV', '')
    vi.stubEnv('NODE_ENV', 'test')
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllEnvs()
  })

  it('allows 20 messages a minute per account, then refuses', async () => {
    m.uid = 'minute-user'
    for (let i = 0; i < 20; i++) expect(await send()).toBe(200)
    expect(await send()).toBe(429)
    m.uid = 'someone-else'
    expect(await send()).toBe(200)
  })

  it('caps an account at 200 messages a day even when spread out', async () => {
    m.uid = 'daily-user'
    for (let minute = 0; minute < 10; minute++) {
      for (let i = 0; i < 20; i++) expect(await send()).toBe(200)
      vi.advanceTimersByTime(61_000)
    }
    expect(await send()).toBe(429)
    expect(m.generate).toHaveBeenCalledTimes(200)
  })

  it('refuses in production when the shared limiter is not configured', async () => {
    vi.stubEnv('VERCEL_ENV', 'production')
    m.uid = 'prod-user'
    expect(await send()).toBe(503)
    expect(m.generate).not.toHaveBeenCalled()
  })
})

describe('assistant status', () => {
  it('does not reveal the model name', async () => {
    const result = await statusHandler(makeEvent())
    expect(result).toEqual({ configured: true })
  })
})
