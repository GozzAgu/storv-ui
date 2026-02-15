import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  type FirebaseStorage,
  type UploadTaskSnapshot,
} from 'firebase/storage'
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
    const storage = getStorageInstance()
    if (!storage) {
      throw new Error('Firebase Storage not initialized')
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

    return new Promise((resolve, reject) => {
      const uploadTask = uploadBytesResumable(storageRef, file, {
        contentType: file.type,
      })

      uploadTask.on(
        'state_changed',
        (snapshot: UploadTaskSnapshot) => {
          if (options.onProgress && snapshot.totalBytes > 0) {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            options.onProgress(Math.round(progress))
          }
        },
        (error) => {
          reject(error)
        },
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
   * Delete an image from Firebase Storage
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
    buildPath,
    getStorageInstance,
    allowedImageTypes: ALLOWED_IMAGE_TYPES,
    maxFileSizeBytes: MAX_FILE_SIZE_BYTES,
  }
}
