# Quick Fix: Firestore Index Error

## What's happening?
You're seeing a warning about a missing Firestore index. **Your app still works!** It's just falling back to a slower query method.

## Quick Fix (30 seconds)

1. **Look at the error message in your browser console**
2. **Find the URL** that starts with `https://console.firebase.google.com/...`
3. **Copy and paste that URL** into your browser
4. **Click "Create Index"** button
5. **Wait 1-2 minutes** for the index to build
6. **Refresh your app** - the warning will disappear!

## Example Error Message
```
The query requires an index. You can create it here: 
https://console.firebase.google.com/v1/r/project/storv-ux/firestore/indexes?create_composite=...
```

## What the Index Does
The index allows Firestore to efficiently query departments/staff that:
- Belong to a specific user (`createdBy == userId`)
- Are sorted by creation date (`orderBy createdAt`)

Without the index, Firestore falls back to:
- ✅ Still works correctly
- ⚠️ May be slightly slower for large datasets
- ✅ Results are still sorted correctly (app sorts manually)

## After Creating the Index
- ✅ No more warnings in console
- ✅ Faster queries
- ✅ Better performance at scale

## Need More Help?
See `FIRESTORE_INDEX_SETUP.md` for detailed instructions.

