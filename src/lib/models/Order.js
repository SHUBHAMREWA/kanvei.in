import mongoose from "mongoose"

const OrderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    name: { type: String },
    price: { type: Number },
    quantity: { type: Number },
    options: { type: Object, default: {} },
  },
  { _id: false },
)

const OrderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      unique: true,
      index: true
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    items: { type: [OrderItemSchema], default: [] },
    totalAmount: { type: Number, required: true },
    originalAmount: { type: Number }, // Amount before coupon discount
    discountAmount: { type: Number, default: 0 }, // Coupon discount amount
    couponCode: { type: String }, // Applied coupon code
    couponId: { type: mongoose.Schema.Types.ObjectId, ref: "Coupon" }, // Reference to coupon
    status: { 
      type: String, 
      default: "pending",
      enum: [
        'pending', 
        'confirmed',
        'processing', 
        'shipping', 
        'out_for_delivery', 
        'delivered', 
        'cancelled',
        'return_accepted',
        'return_not_accepted'
      ]
    },
    shippingAddress: { type: Object },
    paymentMethod: { type: String },
    paymentStatus: { type: String, default: "pending" },
    razorpayPaymentId: { type: String, default: null },
    razorpayOrderId: { type: String, default: null, index: true },
    customerEmail: { type: String, default: null },
  },
  { timestamps: true },
)

// Generate unique order ID before saving
OrderSchema.pre('save', async function(next) {
  if (!this.orderId) {
    // Generate order ID format: KNV + timestamp + random
    const timestamp = Date.now().toString().slice(-6) // Last 6 digits of timestamp
    const random = Math.random().toString(36).substring(2, 6).toUpperCase() // 4 random chars
    const generatedOrderId = `KNV${timestamp}${random}`
    
    // Check if this orderId already exists (very unlikely but let's be safe)
    let attempts = 0
    let orderIdToUse = generatedOrderId
    
    while (attempts < 5) {
      const existing = await mongoose.model('Order').findOne({ orderId: orderIdToUse })
      if (!existing) {
        break
      }
      // Generate new one if collision
      const newRandom = Math.random().toString(36).substring(2, 6).toUpperCase()
      orderIdToUse = `KNV${timestamp}${newRandom}`
      attempts++
    }
    
    this.orderId = orderIdToUse
    console.log('🆔 Generated Order ID:', orderIdToUse)
  }
  next()
})

// Add static method to generate order ID preview
OrderSchema.statics.generateOrderId = function() {
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `KNV${timestamp}${random}`
}

if (mongoose.models.Order) {
  delete mongoose.models.Order
}

const Order = mongoose.model("Order", OrderSchema)

export default Order
