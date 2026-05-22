import {
  getStorage,
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  type FirebaseStorage,
  type UploadTaskSnapshot,
} from 'firebase/storage'
import { FirebaseError } from 'firebase/app'
import { getFirebaseClientAuth } from '~/utils/firebase-client-auth'
import { useFirebase } from './useFirebase'

/** Allowed image MIME types */
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
]

/** Max file size: 5MB */
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024

/**
 * Human-readable message for Firebase Storage failures (storage/unknown is often config/network).
 */
export function getFirebaseStorageErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    const raw = typeof (error as FirebaseError & { customData?: { serverResponse?: string } }).customData?.serverResponse === 'string'
      ? String((error as FirebaseError & { customData?: { serverResponse?: string } }).customData?.serverResponse)
      : ''

    switch (error.code) {
      case 'storage/unauthorized':
        return 'Storage blocked by rules. Sign in again or check that your account owns this upload path.'
      case 'storage/canceled':
        return 'Upload was canceled.'
      case 'storage/quota-exceeded':
        return 'Storage quota exceeded for this project.'
      case 'storage/unauthenticated':
        return 'You must be signed in to upload files.'
      case 'storage/retry-limit-exceeded':
        return 'Upload failed after retries. Check your connection and try again.'
      case 'storage/invalid-checksum':
        return 'File was corrupted during upload. Try again.'
      case 'storage/unknown':
        return raw
          ? `Upload failed (${error.code}): ${raw}`
          : 'Upload failed (storage/unknown). The app will retry via the server if possible. Also verify NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET in Firebase Console → Project settings, Storage enabled, rules deployed, and FIREBASE_SERVICE_ACCOUNT_JSON for local API uploads.'
      default:
        return error.message || 'Upload failed.'
    }
  }
  if (error instanceof Error) return error.message
  return 'Upload failed.'
}

export interface UploadResult {
  url: string
  path: string
}

export interface UploadOptions {
  /** Base path (e.g. 'products', 'avatars'). Will be prefixed with userId */
  folder?: string
  /** Optional custom filename. If not provided, uses original name + timestamp */
  filename?: string
  /** Called with progress 0-100 */
  onProgress?: (progress: number) => void
}

/**
 * Composable for Firebase Storage image operations
 */
export const useFirebaseStorage = () => {
  const { getApp } = useFirebase()

  const getStorageInstance = (): FirebaseStorage | null => {
    if (import.meta.server) return null

    const app = getApp()
    if (!app) {
      console.warn('Firebase app not initialized')
      return null
    }

    // Use the default bucket from initializeApp(storageBucket). A second gs:// argument can
    // mismatch some Firebase / bucket combinations and surface as storage/unknown.
    return getStorage(app)
  }

  /**
   * Upload an image file to Firebase Storage
   * Path format: images/{userId}/{folder}/{filename}
   */
  const uploadImage = async (
    file: File,
    userId: string,
    options: UploadOptions = {}
  ): Promise<UploadResult> => {
    const app = getApp()
    const storage = getStorageInstance()
    if (!storage || !app) {
      throw new Error('Firebase Storage not initialized')
    }

    const auth = getFirebaseClientAuth()
    if (auth?.currentUser) {
      await auth.currentUser.getIdToken(true)
    }

    // Validate file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      throw new Error(
        `Invalid file type. Allowed: ${ALLOWED_IMAGE_TYPES.join(', ')}`
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new Error(`File too large. Max size: ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB`)
    }

    const folder = options.folder || 'uploads'
    const filename =
      options.filename ||
      `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const path = `images/${userId}/${folder}/${filename}`
    const storageRef = ref(storage, path)

    if (options.onProgress) {
      return new Promise((resolve, reject) => {
        const uploadTask = uploadBytesResumable(storageRef, file, {
          contentType: file.type,
        })

        uploadTask.on(
          'state_changed',
          (snapshot: UploadTaskSnapshot) => {
            if (snapshot.totalBytes > 0) {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
              options.onProgress!(Math.round(progress))
            }
          },
          (error) => reject(error),
          async () => {
            try {
              const url = await getDownloadURL(uploadTask.snapshot.ref)
              resolve({ url, path })
            } catch (err) {
              reject(err)
            }
          }
        )
      })
    }

    await uploadBytes(storageRef, file, { contentType: file.type })
    const url = await getDownloadURL(storageRef)
    return { url, path }
  }

  /**
   * Get download URL for an existing file
   */
  const getImageUrl = async (path: string): Promise<string> => {
    const storage = getStorageInstance()
    if (!storage) {
      throw new Error('Firebase Storage not initialized')
    }

    const storageRef = ref(storage, path)
    return getDownloadURL(storageRef)
  }

  /**
   * Delete an image from Firebase Storage by path
   */
  const deleteImage = async (path: string): Promise<void> => {
    const storage = getStorageInstance()
    if (!storage) {
      throw new Error('Firebase Storage not initialized')
    }

    const storageRef = ref(storage, path)
    await deleteObject(storageRef)
  }

  /**
   * Delete an image from Firebase Storage by download URL.
   * Extracts the storage path from Firebase Storage URLs.
   */
  const deleteImageByUrl = async (url: string): Promise<void> => {
    if (!url) return

    // Firebase Storage URL format: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{encodedPath}?alt=media&token=...
    const match = url.match(/\/o\/(.+?)\?/)
    const encodedPath = match?.[1]
    if (!encodedPath) return

    const path = decodeURIComponent(encodedPath)
    await deleteImage(path)
  }

  /**
   * Build storage path for consistent naming
   */
  const buildPath = (
    userId: string,
    folder: string,
    filename: string
  ): string => {
    return `images/${userId}/${folder}/${filename}`
  }

  return {
    uploadImage,
    getImageUrl,
    deleteImage,
    deleteImageByUrl,
    buildPath,
    getStorageInstance,
    getFirebaseStorageErrorMessage,
    allowedImageTypes: ALLOWED_IMAGE_TYPES,
    maxFileSizeBytes: MAX_FILE_SIZE_BYTES,
  }
}
