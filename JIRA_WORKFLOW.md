# Jira Workflow - Staff Account Creation & Role-Based Authentication

## Epic: Staff Account Management System
**Epic Description:** Implement a comprehensive staff account creation and management system that allows super admins to create staff members who can log in with their own credentials and access role-appropriate UI.

**Epic Acceptance Criteria:**
- Super admins can create staff members from departments page
- Staff members can log in with email and password
- Staff members see role-appropriate UI (limited access)
- Staff authentication is secure and follows Firebase best practices

---

## Story 1: Staff Creation Modal Enhancement
**Story Type:** Feature
**Story Points:** 5
**Priority:** High

### Description
As a super admin, I want to create staff members with login credentials so that they can access the system.

### Acceptance Criteria
- [ ] Add password field to StaffModal component
- [ ] Password field only appears when creating new staff (not editing)
- [ ] Password validation (minimum 6 characters)
- [ ] Clear UI indication that password is for staff login
- [ ] Form validation prevents submission without valid password

### Tasks
1. **Update StaffModal Component**
   - Add password input field to form
   - Add conditional rendering for create vs edit mode
   - Add password validation logic
   - Update form validation computed property

2. **Update Form Data Interface**
   - Add password to formData ref
   - Update resetForm function to include password
   - Ensure password is excluded when editing

### Technical Notes
- File: `components/departments/StaffModal.vue`
- Password field should be required only for new staff creation
- Consider password strength requirements

---

## Story 2: Firebase Auth Account Creation for Staff
**Story Type:** Feature
**Story Points:** 8
**Priority:** High

### Description
As a system, I need to automatically create Firebase Auth accounts when staff members are created so they can authenticate.

### Acceptance Criteria
- [ ] Firebase Auth account created when staff is added
- [ ] Account creation handles errors gracefully (e.g., when super admin is logged in)
- [ ] Staff document linked to Firebase Auth UID
- [ ] User document created in Firestore with 'staff' role
- [ ] Temporary password storage if immediate account creation fails

### Tasks
1. **Update Staff Store - Account Creation**
   - Integrate Firebase Auth account creation in `createStaff` method
   - Handle cases where account creation might fail
   - Store temporary password if needed for later activation
   - Link staff document with authUid field

2. **Update Staff Interface**
   - Add `authUid` field to Staff interface
   - Add `tempPassword` field for temporary storage (if needed)

3. **User Document Creation**
   - Create user document with role 'staff'
   - Set appropriate onboarding flags
   - Link to staff document via email or authUid

### Technical Notes
- Files: `stores/staff.ts`, `composables/useStaff.ts`
- Consider using Firebase Cloud Functions for account creation (production best practice)
- Handle race conditions and duplicate email errors
- Security: Never log passwords, hash if storing temporarily

---

## Story 3: Staff Login Flow Implementation
**Story Type:** Feature
**Story Points:** 8
**Priority:** High

### Description
As a staff member, I want to log in with my email and password so I can access the application with my assigned permissions.

### Acceptance Criteria
- [ ] Staff can log in using email and password
- [ ] System checks if email belongs to staff collection
- [ ] Staff accounts without authUid are activated on first login
- [ ] Temporary password is verified before account creation
- [ ] Staff is redirected appropriately after login (no onboarding)
- [ ] Error messages are clear and helpful

### Tasks
1. **Update Signin Page - Staff Account Check**
   - Add function to check if email belongs to staff member
   - Query Firestore staff collection by email
   - Handle account activation flow for unactivated staff

2. **Account Activation Logic**
   - Verify temporary password
   - Create Firebase Auth account on first login
   - Update staff document with authUid
   - Remove temporary password from document
   - Create user document with staff role

3. **Login Routing for Staff**
   - Staff skip onboarding flow
   - Staff go directly to dashboard
   - Handle role-based redirects appropriately

### Technical Notes
- File: `pages/signin.vue`
- Use Firestore queries to find staff by email
- Consider indexing staff collection by email for performance
- Handle edge cases (multiple staff with same email, account already exists, etc.)

---

## Story 4: Role-Based UI Filtering
**Story Type:** Feature
**Story Points:** 5
**Priority:** High

### Description
As a staff member, I want to see only the navigation items I have access to so the interface is clean and appropriate for my role.

### Acceptance Criteria
- [ ] Navigation sidebar filters items based on user role
- [ ] Super admins see all navigation items
- [ ] Staff members see limited navigation (no Departments, no Settings)
- [ ] Navigation updates automatically when user data loads
- [ ] Role check happens on page load and auth state changes

### Tasks
1. **Update UserData Interface**
   - Add 'staff' as valid role type
   - Ensure role is properly typed throughout application

2. **Implement Role-Based Navigation**
   - Create base navigation items with role permissions
   - Filter navigation based on user role
   - Use computed property for reactive navigation
   - Update navigation items to include roles array

3. **Load User Data on Dashboard**
   - Fetch user data when dashboard layout loads
   - Watch for auth state changes
   - Ensure user role is available before rendering navigation

### Technical Notes
- Files: `layouts/dashboard.vue`, `composables/useUser.ts`, `stores/user.ts`
- Consider caching user data to avoid repeated fetches
- Ensure navigation is reactive to role changes

---

## Story 5: Staff Profile & User Document Management
**Story Type:** Feature
**Story Points:** 3
**Priority:** Medium

### Description
As a system, I need to properly manage staff user documents so staff information is consistent across collections.

### Acceptance Criteria
- [ ] User document created with correct staff role
- [ ] Staff profile information synced between staff and user collections
- [ ] Staff can view their own profile
- [ ] Profile page shows appropriate information for staff role

### Tasks
1. **User Document Schema Updates**
   - Ensure 'staff' role is supported in UserData interface
   - Add staff-specific fields if needed

2. **Profile Page Role Handling**
   - Ensure profile page works for staff members
   - Show appropriate fields based on role
   - Handle staff vs super admin profile differences

### Technical Notes
- Files: `pages/dashboard/profile.vue`, `composables/useUser.ts`
- Consider data synchronization between staff and user collections

---

## Story 6: Security & Error Handling
**Story Type:** Technical Debt / Security
**Story Points:** 5
**Priority:** High

### Description
As a system, I need to handle edge cases, errors, and security concerns properly so the application is robust and secure.

### Acceptance Criteria
- [ ] Proper error handling for all staff account operations
- [ ] Password is never logged or exposed in error messages
- [ ] Firestore security rules updated for staff collection
- [ ] Handle duplicate email scenarios
- [ ] Handle network failures gracefully
- [ ] Provide helpful error messages to users

### Tasks
1. **Firestore Security Rules**
   - Update rules to allow staff read access to their own data
   - Ensure staff can only access data they're authorized for
   - Review all staff-related collection rules

2. **Error Handling Enhancement**
   - Add try-catch blocks where needed
   - Provide user-friendly error messages
   - Log errors appropriately (without sensitive data)

3. **Edge Case Handling**
   - Handle duplicate emails
   - Handle staff creation while super admin is logged in
   - Handle account activation failures
   - Handle deleted staff members trying to log in

### Technical Notes
- Files: `firestore.rules`, all staff-related files
- Consider rate limiting for account creation
- Implement proper logging strategy

---

## Story 7: Testing & Documentation
**Story Type:** Testing / Documentation
**Story Points:** 5
**Priority:** Medium

### Description
As a developer, I want comprehensive tests and documentation so the feature is maintainable and well-understood.

### Acceptance Criteria
- [ ] Unit tests for staff creation flow
- [ ] Integration tests for staff login flow
- [ ] E2E tests for role-based navigation
- [ ] Documentation for staff account creation process
- [ ] API documentation for staff-related endpoints

### Tasks
1. **Unit Tests**
   - Test StaffModal component
   - Test staff store methods
   - Test user document creation

2. **Integration Tests**
   - Test full staff creation flow
   - Test staff login and account activation
   - Test role-based navigation filtering

3. **Documentation**
   - Update README with staff creation process
   - Document Firebase setup requirements
   - Create user guide for super admins

### Technical Notes
- Consider test coverage goals
- Document any manual testing steps required

---

## Sprint Planning Notes

### Sprint 1: Foundation (Stories 1, 2)
- Staff creation modal enhancement
- Basic Firebase Auth integration

### Sprint 2: Authentication (Story 3)
- Complete login flow
- Account activation logic

### Sprint 3: UI & Security (Stories 4, 6)
- Role-based navigation
- Security enhancements

### Sprint 4: Polish (Stories 5, 7)
- Profile management
- Testing and documentation

---

## Dependencies

### External Dependencies
- Firebase Authentication enabled in Firebase Console
- Firebase Firestore database configured
- Proper Firestore security rules deployed

### Internal Dependencies
- User store implementation
- Auth store implementation
- Theme system (for UI consistency)
- Existing department management system

---

## Risk Assessment

### High Risk
- **Firebase Auth account creation from client-side**: Limited by Firebase security rules. May need Cloud Functions.
- **Password storage**: Temporary password storage needs secure handling.

### Medium Risk
- **Role-based UI**: Need to ensure proper role loading and caching.
- **Staff login activation**: Edge cases around failed activations.

### Low Risk
- **UI changes**: Standard Vue/Nuxt implementation.

---

## Definition of Done

For each story to be considered complete:
- [ ] All acceptance criteria met
- [ ] Code reviewed and approved
- [ ] No TypeScript/linter errors
- [ ] Manual testing completed
- [ ] Edge cases handled
- [ ] Error messages are user-friendly
- [ ] Documentation updated (if applicable)
- [ ] Security considerations addressed
- [ ] Performance acceptable (no obvious bottlenecks)

---

## Additional Notes

### Future Enhancements (Out of Scope)
- Password reset functionality for staff
- Staff invitation emails
- Staff activity logging
- Staff permissions granularity (beyond role-based)
- Multi-factor authentication for staff
- Staff profile photo upload
- Staff onboarding workflow

### Production Considerations
- Use Firebase Cloud Functions for account creation (Admin SDK)
- Implement proper password hashing if temporary storage needed
- Set up email notifications for staff account creation
- Implement rate limiting for account creation
- Add monitoring and alerting for failed account creations

---

## Labels
- `feature`
- `authentication`
- `staff-management`
- `role-based-access`
- `firebase`
- `security`

## Components
- Staff Management
- Authentication
- User Interface

## Labels for Tracking
- `backend`: Stores, composables, Firebase integration
- `frontend`: Components, pages, UI
- `security`: Security rules, password handling
- `testing`: All test-related tasks

