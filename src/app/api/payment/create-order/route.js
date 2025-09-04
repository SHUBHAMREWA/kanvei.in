import Razorpay from "razorpay"
import connectDB from "../../../../lib/mongodb"
import Product from "../../../../lib/models/Product"

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
})

// Helper function to calculate shipping (set to 0 as per requirement)
const calculateShipping = (items, shippingAddress) => {
  return 0; // Always return 0 shipping charge
}

// Helper function to calculate taxes (if any)
const calculateTaxes = (subtotal) => {
  return 0; // No taxes for now, can be customized later
}

export async function POST(request) {
  try {
    const { cartItems, shippingAddress, currency = "INR", appliedCoupon, finalAmount } = await request.json()

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return Response.json({ success: false, error: "Invalid cart items" }, { status: 400 })
    }

    await connectDB()

    // Validate and calculate amount server-side
    let subtotal = 0
    const validatedItems = []

    for (const item of cartItems) {
      const product = await Product.findById(item.productId)
      if (!product) {
        return Response.json({ success: false, error: `Product not found: ${item.productId}` }, { status: 400 })
      }

      let itemPrice = product.price
      
      // If item has specific options (size/color), find the option price
      if (item.selectedOption && product.options && product.options.length > 0) {
        const option = product.options.find(
          opt => opt.size === item.selectedOption.size && opt.color === item.selectedOption.color
        )
        if (option) {
          itemPrice = option.price
        }
      }

      const itemTotal = itemPrice * item.quantity
      subtotal += itemTotal

      validatedItems.push({
        productId: product._id,
        name: product.name,
        price: itemPrice,
        quantity: item.quantity,
        selectedOption: item.selectedOption,
        total: itemTotal
      })
    }

    // Calculate additional charges
    const shipping = calculateShipping(validatedItems, shippingAddress)
    const taxes = calculateTaxes(subtotal)
    const totalAmount = subtotal + shipping + taxes
    
    // Use final amount if coupon is applied, otherwise use calculated total
    const amountToPay = finalAmount !== undefined ? finalAmount : totalAmount
    const discountAmount = appliedCoupon ? (totalAmount - amountToPay) : 0

    const options = {
      amount: Math.round(amountToPay * 100), // Razorpay expects amount in paise
      currency,
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1,
    }

    const order = await razorpay.orders.create(options)

    return Response.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      calculatedTotal: totalAmount,
      finalAmount: amountToPay,
      discountAmount,
      appliedCoupon,
      breakdown: {
        subtotal,
        shipping,
        taxes,
        total: totalAmount,
        discount: discountAmount,
        finalTotal: amountToPay
      },
      validatedItems
    })
  } catch (error) {
    console.error("Error creating Razorpay order:", error)
    return Response.json({ success: false, error: "Failed to create payment order" }, { status: 500 })
  }
}
