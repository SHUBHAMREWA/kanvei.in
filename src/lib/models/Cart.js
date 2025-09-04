
import mongoose from "mongoose";

// Main Cart Schema
const CartSchema = new mongoose.Schema({

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true // One cart per user
  },

  items: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CartItem'
  }],
  
  // Cart metadata
  totalItems: {
    type: Number,
    default: 0
  },

  totalAmount: {
    type: Number,
    default: 0
  },
  
  // Cart status
  status: {
    type: String,
    enum: ['active', 'abandoned', 'converted'],
    default: 'active'
  },
  
  // Timestamps
  lastModified: {
    type: Date,
    default: Date.now
  }

}, {
  timestamps: true // Adds createdAt and updatedAt
});

// Indexes for better performance
CartSchema.index({ userId: 1 });

// Method to recalculate cart totals
CartSchema.methods.calculateTotals = async function() {
  await this.populate('items');
  let totalItems = 0;
  let totalAmount = 0;
  
  for (const item of this.items) {
    totalItems += item.quantity;
    totalAmount += item.price * item.quantity;
  }
  
  this.totalItems = totalItems;
  this.totalAmount = totalAmount;
  this.lastModified = new Date();
  
  return this.save();
};

// Method to add CartItem reference to cart
CartSchema.methods.addCartItem = function(cartItemId) {
  if (!this.items.includes(cartItemId)) {
    this.items.push(cartItemId);
  }
  return this.calculateTotals();
};

// Method to remove CartItem reference from cart
CartSchema.methods.removeCartItem = function(cartItemId) {
  this.items = this.items.filter(itemId => itemId.toString() !== cartItemId.toString());
  return this.calculateTotals();
};

// Method to clear cart
CartSchema.methods.clearCart = async function() {
  // Delete all CartItem documents
  const CartItem = mongoose.model('CartItem');
  await CartItem.deleteMany({ _id: { $in: this.items } });
  
  this.items = [];
  return this.calculateTotals();
};

// Static method to find cart with populated items
CartSchema.statics.findByUserId = function(userId) {
  return this.findOne({ userId }).populate({
    path: 'items',
    populate: [
      {
        path: 'product',
        select: 'name price images stock slug mrp'
      },
      {
        path: 'productOption',
        select: 'size color price mrp stock images',
        populate: {
          path: 'productId',
          select: 'name images slug'
        }
      }
    ]
  });
};

// Static method to create or get user cart
CartSchema.statics.getOrCreateCart = async function(userId) {
  let cart = await this.findOne({ userId });
  if (!cart) {
    cart = new this({ userId, items: [] });
    await cart.save();
  }
  return cart;
};

const Cart = mongoose.models.Cart || mongoose.model('Cart', CartSchema);

export default Cart;
