import { createError, defineEventHandler, readBody } from 'h3'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminAuth, getAdminFirestore } from '~/server/utils/firebase-admin'
import { rethrowFirebaseAdminSetupError } from '~/server/utils/firebase-admin-errors'
import { requireAuth, requireFreshTotp } from '~/server/utils/store-auth'
import { assertStaffLoginTarget } from '~/server/utils/staff-login-target'
import { assertCanManageTarget, resolveStaffManager } from '~/server/utils/staff-admin'

interface DeactivateStaffBody {
  ownerUserId?: string
  storeId?: string
  departmentId?: string
  staffId?: string
  totpCode?: string
}

export default defineEventHandler(async (event) => {
  let auth: Awaited<ReturnType<typeof requireAuth>>
  try {
    auth = await requireAuth(event)
  } catch (err) {
    rethrowFirebaseAdminSetupError(err, 'remove')
  }
  const body = await readBody<DeactivateStaffBody>(event)
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

  let adminDb: ReturnType<typeof getAdminFirestore>
  try {
    adminDb = getAdminFirestore()
  } catch (err) {
    rethrowFirebaseAdminSetupError(err, 'remove')
  }
  const manager = await resolveStaffManager(adminDb, auth, ownerUserId, storeId)
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
    email?: string
    status?: string
    createdBy?: string
    role?: string
    admin?: boolean
  }

  const authUid = staff.authUid?.trim()
  const memberRef = authUid
    ? adminDb
        .collection('users')
        .doc(ownerUserId)
        .collection('stores')
        .doc(storeId)
        .collection('members')
        .doc(authUid)
    : null
  const member = memberRef ? (await memberRef.get()).data() : undefined
  assertCanManageTarget(manager, ownerUserId, staff, member)

  if (staff.status === 'inactive') {
    return { ok: true, alreadyInactive: true }
  }

  if (authUid) {
    const adminAuth = getAdminAuth()
    if (await assertStaffLoginTarget(adminDb, adminAuth, authUid, staff.email)) {
      try {
        await adminAuth.updateUser(authUid, { disabled: true })
      } catch (err: unknown) {
        const code = (err as { code?: string })?.code
        if (code !== 'auth/user-not-found') {
          const message = err instanceof Error ? err.message : 'Failed to disable staff login'
          throw createError({ statusCode: 502, message: `Failed to disable staff login: ${message}` })
        }
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
          admin: false,
          adminGrants: FieldValue.delete(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      )

    await adminDb
      .collection('users')
      .doc(ownerUserId)
      .collection('workspaceMembers')
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
    admin: false,
    adminGrants: FieldValue.delete(),
    removedAt: FieldValue.serverTimestamp(),
    removedBy: auth.uid,
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
