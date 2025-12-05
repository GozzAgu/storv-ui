# Multi-Store Implementation Status

## ✅ Completed

### 1. Type Definitions & Core Infrastructure
- ✅ Created `Store` interface in `composables/useStores.ts`
- ✅ Created stores Pinia store (`stores/stores.ts`) with full CRUD operations
- ✅ Added `storeId` field to all data models:
  - Department
  - Staff
  - InventoryFolder
  - InventoryItem
  - Receipt
  - Customer
- ✅ Created `getCurrentStoreId()` helper function for store context

### 2. Store Management
- ✅ Stores store with complete CRUD operations
- ✅ Store context management (current store selection)
- ✅ localStorage persistence for current store
- ✅ Store initialization on app load

### 3. Data Store Updates
- ✅ **Departments Store**: Updated to filter by `storeId` + `createdBy`
  - `fetchDepartments()` - filters by storeId
  - `createDepartment()` - includes storeId
  - `fetchDepartment()` - verifies storeId
  - `updateDepartment()` - verifies storeId
  - `deleteDepartment()` - verifies storeId
- ✅ **Staff Store**: Partially updated
  - `fetchStaff()` - filters by storeId
  - `fetchStaffByDepartment()` - filters by storeId
  - `createStaff()` - includes storeId assignment
  - ⚠️ Still needs: `fetchStaffMember()` storeId verification

### 4. UI Components
- ✅ Store management page (`pages/dashboard/stores.vue`)
  - Create/edit stores
  - List all stores
  - Switch between stores
  - Delete stores
- ✅ Store selector component (`components/ui/StoreSelector.vue`)
  - Dropdown to switch stores
  - Shows current store
  - Link to manage stores

### 5. Security
- ✅ Updated Firestore rules to support store-level access
  - Store-level filtering handled client-side (recommended approach)
  - Basic access control maintained

## ⚠️ Partially Completed / Needs Review

### 1. Staff Store
- ⚠️ `fetchStaffMember()` needs storeId verification
- ⚠️ `updateStaff()` needs storeId verification
- ⚠️ `deleteStaff()` needs storeId verification
- ⚠️ Staff creation modal needs to ensure storeId is set

### 2. Inventory Store
- ❌ `fetchFolders()` - needs storeId filtering
- ❌ `fetchItems()` - needs storeId filtering
- ❌ All create/update operations - need storeId

### 3. Receipts Store
- ❌ `fetchReceipts()` - needs storeId filtering
- ❌ `createReceipt()` - needs storeId
- ❌ All queries need storeId filtering

### 4. Customers Store
- ❌ All queries need storeId filtering
- ❌ Customer creation needs storeId

## ❌ Not Yet Started

### 1. UI Integration
- ❌ Add StoreSelector to dashboard layout header
- ❌ Add "Stores" link to navigation menu (for super admins)
- ❌ Update onboarding to create first store

### 2. Data Migration
- ❌ Migration script for existing data
  - Create default store for existing super admins
  - Add storeId to all existing records
  - Assign existing staff to default store

### 3. Firestore Indexes
- ❌ Create indexes for storeId queries:
  - `departments`: storeId + createdBy + createdAt
  - `staff`: storeId + createdBy + createdAt
  - `staff`: storeId + departmentId + createdBy
  - `inventoryFolders`: storeId + createdBy + createdAt
  - `inventoryItems`: storeId + folderId + createdBy
  - `receipts`: storeId + createdBy + createdAt
  - `customers`: storeId + createdBy + createdAt

## 📝 Implementation Notes

### Store Context Management
- Super admins can switch between multiple stores
- Staff are automatically assigned to a store and can only see that store's data
- Current store is persisted in localStorage
- Store context is initialized on app load

### Data Isolation
All queries now filter by:
1. `createdBy` - User ownership
2. `storeId` - Store isolation

### Staff Access
- Staff members get their `storeId` from their staff document
- Staff queries automatically use their assigned store
- Staff cannot switch stores (only see their assigned store)

### Next Steps Priority

1. **High Priority**
   - Complete inventory store updates
   - Complete receipts store updates
   - Complete customers store updates
   - Add StoreSelector to dashboard layout

2. **Medium Priority**
   - Create Firestore indexes
   - Add stores link to navigation
   - Update onboarding flow

3. **Low Priority**
   - Data migration script
   - Advanced store features (store settings, etc.)

## 🔧 How to Complete Remaining Work

### 1. Update Inventory Store
Similar pattern to departments store:
```typescript
// In fetchFolders():
const storeId = await getCurrentStoreId()
const q = query(
  foldersRef,
  where('storeId', '==', storeId),
  where('createdBy', '==', userId),
  orderBy('createdAt', 'desc')
)

// In createFolder():
const storeId = await getCurrentStoreId()
const newFolder = {
  ...folderData,
  storeId,
  // ...
}
```

### 2. Update Receipts Store
Same pattern - add storeId to all queries and create operations.

### 3. Add StoreSelector to Dashboard
In `layouts/dashboard.vue`, add before the profile dropdown:
```vue
<StoreSelector />
```

### 4. Create Firestore Indexes
Use the Firebase Console or deploy via `firestore.indexes.json`. See `CREATE_INDEX_NOW.md` for format.

## 📚 Files Created/Modified

### New Files
- `composables/useStores.ts` - Store type definitions
- `composables/useCurrentStore.ts` - Store context helper
- `stores/stores.ts` - Stores Pinia store
- `pages/dashboard/stores.vue` - Store management UI
- `components/ui/StoreSelector.vue` - Store selector dropdown

### Modified Files
- `composables/useDepartments.ts` - Added storeId field
- `composables/useStaff.ts` - Added storeId field
- `stores/departments.ts` - Added storeId filtering
- `stores/staff.ts` - Partial storeId filtering
- `stores/receipts.ts` - Added storeId field (needs filtering updates)
- `stores/inventory.ts` - Added storeId field (needs filtering updates)
- `stores/customers.ts` - Added storeId field (needs filtering updates)
- `firestore.rules` - Updated for store support

## 🎯 Testing Checklist

- [ ] Create multiple stores as super admin
- [ ] Switch between stores
- [ ] Create departments in different stores (verify isolation)
- [ ] Create staff in specific store (verify they only see that store)
- [ ] Verify staff can only see their store's data
- [ ] Test store deletion (should warn about data)
- [ ] Verify all queries filter by storeId
