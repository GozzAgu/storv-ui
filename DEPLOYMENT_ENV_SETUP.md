# Firebase Environment Variables Setup for Deployment

## Overview
This application requires Firebase environment variables to be configured in your deployment platform. If these variables are missing, the application will display an error message and fail to initialize.

## Required Environment Variables

The following environment variables must be set in your deployment platform:

```
NUXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
NUXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id_here
NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
NUXT_PUBLIC_FIREBASE_APP_ID=your_app_id_here
NUXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id_here
```

## How to Get Your Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create a new one)
3. Click the gear icon ⚙️ next to "Project Overview"
4. Select "Project settings"
5. Scroll down to "Your apps" section
6. If you don't have a web app, click "Add app" and select the web icon (</>)
7. Copy the configuration values from the `firebaseConfig` object

## Setting Environment Variables by Platform

### Vercel
1. Go to your project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable with the name and value
4. Select the environments (Production, Preview, Development)
5. Click **Save**
6. Redeploy your application

### Netlify
1. Go to your site dashboard
2. Navigate to **Site configuration** → **Environment variables**
3. Click **Add variable**
4. Add each variable with the name and value
5. Click **Save**
6. Trigger a new deploy

### Firebase Hosting
1. Use Firebase CLI to set environment variables:
   ```bash
   firebase functions:config:set firebase.api_key="your_api_key"
   ```
2. Or use `.env` file in your project root (for local development)
3. For production, use Firebase Functions config or Firebase Hosting environment variables

### Other Platforms
Most deployment platforms support environment variables. Look for:
- **Environment Variables** section in settings
- **Config Vars** (Heroku)
- **Secrets** (GitHub Actions, GitLab CI/CD)
- **Environment** settings in your platform's dashboard

## Verification

After setting environment variables and deploying:

1. The application should load without the Firebase configuration error
2. Check the browser console for any Firebase-related warnings
3. Try logging in to verify Firebase Authentication is working
4. Test creating a receipt to verify Firestore is working

## Troubleshooting

### Error: "Firebase configuration is missing"
- **Cause**: Environment variables are not set or not accessible
- **Solution**: 
  - Verify variables are set in your deployment platform
  - Ensure variable names start with `NUXT_PUBLIC_` (required for Nuxt 3)
  - Rebuild/redeploy after adding variables
  - Check that variables are available in the correct environment (production/preview)

### Error: "Firebase Initialization Error"
- **Cause**: Invalid Firebase configuration values
- **Solution**:
  - Double-check all values are correct
  - Ensure no extra spaces or quotes in values
  - Verify project ID matches your Firebase project
  - Check Firebase project is active and billing is enabled (if required)

### Variables Not Loading
- **Cause**: Variables not prefixed with `NUXT_PUBLIC_`
- **Solution**: All client-side variables in Nuxt 3 must start with `NUXT_PUBLIC_` to be exposed to the browser

## Security Notes

⚠️ **Important**: These are public environment variables (prefixed with `NUXT_PUBLIC_`), which means they are exposed to the client-side code. This is normal for Firebase web apps, as the API key is meant to be public and is restricted by Firebase Security Rules.

However, make sure:
- Firebase Security Rules are properly configured
- API keys are restricted in Firebase Console (Settings → General → Your apps)
- Only authorized domains can use your Firebase project

## Local Development

For local development, create a `.env` file in the project root:

```bash
# Copy the example file
cp .env.example .env

# Edit .env and add your Firebase configuration
```

The `.env` file is git-ignored and should never be committed to version control.
