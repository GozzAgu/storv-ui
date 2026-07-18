/** Stable key for merging receipt-derived customers with account balance docs. */
export function getCustomerContactKey(params: {
  email?: string | null
  phone?: string | null
  name?: string | null
}): string {
  const email = params.email?.toLowerCase().trim()
  if (email) return `email:${email}`

  const phoneDigits = params.phone?.replace(/\D/g, '')
  if (phoneDigits && phoneDigits.length >= 7) return `phone:${phoneDigits}`

  const name = params.name?.toLowerCase().trim()
  if (name) return `name:${name}`

  return 'unknown'
}

/** Firestore-safe document id from contact key. */
export function customerAccountDocId(contactKey: string): string {
  return contactKey.replace(/[/\s.#$[\]]/g, '_').slice(0, 200)
}
