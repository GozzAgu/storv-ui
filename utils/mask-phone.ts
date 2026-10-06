/**
 * Masks a phone number for display, keeping only the last four digits (and the country
 * code for international numbers): `+2348031234921` → `+234 ••• ••• 4921`.
 */
export function maskPhone(raw: string | null | undefined): string {
  const value = String(raw ?? '').trim()
  if (!value) return ''

  let digits = value.replace(/\D/g, '')
  if (digits.length < 7) return value

  const last4 = digits.slice(-4)
  const international = value.startsWith('+') || value.startsWith('00')
  if (!international || digits.length <= 10) return `••• ••• ${last4}`

  if (value.startsWith('00')) digits = digits.slice(2)
  return `+${digits.slice(0, digits.length - 10)} ••• ••• ${last4}`
}
