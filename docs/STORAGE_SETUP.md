# Firebase Storage Setup for Images

Firebase Storage is configured for saving images. Use the `useFirebaseStorage` composable to upload, fetch, and delete images.

## 1. Enable Firebase Storage

1. Go to [Firebase Console](https://console.firebase.google.com) → your project → **Storage**
2. Click **Get started** if Storage isn’t enabled yet
3. Choose **Start in test mode** (or production) and select a location

## 2. Deploy Storage Rules

**Option A: Using Firebase CLI**
```bash
firebase login
firebase deploy --only storage
```

**Option B: Using Firebase Console**
1. Open **Storage** → **Rules**
2. Replace the rules with the content of `storage.rules` in this project
3. Click **Publish**

## Usage

### Upload an image

```vue
<script setup lang="ts">
const { uploadImage } = useFirebaseStorage()
const { currentUser } = useFirebaseAuth()

async function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file || !currentUser.value) return

  try {
    const { url, path } = await uploadImage(file, currentUser.value.uid, {
      folder: 'products',
      onProgress: (p) => console.log(`${p}%`),
    })
    console.log('Uploaded:', url)
    // Save url or path to Firestore
  } catch (err) {
    console.error('Upload failed:', err)
  }
}
</script>

<template>
  <input type="file" accept="image/*" @change="handleFileChange" />
</template>
```

### Get download URL

```ts
const { getImageUrl } = useFirebaseStorage()
const url = await getImageUrl('images/user123/products/photo.jpg')
```

### Delete an image

```ts
const { deleteImage } = useFirebaseStorage()
await deleteImage('images/user123/products/photo.jpg')
```

## Path structure

- `images/{userId}/{folder}/{filename}`: user-scoped images (e.g. products, avatars)

## Limits

- Allowed types: JPEG, PNG, GIF, WebP
- Max file size: 5MB (configurable in composable)
- Paths are scoped by `userId` for security
