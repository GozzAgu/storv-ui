# Firestore Index Setup Guide

## Problem
When querying Firestore with both a `where()` filter and an `orderBy()` clause, Firestore requires a composite index to efficiently execute the query.

## Solution
Create the required composite index in Firebase Console.

## Quick Fix (Automated)

### Option 1: Use the Link from Error Message
When you see an error like:
```
The query requires an index. You can create it here: https://console.firebase.google.com/...
```

1. **Copy the entire URL** from the error message
2. **Open it in your browser**
3. **Click "Create Index"** button
4. **Wait 1-2 minutes** for the index to build
5. **Refresh your app** - the query will now work

### Option 2: Manual Index Creation

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **storv-ux**
3. Navigate to **Firestore Database** → **Indexes** tab
4. Click **"Create Index"**
5. Set up the index with these fields:

#### Index for Departments Query
- **Collection ID:** `departments`
- **Fields to index:**
  - Field: `createdBy` → Order: **Ascending**
  - Field: `createdAt` → Order: **Descending**
- **Query scope:** Collection
- Click **"Create"**

#### Index for Staff Query (if needed)
- **Collection ID:** `staff`
- **Fields to index:**
  - Field: `createdBy` → Order: **Ascending**
  - Field: `createdAt` → Order: **Descending**
- **Query scope:** Collection
- Click **"Create"**

## Index Status

Once created, the index will show as **"Building"** (takes 1-2 minutes), then **"Enabled"** when ready.

While the index is building, the app will automatically fall back to querying without `orderBy()` and sort the results manually, so your app will still work - just not as efficiently.

## Automated Setup (firestore.indexes.json)

For a more permanent solution, you can create a `firestore.indexes.json` file in your project root:

```json
{
  "indexes": [
    {
      "collectionGroup": "departments",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "createdBy",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "staff",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "createdBy",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    }
  ],
  "fieldOverrides": []
}
```

Then deploy with:
```bash
firebase deploy --only firestore:indexes
```

**Note:** You'll need Firebase CLI installed and your project connected for this method.

## Current Behavior

The app is already handling this gracefully:
- ✅ First tries query with `orderBy` for optimal performance
- ✅ If index doesn't exist, catches error and retries without `orderBy`
- ✅ Manually sorts results after fetching
- ⚠️ Creates warning in console (harmless, but can be fixed by creating index)

## Verification

After creating the index, check the browser console - you should see:
- ✅ No more index error warnings
- ✅ `[DepartmentsStore] Query successful, docs: X` (not "retrying without orderBy")

