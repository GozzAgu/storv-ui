import { createError, defineEventHandler, readBody } from 'h3'
import { normalizeAssistantChatTurns, sanitizeAssistantReply } from '~/utils/assistant-chat'
import {
  buildAssistantSystemPrompt,
  buildDashboardHelpKnowledgeBase,
} from '~/utils/dashboard-help-content'
import { generateGeminiAssistantReply } from '~/server/utils/gemini-assistant'
import { getGeminiApiKey, getGeminiModel } from '~/server/utils/gemini-config'
import { requireAuth } from '~/server/utils/store-auth'

export default defineEventHandler(async (event) => {
  await requireAuth(event)

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
