"use client"
import { useState, useId } from "react"

export default function ImageUpload({ onUpload, currentImages = [], maxImages = 5, folder = "kanvei/products", onRemove, idSuffix }) {
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [uploadInfo, setUploadInfo] = useState(null)
  const [imageMetaList, setImageMetaList] = useState([]) // [{url, processedSize, processedWidth, processedHeight}]
  const uid = useId()
  const inputId = `file-upload-${(idSuffix || folder).replace(/[^a-z0-9_-]/gi, "-")}-${uid}`

  const formatBytes = (bytes) => {
    if (!bytes && bytes !== 0) return "-"
    const sizes = ["B", "KB", "MB", "GB"]
    if (bytes === 0) return "0 B"
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    const val = bytes / Math.pow(1024, i)
    return `${val.toFixed(val >= 100 ? 0 : val >= 10 ? 1 : 2)} ${sizes[i]}`
  }

  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return

    setUploading(true)
    const uploadedUrls = []

    try {
      for (const file of files) {
        if (currentImages.length + uploadedUrls.length >= maxImages) {
          alert(`Maximum ${maxImages} images allowed`)
          break
        }

        const formData = new FormData()
        formData.append("file", file)
        formData.append("folder", folder)

        const token = typeof window !== "undefined" ? localStorage.getItem("kanvei-token") : null
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined

        // Show original size while uploading
        setUploadInfo({ fileName: file.name, originalSizeBytes: file.size, processedSizeBytes: null })

        const response = await fetch("/api/upload", {
          method: "POST",
          headers,
          body: formData,
        })

        const data = await response.json()

        if (data.success) {
          uploadedUrls.push(data.url)
          // Show processed size after success
          if (typeof data.processedSize === "number") {
            setUploadInfo({ fileName: file.name, originalSizeBytes: file.size, processedSizeBytes: data.processedSize })
          }
          setImageMetaList((prev) => [
            ...prev,
            {
              url: data.url,
              processedSize: data.processedSize,
              processedWidth: data.processedWidth,
              processedHeight: data.processedHeight,
              originalSize: data.originalSize,
              originalWidth: data.originalWidth,
              originalHeight: data.originalHeight,
              publicId: data.publicId,
            },
          ])
        } else {
          alert(`Failed to upload ${file.name}: ${data.error}`)
        }
      }

      if (uploadedUrls.length > 0) {
        onUpload([...currentImages, ...uploadedUrls])
      }
    } catch (error) {
      console.error("Upload error:", error)
      alert("Upload failed. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(Array.from(e.dataTransfer.files))
    }
  }

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(Array.from(e.target.files))
    }
  }

  const removeImage = async (index) => {
    const url = currentImages[index]
    const meta = imageMetaList.find((m) => m.url === url)
    const publicId = meta?.publicId
    const newImages = currentImages.filter((_, i) => i !== index)
    onUpload(newImages)
    setImageMetaList((prev) => prev.filter((m) => m.url !== url))
    if (onRemove) onRemove(url)
    
    // Only delete from Cloudinary if we have a publicId and this is a newly uploaded image
    // For existing images from editing, we'll let the API handle cleanup on product update
    try {
      if (publicId) {
        const token = typeof window !== "undefined" ? localStorage.getItem("kanvei-token") : null
        const headers = {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        }
        // Only delete immediately if this was a newly uploaded image (has publicId in meta)
        await fetch("/api/upload", {
          method: "DELETE",
          headers,
          body: JSON.stringify({ publicId }),
        })
      }
    } catch (e) {
      // ignore cleanup errors - the API will handle cleanup on product update
      console.warn('Could not delete image immediately, will be cleaned up on product update:', e.message)
    }
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-4 sm:p-8 text-center transition-colors ${
          dragActive ? "border-blue-400 bg-blue-50" : "border-gray-300"
        } ${uploading ? "opacity-50 pointer-events-none" : ""}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          id={inputId}
          disabled={uploading || currentImages.length >= maxImages}
        />

        {uploading ? (
          <div className="space-y-2">
            <div
              className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto"
              style={{ borderColor: "#5A0117" }}
            ></div>
            <p style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>Uploading images...</p>
            {uploadInfo && (
              <div className="text-xs" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
                <div>File: {uploadInfo.fileName}</div>
                <div>Original: {formatBytes(uploadInfo.originalSizeBytes)}</div>
                {typeof uploadInfo.processedSizeBytes === "number" && (
                  <div>Compressed: {formatBytes(uploadInfo.processedSizeBytes)}</div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <svg className="mx-auto h-12 w-12 opacity-50" stroke="#8C6141" fill="none" viewBox="0 0 48 48">
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div>
              <label
                htmlFor={inputId}
                className="cursor-pointer font-semibold hover:opacity-80 transition-opacity"
                style={{ color: "#5A0117", fontFamily: "Montserrat, sans-serif" }}
              >
                Click to upload
              </label>
              <p style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>or drag and drop</p>
            </div>
            <p className="text-xs" style={{ fontFamily: "Montserrat, sans-serif", color: "#AFABAA" }}>
              PNG, JPG, GIF up to 10MB ({currentImages.length}/{maxImages} images)
            </p>
          </div>
        )}
      </div>

      {/* Image Preview */}
      {currentImages.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {currentImages.map((image, index) => {
            const meta = imageMetaList.find((m) => m.url === image)
            return (
              <div key={index} className="relative group">
                <img
                  src={image || "/placeholder.svg"}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg border"
                />
                <button
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                >
                  ×
                </button>
                {meta && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] px-1 py-0.5 rounded-b">
                    {meta.processedWidth}x{meta.processedHeight} • {formatBytes(meta.processedSize)}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
