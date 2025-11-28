# Quick Fix: Firestore Permission Error

## The Problem
You're seeing this error:
```
FirebaseError: Missing or insufficient permissions
```

This happens because **Firestore security rules are not configured** yet.

## Quick Solution (5 minutes)

### Step 1: Open Firebase Console
1. Go to https://console.firebase.google.com
2. Select your project: **storv-ux**

### Step 2: Set Up Firestore Rules
1. Click on **Firestore Database** in the left sidebar
2. Click on the **Rules** tab (at the top)
3. You'll see some default rules that look like this:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if false;
       }
     }
   }
   ```

### Step 3: Replace with Correct Rules
Delete everything and paste these rules instead:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to check if user owns the document
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Users collection - users can read/write their own document
    match /users/{userId} {
      // Allow read if user is authenticated
      allow read: if isAuthenticated();
      
      // Allow create if user is creating their own document
      allow create: if isOwner(userId);
      
      // Allow update if user is updating their own document
      allow update: if isOwner(userId);
      
      // Only allow delete by the document owner
      allow delete: if isOwner(userId);
    }
    
    // Deny all other access by default
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### Step 4: Publish the Rules
1. Click the **Publish** button (blue button at the top)
2. Wait a few seconds for the rules to be published

### Step 5: Test Again
1. Go back to your app
2. Try signing up with Google again
3. It should work now! ✅

## Alternative: Quick Test Mode (NOT FOR PRODUCTION)

If you just want to test quickly, you can temporarily use test mode rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.time < timestamp.date(2025, 12, 31);
    }
  }
}
```

⚠️ **Warning**: These rules allow anyone to read/write your database. Only use for testing!

## Still Not Working?

### Check These Things:

1. **Firestore Database Exists?**
   - Go to Firestore Database
   - If you see "Create database", click it
   - Choose "Start in test mode" or "Start in production mode"
   - Select a location
   - Click "Enable"

2. **Rules Published?**
   - Make sure you clicked "Publish" after pasting the rules
   - Rules take a few seconds to propagate

3. **Google Sign-in Enabled?**
   - Go to Authentication → Sign-in method
   - Make sure Google is enabled
   - Add your project support email

4. **Clear Browser Cache**
   - Sometimes cached errors persist
   - Try incognito/private mode

## About COOP Warnings

The COOP warnings you see in the console are **harmless**. They're just browser security warnings that don't affect functionality. You can safely ignore them or filter them out in your browser console.

## Need More Help?

See the detailed guide: `FIRESTORE_SETUP.md`

