import mongoose from "mongoose"

const BlogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true, trim: true, index: true, unique: true },
    heroImage: { type: String },
    heroImagePublicId: { type: String }, // For Cloudinary deletion
    description: { type: String, required: true },
    subtitle: { type: String },
    content: { type: String, required: true },
    youtubeLinks: { type: [String], default: [] },
    additionalLinks: [{
      title: { type: String },
      url: { type: String }
    }],
    author: { type: String, default: 'Kanvei Team' },
    tags: { type: [String], default: [] },
    published: { type: Boolean, default: false },
    publishedAt: { type: Date },
    metaTitle: { type: String },
    metaDescription: { type: String },
    readTime: { type: Number },
    views: { type: Number, default: 0 }
  },
  { timestamps: true },
)

if (mongoose.models.Blog) {
  delete mongoose.models.Blog
}

const Blog = mongoose.model("Blog", BlogSchema)

export default Blog

export const BlogUtils = {
  generateSlug(title) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim("-")
  },
  calculateReadTime(content) {
    const wordsPerMinute = 200
    const words = content.split(/\s+/).length
    return Math.ceil(words / wordsPerMinute)
  },
}
