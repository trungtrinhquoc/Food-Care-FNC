export interface CloudinaryUploadResult {
  url: string
  publicId: string
  width: number
  height: number
}

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_PRESET

if (!CLOUD_NAME || !UPLOAD_PRESET) {
  console.warn('⚠️ Cloudinary env variables are missing')
}

/**
 * Upload 1 file lên Cloudinary
 */
export async function uploadToCloudinary(
  file: File
): Promise<CloudinaryUploadResult> {
  // Validate
  if (!file.type.startsWith('image/')) {
    throw new Error('Chỉ cho phép upload hình ảnh')
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Ảnh không được vượt quá 5MB')
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', UPLOAD_PRESET)

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  )

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error?.error?.message || 'Upload failed')
  }

  const data = await res.json()

  return {
    url: data.secure_url,
    publicId: data.public_id,
    width: data.width,
    height: data.height,
  }
}

/**
 * Upload nhiều file song song
 */
export async function uploadMultipleToCloudinary(
  files: File[]
): Promise<CloudinaryUploadResult[]> {
  return Promise.all(files.map(uploadToCloudinary))
}
// src/utils/cloudinary.ts
export function cloudinaryResize(
  url?: string,
  size = 800
): string | undefined {
  if (!url) return undefined

  return url.replace(
    '/upload/',
    `/upload/w_${size},h_${size},c_pad,b_white/`
  )
}
