import { defineEventHandler, getRequestHeader, sendNoContent, setResponseHeaders } from 'h3'
import { isCapacitorOrigin } from '~/utils/capacitor-cors-origins'

/** Allow iOS/Android shells to call hosted `/api/*` on app.storvv.com. */
export default defineEventHandler((event) => {
  const path = event.path || ''
  if (!path.startsWith('/api/')) return

  const origin = getRequestHeader(event, 'origin')
  if (!origin || !isCapacitorOrigin(origin)) return

  setResponseHeaders(event, {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, Accept',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  })

  if (event.method === 'OPTIONS') {
    return sendNoContent(event, 204)
  }
})
