// src/shared/hooks/useCloudinaryPdfUpload.js
//
// Hook upload PDF lên Cloudinary (resource_type: "raw")
// Khác với useCloudinaryUpload (dùng cho ảnh), hook này:
//   - Gọi endpoint /raw/upload thay vì /image/upload
//   - Validate: chỉ chấp nhận PDF, tối đa 5MB
//
// Setup: dùng chung biến .env với hook ảnh:
//   VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
//   VITE_CLOUDINARY_UPLOAD_PRESET=your-unsigned-preset
//
// Dùng:
//   const { uploading, uploadPdf, error: uploadError } = useCloudinaryPdfUpload()
//   const url = await uploadPdf(file)   // trả về URL string hoặc throw Error

import { useState } from 'react'

const CLOUD_NAME    = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB

export function useCloudinaryPdfUpload() {
  const [uploading, setUploading] = useState(false)
  const [error, setError]         = useState('')

  async function uploadPdf(file) {
    setError('')

    // ── Validate ──────────────────────────────────────────────────────────────
    if (!file) throw new Error('Không có file để upload')

    if (file.type !== 'application/pdf') {
      const msg = 'Chỉ chấp nhận file PDF'
      setError(msg)
      throw new Error(msg)
    }

    if (file.size > MAX_SIZE_BYTES) {
      const msg = 'File không được vượt quá 5 MB'
      setError(msg)
      throw new Error(msg)
    }

    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      throw new Error(
        'Thiếu VITE_CLOUDINARY_CLOUD_NAME hoặc VITE_CLOUDINARY_UPLOAD_PRESET trong .env'
      )
    }

    // ── Upload ────────────────────────────────────────────────────────────────
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('upload_preset', UPLOAD_PRESET)
      // folder tuỳ chọn — giữ gọn trong Cloudinary Media Library
      fd.append('folder', 'codemia/cvs')

      const res = await fetch(
        // Dùng /raw/upload — bắt buộc với PDF, không dùng /image/upload
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/raw/upload`,
        { method: 'POST', body: fd }
      )

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        const msg = err?.error?.message || 'Upload thất bại'
        setError(msg)
        throw new Error(msg)
      }

      const data = await res.json()
      return data.secure_url // HTTPS URL — gửi lên BE trong field cvUrl
    } catch (e) {
      if (!error) setError(e.message)
      throw e
    } finally {
      setUploading(false)
    }
  }

  /** Reset error thủ công nếu cần (vd: khi user xoá file) */
  function clearError() {
    setError('')
  }

  return { uploading, uploadPdf, error, clearError }
}