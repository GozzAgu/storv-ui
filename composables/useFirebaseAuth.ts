import { 
 signInWithEmailAndPassword, 
 createUserWithEmailAndPassword,
 signOut as firebaseSignOut,
 sendPasswordResetEmail,
 onAuthStateChanged,
 RecaptchaVerifier,
 signInWithPhoneNumber,
 updatePassword,
 reauthenticateWithCredential,
 EmailAuthProvider,
 multiFactor,
 getMultiFactorResolver,
 type User,
 type Auth,
 type ConfirmationResult
} from 'firebase/auth'
import { getFirebaseClientAuth } from '~/utils/firebase-client-auth'
import { sendUserEmailVerification } from '~/utils/emailVerification'

/**
 * Composable for Firebase Authentication
 */
export const useFirebaseAuth = () => {
 const getAuthInstance = (): Auth | null => {
 if (import.meta.server) return null
 return getFirebaseClientAuth()
 }

 // Use shared state (initialized by plugin)
 const currentUser = useState<User | null>('firebase-auth-user', () => null)
 const loading = useState<boolean>('firebase-auth-loading', () => false)
 
 // On server-side, loading should be false
 if (import.meta.server) {
 loading.value = false
 }

 // Sign in with email and password
 const signIn = async (email: string, password: string) => {
 const auth = getAuthInstance()
 if (!auth) {
 throw new Error('Firebase Auth not initialized')
 }

 try {
 const userCredential = await signInWithEmailAndPassword(auth, email, password)
 return userCredential.user
 } catch (error: any) {
 throw new Error(error.message || 'Sign in failed')
 }
 }

 // Sign up with email and password
 const signUp = async (
 email: string,
 password: string,
 sendVerificationEmail: boolean = true
 ): Promise<{ user: User; verificationEmailSent: boolean }> => {
 const auth = getAuthInstance()
 if (!auth) {
 throw new Error('Firebase Auth not initialized')
 }

 try {
 const userCredential = await createUserWithEmailAndPassword(auth, email, password)
 const user = userCredential.user

 let verificationEmailSent = false
 if (sendVerificationEmail && user && !user.emailVerified) {
 try {
 const runtimeConfig = useRuntimeConfig()
 await sendUserEmailVerification(user, (runtimeConfig.public.appOrigin as string) || '')
 verificationEmailSent = true
 } catch (verificationError: unknown) {
 const code = (verificationError as { code?: string })?.code
 const msg = (verificationError as Error)?.message
 console.error('Failed to send verification email:', code, msg, verificationError)
 }
 }

 return { user, verificationEmailSent }
 } catch (error: any) {
 throw new Error(error.message || 'Sign up failed')
 }
 }

 // Sign out
 const signOut = async () => {
 const auth = getAuthInstance()
 if (!auth) {
 throw new Error('Firebase Auth not initialized')
 }

 try {
 await firebaseSignOut(auth)
 } catch (error: any) {
 throw new Error(error.message || 'Sign out failed')
 }
 }

 // Send password reset email
 const resetPassword = async (email: string) => {
 const auth = getAuthInstance()
 if (!auth) {
 throw new Error('Firebase Auth not initialized')
 }

 try {
 await sendPasswordResetEmail(auth, email)
 } catch (error: any) {
 throw new Error(error.message || 'Password reset failed')
 }
 }

 // Send email verification
 const sendVerificationEmail = async (user?: User) => {
 const auth = getAuthInstance()
 if (!auth) {
 throw new Error('Firebase Auth not initialized')
 }

 const targetUser = user || auth.currentUser
 if (!targetUser) {
 throw new Error('No user found to send verification email')
 }

 if (targetUser.emailVerified) {
 throw new Error('Email is already verified')
 }

 try {
 const runtimeConfig = useRuntimeConfig()
 await sendUserEmailVerification(targetUser, (runtimeConfig.public.appOrigin as string) || '')
 } catch (error: any) {
 if (error.code === 'auth/too-many-requests') {
 throw new Error('Too many verification emails sent. Please try again later.')
 }
 throw new Error(error.message || 'Failed to send verification email')
 }
 }


 // Phone authentication functions
 let recaptchaVerifier: RecaptchaVerifier | null = null
 let confirmationResult: ConfirmationResult | null = null

 // Initialize reCAPTCHA verifier
 const initializeRecaptcha = (containerId: string = 'recaptcha-container'): Promise<RecaptchaVerifier> => {
 return new Promise((resolve, reject) => {
 if (import.meta.server) {
 reject(new Error('reCAPTCHA can only be initialized on the client side'))
 return
 }

 const auth = getAuthInstance()
 if (!auth) {
 reject(new Error('Firebase Auth not initialized'))
 return
 }

 try {
 // Clean up existing verifier if any
 if (recaptchaVerifier) {
 recaptchaVerifier.clear()
 }

 // Create new reCAPTCHA verifier
 recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
 size: 'invisible',
 callback: () => {
 resolve(recaptchaVerifier!)
 },
 'expired-callback': () => {
 reject(new Error('reCAPTCHA expired. Please try again.'))
 }
 })

 // Render reCAPTCHA
 recaptchaVerifier.render().then(() => {
 resolve(recaptchaVerifier!)
 }).catch(reject)
 } catch (error: any) {
 reject(new Error(error.message || 'Failed to initialize reCAPTCHA'))
 }
 })
 }

 // Send SMS code to phone number
 const sendPhoneVerificationCode = async (phoneNumber: string, containerId: string = 'recaptcha-container'): Promise<ConfirmationResult> => {
 const auth = getAuthInstance()
 if (!auth) {
 throw new Error('Firebase Auth not initialized')
 }

 try {
 // Initialize reCAPTCHA if not already done
 if (!recaptchaVerifier) {
 await initializeRecaptcha(containerId)
 }

 if (!recaptchaVerifier) {
 throw new Error('reCAPTCHA verifier not initialized')
 }

 // Format phone number (ensure it includes country code)
 const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`

 // Send verification code
 confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier)
 return confirmationResult
 } catch (error: any) {
 // Clean up on error
 if (recaptchaVerifier) {
 recaptchaVerifier.clear()
 recaptchaVerifier = null
 }

 if (error.code === 'auth/invalid-phone-number') {
 throw new Error('Invalid phone number format. Please include country code (e.g., +1234567890)')
 }
 if (error.code === 'auth/too-many-requests') {
 throw new Error('Too many attempts. Please try again later.')
 }
 if (error.code === 'auth/quota-exceeded') {
 throw new Error('SMS quota exceeded. Please try again later.')
 }
 if (error.code === 'auth/captcha-check-failed') {
 throw new Error('reCAPTCHA verification failed. Please try again.')
 }
 throw new Error(error.message || 'Failed to send verification code')
 }
 }

 // Verify SMS code and sign in
 const verifyPhoneCode = async (code: string): Promise<User> => {
 if (!confirmationResult) {
 throw new Error('No verification session found. Please request a new code.')
 }

 try {
 const result = await confirmationResult.confirm(code)
 
 // Clean up
 if (recaptchaVerifier) {
 recaptchaVerifier.clear()
 recaptchaVerifier = null
 }
 confirmationResult = null

 return result.user
 } catch (error: any) {
 if (error.code === 'auth/invalid-verification-code') {
 throw new Error('Invalid verification code. Please try again.')
 }
 if (error.code === 'auth/code-expired') {
 throw new Error('Verification code expired. Please request a new code.')
 }
 throw new Error(error.message || 'Failed to verify code')
 }
 }

 // Clean up reCAPTCHA
 const clearRecaptcha = () => {
 if (recaptchaVerifier) {
 recaptchaVerifier.clear()
 recaptchaVerifier = null
 }
 confirmationResult = null
 }

 // Update password (requires re-authentication)
 const updateUserPassword = async (currentPassword: string, newPassword: string) => {
 const auth = getAuthInstance()
 if (!auth) {
 throw new Error('Firebase Auth not initialized')
 }

 const user = auth.currentUser
 if (!user || !user.email) {
 throw new Error('No authenticated user found')
 }

 try {
 // Re-authenticate user
 const credential = EmailAuthProvider.credential(user.email, currentPassword)
 await reauthenticateWithCredential(user, credential)

 // Update password
 await updatePassword(user, newPassword)
 } catch (error: any) {
 if (error.code === 'auth/wrong-password') {
 throw new Error('Current password is incorrect')
 }
 if (error.code === 'auth/weak-password') {
 throw new Error('New password is too weak. Please use a stronger password.')
 }
 if (error.code === 'auth/requires-recent-login') {
 throw new Error('Please sign out and sign back in before changing your password.')
 }
 throw new Error(error.message || 'Failed to update password')
 }
 }

 // Get active sessions (via token verification)
 const getActiveSessions = async () => {
 const auth = getAuthInstance()
 if (!auth) {
 return []
 }

 const user = auth.currentUser
 if (!user) {
 return []
 }

 try {
 // Get token info
 const tokenResult = await user.getIdTokenResult()
 
 // This is a simplified version - in production you'd track sessions server-side
 return [{
 device: navigator.userAgent,
 location: 'Current device',
 lastActive: new Date().toISOString(),
 current: true
 }]
 } catch (error) {
 console.error('Error getting sessions:', error)
 return []
 }
 }

 // Save 2FA secret to Firestore
 const save2FASecret = async (secret: string, method: 'totp' | 'phone') => {
 const auth = getAuthInstance()
 if (!auth) {
 throw new Error('Firebase Auth not initialized')
 }

 const user = auth.currentUser
 if (!user) {
 throw new Error('No authenticated user found')
 }

 try {
 const { updateUserDocument } = useUser()
 await updateUserDocument(user.uid, {
 twoFactorEnabled: true,
 twoFactorMethod: method,
 twoFactorSecret: secret, // In production, encrypt this
 twoFactorEnabledAt: new Date().toISOString()
 })
 } catch (error: any) {
 throw new Error(error.message || 'Failed to save 2FA settings')
 }
 }

 // Verify TOTP code
 const verifyTOTPCode = async (code: string): Promise<boolean> => {
 const auth = getAuthInstance()
 if (!auth) {
 throw new Error('Firebase Auth not initialized')
 }

 const user = auth.currentUser
 if (!user) {
 throw new Error('No authenticated user found')
 }

 try {
 // Get user's 2FA secret from Firestore
 const { getUserDocument } = useUser()
 const userData = await getUserDocument(user.uid)
 
 if (!userData?.twoFactorSecret) {
 throw new Error('2FA not set up')
 }

 // Import TOTP dynamically
 const { TOTP } = await import('otpauth')
 
 const totp = new TOTP({
 secret: userData.twoFactorSecret,
 digits: 6,
 period: 30,
 algorithm: 'SHA1'
 })

 const isValid = totp.validate({ token: code, window: 2 })
 return isValid !== null
 } catch (error: any) {
 console.error('Error verifying TOTP:', error)
 throw new Error(error.message || 'Failed to verify code')
 }
 }

 // Check if 2FA is enabled for user
 const is2FAEnabled = async (): Promise<boolean> => {
 const auth = getAuthInstance()
 if (!auth) {
 return false
 }

 const user = auth.currentUser
 if (!user) {
 return false
 }

 try {
 const { getUserDocument } = useUser()
 const userData = await getUserDocument(user.uid)
 return userData?.twoFactorEnabled === true
 } catch (error) {
 console.error('Error checking 2FA status:', error)
 return false
 }
 }

 // Disable 2FA (requires re-authentication)
 const disable2FA = async (password: string) => {
 const auth = getAuthInstance()
 if (!auth) {
 throw new Error('Firebase Auth not initialized')
 }

 const user = auth.currentUser
 if (!user || !user.email) {
 throw new Error('No authenticated user found')
 }

 try {
 // Re-authenticate user
 const credential = EmailAuthProvider.credential(user.email, password)
 await reauthenticateWithCredential(user, credential)

 // Remove 2FA from Firestore
 const { updateUserDocument } = useUser()
 await updateUserDocument(user.uid, {
 twoFactorEnabled: false,
 twoFactorMethod: null,
 twoFactorSecret: null,
 twoFactorEnabledAt: null
 })
 } catch (error: any) {
 if (error.code === 'auth/wrong-password') {
 throw new Error('Incorrect password')
 }
 if (error.code === 'auth/requires-recent-login') {
 throw new Error('Please sign out and sign back in before disabling 2FA')
 }
 throw new Error(error.message || 'Failed to disable 2FA')
 }
 }

 return {
 currentUser: readonly(currentUser),
 loading: readonly(loading),
 signIn,
 signUp,
 signOut,
 resetPassword,
 sendVerificationEmail,
 sendPhoneVerificationCode,
 verifyPhoneCode,
 clearRecaptcha,
 updateUserPassword,
 getActiveSessions,
 save2FASecret,
 verifyTOTPCode,
 is2FAEnabled,
 disable2FA,
 getAuthInstance
 }
}

