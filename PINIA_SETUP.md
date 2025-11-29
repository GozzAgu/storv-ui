# Pinia State Management Setup

## Overview
Pinia has been integrated into the application to manage global state. All major functionality has been moved from composables to Pinia stores for better state management and organization.

## Installed Packages
- `pinia` - Core Pinia library
- `@pinia/nuxt` - Nuxt.js integration for Pinia

## Stores Created

### 1. **Auth Store** (`stores/auth.ts`)
Manages Firebase authentication state and operations:
- `currentUser` - Current authenticated user
- `loading` - Authentication loading state
- `isAuthenticated` - Computed getter
- Actions:
  - `initAuth()` - Initialize auth state listener
  - `signIn()` - Email/password sign in
  - `signUp()` - Email/password sign up
  - `signOut()` - Sign out user
  - `signInWithGoogle()` - Google authentication
  - `resetPassword()` - Send password reset email
  - `sendPhoneVerificationCode()` - Phone authentication (send code)
  - `verifyPhoneCode()` - Phone authentication (verify code)
  - `updateUserPassword()` - Change user password
  - `getActiveSessions()` - Get active sessions
  - `clearRecaptcha()` - Clean up reCAPTCHA

### 2. **User Store** (`stores/user.ts`)
Manages user profile data from Firestore:
- `userData` - User document data
- `loading` - Loading state
- `error` - Error state
- Getters:
  - `isSuperAdmin` - Check if user is super admin
  - `hasCompletedOnboarding` - Check onboarding status
  - `hasCompletedTutorial` - Check tutorial status
  - `storeDetails` - Get store details
- Actions:
  - `fetchUserData()` - Fetch user data from Firestore
  - `createUserDocument()` - Create new user document
  - `updateUserDocument()` - Update user document
  - `updateStoreDetails()` - Update store information
  - `completeTutorial()` - Mark tutorial as complete
  - `completeOnboarding()` - Mark onboarding as complete
  - `clearUserData()` - Clear user data

### 3. **Departments Store** (`stores/departments.ts`)
Manages departments data and operations:
- `departments` - Array of departments
- `loading` - Loading state
- `error` - Error state
- Getters:
  - `totalDepartments` - Total count
  - `totalStaff` - Total staff across all departments
  - `totalManagers` - Total managers
  - `averageStaffPerDept` - Average staff per department
  - `getDepartmentById()` - Get department by ID
- Actions:
  - `fetchDepartments()` - Fetch all departments
  - `fetchDepartment()` - Fetch single department
  - `createDepartment()` - Create new department
  - `updateDepartment()` - Update department
  - `deleteDepartment()` - Delete department
  - `updateStaffCount()` - Update staff count for department

### 4. **Staff Store** (`stores/staff.ts`)
Manages staff data and operations:
- `staff` - Array of staff members
- `loading` - Loading state
- `error` - Error state
- Getters:
  - `totalStaff` - Total staff count
  - `getStaffByDepartment()` - Filter staff by department
  - `getStaffMember()` - Get staff member by ID
- Actions:
  - `fetchStaff()` - Fetch all staff
  - `fetchStaffByDepartment()` - Fetch staff for specific department
  - `fetchStaffMember()` - Fetch single staff member
  - `createStaff()` - Create new staff member
  - `updateStaff()` - Update staff member
  - `deleteStaff()` - Delete staff member

### 5. **Theme Store** (`stores/theme.ts`)
Manages theme state:
- `theme` - Current theme ('light' | 'dark' | 'system')
- `initialized` - Initialization flag
- Getters:
  - `actualTheme` - Computed actual theme (resolves 'system' to light/dark)
- Actions:
  - `initTheme()` - Initialize theme from localStorage
  - `applyTheme()` - Apply theme to document
  - `setTheme()` - Set new theme
  - `watchSystemTheme()` - Watch for system theme changes

## Plugin Setup

### Pinia Auth Plugin (`plugins/pinia-auth.client.ts`)
- Initializes auth store on app startup
- Initializes theme store on app startup

## Migration Status

### ✅ Migrated to Stores:
- Authentication state (Auth Store)
- User data (User Store)
- Departments management (Departments Store)
- Staff management (Staff Store)
- Theme management (Theme Store)

### 🔄 Components Updated:
- `pages/dashboard/departments.vue` - Now uses `useDepartmentsStore()` and `useAuthStore()`

### 📝 Remaining Work:
- Update remaining pages/components to use stores
- Update composables to be wrappers around stores (or remove if redundant)
- Update middleware to use stores
- Update other dashboard pages

## Usage Examples

### Using Auth Store
```typescript
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()

// Access current user
const user = authStore.currentUser

// Check if authenticated
if (authStore.isAuthenticated) {
  // User is logged in
}

// Sign in
await authStore.signIn(email, password)
```

### Using Departments Store
```typescript
import { useDepartmentsStore } from '~/stores/departments'

const departmentsStore = useDepartmentsStore()

// Fetch departments
await departmentsStore.fetchDepartments()

// Access departments
const depts = departmentsStore.departments

// Get stats
const total = departmentsStore.totalDepartments
const avgStaff = departmentsStore.averageStaffPerDept

// Create department
await departmentsStore.createDepartment({
  name: 'Sales',
  description: 'Sales department',
  departmentType: 'Sales'
})
```

### Using Staff Store
```typescript
import { useStaffStore } from '~/stores/staff'

const staffStore = useStaffStore()

// Fetch staff for department
await staffStore.fetchStaffByDepartment(departmentId)

// Access staff
const allStaff = staffStore.staff

// Create staff
await staffStore.createStaff({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  departmentId: 'dept-123',
  position: 'Manager',
  role: 'manager',
  hireDate: '2024-01-01',
  status: 'active'
})
```

### Using User Store
```typescript
import { useUserStore } from '~/stores/user'

const userStore = useUserStore()

// Fetch user data
await userStore.fetchUserData(userId)

// Check if super admin
if (userStore.isSuperAdmin) {
  // Super admin logic
}

// Update store details
await userStore.updateStoreDetails(userId, {
  storeName: 'My Store',
  // ... other details
})
```

### Using Theme Store
```typescript
import { useThemeStore } from '~/stores/theme'

const themeStore = useThemeStore()

// Set theme
themeStore.setTheme('dark')

// Get current theme
const theme = themeStore.theme
const actualTheme = themeStore.actualTheme // 'light' or 'dark'
```

## Benefits of Pinia

1. **Centralized State** - All global state in one place
2. **Type Safety** - Full TypeScript support
3. **DevTools** - Better debugging with Vue DevTools
4. **Performance** - Automatic optimization and caching
5. **SSR Support** - Works seamlessly with Nuxt SSR
6. **Better Organization** - Clear separation of concerns

## Next Steps

1. Continue migrating components to use stores
2. Update composables to be thin wrappers if needed
3. Add more stores as needed (e.g., inventory, receipts, etc.)
4. Add store persistence for non-sensitive data if needed

