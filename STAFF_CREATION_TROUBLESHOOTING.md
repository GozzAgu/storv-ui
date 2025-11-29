# Staff Creation Troubleshooting Guide

## Issue: Staff account only created in Firestore, not in Firebase Auth

### Problem
When creating a staff member, the Firestore document is created but the Firebase Auth account is not. This means staff cannot log in.

### Current Implementation
The code is designed to:
1. Sign out super admin
2. Create Firebase Auth account for staff
3. Create user document in Firestore
4. Sign super admin back in
5. Create staff document in Firestore with `authUid`

### How to Debug

#### Step 1: Check Browser Console
Open DevTools → Console and create a staff member. Look for these log messages:

**Expected Success Flow:**
```
[Staff Creation] Signing out super admin...
[Staff Creation] Super admin signed out successfully
[Staff Creation] Creating Firebase Auth account for staff: [email]
[Staff Creation] Calling createUserWithEmailAndPassword...
[Staff Creation] Firebase Auth account created successfully. UID: [uid]
[Staff Creation] ✅ Firebase Auth account creation confirmed. Flag set to true.
[Staff Creation] Creating user document in Firestore for staff...
[Staff Creation] User document created successfully in users collection
[Staff Creation] Signing super admin back in...
[Staff Creation] Super admin signed back in successfully
[Staff Creation] ✅ Firebase Auth account confirmed. Creation flag: true UID: [uid]
[Staff Creation] Creating staff document in Firestore...
[Staff Creation] ✅ SUCCESS: Staff created in Firestore with authUid: [uid]
[Staff Creation] ✅ Verified: Staff document has correct authUid: [uid]
```

**If Firebase Auth Creation Fails:**
```
[Staff Creation] Error creating staff Firebase Auth account: [error]
Failed to create staff Firebase Auth account ([error-code]): [error message]
```

#### Step 2: Common Error Scenarios

**Error: "Super admin credentials not available"**
- **Cause:** Super admin didn't sign in with email/password, or credentials expired
- **Solution:** Sign out and sign back in with email and password

**Error: "email-already-in-use"**
- **Cause:** Staff email already exists in Firebase Auth
- **Solution:** Use a different email, or check Firebase Console → Authentication → Users

**Error: "weak-password"**
- **Cause:** Password is less than 6 characters
- **Solution:** Ensure password meets Firebase requirements (minimum 6 characters)

**Error: "operation-not-allowed"**
- **Cause:** Email/Password authentication is not enabled in Firebase
- **Solution:** Go to Firebase Console → Authentication → Sign-in method → Enable Email/Password

**Error: "Firebase Auth not initialized"**
- **Cause:** Firebase app is not initialized properly
- **Solution:** Check Firebase configuration and plugin loading order

#### Step 3: Verify Firebase Auth Account
1. Go to Firebase Console → Authentication → Users
2. Search for the staff email
3. Check if account exists and was created recently

#### Step 4: Verify Firestore Documents
1. Check `staff` collection - should have `authUid` field
2. Check `users` collection - should have document with staff's authUid and `role: 'staff'`

### If Issue Persists

**Scenario: Console shows success logs but account doesn't exist in Firebase Auth**
- Check if account creation is actually happening
- Look for network errors in DevTools → Network tab
- Check Firebase Console → Authentication for any errors

**Scenario: Error is thrown but Firestore document is still created**
- This should NOT happen - there's a bug
- Check if error is being caught somewhere and ignored
- Verify the validation checks are working

**Scenario: No errors but account not created**
- Check Firebase Authentication settings
- Verify Email/Password provider is enabled
- Check Firebase project quotas (daily limits)

### Code Validation Points

The code has multiple checkpoints:
1. ✅ Validates email and password before creating account
2. ✅ Checks if Firebase Auth is initialized
3. ✅ Verifies account creation returned valid UID
4. ✅ Sets `firebaseAuthAccountCreated` flag to `true`
5. ✅ Validates flag before creating Firestore document
6. ✅ Validates `staffAuthUid` is not null before creating Firestore document
7. ✅ Verifies Firestore document has `authUid` after creation

If any of these fail, an error should be thrown and the process should stop.

### Next Steps for Debugging

1. **Check Console Logs:** Look for `[Staff Creation]` messages
2. **Check Network Tab:** Look for Firebase API calls and their responses
3. **Check Firebase Console:** Verify account was created in Authentication section
4. **Test Staff Login:** Try to sign in with staff email/password
5. **Check Error Messages:** Note the exact error code and message

If you're still seeing the issue, please provide:
- Browser console logs (all `[Staff Creation]` messages)
- Any error messages
- Firebase Console → Authentication → Users screenshot
- Firestore `staff` collection document showing the `authUid` field (or lack thereof)

