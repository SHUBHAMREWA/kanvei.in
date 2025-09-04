import { v2 as cloudinary } from "cloudinary"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export const uploadImage = async (file, folder = "kanvei") => {
  try {
    const result = await cloudinary.uploader.upload(file, {
      folder,
      resource_type: "auto",
      // Image is already processed via sharp; keep Cloudinary from re-scaling
      transformation: [{ quality: "auto" }, { fetch_format: "auto" }],
    })

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
    }
  } catch (error) {
    console.error("Cloudinary upload error:", error)
    return {
      success: false,
      error: error.message,
    }
  }
}

export const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId)
    return {
      success: true,
      result,
    }
  } catch (error) {
    console.error("Cloudinary delete error:", error)
    return {
      success: false,
      error: error.message,
    }
  }
}

// Extract public ID from Cloudinary URL
export const extractPublicId = (imageUrl) => {
  if (!imageUrl || typeof imageUrl !== 'string') return null
  try {
    // Extract public ID from Cloudinary URL
    // Example: https://res.cloudinary.com/your-cloud/image/upload/v1234567890/folder/filename.ext
    const match = imageUrl.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.\w+)?$/)
    return match ? match[1] : null
  } catch (error) {
    console.error('Error extracting public ID:', error)
    return null
  }
}

// Delete multiple images from Cloudinary
export const deleteMultipleImages = async (imageUrls) => {
  if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
    return { success: true, deletedCount: 0, errors: [] }
  }

  const publicIds = imageUrls
    .map(url => extractPublicId(url))
    .filter(id => id !== null)

  if (publicIds.length === 0) {
    return { success: true, deletedCount: 0, errors: [] }
  }

  const results = []
  const errors = []

  // Delete images in parallel with a limit to avoid rate limiting
  const batchSize = 10
  for (let i = 0; i < publicIds.length; i += batchSize) {
    const batch = publicIds.slice(i, i + batchSize)
    const batchPromises = batch.map(async (publicId) => {
      try {
        const result = await deleteImage(publicId)
        return { publicId, ...result }
      } catch (error) {
        errors.push({ publicId, error: error.message })
        return { publicId, success: false, error: error.message }
      }
    })
    
    const batchResults = await Promise.allSettled(batchPromises)
    results.push(...batchResults.map(r => r.status === 'fulfilled' ? r.value : { success: false, error: r.reason }))
  }

  const successCount = results.filter(r => r.success).length
  
  return {
    success: errors.length === 0,
    deletedCount: successCount,
    totalAttempted: publicIds.length,
    errors: errors,
    results: results
  }
}

export default cloudinary
