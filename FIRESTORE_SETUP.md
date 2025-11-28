# Firestore Security Rules Setup

## 🔒 Setting Up Firestore Security Rules

The "Missing or insufficient permissions" error occurs when Firestore security rules are too restrictive or not properly configured. Follow these steps to set up your Firestore security rules:

### Step 1: Access Firestore Rules

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project (`storv-ux`)
3. Navigate to **Firestore Database** → **Rules** tab

### Step 2: Deploy Security Rules

Copy and paste the following security rules into the Firebase Console:

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

### Step 3: Publish the Rules

Click **Publish** to deploy the rules to your Firestore database.

### Step 4: Verify Firestore Database Exists

Make sure you have created a Firestore database:

1. Go to **Firestore Database** in Firebase Console
2. If you see "Create database", click it
3. Choose **Start in test mode** (or **Start in production mode** if you prefer)
4. Select a location for your database
5. Click **Enable**

### Alternative: Test Mode (Temporary)

If you're still testing and want to allow all operations temporarily, you can use test mode rules:

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

⚠️ **Warning**: Test mode rules allow anyone to read/write your database. Only use this for development and **never** in production!

### Step 5: Enable Google Authentication

1. Go to **Authentication** → **Sign-in method**
2. Click on **Google** provider
3. Toggle **Enable** switch
4. Enter your **Project support email**
5. Click **Save**

### Step 6: Add Authorized Domains

1. Still in **Authentication** → **Sign-in method**
2. Scroll down to **Authorized domains**
3. Make sure these domains are listed:
   - `localhost` (for development)
   - Your custom domain (if applicable)
   - Your Firebase hosting domain (e.g., `storv-ux.web.app`)

### Troubleshooting

#### Error: "Missing or insufficient permissions"

**Causes:**
- Firestore security rules are too restrictive
- Firestore database doesn't exist
- User is not authenticated
- Rules haven't been published

**Solutions:**
1. Verify Firestore database is created
2. Check that security rules are published
3. Ensure user is authenticated before accessing Firestore
4. Use the security rules provided above

#### Error: "Cross-Origin-Opener-Policy policy would block"

This warning appears when using popup authentication. We've switched to redirect-based authentication to avoid this issue. The warning is harmless but the redirect method is more reliable.

#### Still Having Issues?

1. **Check Firebase Console:**
   - Verify Firestore database exists
   - Verify security rules are published
   - Verify Google provider is enabled

2. **Check Browser Console:**
   - Look for specific error codes
   - Check if authentication is working
   - Verify user object is created

3. **Clear Browser Cache:**
   - Sometimes cached rules can cause issues
   - Try incognito/private mode

### Security Rules File

A `firestore.rules` file has been created in your project root. You can use this with Firebase CLI to deploy rules:

```bash
firebase deploy --only firestore:rules
```

Or copy the contents to Firebase Console as described above.

