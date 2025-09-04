import mongoose from "mongoose"

const ProductViewSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, unique: true },
    views: { type: Number, default: 0 },
  },
  { timestamps: true },
)

if (mongoose.models.ProductView) {
  delete mongoose.models.ProductView
}

const ProductView = mongoose.model("ProductView", ProductViewSchema)
export default ProductView


