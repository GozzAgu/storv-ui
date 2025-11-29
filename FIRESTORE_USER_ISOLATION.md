# Firestore User Isolation Setup

## Overview
The application now implements user isolation, ensuring that each super admin can only see and manage their own departments and staff. All data is filtered by the `createdBy` field matching the current user's UID.

## Changes Made

### 1. **Departments Store** (`stores/departments.ts`)
- **`fetchDepartments()`**: Now filters by `where('createdBy', '==', userId)` to only fetch departments created by the current user
- **`fetchDepartment()`**: Verifies the department belongs to the current user before returning
- **`createDepartment()`**: Already sets `createdBy` to the current user's UID
- **`updateDepartment()`**: Verifies ownership before allowing updates
- **`deleteDepartment()`**: Verifies ownership and only checks for staff created by the same user

### 2. **Staff Store** (`stores/staff.ts`)
- **`fetchStaff()`**: Now filters by `where('createdBy', '==', userId)` to only fetch staff created by the current user
- **`fetchStaffByDepartment()`**: Filters by both `departmentId` and `createdBy` to ensure user isolation
- **`fetchStaffMember()`**: Verifies the staff member belongs to the current user
- **`createStaff()`**: Verifies the department belongs to the user before creating staff
- **`updateStaff()`**: Verifies ownership and ensures department changes are within user's departments
- **`deleteStaff()`**: Verifies ownership before deletion

### 3. **Firestore Security Rules** (`firestore.rules`)
Updated to enforce user isolation at the database level:

```javascript
// Departments collection - users can only access their own departments
match /departments/{departmentId} {
  allow read: if isAuthenticated() && resource.data.createdBy == request.auth.uid;
  allow create: if isAuthenticated() && request.resource.data.createdBy == request.auth.uid;
  allow update: if isAuthenticated() && resource.data.createdBy == request.auth.uid;
  allow delete: if isAuthenticated() && resource.data.createdBy == request.auth.uid;
}

// Staff collection - users can only access their own staff
match /staff/{staffId} {
  allow read: if isAuthenticated() && resource.data.createdBy == request.auth.uid;
  allow create: if isAuthenticated() && request.resource.data.createdBy == request.auth.uid;
  allow update: if isAuthenticated() && resource.data.createdBy == request.auth.uid;
  allow delete: if isAuthenticated() && resource.data.createdBy == request.auth.uid;
}
```

## How It Works

1. **Data Creation**: When a department or staff member is created, the `createdBy` field is automatically set to the current user's UID
2. **Data Fetching**: All queries filter by `createdBy == currentUser.uid` to only return data belonging to the current user
3. **Data Updates**: Before any update, the system verifies that the document belongs to the current user
4. **Data Deletion**: Before deletion, the system verifies ownership and ensures related data (staff in departments) also belongs to the user
5. **Security Rules**: Firestore rules enforce these restrictions at the database level, providing an additional layer of security

## Required Firestore Indexes

You may need to create composite indexes in Firestore for queries that filter by multiple fields:

1. **Departments**: `createdBy` + `createdAt` (descending)
2. **Staff**: `createdBy` + `createdAt` (descending)
3. **Staff by Department**: `departmentId` + `createdBy` + `createdAt` (descending)

Firebase will prompt you to create these indexes when you first use them, or you can create them manually in the Firebase Console.

## Deployment

**IMPORTANT**: You must deploy the updated Firestore security rules to Firebase Console:

1. Go to Firebase Console → Firestore Database → Rules
2. Copy the contents of `firestore.rules`
3. Paste into the rules editor
4. Click "Publish"

The rules will enforce user isolation at the database level, preventing any user from accessing another user's data even if they try to bypass the application code.

## Benefits

1. **Data Privacy**: Each super admin can only see and manage their own data
2. **Security**: Multi-layer protection (application-level filtering + database-level rules)
3. **Scalability**: Each user's data is isolated, making the system scalable
4. **Compliance**: Better data privacy and compliance with regulations

## Testing

After deploying the rules, test that:
1. User A can only see their own departments and staff
2. User B can only see their own departments and staff
3. User A cannot access User B's data
4. Creating, updating, and deleting operations work correctly for each user

