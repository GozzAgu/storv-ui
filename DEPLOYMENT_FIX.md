# 🔧 Fix Google Sign-In on Deployed Version

## Common Issues & Solutions

Google sign-in often fails in production due to missing domain configuration in Firebase Console. Follow these steps:

---

## ✅ Step 1: Add Your Domain to Firebase Authorized Domains

### What This Does:
Firebase requires you to explicitly authorize domains that can use authentication.

### How to Fix:

1. **Open Firebase Console**
   - Go to: https://console.firebase.google.com
   - Select your project: **storv-ux**

2. **Navigate to Authentication Settings**
   - Click **"Authentication"** in the left sidebar
   - Click on the **"Settings"** tab (gear icon) at the top
   - Scroll down to **"Authorized domains"**

3. **Add Your Deployed Domain**
   - Click **"Add domain"**
   - Enter your deployed domain (e.g., `yourdomain.com` or `your-app.vercel.app`)
   - Click **"Add"**
   
   **Common hosting platforms:**
   - **Vercel**: `your-app.vercel.app` (or your custom domain)
   - **Netlify**: `your-app.netlify.app` (or your custom domain)
   - **Cloudflare Pages**: `your-app.pages.dev` (or your custom domain)
   - **Custom domain**: Just enter your domain (e.g., `app.yourdomain.com`)

4. **Save**
   - The domain should appear in the list
   - Changes take effect immediately (no publish button needed)

---

## ✅ Step 2: Verify OAuth Consent Screen (Google Cloud Console)

### What This Does:
Google OAuth requires redirect URIs to be registered in Google Cloud Console.

### How to Fix:

1. **Open Google Cloud Console**
   - Go to: https://console.cloud.google.com
   - Select your project: **storv-ux** (or the project linked to Firebase)

2. **Navigate to OAuth Consent Screen**
   - Click **"APIs & Services"** → **"OAuth consent screen"**
   - Make sure your app is properly configured

3. **Check Authorized Redirect URIs**
   - Click **"Credentials"** in the left sidebar
   - Find your **OAuth 2.0 Client ID** (Web client)
   - Click on it to edit
   - Under **"Authorized redirect URIs"**, ensure you have:
     - `https://your-deployed-domain.com` (if using redirect method)
     - For popup method (which you're using), the domain should be automatically allowed if it's in Firebase authorized domains

4. **Save Changes**
   - Click **"Save"**

---

## ✅ Step 3: Enable Google Provider in Firebase

1. **Firebase Console** → **Authentication** → **Sign-in method**
2. **Click on "Google"**
3. **Enable** the provider (toggle should be ON)
4. **Add Project support email**
5. **Save**

---

## ✅ Step 4: Verify HTTPS is Enabled

Google OAuth **requires HTTPS** in production. Make sure:
- Your deployed site uses HTTPS (most hosting platforms do this automatically)
- Check that your URL starts with `https://` not `http://`

---

## 🔍 Troubleshooting Common Errors

### Error: "auth/unauthorized-domain"
**Solution**: Add your domain to Firebase Authorized Domains (Step 1)

### Error: "auth/popup-blocked"
**Solution**: 
- Check browser popup blocker settings
- Try a different browser
- Consider using redirect method as fallback

### Error: "auth/network-request-failed"
**Solution**: 
- Check internet connection
- Verify Firebase services are accessible from your region
- Check browser console for CORS errors

### Error: "auth/operation-not-allowed"
**Solution**: 
- Verify Google sign-in is enabled in Firebase Console (Step 3)
- Check that the provider is properly configured

---

## 🚀 Quick Checklist

- [ ] Domain added to Firebase Authorized Domains
- [ ] Google Provider enabled in Firebase Authentication
- [ ] OAuth Client ID properly configured in Google Cloud Console
- [ ] Site is using HTTPS
- [ ] Browser popup blockers are disabled for your site

---

## 📝 Environment Variables (Optional but Recommended)

For better security, consider moving Firebase config to environment variables:

1. **Create `.env.production`** (don't commit this):
```env
NUXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN=storv-ux.firebaseapp.com
NUXT_PUBLIC_FIREBASE_PROJECT_ID=storv-ux
NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET=storv-ux.firebasestorage.app
NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1038005888848
NUXT_PUBLIC_FIREBASE_APP_ID=1:1038005888848:web:1630fa92450882af08ee55
NUXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-TW5BCF05NL
```

2. **Update `config/firebase.config.ts`**:
```typescript
export const firebaseConfig = {
  apiKey: process.env.NUXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NUXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NUXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NUXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}
```

3. **Add environment variables to your hosting platform**:
   - **Vercel**: Project Settings → Environment Variables
   - **Netlify**: Site Settings → Build & Deploy → Environment Variables
   - **Cloudflare Pages**: Settings → Environment Variables

---

## 🆘 Still Not Working?

1. **Check Browser Console**
   - Open DevTools (F12)
   - Look for errors in the Console tab
   - Check the Network tab for failed requests

2. **Test in Incognito Mode**
   - This rules out browser extensions interfering

3. **Verify Firebase Project**
   - Make sure you're using the correct Firebase project
   - Check that the API key matches your project

4. **Contact Support**
   - If issues persist, check Firebase status: https://status.firebase.google.com
   - Review Firebase documentation: https://firebase.google.com/docs/auth/web/google-signin

---

## ✅ After Fixing

Once you've completed the steps above:
1. Clear your browser cache
2. Test Google sign-in again
3. If using a custom domain, wait a few minutes for DNS/propagation

The most common issue is **missing authorized domains**, so start with Step 1!

