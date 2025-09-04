import mongoose from "mongoose"

const ProductOptionSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    size: { type: String, trim: true },
    price: { type: Number },
    mrp: { type: Number },
    color: { type: String, trim: true },
    stock: { type: Number, default: 0 },
    images: [{ type: String }]
  },
  { timestamps: true },
)

if (mongoose.models.ProductOption) {
  delete mongoose.models.ProductOption
}

const ProductOption = mongoose.model("ProductOption", ProductOptionSchema)
export default ProductOption


