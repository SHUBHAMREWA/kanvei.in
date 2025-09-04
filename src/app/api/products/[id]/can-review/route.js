import { NextRequest, NextResponse } from "next/server";
import connectDB from "../../../../../lib/mongodb";
import Order from "../../../../../lib/models/Order";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]/route";

export async function GET(request, { params }) {
  try {
    await connectDB();
    
    // Get user session
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({
        success: false,
        canReview: false,
        message: "Please login to review products"
      });
    }

    // Await params for Next.js 15 compatibility
    const resolvedParams = await params;
    const productId = resolvedParams.id;
    const userId = session.user.id;
    const userRole = session.user.role;

    // Admin can always review any product
    if (userRole === 'admin') {
      console.log(`Admin user ${userId} can review any product`);
      return NextResponse.json({
        success: true,
        canReview: true,
        message: "As admin, you can review any product",
        isAdmin: true
      });
    }

    // Find orders where:
    // 1. User is the customer (userId matches)
    // 2. Order status is 'delivered' 
    // 3. Order contains the specific product
    const deliveredOrders = await Order.find({
      userId: userId,
      status: 'delivered',
      'items.productId': productId
    }).populate('items.productId');

    console.log(`Checking review eligibility for user ${userId} and product ${productId}`);
    console.log(`Found ${deliveredOrders.length} delivered orders with this product`);

    if (deliveredOrders.length > 0) {
      // User has purchased and received this product
      return NextResponse.json({
        success: true,
        canReview: true,
        message: "You can review this product",
        orderCount: deliveredOrders.length
      });
    } else {
      // Check if user has any orders with this product (but not delivered)
      const anyOrders = await Order.find({
        userId: userId,
        'items.productId': productId
      });

      let message = "You need to purchase and receive this product before you can review it";
      
      if (anyOrders.length > 0) {
        // User has purchased but not delivered yet
        const pendingOrder = anyOrders.find(order => ['pending', 'processing', 'shipping', 'out_for_delivery'].includes(order.status));
        if (pendingOrder) {
          message = `You have ordered this product but it's not delivered yet. Current status: ${pendingOrder.status.replace('_', ' ')}`;
        }
      }

      return NextResponse.json({
        success: true,
        canReview: false,
        message: message,
        hasOrdered: anyOrders.length > 0
      });
    }

  } catch (error) {
    console.error("Error checking review eligibility:", error);
    return NextResponse.json({
      success: false,
      canReview: false,
      message: "Error checking review eligibility"
    }, { status: 500 });
  }
}
