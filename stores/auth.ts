import { defineStore } from 'pinia'
import { AUTH_UNAVAILABLE_MESSAGE } from '~/utils/cloud-user-messages'
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
  type User,
  type Auth,
  type ConfirmationResult,
} from 'firebase/auth'
import { getFirebaseClientAuth } from '~/utils/firebase-client-auth'
import { sendUserEmailVerification } from '~/utils/emailVerification'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    currentUser: null as User | null,
    loading: true,
    recaptchaVerifier: null as RecaptchaVerifier | null,
    confirmationResult: null as ConfirmationResult | null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.currentUser,
    isAuthLoading: (state) => state.loading,
  },

  actions: {
    // Initialize auth state listener
    initAuth() {
      if (import.meta.server) {
        this.loading = false
        return
      }

      const auth = getFirebaseClientAuth()
      if (!auth) {
        setTimeout(() => this.initAuth(), 500)
        return
      }
      const timeout = setTimeout(() => {
        if (this.loading) {
          this.loading = false
        }
      }, 3000)

      onAuthStateChanged(
        auth,
        (user) => {
          this.currentUser = user
          this.loading = false
          clearTimeout(timeout)
        },
        (error) => {
          console.error('Auth state change error:', error)
          this.loading = false
          clearTimeout(timeout)
        }
      )
    },

    // Get Auth instance
    getAuthInstance(): Auth | null {
      if (import.meta.server) return null

      return getFirebaseClientAuth()
    },

    // Sign in with email and password
    async signIn(email: string, password: string) {
      const auth = this.getAuthInstance()
      if (!auth) throw new Error(AUTH_UNAVAILABLE_MESSAGE)

      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password)
        this.currentUser = userCredential.user
        return userCredential.user
      } catch (error: any) {
        throw new Error(error.message || 'Sign in failed')
      }
    },

    // Sign up with email and password
    async signUp(email: string, password: string, sendVerificationEmail: boolean = true) {
      const auth = this.getAuthInstance()
      if (!auth) throw new Error(AUTH_UNAVAILABLE_MESSAGE)

      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        const user = userCredential.user
        this.currentUser = user

        // Send email verification if requested (template: Firebase Console → Auth → Templates)
        if (sendVerificationEmail && user && !user.emailVerified) {
          try {
            const rc = useRuntimeConfig()
            await sendUserEmailVerification(user, (rc.public.appOrigin as string) || '')
          } catch (verificationError: any) {
            console.warn('Failed to send verification email:', verificationError)
          }
        }

        return user
      } catch (error: any) {
        throw new Error(error.message || 'Sign up failed')
      }
    },

    // Sign out
    async signOut() {
      const auth = this.getAuthInstance()
      if (!auth) throw new Error(AUTH_UNAVAILABLE_MESSAGE)

      try {
        await firebaseSignOut(auth)
        this.currentUser = null
      } catch (error: any) {
        throw new Error(error.message || 'Sign out failed')
      }
    },

    // Send password reset email
    async resetPassword(email: string) {
      const auth = this.getAuthInstance()
      if (!auth) throw new Error(AUTH_UNAVAILABLE_MESSAGE)

      try {
        await sendPasswordResetEmail(auth, email)
      } catch (error: any) {
        throw new Error(error.message || 'Password reset failed')
      }
    },

    // Send email verification
    async sendVerificationEmail(user?: User) {
      const auth = this.getAuthInstance()
      if (!auth) throw new Error(AUTH_UNAVAILABLE_MESSAGE)

      const targetUser = user || this.currentUser
      if (!targetUser) {
        throw new Error('No user found to send verification email')
      }

      if (targetUser.emailVerified) {
        throw new Error('Email is already verified')
      }

      try {
        const rc = useRuntimeConfig()
        await sendUserEmailVerification(targetUser, (rc.public.appOrigin as string) || '')
      } catch (error: any) {
        if (error.code === 'auth/too-many-requests') {
          throw new Error('Too many verification emails sent. Please try again later.')
        }
        throw new Error(error.message || 'Failed to send verification email')
      }
    },

    // Initialize reCAPTCHA verifier
    async initializeRecaptcha(
      containerId: string = 'recaptcha-container'
    ): Promise<RecaptchaVerifier> {
      if (import.meta.server) {
        throw new Error('reCAPTCHA can only be initialized on the client side')
      }

      const auth = this.getAuthInstance()
      if (!auth) {
        throw new Error(AUTH_UNAVAILABLE_MESSAGE)
      }

      try {
        if (this.recaptchaVerifier) {
          this.recaptchaVerifier.clear()
        }

        const verifier = new RecaptchaVerifier(auth, containerId, {
          size: 'invisible',
          callback: () => {},
          'expired-callback': () => {
            throw new Error('reCAPTCHA expired. Please try again.')
          },
        })

        await verifier.render()
        this.recaptchaVerifier = verifier
        return verifier
      } catch (error: any) {
        throw new Error(error.message || 'Failed to initialize reCAPTCHA')
      }
    },

    // Send phone verification code
    async sendPhoneVerificationCode(
      phoneNumber: string,
      containerId: string = 'recaptcha-container'
    ): Promise<ConfirmationResult> {
      const auth = this.getAuthInstance()
      if (!auth) throw new Error(AUTH_UNAVAILABLE_MESSAGE)

      try {
        if (!this.recaptchaVerifier) {
          await this.initializeRecaptcha(containerId)
        }

        if (!this.recaptchaVerifier) {
          throw new Error('reCAPTCHA verifier not initialized')
        }

        const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`
        this.confirmationResult = await signInWithPhoneNumber(
          auth,
          formattedPhone,
          this.recaptchaVerifier
        )
        return this.confirmationResult
      } catch (error: any) {
        if (this.recaptchaVerifier) {
          this.recaptchaVerifier.clear()
          this.recaptchaVerifier = null
        }

        if (error.code === 'auth/invalid-phone-number') {
          throw new Error(
            'Invalid phone number format. Please include country code (e.g., +1234567890)'
          )
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
    },

    // Verify phone code
    async verifyPhoneCode(code: string): Promise<User> {
      if (!this.confirmationResult) {
        throw new Error('No verification session found. Please request a new code.')
      }

      try {
        const result = await this.confirmationResult.confirm(code)

        if (this.recaptchaVerifier) {
          this.recaptchaVerifier.clear()
          this.recaptchaVerifier = null
        }
        this.confirmationResult = null
        this.currentUser = result.user

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
    },

    // Clear reCAPTCHA
    clearRecaptcha() {
      if (this.recaptchaVerifier) {
        this.recaptchaVerifier.clear()
        this.recaptchaVerifier = null
      }
      this.confirmationResult = null
    },

    // Update password
    async updateUserPassword(currentPassword: string, newPassword: string) {
      const auth = this.getAuthInstance()
      if (!auth) throw new Error(AUTH_UNAVAILABLE_MESSAGE)

      const user = auth.currentUser
      if (!user || !user.email) {
        throw new Error('No authenticated user found')
      }

      try {
        const credential = EmailAuthProvider.credential(user.email, currentPassword)
        await reauthenticateWithCredential(user, credential)
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
    },

    // Get active sessions
    async getActiveSessions() {
      const auth = this.getAuthInstance()
      if (!auth || !this.currentUser) return []

      try {
        const tokenResult = await this.currentUser.getIdTokenResult()
        return [
          {
            device: navigator.userAgent,
            location: 'Current device',
            lastActive: new Date().toISOString(),
            current: true,
          },
        ]
      } catch (error) {
        console.error('Error getting sessions:', error)
        return []
      }
    },
  },
})
