import mongoose from "mongoose"

const ReviewSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    userName: { type: String },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String },
  },
  { timestamps: true },
)

if (mongoose.models.Review) {
  delete mongoose.models.Review
}

const Review = mongoose.model("Review", ReviewSchema)

export default Review
