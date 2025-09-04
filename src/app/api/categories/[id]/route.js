import connectDB from "../../../../lib/mongodb"
import Category from "../../../../lib/models/Category"
import Product from "../../../../lib/models/Product"
import ProductAttribute from "../../../../lib/models/ProductAttribute"
import ProductOption from "../../../../lib/models/ProductOption"
import ProductImage from "../../../../lib/models/ProductImage"
import OptionImage from "../../../../lib/models/OptionImage"
import ProductView from "../../../../lib/models/ProductView"
import User from "../../../../lib/models/User"
import { deleteMultipleImages, extractPublicId, deleteImage } from "../../../../lib/cloudinary"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/route"
import { getAuthUser } from "../../../../lib/auth"

export async function GET(request, { params }) {
  try {
    await connectDB()
    const { id } = await params

    const category = await Category.findById(id).lean()

    if (!category) {
      return Response.json({ success: false, error: "Category not found" }, { status: 404 })
    }

    return Response.json({ success: true, category })
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    await connectDB()
    const { id } = await params

    const updateData = await request.json()
    const payload = {
      ...(updateData.name !== undefined && { name: updateData.name }),
      ...(updateData.slug !== undefined && { slug: updateData.slug }),
      ...(updateData.description !== undefined && { description: updateData.description }),
      ...(updateData.image !== undefined && { image: updateData.image }),
      ...(updateData.parentCategory !== undefined && { parentCategory: updateData.parentCategory || null }),
    }

    const updated = await Category.findByIdAndUpdate(id, payload, { new: true })

    if (!updated) {
      return Response.json({ success: false, error: "Category not found" }, { status: 404 })
    }

    return Response.json({ success: true, message: "Category updated successfully", category: updated })
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB()
    const { id } = await params
    
    // Check NextAuth session first
    const session = await getServerSession(authOptions)
    let isAdmin = Boolean(session && session.user?.role === "admin")

    // If not authenticated via NextAuth, check custom JWT token
    if (!isAdmin) {
      const authUser = await getAuthUser(request)
      if (authUser?.userId) {
        const dbUser = await User.findById(authUser.userId)
        if (dbUser && dbUser.role === "admin") {
          isAdmin = true
        }
      }
    }

    if (!isAdmin) {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // First, get all categories to be deleted (including descendants)
    const idsToDelete = [id]
    let index = 0
    while (index < idsToDelete.length) {
      const currentIds = idsToDelete.slice(index)
      index = idsToDelete.length
      const children = await Category.find({ parentCategory: { $in: currentIds } }, { _id: 1 }).lean()
      for (const child of children) {
        const idStr = String(child._id)
        if (!idsToDelete.includes(idStr)) idsToDelete.push(idStr)
      }
    }

    // Get all categories with their images before deletion
    const categoriesToDelete = await Category.find({ _id: { $in: idsToDelete } }).lean()
    
    if (categoriesToDelete.length === 0) {
      return Response.json({ success: false, error: "Category not found" }, { status: 404 })
    }

    // Collect category images for Cloudinary deletion
    const categoryImages = categoriesToDelete
      .map(cat => cat.image)
      .filter(img => img && img.trim() !== '')

    // Find all products belonging to these categories
    const productsToDelete = await Product.find({ categoryId: { $in: idsToDelete } }).lean()
    const productIdsToDelete = productsToDelete.map(p => p._id)

    // Collect all product images for Cloudinary deletion
    const allImagesToDelete = [...categoryImages]
    
    // Add product main images
    for (const product of productsToDelete) {
      if (Array.isArray(product.images)) {
        allImagesToDelete.push(...product.images)
      }
    }

    // Get product images from ProductImage collection
    const productImages = await ProductImage.find({ productId: { $in: productIdsToDelete } }).lean()
    for (const imgDoc of productImages) {
      if (Array.isArray(imgDoc.img)) {
        allImagesToDelete.push(...imgDoc.img)
      }
    }

    // Get option images from OptionImage collection
    const productOptions = await ProductOption.find({ productId: { $in: productIdsToDelete } }).lean()
    const optionIds = productOptions.map(opt => opt._id)
    const optionImages = await OptionImage.find({ optionId: { $in: optionIds } }).lean()
    for (const optImgDoc of optionImages) {
      if (Array.isArray(optImgDoc.img)) {
        allImagesToDelete.push(...optImgDoc.img)
      }
    }

    // Delete all Cloudinary images
    if (allImagesToDelete.length > 0) {
      console.log(`Deleting ${allImagesToDelete.length} images from Cloudinary...`)
      const cloudinaryResult = await deleteMultipleImages(allImagesToDelete)
      console.log(`Cloudinary deletion result:`, cloudinaryResult)
    }

    // Delete related data in correct order to avoid foreign key issues
    if (productIdsToDelete.length > 0) {
      // Delete option images first
      await OptionImage.deleteMany({ optionId: { $in: optionIds } })
      
      // Delete product options
      await ProductOption.deleteMany({ productId: { $in: productIdsToDelete } })
      
      // Delete product attributes
      await ProductAttribute.deleteMany({ productId: { $in: productIdsToDelete } })
      
      // Delete product images
      await ProductImage.deleteMany({ productId: { $in: productIdsToDelete } })
      
      // Delete product views
      await ProductView.deleteMany({ productId: { $in: productIdsToDelete } })
      
      // Delete products
      await Product.deleteMany({ _id: { $in: productIdsToDelete } })
    }

    // Finally, delete categories
    await Category.deleteMany({ _id: { $in: idsToDelete } })

    return Response.json({ 
      success: true, 
      message: "Category and related data deleted successfully", 
      deletedCategories: idsToDelete.length,
      deletedProducts: productIdsToDelete.length,
      deletedImages: allImagesToDelete.length
    })
  } catch (error) {
    console.error('Category deletion error:', error)
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}
