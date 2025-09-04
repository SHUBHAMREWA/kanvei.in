"use client"
import { useState, useId } from "react"

export default function BlogImageUpload({ value = "", onChange, disabled = false }) {
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [uploadInfo, setUploadInfo] = useState(null)
  const uid = useId()
  const inputId = `blog-image-upload-${uid}`

  const formatBytes = (bytes) => {
    if (!bytes && bytes !== 0) return "-"
    const sizes = ["B", "KB", "MB", "GB"]
    if (bytes === 0) return "0 B"
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    const val = bytes / Math.pow(1024, i)
    return `${val.toFixed(val >= 100 ? 0 : val >= 10 ? 1 : 2)} ${sizes[i]}`
  }

  const handleFileUpload = async (file) => {
    if (!file) return

    setUploading(true)
    
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("folder", "kanvei/blogs") // Blog images folder
      formData.append("width", "1000") // Fixed 1000px width
      formData.append("height", "1000") // Fixed 1000px height

      const token = typeof window !== "undefined" ? localStorage.getItem("kanvei-token") : null
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined

      // Show original size while uploading
      setUploadInfo({ 
        fileName: file.name, 
        originalSizeBytes: file.size, 
        processedSizeBytes: null 
      })

      const response = await fetch("/api/upload", {
        method: "POST",
        headers,
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        // Show processed size after success
        if (typeof data.processedSize === "number") {
          setUploadInfo({ 
            fileName: file.name, 
            originalSizeBytes: file.size, 
            processedSizeBytes: data.processedSize 
          })
        }
        
        // Return both URL and publicId for deletion
        onChange({
          url: data.url,
          publicId: data.publicId
        })
      } else {
        alert(`Failed to upload ${file.name}: ${data.error}`)
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
      handleFileUpload(e.dataTransfer.files[0])
    }
  }

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0])
    }
  }

  const removeImage = async () => {
    // Clear the image
    onChange("")
    
    // Note: Cloudinary deletion will be handled by the blog deletion API
    // when the blog post is deleted
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {!value && (
        <div
          className={`border-2 border-dashed rounded-lg p-4 sm:p-8 text-center transition-colors ${
            dragActive ? "border-blue-400 bg-blue-50" : "border-gray-300"
          } ${uploading || disabled ? "opacity-50 pointer-events-none" : ""}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            id={inputId}
            disabled={uploading || disabled}
          />

          {uploading ? (
            <div className="space-y-2">
              <div
                className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto"
                style={{ borderColor: "#5A0117" }}
              ></div>
              <p style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
                Processing image (1000x1000)...
              </p>
              {uploadInfo && (
                <div className="text-xs" style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
                  <div>File: {uploadInfo.fileName}</div>
                  <div>Original: {formatBytes(uploadInfo.originalSizeBytes)}</div>
                  {typeof uploadInfo.processedSizeBytes === "number" && (
                    <div>Processed: {formatBytes(uploadInfo.processedSizeBytes)}</div>
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
                  Click to upload blog image
                </label>
                <p style={{ fontFamily: "Montserrat, sans-serif", color: "#8C6141" }}>
                  or drag and drop
                </p>
              </div>
              <p className="text-xs" style={{ fontFamily: "Montserrat, sans-serif", color: "#AFABAA" }}>
                PNG, JPG up to 10MB (will be resized to 1000x1000px)
              </p>
            </div>
          )}
        </div>
      )}

      {/* Image Preview */}
      {value && (
        <div className="relative inline-block">
          <img
            src={typeof value === 'object' ? value.url : value}
            alt="Blog hero image"
            className="w-full max-w-md h-64 object-cover rounded-lg border"
          />
          <button
            onClick={removeImage}
            disabled={disabled}
            className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full text-sm hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            ×
          </button>
          <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
            1000x1000px
          </div>
        </div>
      )}
    </div>
  )
}
