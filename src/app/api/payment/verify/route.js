import crypto from "crypto"
import connectDB from "../../../../lib/mongodb"
import Order from "../../../../lib/models/Order"
import Product from "../../../../lib/models/Product"
import ProductOption from "../../../../lib/models/ProductOption"
import { sendOrderConfirmationEmail } from "../../../../lib/email"

export async function POST(request) {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature, 
      orderData 
    } = await request.json()

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex")

    const isAuthentic = expectedSignature === razorpay_signature

    if (isAuthentic) {
      await connectDB()
      
      console.log('🔍 PAYMENT VERIFICATION - ORDER DATA:', {
        totalItems: orderData.items?.length || 0,
        items: orderData.items
      })
      
      // Update stock for each item before creating order
      for (const item of orderData.items) {
        try {
          console.log('📦 PAYMENT VERIFICATION - PROCESSING ITEM:', {
            name: item.name,
            productId: item.productId,
            itemType: item.itemType,
            quantity: item.quantity,
            size: item.size,
            color: item.color,
            fullItem: item
          })
          
          // Check if item is a ProductOption (has itemType: 'productOption' or has size/color)
          if (item.itemType === 'productOption' || (item.size && item.color)) {
            // Update ProductOption collection directly
            const productOption = await ProductOption.findById(item.productId)
            
            if (productOption) {
              const currentOptionStock = productOption.stock || 0
              
              console.log('📊 PAYMENT VERIFICATION - OPTION STOCK CHECK:', {
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
              
              console.log('✅ PAYMENT VERIFICATION - OPTION STOCK UPDATED:', {
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
            console.log('📦 MAIN PRODUCT STOCK UPDATE - Finding product:', item.productId)
            const product = await Product.findById(item.productId)
            
            if (product) {
              const currentStock = product.stock || 0
              
              console.log('📊 MAIN PRODUCT STOCK CHECK:', {
                productId: product._id,
                productName: product.name,
                currentStock: currentStock,
                requestedQuantity: item.quantity
              })
              
              // Check if enough stock is available
              if (currentStock < item.quantity) {
                return Response.json({ 
                  success: false, 
                  error: `Insufficient stock for ${item.name}. Available: ${currentStock}, Requested: ${item.quantity}` 
                }, { status: 400 })
              }
              
              // Update the stock using findByIdAndUpdate to avoid validation issues
              const newStock = Math.max(0, currentStock - item.quantity)
              console.log('💾 MAIN PRODUCT - Updating stock from', currentStock, 'to', newStock)
              
              await Product.findByIdAndUpdate(
                item.productId, 
                { stock: newStock },
                { runValidators: false } // Skip validation to avoid categoryId issues
              )
              
              console.log('✅ MAIN PRODUCT STOCK UPDATED:', {
                productId: product._id,
                oldStock: currentStock,
                newStock: product.stock
              })
            } else {
              console.error('❌ Main Product not found:', item.productId)
              return Response.json({ 
                success: false, 
                error: `Main product not found for ${item.name}` 
              }, { status: 400 })
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
      
      // Create order in database only after successful payment verification and stock update
      const order = await Order.create({
        userId: orderData.userId,
        items: orderData.items || [],
        totalAmount: orderData.total || orderData.totalAmount,
        shippingAddress: orderData.shippingAddress,
        customerEmail: orderData.customerEmail,
        paymentMethod: "razorpay",
        paymentStatus: "paid",
        razorpayPaymentId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
        status: "confirmed",
      })

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
        message: "Payment verified and order created successfully",
        orderId: order._id
      })
    } else {
      return Response.json({ success: false, error: "Payment verification failed" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error verifying payment:", error)
    return Response.json({ success: false, error: "Payment verification failed" }, { status: 500 })
  }
}
