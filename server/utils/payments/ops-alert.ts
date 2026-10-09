import { FieldValue, type Firestore } from 'firebase-admin/firestore'
import { escapeHtml } from '~/server/utils/receipt-email-html'
import type { EmailSender } from './notify'

export const OPS_ALERTS_COLLECTION = 'paymentsOpsAlerts'

export type OpsAlertFields = Record<string, string | number | boolean | null>

export interface OpsAlertDeps {
  /** Storvv ops inbox (PAYMENTS_ALERT_EMAIL). Without it alerts go to the server log only. */
  to?: string
  sendEmail?: EmailSender
}

export function opsAlertDepsFromEnv(
  sendEmail: EmailSender | undefined,
  env: NodeJS.ProcessEnv = process.env
): OpsAlertDeps {
  const to = String(env.PAYMENTS_ALERT_EMAIL || '').trim()
  return to && sendEmail ? { to, sendEmail } : {}
}

const docId = (alert: string, key: string) =>
  `${alert}__${key}`.replace(/[^A-Za-z0-9_-]+/g, '_').slice(0, 300)

/**
 * Storvv-side alert for something a person must look at (broken audit chain, a verify mismatch,
 * a payment that could not be applied). Always logged as `payments-alert`; emailed to ops once
 * per alert and key. Fields must never carry tokens, secrets, emails or customer names.
 * Never throws: the caller's money change has already committed or failed closed.
 */
export async function opsAlert(
  db: Firestore,
  alert: string,
  key: string,
  fields: OpsAlertFields,
  deps: OpsAlertDeps = {}
): Promise<{ emailed: boolean }> {
  console.error(JSON.stringify({ tag: 'payments-alert', alert, ...fields }))
  if (!deps.to || !deps.sendEmail) return { emailed: false }
  try {
    await db
      .collection(OPS_ALERTS_COLLECTION)
      .doc(docId(alert, key))
      .create({ alert, key, fields, createdAt: FieldValue.serverTimestamp() })
  } catch (err) {
    if ((err as { code?: number }).code === 6) return { emailed: false }
    console.error(JSON.stringify({ tag: 'payments-ops-alert-failed', alert, stage: 'record' }))
    return { emailed: false }
  }
  const rows = Object.entries(fields)
    .map(([k, v]) => `<tr><td>${escapeHtml(k)}</td><td>${escapeHtml(String(v))}</td></tr>`)
    .join('')
  try {
    await deps.sendEmail({
      toEmail: deps.to,
      subject: `[Storvv payments] ${alert}`.replace(/[\r\n]+/g, ' '),
      html: `<p>Payments alert: <strong>${escapeHtml(alert)}</strong></p><table>${rows}</table>`,
    })
    return { emailed: true }
  } catch {
    console.error(JSON.stringify({ tag: 'payments-ops-alert-failed', alert, stage: 'email' }))
    return { emailed: false }
  }
}
