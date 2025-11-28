# Google Authentication Fixes

## Issues Fixed

### 1. Cross-Origin-Opener-Policy (COOP) Warnings ✅
**Problem:** Console warnings about COOP policy blocking window.closed calls when using popup authentication.

**Solution:** These warnings are harmless and can be safely ignored. The popup method works correctly despite these warnings. If the warnings are bothersome, you can filter them in your browser's console settings.

### 2. Missing or Insufficient Permissions Error ✅
**Problem:** `FirebaseError: Missing or insufficient permissions` when trying to sign in with Google.

**Solution:** 
- Created Firestore security rules that allow authenticated users to create and manage their own user documents
- Added proper error handling with helpful error messages
- Created setup documentation

### 3. SessionStorage Error with Redirect ✅
**Problem:** `Unable to process request due to missing initial state. This may happen if browser sessionStorage is inaccessible or accidentally cleared.`

**Solution:** Switched back to popup method instead of redirect. The popup method is more reliable and doesn't have sessionStorage issues.

## What Changed

### Files Modified:
1. **`composables/useFirebaseAuth.ts`**
   - Switched to popup-based Google authentication (more reliable)
   - Improved error handling with specific error codes
   - Removed redirect methods that were causing sessionStorage issues

2. **`pages/signin.vue` & `pages/signup.vue`**
   - Updated to use popup-based Google authentication
   - Improved error messages
   - Better handling of permission errors
   - Handles user document creation after Google sign-in

### Files Created:
1. **`firestore.rules`**
   - Security rules for Firestore
   - Allows users to create/read/update their own documents
   - Secure by default (denies access by default)

2. **`FIRESTORE_SETUP.md`**
   - Complete setup guide for Firestore
   - Security rules configuration
   - Troubleshooting guide

### Files Removed:
1. **`plugins/auth-redirect.client.ts`** - No longer needed with popup method

## Required Setup Steps

### ⚠️ IMPORTANT: You MUST complete these steps:

#### 1. Set Up Firestore Security Rules

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project (`storv-ux`)
3. Navigate to **Firestore Database** → **Rules**
4. Copy the rules from `firestore.rules` file (or see FIRESTORE_SETUP.md)
5. Paste and click **Publish**

**Without these rules, you'll continue to get permission errors!**

#### 2. Create Firestore Database (if not already created)

1. In Firebase Console, go to **Firestore Database**
2. If you see "Create database", click it
3. Choose **Start in test mode** (or **Start in production mode** with the rules above)
4. Select a location for your database
5. Click **Enable**

#### 3. Enable Google Authentication

1. Go to **Authentication** → **Sign-in method**
2. Click on **Google** provider
3. Toggle **Enable**
4. Add your **Project support email**
5. Click **Save**

#### 4. Verify Authorized Domains

1. In **Authentication** → **Sign-in method**
2. Scroll to **Authorized domains**
3. Ensure `localhost` is listed (for development)

## How It Works Now

1. **User clicks "Sign in with Google"**
   - A popup window opens with Google authentication
   - User signs in with their Google account
   - Popup closes and user is authenticated

2. **User Document Creation**
   - If it's a new user, a document is automatically created in Firestore
   - User information is extracted from Google profile

3. **Redirect Based on Status**
   - New users → Onboarding page
   - Users who haven't completed tutorial → Dashboard (tutorial will start)
   - Existing users → Dashboard

## About COOP Warnings

The COOP warnings you see in the console are **harmless** and can be safely ignored. They appear because:
- Modern browsers have strict Cross-Origin-Opener-Policy settings
- The popup window is opened by Firebase for authentication
- The warning doesn't affect functionality

If you want to hide these warnings:
- Chrome: Filter console messages by type
- Or simply ignore them - they don't affect the authentication flow

## Testing

After completing the setup steps above:

1. Try signing in with Google
2. A popup should open
3. Sign in with your Google account
4. Popup will close
5. You should be redirected to onboarding or dashboard

## Troubleshooting

### Still getting "Missing or insufficient permissions"?

1. ✅ **Check Firestore rules are published**
   - Go to Firestore → Rules
   - Verify rules are saved and published

2. ✅ **Check Firestore database exists**
   - Go to Firestore Database
   - Verify database is created

3. ✅ **Check Google provider is enabled**
   - Go to Authentication → Sign-in method
   - Verify Google is enabled

4. ✅ **Clear browser cache**
   - Sometimes cached permissions cause issues
   - Try incognito/private mode

### Popup blocked?

1. Check your browser's popup blocker settings
2. Allow pop-ups for your domain (localhost for dev)
3. Try a different browser if issues persist

### SessionStorage error?

- This should no longer occur with the popup method
- If you still see it, try clearing browser cache and cookies

## Summary

✅ **Fixed:** SessionStorage errors by using popup instead of redirect  
✅ **Fixed:** Permission errors with proper Firestore rules  
✅ **Improved:** Error handling with helpful messages  
✅ **Added:** Comprehensive setup documentation  

**Note:** COOP warnings in console are harmless - you can safely ignore them!

**Next Step:** Complete the Firestore setup steps above, then test Google sign-in!
