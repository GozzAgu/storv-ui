# 🔧 Fix: Missing Permissions for Departments & Staff

## The Problem
You're seeing "Missing or insufficient permissions" when accessing the Departments page because the Firestore security rules don't allow access to the `departments` and `staff` collections.

## Quick Fix (3 minutes)

### Step 1: Open Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: **storv-ux**
3. Click on **Firestore Database** in the left sidebar
4. Click on the **Rules** tab at the top

### Step 2: Copy and Paste Updated Rules

**Delete everything** in the rules editor, then paste this:

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
    
    // Departments collection - authenticated users can read, create, update, and delete
    match /departments/{departmentId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAuthenticated();
      allow delete: if isAuthenticated();
    }
    
    // Staff collection - authenticated users can read, create, update, and delete
    match /staff/{staffId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAuthenticated();
      allow delete: if isAuthenticated();
    }
    
    // Deny all other access by default
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### Step 3: Publish the Rules
1. Click the blue **"Publish"** button at the top
2. Wait 5-10 seconds for the rules to deploy
3. You should see a success message

### Step 4: Test
1. Go back to your app: `http://localhost:3000/dashboard/departments`
2. Refresh the page
3. ✅ The error should be gone and you should be able to view/create departments!

## What Changed?
The rules now include:
- ✅ `departments` collection - All authenticated users can read, create, update, and delete
- ✅ `staff` collection - All authenticated users can read, create, update, and delete

These collections are now accessible to any authenticated user, which allows the Super Admin to manage departments and staff.

