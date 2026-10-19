import { createError, defineEventHandler, readBody } from 'h3'
import { getAdminAuth, getAdminFirestore } from '~/server/utils/firebase-admin'
import { rethrowFirebaseAdminSetupError } from '~/server/utils/firebase-admin-errors'
import {
  generateStaffPasswordResetLink,
  isResendConfigured,
  sendStaffCredentialsInviteEmail,
  sendStaffResetLinkInviteEmail,
} from '~/server/utils/staff-invite-email'
import { assertRateLimit } from '~/server/utils/rate-limit'
import { requireAuth } from '~/server/utils/store-auth'
import { assertStaffLoginTarget } from '~/server/utils/staff-login-target'
import { assertCanManageTarget, resolveStaffManager } from '~/server/utils/staff-admin'

type InviteMode = 'credentials' | 'reset_link'

/** Invite emails one signed-in account can send per day. */
const INVITE_EMAILS_PER_DAY = 30

/**
 * Names and the recipient come from saved records only; `staffEmail`, `staffName`,
 * `departmentName` and `businessName` in the body are ignored (older clients still send them).
 * The temporary password is the one the client just set on the new staff account, so it has to
 * come from the request.
 */
interface SendStaffInviteEmailBody {
  ownerUserId?: string
  storeId?: string
  departmentId?: string
  staffId?: string
  temporaryPassword?: string
  mode?: InviteMode
}

function joinName(first: unknown, last: unknown): string {
  return [first, last]
    .map((part) => (typeof part === 'string' ? part.trim() : ''))
    .filter(Boolean)
    .join(' ')
}

export default defineEventHandler(async (event) => {
  try {
    let auth: Awaited<ReturnType<typeof requireAuth>>
    try {
      auth = await requireAuth(event)
    } catch (err) {
      rethrowFirebaseAdminSetupError(err, 'invite')
    }

    await assertRateLimit(event, {
      id: 'staff-invite-email-day',
      uid: auth.uid,
      limit: INVITE_EMAILS_PER_DAY,
      windowMs: 24 * 60 * 60 * 1000,
      requireDistributed: true,
    })

    const body = (await readBody<SendStaffInviteEmailBody>(event)) || {}
    const ownerUserId = body.ownerUserId?.trim()
    const storeId = body.storeId?.trim()
    const departmentId = body.departmentId?.trim()
    const staffId = body.staffId?.trim()
    const mode: InviteMode = body.mode === 'credentials' ? 'credentials' : 'reset_link'
    const temporaryPassword = body.temporaryPassword?.trim()

    if (!ownerUserId || !storeId || !departmentId || !staffId) {
      throw createError({
        statusCode: 400,
        message: 'ownerUserId, storeId, departmentId, and staffId are required',
      })
    }

    if (
      mode === 'credentials' &&
      (!temporaryPassword || temporaryPassword.length < 6 || temporaryPassword.length > 128)
    ) {
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

    const ownerRef = adminDb.collection('users').doc(ownerUserId)
    const departmentRef = ownerRef
      .collection('stores')
      .doc(storeId)
      .collection('departments')
      .doc(departmentId)
    const staffRef = departmentRef.collection('staff').doc(staffId)

    const staffSnap = await staffRef.get()
    if (!staffSnap.exists) {
      throw createError({ statusCode: 404, message: 'Staff member not found' })
    }

    const staff = staffSnap.data() as {
      email?: string
      firstName?: string
      lastName?: string
      name?: string
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

    // Always the saved address: the request cannot pick who receives the email.
    const staffEmail = staff.email?.trim().toLowerCase()
    if (!staffEmail) {
      throw createError({
        statusCode: 400,
        message: 'Add an email address to this staff member before sending an invite.',
      })
    }

    const [ownerSnap, departmentSnap] = await Promise.all([ownerRef.get(), departmentRef.get()])
    const owner = ownerSnap.data() as
      | { name?: string; storeDetails?: { storeName?: string } }
      | undefined
    const businessName =
      String(owner?.storeDetails?.storeName || '').trim() ||
      String(owner?.name || '').trim() ||
      'Storvv'
    const staffName =
      joinName(staff.firstName, staff.lastName) || String(staff.name || '').trim() || 'Staff'
    const departmentName =
      String((departmentSnap.data() as { name?: string } | undefined)?.name || '').trim() ||
      'Department'

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
        console.error('[staff invite email] reset link', err)
        throw createError({
          statusCode: 502,
          message:
            'Could not create a password setup link. Try emailing the temporary password instead.',
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
    // Firebase and Resend errors can name the project, sender domain or API details.
    console.error('[staff invite email]', err)
    throw createError({
      statusCode: 502,
      message: 'Could not send the invite email. Please try again later.',
    })
  }
})
