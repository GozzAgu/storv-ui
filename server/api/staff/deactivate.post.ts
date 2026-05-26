import { createError, defineEventHandler, readBody } from 'h3'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminAuth, getAdminFirestore } from '~/server/utils/firebase-admin'
import { rethrowFirebaseAdminSetupError } from '~/server/utils/firebase-admin-errors'
import { requireAuth } from '~/server/utils/store-auth'

interface DeactivateStaffBody {
  ownerUserId?: string
  storeId?: string
  departmentId?: string
  staffId?: string
}

export default defineEventHandler(async (event) => {
  let auth: Awaited<ReturnType<typeof requireAuth>>
  try {
    auth = await requireAuth(event)
  } catch (err) {
    rethrowFirebaseAdminSetupError(err, 'remove')
  }
  const body = await readBody<DeactivateStaffBody>(event)
  const ownerUserId = body.ownerUserId?.trim()
  const storeId = body.storeId?.trim()
  const departmentId = body.departmentId?.trim()
  const staffId = body.staffId?.trim()

  if (!ownerUserId || !storeId || !departmentId || !staffId) {
    throw createError({
      statusCode: 400,
      message: 'ownerUserId, storeId, departmentId and staffId are required',
    })
  }

  if (auth.uid !== ownerUserId) {
    throw createError({ statusCode: 403, message: 'Only the store owner can remove staff' })
  }

  let adminDb: ReturnType<typeof getAdminFirestore>
  try {
    adminDb = getAdminFirestore()
  } catch (err) {
    rethrowFirebaseAdminSetupError(err, 'remove')
  }
  const staffRef = adminDb
    .collection('users')
    .doc(ownerUserId)
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

  const staff = staffSnap.data() as {
    authUid?: string
    status?: string
    createdBy?: string
    role?: string
  }

  if (staff.createdBy !== ownerUserId) {
    throw createError({ statusCode: 403, message: 'Access denied' })
  }

  if (staff.status === 'inactive') {
    return { ok: true, alreadyInactive: true }
  }

  const authUid = staff.authUid?.trim()
  if (authUid) {
    try {
      await getAdminAuth().updateUser(authUid, { disabled: true })
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code
      if (code !== 'auth/user-not-found') {
        const message = err instanceof Error ? err.message : 'Failed to disable staff login'
        throw createError({ statusCode: 502, message: `Failed to disable staff login: ${message}` })
      }
    }

    await adminDb
      .collection('users')
      .doc(ownerUserId)
      .collection('stores')
      .doc(storeId)
      .collection('members')
      .doc(authUid)
      .set(
        {
          status: 'inactive',
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      )
  }

  await staffRef.update({
    status: 'inactive',
    removedAt: FieldValue.serverTimestamp(),
    removedBy: ownerUserId,
    updatedAt: FieldValue.serverTimestamp(),
  })

  const deptRef = adminDb
    .collection('users')
    .doc(ownerUserId)
    .collection('stores')
    .doc(storeId)
    .collection('departments')
    .doc(departmentId)

  const deptSnap = await deptRef.get()
  if (deptSnap.exists) {
    const dept = deptSnap.data() as {
      staffCount?: number
      managerId?: string
      createdBy?: string
    }
    if (dept.createdBy === ownerUserId) {
      const deptUpdate: Record<string, unknown> = {
        staffCount: Math.max(0, (dept.staffCount ?? 0) - 1),
        updatedAt: FieldValue.serverTimestamp(),
      }
      if (staff.role === 'manager' && dept.managerId === staffId) {
        deptUpdate.manager = FieldValue.delete()
        deptUpdate.managerId = FieldValue.delete()
      }
      await deptRef.update(deptUpdate)
    }
  }

  return { ok: true }
})
