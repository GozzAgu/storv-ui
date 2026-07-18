import { computed } from 'vue'

/** Match app image rules (see useFirebaseStorage) */
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
] as const

const MAX_FILE_BYTES = 5 * 1024 * 1024

type CloudinaryUploadJson = {
  secure_url?: string
  public_id?: string
  error?: { message?: string }
}

export const useCloudinary = () => {
  const config = useRuntimeConfig()

  const isConfigured = computed(() => {
    const cloud = String(config.public.cloudinaryCloudName || '').trim()
    const preset = String(config.public.cloudinaryUploadPreset || '').trim()
    return Boolean(cloud && preset)
  })

  /**
   * Unsigned upload via upload preset (preset must be "Unsigned" in Cloudinary dashboard).
   */
  const uploadImage = async (
    file: File
  ): Promise<{ url: string; publicId: string | undefined }> => {
    const cloudName = String(config.public.cloudinaryCloudName || '').trim()
    const preset = String(config.public.cloudinaryUploadPreset || '').trim()
    if (!cloudName || !preset) {
      throw new Error(
        'Cloudinary is not configured. Set NUXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NUXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in .env'
      )
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
      throw new Error(`Invalid file type. Allowed: ${ALLOWED_IMAGE_TYPES.join(', ')}`)
    }
    if (file.size > MAX_FILE_BYTES) {
      throw new Error(`File too large. Max ${MAX_FILE_BYTES / 1024 / 1024}MB`)
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', preset)

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    })

    const data = (await res.json()) as CloudinaryUploadJson

    if (!res.ok) {
      throw new Error(data.error?.message || `Cloudinary upload failed (${res.status})`)
    }
    if (!data.secure_url) {
      throw new Error('Cloudinary returned no image URL')
    }

    return { url: data.secure_url, publicId: data.public_id }
  }

  return {
    isConfigured,
    uploadImage,
    allowedImageTypes: ALLOWED_IMAGE_TYPES,
    maxFileBytes: MAX_FILE_BYTES,
  }
}
