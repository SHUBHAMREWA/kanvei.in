import connectDB from "../../../lib/mongodb"
import Order from "../../../lib/models/Order"
import Product from "../../../lib/models/Product"
import ProductOption from "../../../lib/models/ProductOption"
import ProductImage from "../../../lib/models/ProductImage"
import OptionImage from "../../../lib/models/OptionImage"
import Coupon from "../../../lib/models/Coupon"
import { sendOrderConfirmationEmail } from "../../../lib/email"

export async function GET(request) {
  try {
    await connectDB()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const status = searchParams.get("status")
    const dateFilter = searchParams.get("dateFilter")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    // Build filter
    const filter = {}
    
    // If userId provided, filter by user (for user orders)
    if (userId) {
      filter.userId = userId
    }
    // If no userId, return all orders (for admin dashboard)
    // TODO: Add proper admin authentication check here
    
    if (status && status !== 'all') {
      filter.status = status
    }

    // Add date filtering
    if (dateFilter && dateFilter !== 'all') {
      const now = new Date()
      let dateRange = {}
      
      switch (dateFilter) {
        case "today":
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          const tomorrow = new Date(today)
          tomorrow.setDate(tomorrow.getDate() + 1)
          dateRange = { $gte: today, $lt: tomorrow }
          break
        case "yesterday":
          const yesterday = new Date(now)
          yesterday.setDate(yesterday.getDate() - 1)
          const yesterdayStart = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate())
          const yesterdayEnd = new Date(yesterdayStart)
          yesterdayEnd.setDate(yesterdayEnd.getDate() + 1)
          dateRange = { $gte: yesterdayStart, $lt: yesterdayEnd }
          break
        case "7_days":
        case "last_7_days":
          const last7Days = new Date(now)
          last7Days.setDate(last7Days.getDate() - 7)
          dateRange = { $gte: last7Days }
          break
        case "2_weeks":
        case "last_14_days":
          const last14Days = new Date(now)
          last14Days.setDate(last14Days.getDate() - 14)
          dateRange = { $gte: last14Days }
          break
        case "3_weeks":
        case "last_21_days":
          const last21Days = new Date(now)
          last21Days.setDate(last21Days.getDate() - 21)
          dateRange = { $gte: last21Days }
          break
        case "1_month":
        case "last_30_days":
          const last30Days = new Date(now)
          last30Days.setDate(last30Days.getDate() - 30)
          dateRange = { $gte: last30Days }
          break
        case "2_months":
        case "last_2_months":
          const last2Months = new Date(now)
          last2Months.setMonth(last2Months.getMonth() - 2)
          dateRange = { $gte: last2Months }
          break
        case "last_3_months":
          const last3Months = new Date(now)
          last3Months.setMonth(last3Months.getMonth() - 3)
          dateRange = { $gte: last3Months }
          break
        case "last_6_months":
          const last6Months = new Date(now)
          last6Months.setMonth(last6Months.getMonth() - 6)
          dateRange = { $gte: last6Months }
          break
        case "last_year":
          const lastYear = new Date(now)
          lastYear.setFullYear(lastYear.getFullYear() - 1)
          dateRange = { $gte: lastYear }
          break
        case "custom":
          if (startDate && endDate) {
            const start = new Date(startDate)
            const end = new Date(endDate)
            end.setHours(23, 59, 59, 999) // Include the entire end date
            dateRange = { $gte: start, $lte: end }
          }
          break
      }
      
      if (Object.keys(dateRange).length > 0) {
        filter.createdAt = dateRange
      }
    } else if (startDate && endDate) {
      // Handle direct date range parameters (for backward compatibility)
      const start = new Date(startDate)
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      filter.createdAt = { $gte: start, $lte: end }
    }

    // First get raw orders without populate to debug
    const rawOrders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .lean()
    
    // Debug raw order data
    if (rawOrders[0]?.items?.[0]) {
      console.log('🔍 RAW ORDER ITEM BEFORE POPULATE:', {
        name: rawOrders[0].items[0].name,
        productId: rawOrders[0].items[0].productId,
        price: rawOrders[0].items[0].price,
        quantity: rawOrders[0].items[0].quantity,
        itemType: rawOrders[0].items[0].itemType,
        size: rawOrders[0].items[0].size,
        color: rawOrders[0].items[0].color,
        fullItem: rawOrders[0].items[0]
      })
    }
    
    const orders = await Order.find(filter)
      .populate('userId', 'name email')
      .populate('items.productId', 'name price images slug')
      .sort({ createdAt: -1 })
      .lean()
    
    // Fetch product and option images for each order item
    const ordersWithImages = await Promise.all(
      orders.map(async (order) => {
        if (order.items && order.items.length > 0) {
          const itemsWithImages = await Promise.all(
            order.items.map(async (item) => {
              // Handle both cases: when productId exists and when it's null (broken orders)
              if (item.productId && item.productId._id) {
                
                // Try to determine if this is a ProductOption by multiple checks
                const productOptionCheck = await ProductOption.findById(item.productId._id).lean()
                const hasVariantInName = item.name && (item.name.includes(' - ') && (item.name.includes('m ') || item.name.includes('l ') || item.name.includes('s ') || item.name.includes('xl ')))
                const isProductOption = !!productOptionCheck || item.itemType === 'productOption' || (item.size && item.color) || hasVariantInName
                
                console.log('🔍 OPTION DETECTION DEBUG:', {
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
                  
                  console.log('🔧 PRODUCT OPTION DEBUG (CART LOGIC):', {
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
                  
                  console.log('🔧 REGULAR PRODUCT DEBUG:', {
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
                console.log('🔧 FALLBACK: Trying to fix broken order item with null productId:', {
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
                    
                    console.log('🔍 PARSED NAME:', { productName, size, color })
                    
                    // Find matching ProductOption
                    const matchingOption = await ProductOption.findOne({
                      size: { $regex: new RegExp(`^${size.trim()}$`, 'i') },
                      color: { $regex: new RegExp(`^${color.trim()}$`, 'i') }
                    }).populate('productId', 'name slug').lean()
                    
                    if (matchingOption && matchingOption.productId && matchingOption.productId.name.toLowerCase().includes(productName.toLowerCase())) {
                      console.log('✅ FOUND MATCHING OPTION:', {
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
                      console.log('❌ NO MATCHING OPTION FOUND for:', { productName, size, color })
                    }
                  }
                } else {
                  // Try to find main Product by name
                  const productName = item.name.replace(' - ', ' ').trim()
                  const matchingProduct = await Product.findOne({
                    name: { $regex: new RegExp(productName, 'i') }
                  }).lean()
                  
                  if (matchingProduct) {
                    console.log('✅ FOUND MATCHING PRODUCT:', {
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
                    console.log('❌ NO MATCHING PRODUCT FOUND for:', productName)
                  }
                }
              }
              
              // Return item as-is if no product/option found
              return item
            })
          )
          return {
            ...order,
            items: itemsWithImages
          }
        }
        return order
      })
    )
    
    // Debug logging
    if (ordersWithImages[0]?.items?.[0]) {
      const debugItem = ordersWithImages[0].items[0]
      console.log('🔍 FINAL API RESPONSE - First Order First Item:')
      console.log('Item Type:', debugItem.itemType)
      console.log('Product ID:', debugItem.productId?._id)
      console.log('Product Name:', debugItem.productId?.name)
      console.log('Images Array:', debugItem.productId?.images)
      console.log('Images Length:', debugItem.productId?.images?.length || 0)
      console.log('Has Images:', (debugItem.productId?.images?.length || 0) > 0)
      console.log('First Image:', debugItem.productId?.images?.[0] || 'NO IMAGE')
      console.log('Size:', debugItem.productId?.size)
      console.log('Color:', debugItem.productId?.color)
      console.log('Full Item JSON:', JSON.stringify(debugItem, null, 2))
    }
    
    return Response.json({ success: true, orders: ordersWithImages })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    await connectDB()
    const orderData = await request.json()
    
    // Update stock for each item before creating order
    for (const item of orderData.items) {
      try {
        console.log('📦 PROCESSING ORDER ITEM:', {
          name: item.name,
          productId: item.productId,
          itemType: item.itemType,
          quantity: item.quantity,
          size: item.size,
          color: item.color
        })
        
        // Check if item is a ProductOption (has itemType: 'productOption' or has size/color)
        if (item.itemType === 'productOption' || (item.size && item.color)) {
          // Update ProductOption collection directly
          const productOption = await ProductOption.findById(item.productId)
          
          if (productOption) {
            const currentOptionStock = productOption.stock || 0
            
            console.log('📊 PRODUCT OPTION STOCK CHECK:', {
              optionId: productOption._id,
              size: productOption.size,
              color: productOption.color,
              currentStock: currentOptionStock,
              requestedQuantity: item.quantity
            })
            
            // Check if enough stock is available
            if (currentOptionStock < item.quantity) {
              return Response.json({ 
                success: false, 
                error: `Insufficient stock for ${item.name} (${productOption.size}, ${productOption.color}). Available: ${currentOptionStock}, Requested: ${item.quantity}` 
              }, { status: 400 })
            }
            
            // Update the stock
            productOption.stock = Math.max(0, currentOptionStock - item.quantity)
            await productOption.save()
            
            console.log('✅ PRODUCT OPTION STOCK UPDATED:', {
              optionId: productOption._id,
              newStock: productOption.stock
            })
          } else {
            console.error('❌ ProductOption not found:', item.productId)
            return Response.json({ 
              success: false, 
              error: `Product option not found for ${item.name}` 
            }, { status: 400 })
          }
        } else {
          // Update main product stock (for simple products without options)
          const product = await Product.findById(item.productId)
          if (product) {
            const currentStock = product.stock || 0
            
            // Check if enough stock is available
            if (currentStock < item.quantity) {
              return Response.json({ 
                success: false, 
                error: `Insufficient stock for ${item.name}. Available: ${currentStock}, Requested: ${item.quantity}` 
              }, { status: 400 })
            }
            
            // Update the stock using findByIdAndUpdate to avoid validation issues
            const newStock = Math.max(0, currentStock - item.quantity)
            await Product.findByIdAndUpdate(
              item.productId, 
              { stock: newStock },
              { runValidators: false } // Skip validation to avoid categoryId issues
            )
          }
        }
      } catch (stockError) {
        console.error('Error updating stock for item:', item, stockError)
        return Response.json({ 
          success: false, 
          error: `Failed to update stock for ${item.name}. Please try again.` 
        }, { status: 500 })
      }
    }
    
    // Create the order after successful stock updates
    const order = await Order.create(orderData)
    
    // Update coupon usage if coupon was used
    if (orderData.couponId && orderData.couponCode) {
      try {
        const coupon = await Coupon.findById(orderData.couponId)
        if (coupon && coupon.isCurrentlyValid) {
          // Use the coupon (increments usage count)
          await coupon.useCoupon(orderData.userId)
          console.log(`Coupon ${orderData.couponCode} used. Remaining usage: ${coupon.usageLimit ? (coupon.usageLimit - coupon.usageCount - 1) : 'unlimited'}`)
        }
      } catch (couponError) {
        console.error('Error updating coupon usage:', couponError)
        // Don't fail the order if coupon update fails, just log the error
      }
    }

    // Send confirmation email if email is provided
    if (orderData.customerEmail) {
      try {
        await sendOrderConfirmationEmail(order, orderData.customerEmail)
      } catch (emailError) {
        console.error("Failed to send order confirmation email:", emailError)
      }
    }

    return Response.json({ 
      success: true, 
      order,
      orderId: order._id // Include orderId for frontend redirect
    })
  } catch (error) {
    console.error('Order creation error:', error)
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}
