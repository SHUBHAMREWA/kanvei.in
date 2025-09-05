import Razorpay from "razorpay"
import connectDB from "../../../../lib/mongodb"
import Product from "../../../../lib/models/Product"
import ProductOption from "../../../../lib/models/ProductOption"

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
      console.log('💳 PAYMENT CREATE ORDER - VALIDATING ITEM:', {
        productId: item.productId,
        itemType: item.itemType,
        name: item.name,
        quantity: item.quantity,
        size: item.size,
        color: item.color
      })
      
      let product, itemPrice, itemName
      
      // Check if item is a ProductOption
      if (item.itemType === 'productOption' || (item.size && item.color)) {
        // Validate ProductOption
        const productOption = await ProductOption.findById(item.productId)
        if (!productOption) {
          return Response.json({ success: false, error: `Product option not found: ${item.productId}` }, { status: 400 })
        }
        
        // Get main product for name
        const mainProduct = await Product.findById(productOption.productId)
        if (!mainProduct) {
          return Response.json({ success: false, error: `Main product not found for option: ${item.productId}` }, { status: 400 })
        }
        
        itemPrice = productOption.price
        itemName = `${mainProduct.name} - ${productOption.size} - ${productOption.color}`
        product = { _id: productOption._id, name: itemName }
        
        console.log('✅ PRODUCT OPTION VALIDATED:', {
          optionId: productOption._id,
          mainProductId: mainProduct._id,
          name: itemName,
          price: itemPrice
        })
      } else {
        // Validate main Product
        product = await Product.findById(item.productId)
        if (!product) {
          return Response.json({ success: false, error: `Product not found: ${item.productId}` }, { status: 400 })
        }
        
        itemPrice = product.price
        itemName = product.name
        
        console.log('✅ MAIN PRODUCT VALIDATED:', {
          productId: product._id,
          name: itemName,
          price: itemPrice
        })
      }

      const itemTotal = itemPrice * item.quantity
      subtotal += itemTotal

      validatedItems.push({
        productId: product._id,
        name: itemName,
        price: itemPrice,
        quantity: item.quantity,
        itemType: item.itemType || 'product',
        size: item.size,
        color: item.color,
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
