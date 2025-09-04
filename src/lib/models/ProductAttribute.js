import mongoose from "mongoose"

const ProductAttributeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, required: true, trim: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, index: true },
  },
  { timestamps: true },
)

if (mongoose.models.ProductAttribute) {
  delete mongoose.models.ProductAttribute
}

const ProductAttribute = mongoose.model("ProductAttribute", ProductAttributeSchema)
export default ProductAttribute


