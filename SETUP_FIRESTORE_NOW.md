# 🚨 URGENT: Fix Firestore Permission Error

## The Error You're Seeing
```
Firestore permission denied
```

This happens because Firestore security rules are blocking access. Here's how to fix it in **3 minutes**:

---

## Step-by-Step Fix

### Step 1: Open Firebase Console (30 seconds)
1. Open this link: https://console.firebase.google.com
2. Click on your project: **storv-ux**

### Step 2: Navigate to Firestore Rules (30 seconds)
1. In the left sidebar, click **"Firestore Database"**
2. Click on the **"Rules"** tab at the top

### Step 3: Copy and Paste These Rules (1 minute)

**DELETE everything** in the rules editor, then paste this:

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

### Step 4: Publish the Rules (30 seconds)
1. Click the blue **"Publish"** button at the top
2. Wait 5-10 seconds for it to save
3. You should see a success message

### Step 5: Test Your Sign Up (30 seconds)
1. Go back to your app: `http://localhost:3000/signup`
2. Try signing up with Google again
3. ✅ It should work now!

---

## ⚠️ Important Checks

### Make Sure Firestore Database Exists

If you see "Create database" when you go to Firestore Database:

1. Click **"Create database"**
2. Choose **"Start in production mode"** (or test mode if you prefer)
3. Select a location (choose the closest to you)
4. Click **"Enable"**

### Make Sure Google Sign-in is Enabled

1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Click on **"Google"**
3. Toggle **"Enable"** to ON
4. Add your **Project support email**
5. Click **"Save"**

---

## Still Not Working?

### Try These Troubleshooting Steps:

1. **Refresh the page** - Sometimes rules take a moment to propagate
2. **Clear browser cache** - Old cached errors might persist
3. **Check the browser console** - Look for specific error codes
4. **Try incognito/private mode** - Rules out cache issues

### Common Issues:

**"Rules not published"**
- Make sure you clicked "Publish" button
- Wait a few seconds after publishing

**"Database doesn't exist"**
- Create the Firestore database first (see above)

**"Still getting permission errors"**
- Double-check that the rules you pasted match exactly
- Make sure there are no typos

---

## Quick Test Mode (Temporary Only)

If you just need to test quickly and are NOT in production:

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

⚠️ **WARNING**: These rules allow anyone to access your database. **ONLY use for testing!**

---

## Need More Help?

See these files in your project:
- `FIRESTORE_SETUP.md` - Detailed setup guide
- `QUICK_FIX.md` - Quick troubleshooting
- `firestore.rules` - The rules file you need

---

## Summary

✅ Go to Firebase Console  
✅ Open Firestore Database → Rules  
✅ Paste the rules above  
✅ Click Publish  
✅ Test your sign up  

**That's it!** After publishing the rules, your Google sign-up should work perfectly.

