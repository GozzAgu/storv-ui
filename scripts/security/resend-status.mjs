#!/usr/bin/env node
/**
 * Does RESEND_API_KEY work, and is the sending domain verified? Never prints the key.
 * Read-only by default. With --test-send it sends one email to Resend's test inbox
 * (delivered@resend.dev, which reaches nobody) from RESEND_FROM_EMAIL, to prove the domain works
 * with a sending-only key.
 *
 * Usage:
 *   node --env-file=.env scripts/security/resend-status.mjs [--test-send]
 */
const key = (process.env.RESEND_API_KEY || '').trim()
const from = (process.env.RESEND_FROM_EMAIL || 'receipts@storvv.com').trim()
if (!key) {
  console.error('RESEND_API_KEY is empty')
  process.exit(2)
}

const res = await fetch('https://api.resend.com/domains', {
  headers: { Authorization: `Bearer ${key}` },
})
const body = await res.json().catch(() => ({}))
const fromDomain = from.replace(/.*@/, '').replace(/>.*/, '')

if (res.status === 401 || res.status === 403) {
  const sendingOnly = body?.name === 'restricted_api_key'
  const result = {
    keyAccepted: sendingOnly,
    note: sendingOnly
      ? 'Key is sending-only (right for the app); it cannot list domains.'
      : body?.message || `HTTP ${res.status}`,
    fromDomain,
  }
  if (sendingOnly && process.argv.includes('--test-send')) {
    const send = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: 'delivered@resend.dev',
        subject: 'Storvv Resend check',
        text: 'Configuration check from scripts/security/resend-status.mjs.',
      }),
    })
    const sent = await send.json().catch(() => ({}))
    result.testSend = send.ok ? 'ok: domain can send' : sent?.message || `HTTP ${send.status}`
  }
  console.log(JSON.stringify(result, null, 2))
  process.exit(0)
}

const domains = (body.data || []).map((d) => ({ name: d.name, status: d.status, region: d.region }))
console.log(
  JSON.stringify(
    {
      keyAccepted: res.ok,
      fromDomain,
      domains,
      fromDomainVerified: domains.some((d) => d.name === fromDomain && d.status === 'verified'),
    },
    null,
    2
  )
)
