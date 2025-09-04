import connectDB from "@/lib/mongodb"
import Product from "@/lib/models/Product"
import ProductAttribute from "@/lib/models/ProductAttribute"
import ProductOption from "@/lib/models/ProductOption"
import ProductImage from "@/lib/models/ProductImage"
import OptionImage from "@/lib/models/OptionImage"
import ProductView from "@/lib/models/ProductView"
import User from "@/lib/models/User"
import { deleteMultipleImages } from "@/lib/cloudinary"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/route"
import { getAuthUser } from "@/lib/auth"


export async function GET(request, context) {
  try {
    await connectDB()
    const params = await context.params
    const product = await Product.findById(params.id).lean()
    if (!product) {
      return Response.json({ success: false, error: "Product not found" }, { status: 404 })
    }
    return Response.json({ success: true, product })
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function PUT(request, context) {
  try {
    await connectDB()
    const params = await context.params
    
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
    
    const updateData = await request.json()
    
    // Get current product to compare images
    const currentProduct = await Product.findById(params.id).lean()
    if (!currentProduct) {
      return Response.json({ success: false, error: "Product not found" }, { status: 404 })
    }
    
    // Enhanced Image Handling Logic
    let imagesToDelete = []
    
    // If updateData has images array, compare with current images
    if (updateData.images && Array.isArray(updateData.images)) {
      const currentImages = currentProduct.images || []
      const newImages = updateData.images
      
      console.log(`Current images count: ${currentImages.length}, New images count: ${newImages.length}`)
      console.log('Current images:', currentImages)
      console.log('New images:', newImages)
      
      // Find images that were removed (exist in current but not in new)
      const removedImages = currentImages.filter(img => !newImages.includes(img))
      
      if (removedImages.length > 0) {
        console.log(`Found ${removedImages.length} images to delete:`, removedImages)
        imagesToDelete.push(...removedImages)
      }
    }
    
    // Handle explicit removedImages if provided
    if (updateData.removedImages) {
      // Collect main images to delete
      if (updateData.removedImages.mainImages && updateData.removedImages.mainImages.length > 0) {
        imagesToDelete.push(...updateData.removedImages.mainImages)
      }
      
      // Collect option images to delete
      if (updateData.removedImages.optionImages && updateData.removedImages.optionImages.length > 0) {
        updateData.removedImages.optionImages.forEach(optionImg => {
          if (optionImg.images && optionImg.images.length > 0) {
            imagesToDelete.push(...optionImg.images)
          }
        })
      }
      
      // Remove removedImages from updateData before saving to database
      delete updateData.removedImages
    }
    
    // Delete images from Cloudinary if any found
    if (imagesToDelete.length > 0) {
      // Remove duplicates
      imagesToDelete = [...new Set(imagesToDelete)]
      console.log(`Deleting ${imagesToDelete.length} images from Cloudinary during product update...`)
      console.log('Images to delete:', imagesToDelete)
      
      try {
        await deleteMultipleImages(imagesToDelete)
        console.log(`Successfully deleted ${imagesToDelete.length} images from Cloudinary`)
      } catch (error) {
        console.error('Error deleting images from Cloudinary:', error)
        // Continue with product update even if image deletion fails
      }
    }
    
    // Handle categoryId validation - if it's an invalid ObjectId, set to null
    if (updateData.categoryId) {
      try {
        // Check if categoryId is a valid MongoDB ObjectId
        if (!/^[0-9a-fA-F]{24}$/.test(updateData.categoryId)) {
          // If it's not a valid ObjectId (like "cloth"), set to null
          console.log(`Invalid categoryId format: ${updateData.categoryId}, setting to null`)
          updateData.categoryId = null
        }
      } catch (error) {
        console.log(`Error validating categoryId: ${error.message}, setting to null`)
        updateData.categoryId = null
      }
    }
    
    const updated = await Product.findByIdAndUpdate(params.id, updateData, { new: true })
    if (!updated) {
      return Response.json({ success: false, error: "Product not found" }, { status: 404 })
    }
    return Response.json({ success: true, message: "Product updated successfully", product: updated })
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function DELETE(request, context) {
  try {
    await connectDB()
    const params = await context.params
    
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

    // Get the product first to check if it exists and collect images
    const product = await Product.findById(params.id).lean()
    if (!product) {
      return Response.json({ success: false, error: "Product not found" }, { status: 404 })
    }

    const productId = params.id
    const allImagesToDelete = []

    // Collect product main images
    if (Array.isArray(product.images)) {
      allImagesToDelete.push(...product.images)
    }

    // Get and collect images from ProductImage collection
    const productImages = await ProductImage.find({ productId }).lean()
    for (const imgDoc of productImages) {
      if (Array.isArray(imgDoc.img)) {
        allImagesToDelete.push(...imgDoc.img)
      }
    }

    // Get product options and their images
    const productOptions = await ProductOption.find({ productId }).lean()
    const optionIds = productOptions.map(opt => opt._id)
    
    // Get option images
    const optionImages = await OptionImage.find({ optionId: { $in: optionIds } }).lean()
    for (const optImgDoc of optionImages) {
      if (Array.isArray(optImgDoc.img)) {
        allImagesToDelete.push(...optImgDoc.img)
      }
    }

    // Delete all Cloudinary images
    if (allImagesToDelete.length > 0) {
      console.log(`Deleting ${allImagesToDelete.length} images from Cloudinary for product ${productId}...`)
      const cloudinaryResult = await deleteMultipleImages(allImagesToDelete)
      console.log(`Cloudinary deletion result:`, cloudinaryResult)
    }

    // Delete related data in correct order to avoid foreign key issues
    // Delete option images first
    if (optionIds.length > 0) {
      await OptionImage.deleteMany({ optionId: { $in: optionIds } })
    }
    
    // Delete product options
    await ProductOption.deleteMany({ productId })
    
    // Delete product attributes
    await ProductAttribute.deleteMany({ productId })
    
    // Delete product images
    await ProductImage.deleteMany({ productId })
    
    // Delete product views
    await ProductView.deleteMany({ productId })
    
    // Finally, delete the product itself
    await Product.findByIdAndDelete(productId)

    return Response.json({ 
      success: true, 
      message: "Product and all related data deleted successfully",
      deletedImages: allImagesToDelete.length,
      deletedOptions: optionIds.length
    })
  } catch (error) {
    console.error('Product deletion error:', error)
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}
