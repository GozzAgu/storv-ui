import { randomUUID } from 'node:crypto'
import { readMultipartFormData } from 'h3'
import { getAdminAuth, getAdminStorageBucket } from '~/server/utils/firebase-admin'
import {
 BILLING_BLOCKED_USER_MESSAGE,
 isBillingDelinquentMessage,
} from '~/utils/storage-billing-errors'

const ALLOWED = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'])
const MAX_BYTES = 5 * 1024 * 1024

function extFromMime(mime: string, filename?: string): string {
 const m = (mime || '').toLowerCase()
 if (m === 'image/jpeg' || m === 'image/jpg') return 'jpg'
 if (m === 'image/png') return 'png'
 if (m === 'image/gif') return 'gif'
 if (m === 'image/webp') return 'webp'
 const dot = filename?.lastIndexOf('.')
 if (dot && dot > 0 && filename) {
 const e = filename.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, '')
 if (e) return e.slice(0, 8)
 }
 return 'jpg'
}

/**
 * Server-side account logo upload (Firebase Admin). Bypasses fragile browser Storage SDK issues
 * (storage/unknown from bucket/CORS/App Check). Client falls back here after client upload fails.
 */
export default defineEventHandler(async (event) => {
 const authHeader = getHeader(event, 'authorization')
 const raw = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''
 if (!raw) {
 throw createError({ statusCode: 401, message: 'Missing Authorization Bearer token' })
 }

 let uid: string
 try {
 const decoded = await getAdminAuth().verifyIdToken(raw)
 uid = decoded.uid
 } catch {
 throw createError({ statusCode: 401, message: 'Invalid or expired session. Sign in again.' })
 }

 const parts = await readMultipartFormData(event)
 const part = parts?.find((p) => p.name === 'file' && p.filename !== undefined)
 if (!part?.data?.length) {
 throw createError({ statusCode: 400, message: 'Expected multipart field "file"' })
 }

 const contentType = (part.type || 'application/octet-stream').toLowerCase()
 if (!ALLOWED.has(contentType)) {
 throw createError({ statusCode: 400, message: 'Invalid image type' })
 }
 if (part.data.length > MAX_BYTES) {
 throw createError({ statusCode: 400, message: 'File too large (max 5MB)' })
 }

 const filename = `${Date.now()}-logo.${extFromMime(contentType, part.filename)}`
 const objectPath = `images/${uid}/account-logo/${filename}`
 const downloadToken = randomUUID()

 const bucket = getAdminStorageBucket()
 const file = bucket.file(objectPath)

 try {
 await file.save(part.data, {
 metadata: {
 contentType,
 metadata: {
 firebaseStorageDownloadTokens: downloadToken,
 },
 },
 })
 } catch (saveErr: unknown) {
 const raw =
 saveErr instanceof Error
 ? saveErr.message
 : typeof saveErr === 'object' && saveErr !== null && 'message' in saveErr
 ? String((saveErr as { message: unknown }).message)
 : String(saveErr)
 if (isBillingDelinquentMessage(raw)) {
 throw createError({
 statusCode: 402,
 statusMessage: 'Billing inactive',
 message: BILLING_BLOCKED_USER_MESSAGE,
 })
 }
 throw createError({
 statusCode: 502,
 message: raw.length > 600 ? `${raw.slice(0, 600)}…` : raw,
 })
 }

 const bucketName = bucket.name
 const encodedPath = encodeURIComponent(objectPath)
 const url = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedPath}?alt=media&token=${downloadToken}`

 return { url, path: objectPath }
})
