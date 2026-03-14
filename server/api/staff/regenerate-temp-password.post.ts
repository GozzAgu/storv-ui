import { getAdminAuth, getAdminFirestore } from '~/server/utils/firebase-admin'

function randomPassword(length = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let s = ''
  const bytes = new Uint8Array(length)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes)
    for (let i = 0; i < length; i++) s += chars[bytes[i]! % chars.length]
  } else {
    for (let i = 0; i < length; i++) s += chars[Math.floor(Math.random() * chars.length)]
  }
  return s
}

export default defineEventHandler(async (event) => {
  try {
    const authHeader = getHeader(event, 'authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      throw createError({ statusCode: 401, message: 'Authorization Bearer token required' })
    }

    const auth = getAdminAuth()
    let decoded: { uid: string }
    try {
      decoded = await auth.verifyIdToken(token)
    } catch {
      throw createError({ statusCode: 401, message: 'Invalid or expired token' })
    }
    const superAdminUid = decoded.uid

    const body = await readBody(event)
    const { staffId, departmentId, storeId } = body as { staffId?: string; departmentId?: string; storeId?: string }

    if (!staffId || !departmentId || !storeId) {
      throw createError({
        statusCode: 400,
        message: 'staffId, departmentId, and storeId are required',
      })
    }

    const firestore = getAdminFirestore()
    const staffRef = firestore
      .collection('users')
      .doc(superAdminUid)
      .collection('stores')
      .doc(storeId)
      .collection('departments')
      .doc(departmentId)
      .collection('staff')
      .doc(staffId)

    const staffSnap = await staffRef.get()
    if (!staffSnap.exists) {
      throw createError({ statusCode: 404, message: 'Staff member not found' })
    }

    const staffData = staffSnap.data()
    const authUid = staffData?.authUid as string | undefined
    if (!authUid) {
      throw createError({ statusCode: 400, message: 'Staff account has no auth UID' })
    }

    const newPassword = randomPassword(12)
    await auth.updateUser(authUid, { password: newPassword })

    return { temporaryPassword: newPassword }
  } catch (e: any) {
    if (e.statusCode) throw e
    const message = e?.message || e?.data?.message || 'Failed to regenerate temporary password'
    console.error('[staff/regenerate-temp-password]', e)
    throw createError({ statusCode: 500, message })
  }
})
