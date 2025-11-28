# Firebase Setup Guide

Firebase has been successfully configured in your Storv application.

## 📁 File Structure

```
storv-ui/
├── config/
│   └── firebase.config.ts          # Firebase configuration
├── plugins/
│   └── firebase.client.ts          # Firebase initialization plugin
└── composables/
    ├── useFirebase.ts              # Base Firebase composable
    └── useFirebaseAuth.ts          # Firebase Authentication composable
```

## 🚀 Setup Complete

Firebase is automatically initialized when your Nuxt app loads. The plugin runs only on the client side (browser) as required by Firebase.

## 🔧 Configuration

Your Firebase configuration is stored in `config/firebase.config.ts`. For production, consider moving these values to environment variables:

1. Create a `.env` file (don't commit this to git)
2. Add your Firebase config values
3. Update `config/firebase.config.ts` to read from environment variables

Example:
```typescript
export const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  // ... etc
}
```

## 📖 Usage Examples

### Using Firebase in Components

```vue
<script setup lang="ts">
const { app, analytics } = useFirebase()
</script>
```

### Using Firebase Authentication

```vue
<script setup lang="ts">
const { signIn, signUp, signOut, currentUser, loading } = useFirebaseAuth()

// Sign in
const handleSignIn = async () => {
  try {
    await signIn(email.value, password.value)
    // Redirect to dashboard
    navigateTo('/dashboard')
  } catch (error) {
    console.error('Sign in error:', error)
  }
}

// Sign up
const handleSignUp = async () => {
  try {
    await signUp(email.value, password.value)
    // Redirect to dashboard
    navigateTo('/dashboard')
  } catch (error) {
    console.error('Sign up error:', error)
  }
}

// Sign out
const handleSignOut = async () => {
  try {
    await signOut()
    navigateTo('/signin')
  } catch (error) {
    console.error('Sign out error:', error)
  }
}

// Sign in with Google
const handleGoogleSignIn = async () => {
  try {
    const user = await signInWithGoogle()
    // Check if user exists in Firestore, create if new
    const userData = await getUserDocument(user.uid)
    if (!userData) {
      await createUserDocument(user.uid, {
        email: user.email || '',
        name: user.displayName || 'User',
        role: 'superAdmin'
      })
    }
    navigateTo('/dashboard')
  } catch (error) {
    console.error('Google sign in error:', error)
  }
}

// Watch auth state
watchEffect(() => {
  if (!loading.value && !currentUser.value) {
    // User is not authenticated
  }
})
</script>
```

### Password Reset

```vue
<script setup lang="ts">
const { resetPassword } = useFirebaseAuth()

const handleResetPassword = async () => {
  try {
    await resetPassword(email.value)
    // Show success message
  } catch (error) {
    console.error('Reset password error:', error)
  }
}
</script>
```

## 🔒 Protected Routes

To protect routes that require authentication, create a middleware:

**`middleware/auth.ts`:**
```typescript
export default defineNuxtRouteMiddleware((to, from) => {
  const { currentUser, loading } = useFirebaseAuth()
  
  if (!loading.value && !currentUser.value) {
    return navigateTo('/signin')
  }
})
```

Then use it in your pages:
```vue
<script setup>
definePageMeta({
  middleware: 'auth'
})
</script>
```

## 📊 Analytics

Firebase Analytics is automatically initialized. You can access it via:

```typescript
const { analytics } = useFirebase()
```

## 🎯 Next Steps

1. **Enable Authentication Providers**: 
   - Go to Firebase Console → Authentication → Sign-in method
   - Enable **Email/Password** provider
   - Enable **Google** provider:
     - Click on Google
     - Toggle "Enable" switch
     - Add your project support email
     - Save
   - Configure authorized domains if needed (add your domain)
2. **Set up Firestore**: 
   - Create a Firestore database in Firebase Console
   - Start in test mode (or configure security rules as needed)
   - The app will create a `users` collection automatically
3. **Add Error Handling**: Implement proper error handling and user feedback
4. **Add Loading States**: Show loading indicators during auth operations
5. **Store User Data**: Consider storing additional user info in Firestore

## 🔗 Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)
- [Nuxt 3 Plugins](https://nuxt.com/docs/guide/directory-structure/plugins)

