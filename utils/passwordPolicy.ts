/**
 * App password rules (signup and password changes).
 * Minimum length is 12 characters, plus one number, one uppercase letter,
 * and at least one letter overall (the uppercase satisfies this).
 */
export const PASSWORD_MIN_LENGTH = 12

export type PasswordPolicyCheck = {
 id: 'length' | 'number' | 'uppercase'
 label: string
 ok: boolean
}

export function getPasswordRuleChecks(password: string): PasswordPolicyCheck[] {
 return [
 {
 id: 'length',
 label: `At least ${PASSWORD_MIN_LENGTH} characters`,
 ok: password.length >= PASSWORD_MIN_LENGTH,
 },
 {
 id: 'number',
 label: 'At least one number (0-9)',
 ok: /[0-9]/.test(password),
 },
 {
 id: 'uppercase',
 label: 'At least one uppercase letter (A-Z)',
 ok: /[A-Z]/.test(password),
 },
 ]
}

/** True when the password meets every rule (letters + numbers + one capital, min length). */
export function isPasswordPolicyValid(password: string): boolean {
 return getPasswordRuleChecks(password).every((r) => r.ok)
}

/** Human-readable reasons the password does not meet policy (empty if valid). */
export function getPasswordPolicyErrors(password: string): string[] {
 return getPasswordRuleChecks(password).filter((r) => !r.ok).map((r) => r.label)
}

/** Optional checks that improve strength (not required to sign up). */
export type PasswordBonusCheck = {
 id: 'lowercase' | 'special' | 'longer' | 'mixed'
 label: string
 ok: boolean
}

export function getPasswordBonusChecks(password: string): PasswordBonusCheck[] {
 const len = password.length
 const hasLower = /[a-z]/.test(password)
 const hasSpecial = /[^A-Za-z0-9]/.test(password)
 const uniqueRatio =
 len > 0 ? new Set(password.split('')).size / len : 0

 return [
 {
 id: 'lowercase',
 label: 'Add a lowercase letter (a-z)',
 ok: hasLower,
 },
 {
 id: 'special',
 label: 'Add a symbol (! @ # $ …)',
 ok: hasSpecial,
 },
 {
 id: 'longer',
 label: 'Use 16+ characters',
 ok: len >= 16,
 },
 {
 id: 'mixed',
 label: 'Mix different characters (avoid “aaaa” or “1111”)',
 ok: len < 4 || uniqueRatio >= 0.45,
 },
 ]
}

export type PasswordStrengthTier = 'empty' | 'weak' | 'fair' | 'good' | 'strong'

export type PasswordStrengthResult = {
 /** 0-100 */
 score: number
 /** 0-4 filled segments for UI */
 segments: 0 | 1 | 2 | 3 | 4
 tier: PasswordStrengthTier
 label: string
}

/**
 * Heuristic strength score (guidance only). Required policy is still enforced via
 * {@link isPasswordPolicyValid}; this helps users go beyond the minimum.
 */
export function getPasswordStrength(password: string): PasswordStrengthResult {
 if (!password.length) {
 return {
 score: 0,
 segments: 0,
 tier: 'empty',
 label: 'Enter a password',
 }
 }

 let score = 0
 const len = password.length

 // Length (max ~35)
 if (len >= 8) score += 6
 if (len >= 12) score += 12
 if (len >= 16) score += 10
 if (len >= 20) score += 7

 // Character classes
 if (/[a-z]/.test(password)) score += 14
 if (/[A-Z]/.test(password)) score += 14
 if (/[0-9]/.test(password)) score += 14
 if (/[^A-Za-z0-9]/.test(password)) score += 16

 // Simple repetition penalty (e.g. "aaaaaaaaaaaa")
 if (/(.)\1{4,}/.test(password)) score -= 12
 // Sequential digits penalty (e.g. 12345)
 if (/(?:0123|1234|2345|3456|4567|5678|6789|8901)/.test(password)) score -= 6

 const unique = new Set(password.split('')).size
 const ratio = unique / len
 if (len >= 8 && ratio >= 0.5) score += 6
 if (len >= 12 && ratio >= 0.65) score += 5

 score = Math.max(0, Math.min(100, Math.round(score)))

 let tier: PasswordStrengthTier
 let label: string
 if (score < 28) {
 tier = 'weak'
 label = 'Weak'
 } else if (score < 48) {
 tier = 'fair'
 label = 'Fair'
 } else if (score < 72) {
 tier = 'good'
 label = 'Good'
 } else {
 tier = 'strong'
 label = 'Strong'
 }

 // Until minimum policy is met, don’t claim “Good” or “Strong”
 if (!isPasswordPolicyValid(password)) {
 if (score >= 48) {
 tier = 'fair'
 label = 'Almost there: finish required rules'
 } else {
 tier = 'weak'
 label = 'Weak: check requirements below'
 }
 }

 const segments = (Math.min(4, Math.max(0, Math.ceil(score / 25))) || 0) as 0 | 1 | 2 | 3 | 4

 return { score, segments, tier, label }
}
