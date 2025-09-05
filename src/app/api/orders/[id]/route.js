import connectDB from "../../../../lib/mongodb"
import Order from "../../../../lib/models/Order"
import Product from "../../../../lib/models/Product"
import ProductOption from "../../../../lib/models/ProductOption"
import ProductImage from "../../../../lib/models/ProductImage"
import OptionImage from "../../../../lib/models/OptionImage"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../auth/[...nextauth]/route"

export async function GET(request, { params }) {
  try {
    await connectDB()
    
    const { id } = await params
    if (!id) {
      return Response.json({ success: false, error: "Order ID is required" }, { status: 400 })
    }

    // Get the order
    const order = await Order.findById(id)
      .populate('userId', 'name email')
      .populate('items.productId', 'name price images slug')
      .lean()
    
    if (!order) {
      return Response.json({ success: false, error: "Order not found" }, { status: 404 })
    }
    
    // Fetch product and option images for each order item - EXACT SAME LOGIC AS MAIN ORDERS API
    if (order.items && order.items.length > 0) {
      const itemsWithImages = await Promise.all(
        order.items.map(async (item) => {
          // Handle both cases: when productId exists and when it's null (broken orders)
          if (item.productId && item.productId._id) {
            
            // Try to determine if this is a ProductOption by multiple checks
            const productOptionCheck = await ProductOption.findById(item.productId._id).lean()
            const hasVariantInName = item.name && (item.name.includes(' - ') && (item.name.includes('m ') || item.name.includes('l ') || item.name.includes('s ') || item.name.includes('xl ')))
            const isProductOption = !!productOptionCheck || item.itemType === 'productOption' || (item.size && item.color) || hasVariantInName
            
            console.log('🔍 SINGLE ORDER - OPTION DETECTION DEBUG:', {
              itemName: item.name,
              productId: item.productId._id,
              foundAsProductOption: !!productOptionCheck,
              hasItemType: !!item.itemType,
              hasSizeColor: !!(item.size && item.color),
              hasVariantInName: hasVariantInName,
              finalDecision: isProductOption ? 'PRODUCT OPTION' : 'REGULAR PRODUCT'
            })
            
            // Check if this is a ProductOption or main Product
            if (isProductOption) {
              // === EXACT CART LOGIC FOR PRODUCT OPTION ===
              // Product option - fetch images from OptionImage collection (same as cart)
              const productOption = await ProductOption.findById(item.productId._id).populate('productId', 'name slug').lean()
              const optionImageDoc = await OptionImage.findOne({ optionId: item.productId._id })
              const optionImages = optionImageDoc?.img || []
              
              // Fallback to main product images if option has no images (same as cart)
              let imageUrl = optionImages[0]
              if (!imageUrl && productOption?.productId?._id) {
                const productImageDoc = await ProductImage.findOne({ productId: productOption.productId._id })
                const productImages = productImageDoc?.img || []
                imageUrl = productImages[0] || ''
              }
              
              const mainProductName = productOption?.productId?.name
              const optionDetails = [productOption?.size, productOption?.color].filter(Boolean).join(' - ')
              
              console.log('🔧 SINGLE ORDER - PRODUCT OPTION DEBUG (CART LOGIC):', {
                optionId: item.productId._id,
                productId: productOption?.productId?._id,
                mainProductName: mainProductName,
                optionDetails: optionDetails,
                optionImageDoc: !!optionImageDoc,
                optionImages: optionImages,
                finalImageUrl: imageUrl,
                hasImage: !!imageUrl
              })
              
              return {
                ...item,
                itemType: 'productOption',
                productId: {
                  _id: item.productId._id,
                  name: optionDetails ? `${mainProductName} - ${optionDetails}` : mainProductName,
                  images: imageUrl ? [imageUrl] : [],
                  slug: productOption?.productId?.slug,
                  size: productOption?.size,
                  color: productOption?.color
                }
              }
            } else {
              // This is a main Product - fetch from ProductImage collection
              const productImages = await ProductImage.findOne({ productId: item.productId._id }).lean()
              
              console.log('🔧 SINGLE ORDER - REGULAR PRODUCT DEBUG:', {
                productId: item.productId._id,
                productName: item.productId?.name,
                productImageDoc: !!productImages,
                productImages: productImages?.img || [],
                fallbackImages: item.productId.images || [],
                finalImages: productImages ? productImages.img : (item.productId.images || [])
              })
              
              return {
                ...item,
                itemType: 'product', // Ensure itemType is set for main products
                productId: {
                  ...item.productId,
                  images: productImages ? productImages.img : (item.productId.images || [])
                }
              }
            }
          } else if (!item.productId && item.name) {
            // FALLBACK LOGIC: Handle broken orders with null productId
            // Try to find the ProductOption/Product by name matching
            console.log('🔧 SINGLE ORDER - FALLBACK: Trying to fix broken order item with null productId:', {
              itemName: item.name,
              itemType: item.itemType,
              hasSize: !!item.size,
              hasColor: !!item.color
            })
            
            const hasVariantInName = item.name && (item.name.includes(' - ') && (item.name.includes('m ') || item.name.includes('l ') || item.name.includes('s ') || item.name.includes('xl ')))
            const isLikelyProductOption = item.itemType === 'productOption' || (item.size && item.color) || hasVariantInName
            
            if (isLikelyProductOption) {
              // Try to find ProductOption by name pattern matching
              // Parse name like "raymand shirt - m - medium blue" -> size="m", color="medium blue", productName="raymand shirt"
              const nameParts = item.name.split(' - ')
              if (nameParts.length >= 3) {
                const productName = nameParts[0]
                const size = nameParts[1]
                const color = nameParts.slice(2).join(' - ')
                
                console.log('🔍 SINGLE ORDER - PARSED NAME:', { productName, size, color })
                
                // Find matching ProductOption
                const matchingOption = await ProductOption.findOne({
                  size: { $regex: new RegExp(`^${size.trim()}$`, 'i') },
                  color: { $regex: new RegExp(`^${color.trim()}$`, 'i') }
                }).populate('productId', 'name slug').lean()
                
                if (matchingOption && matchingOption.productId && matchingOption.productId.name.toLowerCase().includes(productName.toLowerCase())) {
                  console.log('✅ SINGLE ORDER - FOUND MATCHING OPTION:', {
                    optionId: matchingOption._id,
                    productName: matchingOption.productId.name,
                    size: matchingOption.size,
                    color: matchingOption.color
                  })
                  
                  // Get images using the same logic
                  const optionImageDoc = await OptionImage.findOne({ optionId: matchingOption._id })
                  const optionImages = optionImageDoc?.img || []
                  
                  let imageUrl = optionImages[0]
                  if (!imageUrl && matchingOption.productId._id) {
                    const productImageDoc = await ProductImage.findOne({ productId: matchingOption.productId._id })
                    const productImages = productImageDoc?.img || []
                    imageUrl = productImages[0] || ''
                  }
                  
                  const mainProductName = matchingOption.productId.name
                  const optionDetails = [matchingOption.size, matchingOption.color].filter(Boolean).join(' - ')
                  
                  return {
                    ...item,
                    itemType: 'productOption',
                    productId: {
                      _id: matchingOption._id,
                      name: optionDetails ? `${mainProductName} - ${optionDetails}` : mainProductName,
                      images: imageUrl ? [imageUrl] : [],
                      slug: matchingOption.productId.slug,
                      size: matchingOption.size,
                      color: matchingOption.color
                    }
                  }
                } else {
                  console.log('❌ SINGLE ORDER - NO MATCHING OPTION FOUND for:', { productName, size, color })
                }
              }
            } else {
              // Try to find main Product by name
              const productName = item.name.replace(' - ', ' ').trim()
              const matchingProduct = await Product.findOne({
                name: { $regex: new RegExp(productName, 'i') }
              }).lean()
              
              if (matchingProduct) {
                console.log('✅ SINGLE ORDER - FOUND MATCHING PRODUCT:', {
                  productId: matchingProduct._id,
                  productName: matchingProduct.name
                })
                
                const productImages = await ProductImage.findOne({ productId: matchingProduct._id }).lean()
                
                return {
                  ...item,
                  itemType: 'product',
                  productId: {
                    _id: matchingProduct._id,
                    name: matchingProduct.name,
                    images: productImages ? productImages.img : [],
                    slug: matchingProduct.slug
                  }
                }
              } else {
                console.log('❌ SINGLE ORDER - NO MATCHING PRODUCT FOUND for:', productName)
              }
            }
          }
          
          // Return item as-is if no product/option found
          return item
        })
      )
      order.items = itemsWithImages
    }

    // Check authentication and authorization
    const session = await getServerSession(authOptions)
    
    // Allow access if:
    // 1. User is logged in with NextAuth and the order belongs to them
    // 2. User is logged in with custom auth (check via Authorization header)
    // 3. Admin access
    
    let isAuthorized = false
    
    if (session?.user) {
      // NextAuth session
      const userId = session.user._id || session.user.id
      isAuthorized = order.userId?.toString() === userId?.toString() || 
                    order.customerEmail === session.user.email ||
                    session.user.role === 'admin'
    } else {
      // Check custom auth header
      const authHeader = request.headers.get('Authorization')
      if (authHeader?.startsWith('Bearer ')) {
        // For now, we'll allow access with valid token
        // In a real app, you'd verify the token and get user info
        isAuthorized = true
      }
    }

    if (!isAuthorized) {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    return Response.json({ success: true, order })
  } catch (error) {
    console.error('Error fetching order:', error)
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    await connectDB()
    
    const { id } = await params
    if (!id) {
      return Response.json({ success: false, error: "Order ID is required" }, { status: 400 })
    }

    const body = await request.json()
    const { status } = body
    
    if (!status) {
      return Response.json({ success: false, error: "Status is required" }, { status: 400 })
    }

    // Validate status values
    const validStatuses = [
      'pending', 
      'processing', 
      'shipping', 
      'out_for_delivery', 
      'delivered', 
      'cancelled',
      'return_accepted',
      'return_not_accepted'
    ]
    if (!validStatuses.includes(status)) {
      return Response.json({ 
        success: false, 
        error: `Invalid status value. Allowed values: ${validStatuses.join(', ')}` 
      }, { status: 400 })
    }

    // Get current order to check existing status
    const currentOrder = await Order.findById(id)
    if (!currentOrder) {
      return Response.json({ success: false, error: "Order not found" }, { status: 404 })
    }

    // Optional: Add business logic for status transitions
    // For example, prevent updating delivered orders to pending
    const restrictedTransitions = {
      'delivered': ['pending', 'processing', 'shipping'],
      'cancelled': ['pending', 'processing', 'shipping', 'out_for_delivery', 'delivered']
    }
    
    if (restrictedTransitions[currentOrder.status]?.includes(status)) {
      return Response.json({ 
        success: false, 
        error: `Cannot change order status from '${currentOrder.status}' to '${status}'` 
      }, { status: 400 })
    }

    // Check if user is admin
    // TODO: Add proper admin authentication
    // For now, allow status updates from admin dashboard
    // const session = await getServerSession(authOptions)
    // if (!session?.user || session.user.role !== 'admin') {
    //   return Response.json({ success: false, error: "Admin access required" }, { status: 403 })
    // }

    // Log the status change
    console.log(`Updating order ${id} status from '${currentOrder.status}' to '${status}'`)

    // Update the order
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { 
        status,
        updatedAt: new Date() // Explicitly update timestamp
      },
      { new: true }
    )
    
    if (!updatedOrder) {
      return Response.json({ success: false, error: "Order not found" }, { status: 404 })
    }

    // Log successful update
    console.log(`Successfully updated order ${id} to status '${status}'`)

    return Response.json({ 
      success: true, 
      message: "Order status updated successfully",
      order: updatedOrder 
    })
  } catch (error) {
    console.error('Error updating order:', error)
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}
