import { getResendConfig, isResendConfigured } from '~/server/utils/delivery-config'
import { getAdminAuth } from '~/server/utils/firebase-admin'
import { getAuthActionContinueUrl } from '~/utils/firebase-auth-action'

export { isResendConfigured }

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

async function sendViaResend(params: {
  toEmail: string
  subject: string
  html: string
}): Promise<void> {
  const { apiKey, from } = getResendConfig()
  if (!apiKey) {
    throw new Error(
      'Email is not configured. Add RESEND_API_KEY and RESEND_FROM_EMAIL to your server environment.'
    )
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from,
      to: [params.toEmail.trim().toLowerCase()],
      subject: params.subject,
      html: params.html,
    }),
  })

  if (!response.ok) {
    const err = (await response.json().catch(() => ({}))) as {
      message?: string
      name?: string
    }
    const detail = err.message || `Email send failed (${response.status})`
    throw new Error(
      `${detail} (from: ${from}). Check RESEND_FROM_EMAIL is a verified domain in Resend.`
    )
  }
}

export async function generateStaffPasswordResetLink(
  staffEmail: string,
  appOrigin: string
): Promise<string> {
  const continueUrl = getAuthActionContinueUrl(appOrigin.replace(/\/$/, ''), 'reset')
  return getAdminAuth().generatePasswordResetLink(staffEmail.trim().toLowerCase(), {
    url: continueUrl,
    handleCodeInApp: true,
  })
}

export async function sendStaffCredentialsInviteEmail(params: {
  toEmail: string
  staffName: string
  departmentName: string
  businessName: string
  signInUrl: string
  temporaryPassword: string
}): Promise<void> {
  const name = escapeHtml(params.staffName || 'there')
  const dept = escapeHtml(params.departmentName || 'your department')
  const business = escapeHtml(params.businessName || 'Storvv')
  const signInUrl = escapeHtml(params.signInUrl)
  const email = escapeHtml(params.toEmail.trim().toLowerCase())
  const password = escapeHtml(params.temporaryPassword)

  const html = `
    <p>Hi ${name},</p>
    <p>You've been invited to <strong>${business}</strong> on Storvv (${dept}).</p>
    <p><strong>Sign in:</strong> <a href="${signInUrl}">${signInUrl}</a></p>
    <p><strong>Email:</strong> ${email}<br/>
    <strong>Temporary password:</strong> <code>${password}</code></p>
    <p>You'll be asked to set a new password when you sign in for the first time.</p>
    <p>If you did not expect this email, you can ignore it.</p>
  `.trim()

  await sendViaResend({
    toEmail: params.toEmail,
    subject: `Your Storvv sign-in for ${params.businessName || 'your store'}`,
    html,
  })
}

export async function sendStaffResetLinkInviteEmail(params: {
  toEmail: string
  staffName: string
  departmentName: string
  businessName: string
  resetLink: string
}): Promise<void> {
  const name = escapeHtml(params.staffName || 'there')
  const dept = escapeHtml(params.departmentName || 'your department')
  const business = escapeHtml(params.businessName || 'Storvv')
  const resetLink = escapeHtml(params.resetLink)

  const html = `
    <p>Hi ${name},</p>
    <p>You've been invited to <strong>${business}</strong> on Storvv (${dept}).</p>
    <p><a href="${resetLink}">Set your password and sign in</a></p>
    <p>This link expires after a short time. If it stops working, ask your admin to send a new invite email.</p>
    <p>If you did not expect this email, you can ignore it.</p>
  `.trim()

  await sendViaResend({
    toEmail: params.toEmail,
    subject: `Set up your Storvv account for ${params.businessName || 'your store'}`,
    html,
  })
}
