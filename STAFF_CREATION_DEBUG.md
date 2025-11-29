# Staff Creation Debugging Guide

## Issue
Staff accounts are being created in Firestore but not in Firebase Auth, meaning staff cannot log in.

## Expected Flow

1. **Super admin creates staff** → Password field filled in StaffModal
2. **System signs out super admin** temporarily
3. **System creates Firebase Auth account** for staff using `createUserWithEmailAndPassword`
4. **System creates user document** in Firestore `users` collection with role 'staff'
5. **System signs super admin back in** quickly
6. **System creates staff document** in Firestore `staff` collection with `authUid` field

## Debugging Steps

### 1. Check Browser Console
Look for these log messages in order:

```
[Staff Creation] Signing out super admin...
[Staff Creation] Super admin signed out successfully
[Staff Creation] Creating Firebase Auth account for staff: [email]
[Staff Creation] Firebase Auth account created successfully: [uid]
[Staff Creation] Creating user document in Firestore for staff...
[Staff Creation] User document created successfully in users collection
[Staff Creation] Signing super admin back in...
[Staff Creation] Super admin signed back in successfully
[Staff Creation] Creating staff document in Firestore...
[Staff Creation] ✅ SUCCESS: Staff created in Firestore with authUid: [uid]
```

### 2. Check for Errors
Look for error messages starting with:
- `[Staff Creation] Error creating staff Firebase Auth account:`
- `Failed to create staff Firebase Auth account`
- Any Firebase Auth error codes

### 3. Verify Firebase Auth Account
1. Go to Firebase Console → Authentication → Users
2. Search for the staff member's email
3. Check if the account exists

### 4. Verify Firestore Documents
1. Go to Firebase Console → Firestore Database
2. Check `users` collection - should have a document with the staff's authUid
3. Check `staff` collection - should have a document with `authUid` field populated

### 5. Common Issues

#### Issue: "Firebase Auth account created" log appears but account doesn't exist
**Possible Causes:**
- Account was created but immediately deleted
- Account creation succeeded but UID wasn't stored properly
- Firebase Auth state was reset after creation

**Solution:** Check Firebase Console → Authentication → Users directly after creation

#### Issue: Error: "email-already-in-use"
**Cause:** Staff email already exists in Firebase Auth
**Solution:** Use a different email or check if account already exists

#### Issue: Error: "weak-password"
**Cause:** Password doesn't meet Firebase requirements
**Solution:** Ensure password is at least 6 characters

#### Issue: Staff document created but authUid is null
**Cause:** Firebase Auth account creation failed but error wasn't caught
**Solution:** Check console logs for errors, verify credentials are stored

#### Issue: Super admin credentials not available
**Cause:** Super admin didn't sign in with email/password
**Solution:** Sign out and sign back in with email and password

## Testing Steps

1. **Test with Console Open**
   - Open browser DevTools → Console tab
   - Create a new staff member
   - Watch for all `[Staff Creation]` log messages
   - Note any errors

2. **Verify Immediately After Creation**
   - Go to Firebase Console → Authentication
   - Check if staff account exists
   - Check Firestore → `staff` collection
   - Verify `authUid` field is populated

3. **Test Staff Login**
   - Sign out as super admin
   - Try to sign in with staff email and password
   - Should successfully authenticate

## Current Implementation Notes

- Super admin credentials are stored in `sessionStorage` when they sign in with email/password
- Credentials expire after 24 hours
- If Firebase Auth account creation fails, an error is thrown and super admin is signed back in
- Staff document should NOT be created if Firebase Auth account creation fails
- All steps have console logging for debugging

## If Staff Document is Created Without authUid

This indicates a critical bug where the Firestore document is being created even when Firebase Auth account creation fails. 

**Immediate Actions:**
1. Check browser console for errors
2. Check if `staffAuthUid` is null when creating Firestore document
3. Verify the validation check `if (!staffAuthUid)` is working
4. Check if error is being caught and ignored somewhere

## Code Flow Verification

The code should follow this exact sequence:

```typescript
1. Sign out super admin
2. Create Firebase Auth account → Get staffAuthUid
3. Create user document in Firestore users collection
4. Sign super admin back in
5. Validate staffAuthUid is not null
6. Create staff document in Firestore with authUid field
7. Verify document was created with correct authUid
```

If any step fails, the process should stop and throw an error.

