// src/shared/hooks/useCloudinaryUpload.js
//
// Hook dùng chung cho upload ảnh lên Cloudinary (avatar + course thumbnail)
//
// Setup:
//   1. Tạo tài khoản Cloudinary (free) tại https://cloudinary.com
//   2. Vào Settings → Upload → Add upload preset → Mode: Unsigned
//   3. Điền VITE_CLOUDINARY_CLOUD_NAME và VITE_CLOUDINARY_UPLOAD_PRESET vào .env
//
// Dùng:
//   const { uploading, upload } = useCloudinaryUpload()
//   const url = await upload(file)   // trả về URL string hoặc throw Error

import { useState } from 'react'

const CLOUD_NAME   = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

export function useCloudinaryUpload() {
  const [uploading, setUploading] = useState(false)

  async function upload(file) {
    if (!file) throw new Error('Không có file để upload')
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      throw new Error(
        'Thiếu VITE_CLOUDINARY_CLOUD_NAME hoặc VITE_CLOUDINARY_UPLOAD_PRESET trong .env'
      )
    }

    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('upload_preset', UPLOAD_PRESET)

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        { method: 'POST', body: fd }
      )

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error?.message || 'Upload thất bại')
      }

      const data = await res.json()
      return data.secure_url   // URL HTTPS dùng để lưu vào DB
    } finally {
      setUploading(false)
    }
  }

  return { uploading, upload }
}