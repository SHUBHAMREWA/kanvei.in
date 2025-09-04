import mongoose from "mongoose"

const ProductImageSchema = new mongoose.Schema(
  {
    img: { type: [String], default: [] },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, index: true },
  },
  { timestamps: true },
)

if (mongoose.models.ProductImage) {
  delete mongoose.models.ProductImage
}

const ProductImage = mongoose.model("ProductImage", ProductImageSchema)
export default ProductImage


