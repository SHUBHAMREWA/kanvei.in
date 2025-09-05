import mongoose from "mongoose"

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    title: { type: String, trim: true },
    description: { type: String, trim: true },
    brand: { type: String, trim: true },
    slug: { type: String, trim: true, lowercase: true, index: true, unique: false },
    weight: { type: Number },
    height: { type: Number },
    width: { type: Number },
    mrp: { type: Number },
    price: { type: Number, required: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    stock: { type: Number, default: 0 },
    featured: { type: Boolean, default: false }
  },
  { timestamps: true },
)

if (mongoose.models.Product) {
  delete mongoose.models.Product
}

const Product = mongoose.model("Product", ProductSchema)

export default Product
