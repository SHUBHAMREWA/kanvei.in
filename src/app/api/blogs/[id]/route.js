import { NextResponse } from "next/server"
import connectDB from "../../../../lib/mongodb"
import Blog, { BlogUtils } from "../../../../lib/models/Blog.js"
import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function GET(request, { params }) {
  try {
    await connectDB()
    const { id } = params
    const blog = await Blog.findById(id).lean()

    if (!blog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 })
    }

    return NextResponse.json(blog)
  } catch (error) {
    console.error("Error fetching blog:", error)
    return NextResponse.json({ error: "Failed to fetch blog" }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    await connectDB()
    const { id } = params
    const data = await request.json()

    const existingBlog = await Blog.findById(id).lean()
    if (!existingBlog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 })
    }

    // Update slug if title changed
    if (data.title && data.title !== existingBlog.title && !data.slug) {
      data.slug = BlogUtils.generateSlug(data.title)
    }

    // Calculate read time if content changed
    if (data.content && data.content !== existingBlog.content) {
      data.readTime = BlogUtils.calculateReadTime(data.content)
    }

    // Set published date if publishing for first time
    if (data.published && !existingBlog.published && !data.publishedAt) {
      data.publishedAt = new Date()
    }

    const savedBlog = await Blog.findByIdAndUpdate(id, data, { new: true })

    return NextResponse.json(savedBlog)
  } catch (error) {
    console.error("Error updating blog:", error)
    return NextResponse.json({ error: "Failed to update blog" }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB()
    const { id } = params
    
    // First find the blog to get image info before deletion
    const blogToDelete = await Blog.findById(id)
    if (!blogToDelete) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 })
    }

    // Delete from Cloudinary if hero image exists
    if (blogToDelete.heroImagePublicId) {
      try {
        await cloudinary.uploader.destroy(blogToDelete.heroImagePublicId)
        console.log(`🗑️ Cloudinary image deleted: ${blogToDelete.heroImagePublicId}`)
      } catch (cloudinaryError) {
        console.error('❌ Failed to delete image from Cloudinary:', cloudinaryError)
        // Continue with blog deletion even if Cloudinary deletion fails
      }
    }

    // Delete the blog from database
    const deleted = await Blog.findByIdAndDelete(id)

    return NextResponse.json({ 
      message: "Blog deleted successfully",
      imageDeleted: !!blogToDelete.heroImagePublicId 
    })
  } catch (error) {
    console.error("Error deleting blog:", error)
    return NextResponse.json({ error: "Failed to delete blog" }, { status: 500 })
  }
}
