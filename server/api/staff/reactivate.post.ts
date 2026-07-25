import { createError, defineEventHandler, readBody } from 'h3'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminAuth, getAdminFirestore } from '~/server/utils/firebase-admin'
import { rethrowFirebaseAdminSetupError } from '~/server/utils/firebase-admin-errors'
import { requireAuth, requireFreshTotp } from '~/server/utils/store-auth'

interface ReactivateStaffBody {
  ownerUserId?: string
  storeId?: string
  departmentId?: string
  staffId?: string
  totpCode?: string
}

export default defineEventHandler(async (event) => {
  let auth: Awaited<ReturnType<typeof requireAuth>>
  try {
    auth = await requireAuth(event, { requireVerifiedEmail: true })
  } catch (err) {
    rethrowFirebaseAdminSetupError(err, 'reactivate')
  }

  const body = await readBody<ReactivateStaffBody>(event)
  await requireFreshTotp(auth, body.totpCode)
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
    throw createError({ statusCode: 403, message: 'Only the store owner can reactivate staff' })
  }

  let adminDb: ReturnType<typeof getAdminFirestore>
  try {
    adminDb = getAdminFirestore()
  } catch (err) {
    rethrowFirebaseAdminSetupError(err, 'reactivate')
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
    firstName?: string
    lastName?: string
  }

  if (staff.createdBy !== ownerUserId) {
    throw createError({ statusCode: 403, message: 'Access denied' })
  }

  if ((staff.status || 'active') === 'active') {
    return { ok: true, alreadyActive: true }
  }

  if (staff.status !== 'inactive') {
    throw createError({
      statusCode: 400,
      message: 'Only removed (inactive) staff can be reactivated from this action',
    })
  }

  const authUid = staff.authUid?.trim()
  if (authUid) {
    try {
      await getAdminAuth().updateUser(authUid, { disabled: false })
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code
      if (code !== 'auth/user-not-found') {
        const message = err instanceof Error ? err.message : 'Failed to enable staff login'
        throw createError({ statusCode: 502, message: `Failed to enable staff login: ${message}` })
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
          status: 'active',
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      )
  }

  await staffRef.update({
    status: 'active',
    removedAt: FieldValue.delete(),
    removedBy: FieldValue.delete(),
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
      manager?: string
      createdBy?: string
    }
    if (dept.createdBy === ownerUserId) {
      const deptUpdate: Record<string, unknown> = {
        staffCount: (dept.staffCount ?? 0) + 1,
        updatedAt: FieldValue.serverTimestamp(),
      }
      const displayName = `${staff.firstName || ''} ${staff.lastName || ''}`.trim()
      if (staff.role === 'manager' && !dept.managerId && displayName) {
        deptUpdate.manager = displayName
        deptUpdate.managerId = staffId
      }
      await deptRef.update(deptUpdate)
    }
  }

  return { ok: true }
})
