import mongoose from 'mongoose'

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Coupon code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    minlength: [3, 'Coupon code must be at least 3 characters'],
    maxlength: [20, 'Coupon code cannot exceed 20 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: [true, 'Discount type is required']
  },
  discountValue: {
    type: Number,
    required: [true, 'Discount value is required'],
    min: [0, 'Discount value cannot be negative']
  },
  minOrderAmount: {
    type: Number,
    default: 0,
    min: [0, 'Minimum order amount cannot be negative']
  },
  maxDiscountAmount: {
    type: Number,
    default: null, // null means no limit
    min: [0, 'Maximum discount amount cannot be negative']
  },
  usageLimit: {
    type: Number,
    default: null, // null means unlimited
    min: [1, 'Usage limit must be at least 1']
  },
  usedCount: {
    type: Number,
    default: 0,
    min: [0, 'Used count cannot be negative']
  },
  userUsageLimit: {
    type: Number,
    default: 1, // How many times a single user can use this coupon
    min: [1, 'User usage limit must be at least 1']
  },
  validFrom: {
    type: Date,
    required: [true, 'Valid from date is required']
  },
  validTo: {
    type: Date,
    required: [true, 'Valid to date is required']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  applicableCategories: [{
    type: String,
    trim: true
  }], // Empty array means applicable to all categories
  excludeCategories: [{
    type: String,
    trim: true
  }],
  applicableProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }], // Empty array means applicable to all products
  excludeProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  usedBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    usedAt: {
      type: Date,
      default: Date.now
    },
    orderAmount: {
      type: Number,
      required: true
    },
    discountAmount: {
      type: Number,
      required: true
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
})

// Indexes for better performance
couponSchema.index({ code: 1 })
couponSchema.index({ validFrom: 1, validTo: 1 })
couponSchema.index({ isActive: 1 })

// Virtual to check if coupon is currently valid
couponSchema.virtual('isCurrentlyValid').get(function() {
  const now = new Date()
  return this.isActive && 
         this.validFrom <= now && 
         this.validTo >= now &&
         (this.usageLimit === null || this.usedCount < this.usageLimit)
})

// Method to check if user can use this coupon
couponSchema.methods.canUserUse = function(userId) {
  if (!userId) return false
  
  const userUsages = this.usedBy.filter(usage => 
    usage.userId.toString() === userId.toString()
  )
  
  return userUsages.length < this.userUsageLimit
}

// Method to calculate discount amount
couponSchema.methods.calculateDiscount = function(orderAmount, cartItems = []) {
  if (!this.isCurrentlyValid) {
    return { isValid: false, error: 'Coupon is not currently valid' }
  }
  
  if (orderAmount < this.minOrderAmount) {
    return { 
      isValid: false, 
      error: `Minimum order amount of ₹${this.minOrderAmount} required` 
    }
  }
  
  // Check category/product restrictions
  if (this.applicableCategories.length > 0 || this.excludeCategories.length > 0 ||
      this.applicableProducts.length > 0 || this.excludeProducts.length > 0) {
    
    let applicableAmount = 0
    
    for (const item of cartItems) {
      const product = item.productId || item.product
      let isApplicable = true
      
      // Check category restrictions
      if (this.applicableCategories.length > 0) {
        isApplicable = this.applicableCategories.includes(product.category)
      }
      
      if (this.excludeCategories.length > 0) {
        isApplicable = isApplicable && !this.excludeCategories.includes(product.category)
      }
      
      // Check product restrictions
      if (this.applicableProducts.length > 0) {
        isApplicable = isApplicable && this.applicableProducts.includes(product._id.toString())
      }
      
      if (this.excludeProducts.length > 0) {
        isApplicable = isApplicable && !this.excludeProducts.includes(product._id.toString())
      }
      
      if (isApplicable) {
        applicableAmount += item.price * item.quantity
      }
    }
    
    if (applicableAmount === 0) {
      return { 
        isValid: false, 
        error: 'Coupon is not applicable to any items in your cart' 
      }
    }
    
    orderAmount = applicableAmount
  }
  
  let discountAmount = 0
  
  if (this.discountType === 'percentage') {
    discountAmount = (orderAmount * this.discountValue) / 100
  } else {
    discountAmount = this.discountValue
  }
  
  // Apply max discount limit
  if (this.maxDiscountAmount && discountAmount > this.maxDiscountAmount) {
    discountAmount = this.maxDiscountAmount
  }
  
  // Discount cannot be more than order amount
  if (discountAmount > orderAmount) {
    discountAmount = orderAmount
  }
  
  return {
    isValid: true,
    discountAmount: Math.round(discountAmount * 100) / 100, // Round to 2 decimal places
    finalAmount: Math.round((orderAmount - discountAmount) * 100) / 100
  }
}

// Pre-save middleware to validate dates
couponSchema.pre('save', function(next) {
  if (this.validFrom >= this.validTo) {
    next(new Error('Valid to date must be after valid from date'))
  }
  
  if (this.discountType === 'percentage' && this.discountValue > 100) {
    next(new Error('Percentage discount cannot exceed 100%'))
  }
  
  next()
})

// Ensure model is only compiled once
const Coupon = mongoose.models.Coupon || mongoose.model('Coupon', couponSchema)

export default Coupon
