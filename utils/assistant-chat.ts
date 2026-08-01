export type AssistantChatRole = 'user' | 'assistant'

export type AssistantChatTurn = {
  role: AssistantChatRole
  content: string
}

export const ASSISTANT_MAX_TURNS = 20
export const ASSISTANT_MAX_MESSAGE_CHARS = 2000

/** Strip Markdown bold markers so assistant replies stay plain text in the UI. */
export function sanitizeAssistantReply(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/gs, '$1')
    .replace(/\*\*/g, '')
    .trim()
}

export function normalizeAssistantChatTurns(raw: unknown): AssistantChatTurn[] {
  if (!Array.isArray(raw)) {
    throw new Error('messages must be an array')
  }

  const turns: AssistantChatTurn[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const role = (item as { role?: unknown }).role
    const content = (item as { content?: unknown }).content
    if (role !== 'user' && role !== 'assistant') continue
    if (typeof content !== 'string') continue
    const trimmed = content.trim()
    if (!trimmed) continue
    if (trimmed.length > ASSISTANT_MAX_MESSAGE_CHARS) {
      throw new Error(`Each message must be at most ${ASSISTANT_MAX_MESSAGE_CHARS} characters`)
    }
    turns.push({ role, content: trimmed })
  }

  if (turns.length === 0) {
    throw new Error('At least one message is required')
  }

  if (turns.length > ASSISTANT_MAX_TURNS) {
    throw new Error(`Conversation is limited to ${ASSISTANT_MAX_TURNS} messages`)
  }

  if (turns[turns.length - 1]?.role !== 'user') {
    throw new Error('The last message must be from the user')
  }

  return turns
}
