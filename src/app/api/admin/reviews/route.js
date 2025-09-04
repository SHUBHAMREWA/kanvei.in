import { NextRequest, NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import Review from "../../../../lib/models/Review";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET(request) {
  try {
    await connectDB();
    
    // Get user session and verify admin role
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({
        success: false,
        error: "Authentication required"
      }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({
        success: false,
        error: "Admin access required"
      }, { status: 403 });
    }

    // Fetch all reviews with product details
    const reviews = await Review.find({})
      .populate('productId', 'name price images category')
      .sort({ createdAt: -1 });

    console.log(`Admin ${session.user.id} fetched ${reviews.length} reviews`);

    return NextResponse.json({
      success: true,
      reviews: reviews
    });

  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json({
      success: false,
      error: "Error fetching reviews"
    }, { status: 500 });
  }
}
