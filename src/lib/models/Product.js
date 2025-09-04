import mongoose from "mongoose"

const AttributeSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    type: { type: String, trim: true },
  },
  { _id: false },
)

const OptionSchema = new mongoose.Schema(
  {
    size: { type: String, trim: true },
    price: { type: Number },
    mrp: { type: Number },
    color: { type: String, trim: true },
    stock: { type: Number, default: 0 },
  },
  { _id: false },
)

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
    category: { type: String, trim: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", default: null },
    stock: { type: Number, default: 0 },
    featured: { type: Boolean, default: false },
    images: [{ type: String }],
    attributes: [AttributeSchema],
    options: [OptionSchema],
    views: { type: Number, default: 0 }
  },
  { timestamps: true },
)

if (mongoose.models.Product) {
  delete mongoose.models.Product
}

const Product = mongoose.model("Product", ProductSchema)

export default Product
