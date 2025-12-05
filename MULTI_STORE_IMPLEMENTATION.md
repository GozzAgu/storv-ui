# Multi-Store Implementation Guide

## Overview
This document describes the multi-store feature implementation where super admins can have multiple stores, and staff are assigned to specific stores with data isolation.

## Architecture Changes

### 1. Store Entity
- New `stores` collection in Firestore
- Each store belongs to a super admin (ownerId)
- Super admins can create multiple stores
- Staff are assigned to one store

### 2. Data Isolation
All data is now filtered by:
- `createdBy`: Owner's UID (super admin)
- `storeId`: Store ID for multi-store isolation

### 3. Staff Access
- Staff can only see data from their assigned store
- Staff's `storeId` is set when they are created
- Staff queries automatically filter by their `storeId`

## Type Changes

All interfaces now include `storeId`:
- `Department.storeId`
- `Staff.storeId`
- `InventoryFolder.storeId`
- `InventoryItem.storeId`
- `Receipt.storeId`
- `Customer.storeId`

## Store Updates Needed

### Departments Store
- ✅ Type updated to include `storeId`
- ⏳ `fetchDepartments()`: Filter by `storeId` + `createdBy`
- ⏳ `createDepartment()`: Include `storeId` from current store
- ⏳ `fetchDepartment()`: Verify `storeId` matches
- ⏳ `updateDepartment()`: Verify `storeId` matches
- ⏳ `deleteDepartment()`: Verify `storeId` matches

### Staff Store
- ✅ Type updated to include `storeId`
- ⏳ `fetchStaff()`: Filter by `storeId` + `createdBy`
- ⏳ `createStaff()`: Set `storeId` from current store (super admin) or staff's store (for staff)
- ⏳ All queries need `storeId` filtering

### Inventory Store
- ✅ Types updated to include `storeId`
- ⏳ `fetchFolders()`: Filter by `storeId` + `createdBy`
- ⏳ `fetchItems()`: Filter by `storeId`
- ⏳ All create/update operations need `storeId`

### Receipts Store
- ✅ Type updated to include `storeId`
- ⏳ `fetchReceipts()`: Filter by `storeId` + `createdBy`
- ⏳ `createReceipt()`: Include `storeId` from current store

### Customers Store
- ✅ Type updated to include `storeId`
- ⏳ All queries need `storeId` filtering

## Helper Functions

### `getCurrentStoreId()`
Located in `composables/useCurrentStore.ts`
- For super admins: Returns current selected store from stores store
- For staff: Returns `storeId` from their staff document
- Returns `null` if not available

## Stores Store
Located in `stores/stores.ts`
- Manages store CRUD operations
- Tracks current active store for super admins
- Persists current store in localStorage

## Firestore Security Rules

Rules need to be updated to check:
1. Authentication
2. `createdBy` matches user's UID (or super admin if staff)
3. `storeId` matches user's store (for staff) or is owned by user (for super admin)

## UI Changes Needed

1. **Store Management Page**
   - Create new stores
   - List all stores
   - Switch between stores (for super admin)
   - Edit/delete stores

2. **Store Selector**
   - Dropdown in header/navbar for super admins
   - Shows current store name
   - Allows switching stores

3. **Staff Creation**
   - Automatically assign to current store
   - Display store name in staff list

4. **All Data Lists**
   - Show store name/identifier
   - Filter by store (for super admin with multiple stores)

## Migration Notes

For existing data:
- Need to create a default store for existing super admins
- Migrate existing data to have `storeId` field
- Assign existing staff to default store

## Implementation Priority

1. ✅ Type definitions updated
2. ✅ Stores store created
3. ⏳ Update all data stores to filter by `storeId`
4. ⏳ Update Firestore rules
5. ⏳ Create store management UI
6. ⏳ Update staff creation to include `storeId`
7. ⏳ Add store selector UI
