import mongoose from "mongoose"

const CategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
      trim: true,
    },
    // Parent category reference
    
     parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
  },
  {
    timestamps: true,
  },
)

// Avoid model overwrite in Next.js
if (mongoose.models.Category) {
  delete mongoose.models.Category
}

const Category = mongoose.model("Category", CategorySchema)

export default Category
