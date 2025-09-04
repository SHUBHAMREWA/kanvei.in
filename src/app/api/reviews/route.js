import connectDB from "../../../lib/mongodb"
import Review from "../../../lib/models/Review"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/route"

export async function POST(request) {
  try {
    await connectDB()
    const session = await getServerSession(authOptions)
    if (!session) {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }
    const reviewData = await request.json()
    const review = await Review.create(reviewData)
    return Response.json({ success: true, review })
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}
