import mongoose from "mongoose"

const WishlistSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, index: true },
  },
  { timestamps: true },
)

WishlistSchema.index({ userId: 1, productId: 1 }, { unique: true })

if (mongoose.models.Wishlist) {
  delete mongoose.models.Wishlist
}

const Wishlist = mongoose.model("Wishlist", WishlistSchema)

export default Wishlist
