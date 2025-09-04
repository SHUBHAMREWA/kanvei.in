import { uploadImage, deleteImage } from "../../../lib/cloudinary"
import sharp from "sharp"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/route"
import { getAuthUser } from "../../../lib/auth"
import connectDB from "../../../lib/mongodb"
import User from "../../../lib/models/User"

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    let isAdmin = Boolean(session && session.user?.role === "admin")

    if (!isAdmin) {
      const authUser = await getAuthUser(request)
      if (authUser?.userId) {
        await connectDB()
        const dbUser = await User.findById(authUser.userId)
        if (dbUser && dbUser.role === "admin") {
          isAdmin = true
        }
      }
    }

    if (!isAdmin) {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }
    const formData = await request.formData()
    const file = formData.get("file")
    const folderInput = (formData.get("folder") || "").toString().trim()
    const folder = folderInput && folderInput.length > 0 ? folderInput : "kanvei/products"
    
    // Get custom dimensions for blog images
    const customWidth = formData.get("width") ? parseInt(formData.get("width")) : 1000
    const customHeight = formData.get("height") ? parseInt(formData.get("height")) : 1000

    if (!file) {
      return Response.json({ success: false, error: "No file provided" }, { status: 400 })
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp"]
    const contentType = file.type || ""
    if (!validTypes.includes(contentType)) {
      return Response.json({ success: false, error: "Unsupported file type" }, { status: 400 })
    }

    // Read file into Buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const originalSize = buffer.length
    const originalMeta = await sharp(buffer).metadata()

    // Resize using custom dimensions, convert to WebP with good compression
    const processed = await sharp(buffer)
      .resize({ width: customWidth, height: customHeight, fit: "cover", position: "centre" })
      .webp({ quality: 80 })
      .toBuffer()
    const processedSize = processed.length
    const processedMeta = await sharp(processed).metadata()

    // Convert to base64 data URI for Cloudinary
    const base64 = `data:image/webp;base64,${processed.toString("base64")}`

    // Upload to Cloudinary
    const result = await uploadImage(base64, folder)

    if (result.success) {
      return Response.json({
        success: true,
        url: result.url,
        publicId: result.publicId,
        originalSize,
        processedSize,
        originalWidth: originalMeta.width || null,
        originalHeight: originalMeta.height || null,
        processedWidth: processedMeta.width || null,
        processedHeight: processedMeta.height || null,
      })
    } else {
      return Response.json({ success: false, error: result.error }, { status: 500 })
    }
  } catch (error) {
    console.error("Upload error:", error)
    return Response.json({ success: false, error: "Upload failed" }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions)
    let isAdmin = Boolean(session && session.user?.role === "admin")

    if (!isAdmin) {
      const authUser = await getAuthUser(request)
      if (authUser?.userId) {
        await connectDB()
        const dbUser = await User.findById(authUser.userId)
        if (dbUser && dbUser.role === "admin") {
          isAdmin = true
        }
      }
    }

    if (!isAdmin) {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { publicId } = await request.json()
    if (!publicId || typeof publicId !== "string") {
      return Response.json({ success: false, error: "publicId required" }, { status: 400 })
    }

    const result = await deleteImage(publicId)
    if (!result.success) {
      return Response.json({ success: false, error: result.error || "Delete failed" }, { status: 500 })
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error("Delete upload error:", error)
    return Response.json({ success: false, error: "Delete failed" }, { status: 500 })
  }
}
