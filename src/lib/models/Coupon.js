import mongoose from "mongoose"
import { calculatePercentageDiscount, formatPrice } from "../utils/priceUtils.js"

const CouponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    discountType: {
      type: String,
      required: true,
      enum: ['percentage'],
      default: 'percentage'
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    minimumOrderAmount: {
      type: Number,
      required: true,
      min: 0
    },
    usageLimit: {
      type: Number,
      default: null,
      min: 0
    },
    usageCount: {
      type: Number,
      default: 0,
      min: 0
    },
    isActive: {
      type: Boolean,
      default: true
    },
    usedBy: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
      },
      usedAt: {
        type: Date,
        default: Date.now
      }
    }],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { 
    timestamps: true 
  }
)

// Index for efficient queries
CouponSchema.index({ code: 1, isActive: 1 })
CouponSchema.index({ createdBy: 1 })

// Virtual to check if coupon is currently valid
CouponSchema.virtual('isCurrentlyValid').get(function() {
  // Check if active
  if (!this.isActive) return false
  
  // Check if usage limit reached
  if (this.usageLimit !== null && this.usageCount >= this.usageLimit) return false
  
  return true
})

// Virtual to check if coupon has usage remaining
CouponSchema.virtual('hasUsageRemaining').get(function() {
  if (this.usageLimit === null) return true
  return this.usageCount < this.usageLimit
})

// Method to check if user can use this coupon
CouponSchema.methods.canUserUse = function(userId) {
  return this.isCurrentlyValid
}

// Method to calculate discount for a given order amount
CouponSchema.methods.calculateDiscount = function(orderAmount) {
  // Check if coupon is valid
  if (!this.isCurrentlyValid) {
    return 0
  }
  
  // Check minimum order amount
  if (orderAmount < this.minimumOrderAmount) {
    return 0
  }
  
  // Use utility function for precise percentage calculation
  const discount = calculatePercentageDiscount(orderAmount, this.discountValue)
  
  // Ensure discount doesn't exceed order amount
  return Math.min(discount, formatPrice(orderAmount))
}

// Method to use coupon (decrement usage count)
CouponSchema.methods.useCoupon = function(userId) {
  // Increment usage count
  this.usageCount += 1
  
  // Add user to used by list if userId provided
  if (userId) {
    this.usedBy.push({
      userId: userId,
      usedAt: new Date()
    })
  }
  
  return this.save()
}

// Static method to find active coupons
CouponSchema.statics.findActiveCoupons = function() {
  return this.find({
    isActive: true
  })
}

// Static method to find coupon by code
CouponSchema.statics.findByCode = function(code) {
  return this.findOne({
    code: code.toUpperCase(),
    isActive: true
  })
}

// Prevent saving invalid coupon data
CouponSchema.pre('save', function(next) {
  // For percentage discounts, ensure value is not greater than 100
  if (this.discountType === 'percentage' && this.discountValue > 100) {
    return next(new Error('Percentage discount cannot be greater than 100%'))
  }
  
  // Ensure maximum discount is only set for percentage discounts
  if (this.discountType === 'fixed' && this.maximumDiscount) {
    this.maximumDiscount = null
  }
  
  next()
})

if (mongoose.models.Coupon) {
  delete mongoose.models.Coupon
}

const Coupon = mongoose.model("Coupon", CouponSchema)

export default Coupon
