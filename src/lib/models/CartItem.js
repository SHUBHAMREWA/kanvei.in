import mongoose from "mongoose";

const CartItemSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Either product OR productOption will be filled, not both
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    default: null
  },
  
  productOption: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductOption',
    default: null
  },
  
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  
  price: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Store essential product details at time of adding to cart
  productSnapshot: {
    name: String,
    image: String,
    slug: String,
    // For product options
    size: String,
    color: String,
    parentProductId: mongoose.Schema.Types.ObjectId
  },
  
  // Item type to easily identify
  itemType: {
    type: String,
    enum: ['product', 'productOption'],
    required: true
  },
  
  addedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  // Add compound indexes for performance
  indexes: [
    { userId: 1, product: 1 },
    { userId: 1, productOption: 1 },
    { userId: 1, addedAt: -1 }
  ]
});

// Validation: Either product or productOption must be set, but not both
CartItemSchema.pre('validate', function(next) {
  if (!this.product && !this.productOption) {
    next(new Error('Either product or productOption must be specified'));
  } else if (this.product && this.productOption) {
    next(new Error('Cannot specify both product and productOption'));
  } else {
    next();
  }
});

// Instance method to get the referenced item (product or productOption)
CartItemSchema.methods.getItem = function() {
  return this.populate(this.itemType === 'product' ? 'product' : 'productOption');
};

// Static method to find cart items by user
CartItemSchema.statics.findByUserId = function(userId) {
  return this.find({ userId })
    .populate('product', 'name price images stock slug')
    .populate('productOption', 'size color price mrp stock')
    .sort({ addedAt: -1 });
};

// Static method to find specific cart item
CartItemSchema.statics.findCartItem = function(userId, itemId, itemType) {
  const query = { userId };
  if (itemType === 'product') {
    query.product = itemId;
    query.productOption = null;
  } else {
    query.productOption = itemId;
    query.product = null;
  }
  return this.findOne(query);
};

const CartItem = mongoose.models.CartItem || mongoose.model('CartItem', CartItemSchema);

export default CartItem;
