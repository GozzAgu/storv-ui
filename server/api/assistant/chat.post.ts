import { createError, defineEventHandler, readBody } from 'h3'
import { normalizeAssistantChatTurns, sanitizeAssistantReply } from '~/utils/assistant-chat'
import {
  buildAssistantSystemPrompt,
  buildDashboardHelpKnowledgeBase,
} from '~/utils/dashboard-help-content'
import { generateGeminiAssistantReply } from '~/server/utils/gemini-assistant'
import { getGeminiApiKey, getGeminiModel, isAssistantEnabled } from '~/server/utils/gemini-config'
import { assertRateLimit } from '~/server/utils/rate-limit'
import { requireAuth } from '~/server/utils/store-auth'

/** Each message is a paid model call, so cap how fast and how much one account can send. */
const ASSISTANT_PER_MINUTE_LIMIT = 20
const ASSISTANT_DAILY_LIMIT = 200

export default defineEventHandler(async (event) => {
  if (!isAssistantEnabled()) throw createError({ statusCode: 404, message: 'Not found' })
  const { uid } = await requireAuth(event)

  await assertRateLimit(event, {
    id: 'assistant-chat-minute',
    uid,
    limit: ASSISTANT_PER_MINUTE_LIMIT,
    windowMs: 60_000,
  })
  // A per-instance memory count is no daily cap, so production needs the shared limiter.
  await assertRateLimit(event, {
    id: 'assistant-chat-day',
    uid,
    limit: ASSISTANT_DAILY_LIMIT,
    windowMs: 24 * 60 * 60 * 1000,
    requireDistributed: true,
  })

  const apiKey = getGeminiApiKey()
  if (!apiKey) {
    throw createError({
      statusCode: 503,
      message: 'Storvv Assistant is not configured on this server.',
    })
  }

  const body = await readBody<{ messages?: unknown }>(event)
  let messages
  try {
    messages = normalizeAssistantChatTurns(body?.messages)
  } catch (error) {
    throw createError({
      statusCode: 400,
      message: error instanceof Error ? error.message : 'Invalid assistant request',
    })
  }

  const model = getGeminiModel()
  const systemInstruction = buildAssistantSystemPrompt(buildDashboardHelpKnowledgeBase())
  const rawReply = await generateGeminiAssistantReply(apiKey, model, systemInstruction, messages)

  return { reply: sanitizeAssistantReply(rawReply) }
})
