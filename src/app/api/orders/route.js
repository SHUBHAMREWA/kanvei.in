import connectDB from "../../../lib/mongodb"
import Order from "../../../lib/models/Order"
import Product from "../../../lib/models/Product"
import ProductOption from "../../../lib/models/ProductOption"
import ProductImage from "../../../lib/models/ProductImage"
import Coupon from "../../../lib/models/Coupon"
import { sendOrderConfirmationEmail } from "../../../lib/email"

export async function GET(request) {
  try {
    await connectDB()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const status = searchParams.get("status")

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

    const orders = await Order.find(filter)
      .populate('userId', 'name email')
      .populate('items.productId', 'name price images slug')
      .sort({ createdAt: -1 })
      .lean()
    
    // Fetch product images for each order item
    const ordersWithImages = await Promise.all(
      orders.map(async (order) => {
        if (order.items && order.items.length > 0) {
          const itemsWithImages = await Promise.all(
            order.items.map(async (item) => {
              if (item.productId && item.productId._id) {
                // Fetch product images from ProductImage collection
                const productImages = await ProductImage.findOne({ productId: item.productId._id }).lean()
                return {
                  ...item,
                  productId: {
                    ...item.productId,
                    images: productImages ? productImages.img : (item.productId.images || [])
                  }
                }
              }
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
        // Check if item has selectedOption (for ProductOption stock)
        if (item.selectedOption && item.selectedOption.size && item.selectedOption.color) {
          // Find the product and update specific option stock
          const product = await Product.findById(item.productId)
          if (product) {
            // Find the specific option in the product's options array
            const optionIndex = product.options.findIndex(
              opt => opt.size === item.selectedOption.size && opt.color === item.selectedOption.color
            )
            
            if (optionIndex !== -1) {
              const currentOptionStock = product.options[optionIndex].stock || 0
              
              // Check if enough stock is available
              if (currentOptionStock < item.quantity) {
                return Response.json({ 
                  success: false, 
                  error: `Insufficient stock for ${item.name} (${item.selectedOption.size}, ${item.selectedOption.color}). Available: ${currentOptionStock}, Requested: ${item.quantity}` 
                }, { status: 400 })
              }
              
              // Update the stock for this specific option
              product.options[optionIndex].stock = Math.max(0, currentOptionStock - item.quantity)
              await product.save()
            }
          }
          
          // Also update ProductOption collection if it exists separately
          const productOption = await ProductOption.findOne({
            productId: item.productId,
            size: item.selectedOption.size,
            color: item.selectedOption.color
          })
          
          if (productOption) {
            const currentOptionStock = productOption.stock || 0
            if (currentOptionStock >= item.quantity) {
              productOption.stock = Math.max(0, currentOptionStock - item.quantity)
              await productOption.save()
            }
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
            
            // Update the stock
            product.stock = Math.max(0, currentStock - item.quantity)
            await product.save()
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
