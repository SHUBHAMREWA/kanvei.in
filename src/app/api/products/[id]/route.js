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
    
    // Get product with category info
    const product = await Product.findById(params.id).populate('categoryId', 'name slug').lean()
    if (!product) {
      return Response.json({ success: false, error: "Product not found" }, { status: 404 })
    }

    // Get product images
    const productImages = await ProductImage.findOne({ productId: params.id }).lean()
    
    // Get product attributes
    const productAttributes = await ProductAttribute.find({ productId: params.id }).lean()
    
    // Get product options
    const productOptions = await ProductOption.find({ productId: params.id }).lean()
    
    // Get option images for each option
    const optionsWithImages = await Promise.all(
      productOptions.map(async (option) => {
        const optionImages = await OptionImage.findOne({ optionId: option._id }).lean()
        return {
          ...option,
          images: optionImages ? optionImages.img : []
        }
      })
    )
    
    // Get product views
    const productViews = await ProductView.findOne({ productId: params.id }).lean()
    
    const completeProduct = {
      ...product,
      images: productImages ? productImages.img : [],
      attributes: productAttributes || [],
      options: optionsWithImages || [],
      views: productViews ? productViews.views : 0,
      category: product.categoryId?.name || '',
      categorySlug: product.categoryId?.slug || ''
    }
    
    return Response.json({ success: true, product: completeProduct })
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function PUT(request, context) {
  try {
    await connectDB()
    const params = await context.params
    const productId = params.id
    
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
    console.log('🔄 Product update data received:', JSON.stringify(updateData, null, 2))
    
    // Get current product
    const currentProduct = await Product.findById(productId).lean()
    if (!currentProduct) {
      return Response.json({ success: false, error: "Product not found" }, { status: 404 })
    }
    
    let imagesToDelete = []
    
    // STEP 1: Update basic product information
    const productFields = {
      name: updateData.name,
      title: updateData.title,
      description: updateData.description,
      brand: updateData.brand,
      slug: updateData.slug,
      weight: updateData.weight,
      height: updateData.height,
      width: updateData.width,
      mrp: updateData.mrp,
      price: updateData.price,
      stock: updateData.stock,
      featured: updateData.featured,
      categoryId: updateData.categoryId
    }
    
    // Validate categoryId
    if (productFields.categoryId && !/^[0-9a-fA-F]{24}$/.test(productFields.categoryId)) {
      console.log(`Invalid categoryId format: ${productFields.categoryId}, setting to null`)
      productFields.categoryId = null
    }
    
    await Product.findByIdAndUpdate(productId, productFields)
    
    // STEP 2: Handle Product Images
    if (updateData.images !== undefined) {
      const currentProductImages = await ProductImage.findOne({ productId }).lean()
      const currentImages = currentProductImages ? currentProductImages.img : []
      const newImages = updateData.images || []
      
      // Find images to delete (exist in current but not in new)
      const removedMainImages = currentImages.filter(img => !newImages.includes(img))
      if (removedMainImages.length > 0) {
        console.log(`📸 Found ${removedMainImages.length} main images to delete:`, removedMainImages)
        imagesToDelete.push(...removedMainImages)
      }
      
      // Update product images
      if (currentProductImages) {
        await ProductImage.findOneAndUpdate(
          { productId },
          { img: newImages }
        )
      } else if (newImages.length > 0) {
        await ProductImage.create({ productId, img: newImages })
      }
    }
    
    // STEP 3: Handle Product Attributes
    if (updateData.attributes !== undefined) {
      // Delete existing attributes
      await ProductAttribute.deleteMany({ productId })
      
      // Create new attributes
      if (Array.isArray(updateData.attributes) && updateData.attributes.length > 0) {
        const attributes = updateData.attributes
          .filter(attr => attr && (attr.name || attr.type))
          .map(attr => ({
            name: attr.name || '',
            type: attr.type || '',
            productId
          }))
        
        if (attributes.length > 0) {
          await ProductAttribute.insertMany(attributes)
        }
      }
    }
    
    // STEP 4: Handle Product Options (Complex part)
    if (updateData.options !== undefined) {
      console.log('🔧 Processing options update...')
      
      // Get current options with images
      const currentOptions = await ProductOption.find({ productId }).lean()
      const currentOptionIds = currentOptions.map(opt => opt._id.toString())
      
      // Get current option images to track what needs deletion
      const currentOptionImages = await OptionImage.find({ 
        optionId: { $in: currentOptions.map(opt => opt._id) } 
      }).lean()
      
      const newOptions = updateData.options || []
      const newOptionIds = newOptions
        .filter(opt => opt._id)
        .map(opt => opt._id.toString())
      
      // Find options to delete (exist in current but not in new)
      const optionsToDelete = currentOptions.filter(opt => 
        !newOptionIds.includes(opt._id.toString())
      )
      
      console.log(`🗑️ Deleting ${optionsToDelete.length} options:`, optionsToDelete.map(o => o._id))
      
      // Collect images from options to be deleted
      for (const option of optionsToDelete) {
        const optionImageDoc = currentOptionImages.find(oi => 
          oi.optionId.toString() === option._id.toString()
        )
        if (optionImageDoc && optionImageDoc.img.length > 0) {
          console.log(`📸 Adding ${optionImageDoc.img.length} option images to delete:`, optionImageDoc.img)
          imagesToDelete.push(...optionImageDoc.img)
        }
      }
      
      // Delete option images for deleted options
      if (optionsToDelete.length > 0) {
        const deleteOptionIds = optionsToDelete.map(opt => opt._id)
        await OptionImage.deleteMany({ optionId: { $in: deleteOptionIds } })
        await ProductOption.deleteMany({ _id: { $in: deleteOptionIds } })
      }
      
      // Process each option (create new or update existing)
      for (const optionData of newOptions) {
        if (optionData._id) {
          // UPDATE existing option
          const optionId = optionData._id
          console.log(`📝 Updating existing option: ${optionId}`)
          
          await ProductOption.findByIdAndUpdate(optionId, {
            size: optionData.size,
            color: optionData.color,
            price: optionData.price,
            mrp: optionData.mrp,
            stock: optionData.stock
          })
          
          // Handle option images
          if (optionData.images !== undefined) {
            const currentOptionImageDoc = currentOptionImages.find(oi => 
              oi.optionId.toString() === optionId.toString()
            )
            const currentOptionImgs = currentOptionImageDoc ? currentOptionImageDoc.img : []
            const newOptionImgs = optionData.images || []
            
            // Find option images to delete
            const removedOptionImages = currentOptionImgs.filter(img => !newOptionImgs.includes(img))
            if (removedOptionImages.length > 0) {
              console.log(`📸 Found ${removedOptionImages.length} option images to delete for option ${optionId}:`, removedOptionImages)
              imagesToDelete.push(...removedOptionImages)
            }
            
            // Update option images
            if (currentOptionImageDoc) {
              await OptionImage.findOneAndUpdate(
                { optionId },
                { img: newOptionImgs }
              )
            } else if (newOptionImgs.length > 0) {
              await OptionImage.create({ optionId, img: newOptionImgs })
            }
          }
        } else {
          // CREATE new option
          console.log('➕ Creating new option:', optionData)
          
          const newOption = await ProductOption.create({
            productId,
            size: optionData.size,
            color: optionData.color,
            price: optionData.price,
            mrp: optionData.mrp,
            stock: optionData.stock
          })
          
          // Create option images if provided
          if (optionData.images && optionData.images.length > 0) {
            await OptionImage.create({
              optionId: newOption._id,
              img: optionData.images
            })
          }
        }
      }
    }
    
    // STEP 5: Delete images from Cloudinary
    if (imagesToDelete.length > 0) {
      imagesToDelete = [...new Set(imagesToDelete)] // Remove duplicates
      console.log(`🗑️ Deleting ${imagesToDelete.length} images from Cloudinary...`)
      
      try {
        await deleteMultipleImages(imagesToDelete)
        console.log(`✅ Successfully deleted ${imagesToDelete.length} images from Cloudinary`)
      } catch (error) {
        console.error('❌ Error deleting images from Cloudinary:', error)
      }
    }
    
    // STEP 6: Return updated product with all related data
    const updatedProduct = await Product.findById(productId).populate('categoryId', 'name slug').lean()
    const updatedProductImages = await ProductImage.findOne({ productId }).lean()
    const updatedAttributes = await ProductAttribute.find({ productId }).lean()
    const updatedOptions = await ProductOption.find({ productId }).lean()
    
    const updatedOptionsWithImages = await Promise.all(
      updatedOptions.map(async (option) => {
        const optionImages = await OptionImage.findOne({ optionId: option._id }).lean()
        return {
          ...option,
          images: optionImages ? optionImages.img : []
        }
      })
    )
    
    const completeUpdatedProduct = {
      ...updatedProduct,
      images: updatedProductImages ? updatedProductImages.img : [],
      attributes: updatedAttributes || [],
      options: updatedOptionsWithImages || [],
      category: updatedProduct.categoryId?.name || '',
      categorySlug: updatedProduct.categoryId?.slug || ''
    }
    
    return Response.json({ 
      success: true, 
      message: "Product updated successfully", 
      product: completeUpdatedProduct,
      deletedImages: imagesToDelete.length
    })
  } catch (error) {
    console.error('❌ Product update error:', error)
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
