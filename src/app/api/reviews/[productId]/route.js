import connectDB from "../../../../lib/mongodb"
import Review from "../../../../lib/models/Review"
import Product from "../../../../lib/models/Product"
import mongoose from "mongoose"

export async function GET(request, { params }) {
  try {
    await connectDB()
    const { productId } = await params
    
    // Determine if productId is slug or ObjectId
    let actualProductId = productId
    
    if (!productId.match(/^[0-9a-fA-F]{24}$/)) {
      // It's a slug, find the actual product ID
      const product = await Product.findOne({ slug: productId }).lean()
      if (!product) {
        return Response.json({ success: false, error: "Product not found" }, { status: 404 })
      }
      actualProductId = product._id
    }
    
    const reviews = await Review.find({ productId: actualProductId }).sort({ createdAt: -1 }).lean()
    const agg = await Review.aggregate([
      { $match: { productId: new mongoose.Types.ObjectId(actualProductId) } },
      { $group: { _id: null, avgRating: { $avg: "$rating" }, count: { $sum: 1 } } },
    ])
    const rating = agg.length > 0 ? { average: agg[0].avgRating, count: agg[0].count } : { average: 0, count: 0 }
    return Response.json({ success: true, reviews, rating })
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}
