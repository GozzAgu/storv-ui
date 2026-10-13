import { createError, defineEventHandler, readBody } from 'h3'
import { getAdminAuth, getAdminFirestore } from '~/server/utils/firebase-admin'
import { rethrowFirebaseAdminSetupError } from '~/server/utils/firebase-admin-errors'
import {
  generateStaffPasswordResetLink,
  isResendConfigured,
  sendStaffCredentialsInviteEmail,
  sendStaffResetLinkInviteEmail,
} from '~/server/utils/staff-invite-email'
import { requireAuth } from '~/server/utils/store-auth'
import { assertStaffLoginTarget } from '~/server/utils/staff-login-target'
import { assertCanManageTarget, resolveStaffManager } from '~/server/utils/staff-admin'

type InviteMode = 'credentials' | 'reset_link'

interface SendStaffInviteEmailBody {
  ownerUserId?: string
  storeId?: string
  departmentId?: string
  staffId?: string
  staffEmail?: string
  staffName?: string
  departmentName?: string
  businessName?: string
  temporaryPassword?: string
  mode?: InviteMode
}

export default defineEventHandler(async (event) => {
  try {
    let auth: Awaited<ReturnType<typeof requireAuth>>
    try {
      auth = await requireAuth(event)
    } catch (err) {
      rethrowFirebaseAdminSetupError(err, 'invite')
    }

    const body = await readBody<SendStaffInviteEmailBody>(event)
    const ownerUserId = body.ownerUserId?.trim()
    const storeId = body.storeId?.trim()
    const departmentId = body.departmentId?.trim()
    const staffId = body.staffId?.trim()
    const staffEmail = body.staffEmail?.trim().toLowerCase()
    const staffName = body.staffName?.trim() || 'Staff'
    const departmentName = body.departmentName?.trim() || 'Department'
    const businessName = body.businessName?.trim() || 'Storvv'
    const mode: InviteMode = body.mode === 'credentials' ? 'credentials' : 'reset_link'
    const temporaryPassword = body.temporaryPassword?.trim()

    if (!ownerUserId || !storeId || !departmentId || !staffId || !staffEmail) {
      throw createError({
        statusCode: 400,
        message: 'ownerUserId, storeId, departmentId, staffId, and staffEmail are required',
      })
    }

    if (mode === 'credentials' && (!temporaryPassword || temporaryPassword.length < 6)) {
      throw createError({
        statusCode: 400,
        message: 'temporaryPassword is required for credentials mode',
      })
    }

    let adminDb: ReturnType<typeof getAdminFirestore>
    try {
      adminDb = getAdminFirestore()
    } catch (err) {
      rethrowFirebaseAdminSetupError(err, 'invite')
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
      email?: string
      authUid?: string
      createdBy?: string
      status?: string
      admin?: boolean
    }
    const member = staff.authUid?.trim()
      ? (
          await adminDb
            .collection('users')
            .doc(ownerUserId)
            .collection('stores')
            .doc(storeId)
            .collection('members')
            .doc(staff.authUid.trim())
            .get()
        ).data()
      : undefined
    assertCanManageTarget(manager, ownerUserId, staff, member)

    const storedEmail = staff.email?.trim().toLowerCase()
    if (storedEmail && storedEmail !== staffEmail) {
      throw createError({ statusCode: 400, message: 'Staff email does not match the saved record' })
    }

    if (!isResendConfigured()) {
      throw createError({
        statusCode: 503,
        message:
          'Email is not configured on the server. Add RESEND_API_KEY and RESEND_FROM_EMAIL to your environment.',
      })
    }

    const config = useRuntimeConfig()
    const appOrigin = String(
      config.public.appOrigin || process.env.NUXT_PUBLIC_APP_ORIGIN || ''
    ).trim()
    const signInUrl = appOrigin
      ? `${appOrigin.replace(/\/$/, '')}/signin`
      : 'https://app.storvv.com/signin'

    if (mode === 'credentials') {
      await sendStaffCredentialsInviteEmail({
        toEmail: staffEmail,
        staffName,
        departmentName,
        businessName,
        signInUrl,
        temporaryPassword: temporaryPassword!,
      })
    } else {
      if (!appOrigin) {
        throw createError({
          statusCode: 500,
          message: 'App origin is not configured for password reset links',
        })
      }
      let resetLink: string
      try {
        resetLink = await generateStaffPasswordResetLink(staffEmail, appOrigin)
      } catch (err) {
        const detail = err instanceof Error ? err.message : 'Firebase could not create a reset link'
        console.error('[staff invite email] reset link', detail, err)
        throw createError({
          statusCode: 502,
          message: `Could not create a password setup link (${detail}). Try emailing the temporary password instead.`,
        })
      }
      await sendStaffResetLinkInviteEmail({
        toEmail: staffEmail,
        staffName,
        departmentName,
        businessName,
        resetLink,
      })
    }

    const authUid = staff.authUid?.trim()
    if (authUid) {
      try {
        const adminAuth = getAdminAuth()
        if (await assertStaffLoginTarget(adminDb, adminAuth, authUid, staff.email)) {
          await adminAuth.updateUser(authUid, { emailVerified: true })
        }
      } catch (err) {
        console.warn('[staff invite email] Could not mark staff email verified:', err)
      }
    }

    return {
      ok: true,
      mode,
      message:
        mode === 'credentials'
          ? `Sign-in details emailed to ${staffEmail}`
          : `Password setup link emailed to ${staffEmail}`,
    }
  } catch (err) {
    if (typeof err === 'object' && err !== null && 'statusCode' in err) throw err
    const message = err instanceof Error ? err.message : 'Failed to send staff invite email'
    console.error('[staff invite email]', message, err)
    throw createError({ statusCode: 502, message })
  }
})
