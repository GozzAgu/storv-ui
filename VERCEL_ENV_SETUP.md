# Setting Environment Variables in Vercel

## Quick Setup Guide

### Step 1: Access Vercel Dashboard
1. Go to [vercel.com](https://vercel.com) and log in
2. Navigate to your project: **storv-ui**

### Step 2: Open Environment Variables Settings
1. Click on your project name
2. Go to **Settings** (in the top navigation)
3. Click on **Environment Variables** (in the left sidebar)

### Step 3: Add Each Environment Variable
Click **Add New** and add each of the following variables:

#### Required Variables:

1. **NUXT_PUBLIC_FIREBASE_API_KEY**
   - Value: `AIzaSyAjWHyQswMM_u98vZ5vokrv9m3TuJndPkU`
   - Environment: Select **Production**, **Preview**, and **Development**

2. **NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN**
   - Value: `storv-ux.firebaseapp.com`
   - Environment: Select **Production**, **Preview**, and **Development**

3. **NUXT_PUBLIC_FIREBASE_PROJECT_ID**
   - Value: `storv-ux`
   - Environment: Select **Production**, **Preview**, and **Development**

4. **NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET**
   - Value: `storv-ux.firebasestorage.app`
   - Environment: Select **Production**, **Preview**, and **Development**

5. **NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID**
   - Value: `1038005888848`
   - Environment: Select **Production**, **Preview**, and **Development**

6. **NUXT_PUBLIC_FIREBASE_APP_ID**
   - Value: `1:1038005888848:web:1630fa92450882af08ee55`
   - Environment: Select **Production**, **Preview**, and **Development**

7. **NUXT_PUBLIC_FIREBASE_MEASUREMENT_ID**
   - Value: `G-TW5BCF05NL`
   - Environment: Select **Production**, **Preview**, and **Development**

### Step 4: Save and Redeploy
1. After adding all variables, click **Save** for each one
2. Go to the **Deployments** tab
3. Click the **⋯** (three dots) menu on your latest deployment
4. Select **Redeploy**
5. Or push a new commit to trigger a new deployment

## Important Notes

### ⚠️ Environment Selection
Make sure to select the correct environments for each variable:
- **Production**: For your live site (storv-ui.vercel.app)
- **Preview**: For pull request previews
- **Development**: For local development (if using Vercel CLI)

### 🔄 After Adding Variables
**You MUST redeploy** for the changes to take effect. Environment variables are only available to new deployments.

### ✅ Verification
After redeploying:
1. Visit your site: `https://storv-ui.vercel.app`
2. The Firebase Configuration Error should be gone
3. You should be able to sign in and use the application

## Alternative: Using Vercel CLI

You can also set environment variables using the Vercel CLI:

```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Login to Vercel
vercel login

# Link your project (if not already linked)
vercel link

# Set environment variables
vercel env add NUXT_PUBLIC_FIREBASE_API_KEY production
# Enter the value when prompted

# Repeat for each variable
vercel env add NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN production
vercel env add NUXT_PUBLIC_FIREBASE_PROJECT_ID production
vercel env add NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET production
vercel env add NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID production
vercel env add NUXT_PUBLIC_FIREBASE_APP_ID production
vercel env add NUXT_PUBLIC_FIREBASE_MEASUREMENT_ID production

# Pull environment variables to verify
vercel env pull .env.local
```

## Troubleshooting

### Variables Not Working After Deployment
1. **Check variable names**: Must start with `NUXT_PUBLIC_` for Nuxt 3
2. **Verify environments**: Make sure variables are set for "Production"
3. **Redeploy**: New deployments are required after adding variables
4. **Check for typos**: Variable names are case-sensitive

### Still Seeing Error After Setup
1. Clear browser cache and hard refresh (Cmd/Ctrl + Shift + R)
2. Check Vercel deployment logs for any errors
3. Verify all 7 variables are set correctly
4. Ensure you redeployed after adding variables

## Quick Copy-Paste Values

For convenience, here are all the values you need:

```
NUXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAjWHyQswMM_u98vZ5vokrv9m3TuJndPkU
NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN=storv-ux.firebaseapp.com
NUXT_PUBLIC_FIREBASE_PROJECT_ID=storv-ux
NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET=storv-ux.firebasestorage.app
NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1038005888848
NUXT_PUBLIC_FIREBASE_APP_ID=1:1038005888848:web:1630fa92450882af08ee55
NUXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-TW5BCF05NL
```

Copy each line and paste the value when adding variables in Vercel.
