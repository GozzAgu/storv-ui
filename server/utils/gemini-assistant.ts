import { createError } from 'h3'
import type { AssistantChatTurn } from '~/utils/assistant-chat'
import { formatGeminiAssistantError } from '~/utils/gemini-errors'

type GeminiPart = { text?: string }

type GeminiResponse = {
  candidates?: Array<{
    content?: { parts?: GeminiPart[] }
  }>
  error?: { message?: string }
}

export async function generateGeminiAssistantReply(
  apiKey: string,
  model: string,
  systemInstruction: string,
  messages: AssistantChatTurn[]
): Promise<string> {
  const contents = messages.map((message) => ({
    role: message.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: message.content }],
  }))

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`

  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents,
        generationConfig: {
          temperature: 0.35,
          maxOutputTokens: 1024,
        },
      }),
    })
  } catch {
    throw createError({
      statusCode: 502,
      message: 'Assistant is temporarily unavailable. Please try again.',
    })
  }

  const data = (await response.json()) as GeminiResponse
  if (!response.ok) {
    const raw = data.error?.message || 'Assistant request failed. Please try again.'
    throw createError({
      statusCode: response.status === 429 ? 429 : 502,
      message: formatGeminiAssistantError(raw, model),
    })
  }

  const text = (data.candidates?.[0]?.content?.parts ?? [])
    .map((part) => part.text ?? '')
    .join('')
    .trim()

  if (!text) {
    throw createError({
      statusCode: 502,
      message: 'Assistant returned an empty response. Please try again.',
    })
  }

  return text
}
