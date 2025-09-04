import { NextRequest, NextResponse } from "next/server";
import connectDB from "../../../../../lib/mongodb";
import Review from "../../../../../lib/models/Review";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]/route";

export async function DELETE(request, { params }) {
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

    const reviewId = params.id;

    // Find and delete the review
    const deletedReview = await Review.findByIdAndDelete(reviewId);

    if (!deletedReview) {
      return NextResponse.json({
        success: false,
        error: "Review not found"
      }, { status: 404 });
    }

    console.log(`Admin ${session.user.id} deleted review ${reviewId} by ${deletedReview.userName}`);

    return NextResponse.json({
      success: true,
      message: "Review deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting review:", error);
    return NextResponse.json({
      success: false,
      error: "Error deleting review"
    }, { status: 500 });
  }
}
