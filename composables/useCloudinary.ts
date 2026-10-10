import { computed } from 'vue'
import {
  IMAGE_UPLOAD_MAX_BYTES,
  IMAGE_UPLOAD_TYPE,
  ensureImageUpload,
  type PrepareImageOptions,
} from '~/utils/image-upload'

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
    picked: File,
    image?: PrepareImageOptions
  ): Promise<{ url: string; publicId: string | undefined }> => {
    const cloudName = String(config.public.cloudinaryCloudName || '').trim()
    const preset = String(config.public.cloudinaryUploadPreset || '').trim()
    if (!cloudName || !preset) {
      throw new Error(
        'Cloudinary is not configured. Set NUXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NUXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in .env'
      )
    }

    const file = await ensureImageUpload(picked, image)

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
    allowedImageTypes: [IMAGE_UPLOAD_TYPE],
    maxFileBytes: IMAGE_UPLOAD_MAX_BYTES,
  }
}
