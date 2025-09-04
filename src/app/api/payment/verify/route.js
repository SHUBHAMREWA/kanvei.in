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
