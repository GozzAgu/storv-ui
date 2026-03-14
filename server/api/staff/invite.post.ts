import { FieldValue } from 'firebase-admin/firestore'
import { getAdminAuth, getAdminFirestore } from '~/server/utils/firebase-admin'

function randomPassword(length = 24): string {
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
    let decoded: { uid: string; email?: string }
    try {
      decoded = await auth.verifyIdToken(token)
    } catch {
      throw createError({ statusCode: 401, message: 'Invalid or expired token' })
    }
    const superAdminUid = decoded.uid

    const body = await readBody(event)
    const {
      email,
      departmentId,
      storeId,
      firstName,
      lastName,
      phone,
      position,
      role,
      hireDate,
      salary,
      status,
    } = body as {
      email?: string
      departmentId?: string
      storeId?: string
      firstName?: string
      lastName?: string
      phone?: string
      position?: string
      role?: string
      hireDate?: string
      salary?: number
      status?: string
    }

    if (!email?.trim() || !departmentId || !storeId || !firstName?.trim() || !lastName?.trim() || !position?.trim() || !role) {
      throw createError({
        statusCode: 400,
        message: 'email, departmentId, storeId, firstName, lastName, position, and role are required',
      })
    }

    const normalizedEmail = email.trim().toLowerCase()
    const firestore = getAdminFirestore()

    const temporaryPassword = randomPassword(12)
    const userRecord = await auth.createUser({
      email: normalizedEmail,
      password: temporaryPassword,
      emailVerified: false,
    })
    const staffAuthUid = userRecord.uid

    const staffRef = firestore
      .collection('users')
      .doc(superAdminUid)
      .collection('stores')
      .doc(storeId)
      .collection('departments')
      .doc(departmentId)
      .collection('staff')
      .doc()

    const newStaff = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      ...(phone !== undefined && phone !== '' && { phone: String(phone).trim() }),
      departmentId,
      storeId,
      position: position.trim(),
      role: role === 'manager' || role === 'intern' ? role : 'staff',
      hireDate: hireDate || new Date().toISOString().split('T')[0],
      ...(salary !== undefined && { salary: Number(salary) }),
      status: status === 'inactive' || status === 'on_leave' ? status : 'active',
      authUid: staffAuthUid,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      createdBy: superAdminUid,
    }

    await staffRef.set(newStaff)

    return { success: true, uid: staffAuthUid, staffId: staffRef.id, temporaryPassword }
  } catch (e: any) {
    if (e.statusCode) throw e
    if (e.code === 'auth/email-already-exists') {
      throw createError({ statusCode: 409, message: 'An account with this email already exists.' })
    }
    const message = e?.message || e?.data?.message || 'Failed to create staff invite'
    console.error('[staff/invite]', e)
    throw createError({ statusCode: 500, message })
  }
})
