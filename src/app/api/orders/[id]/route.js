import connectDB from "../../../../lib/mongodb"
import Order from "../../../../lib/models/Order"
import ProductImage from "../../../../lib/models/ProductImage"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../auth/[...nextauth]/route"

export async function GET(request, { params }) {
  try {
    await connectDB()
    
    const { id } = await params
    if (!id) {
      return Response.json({ success: false, error: "Order ID is required" }, { status: 400 })
    }

    // Get the order
    const order = await Order.findById(id)
      .populate('userId', 'name email')
      .populate('items.productId', 'name price images slug')
      .lean()
    
    if (!order) {
      return Response.json({ success: false, error: "Order not found" }, { status: 404 })
    }
    
    // Fetch product images for order items
    if (order.items && order.items.length > 0) {
      const itemsWithImages = await Promise.all(
        order.items.map(async (item) => {
          if (item.productId && item.productId._id) {
            // Fetch product images from ProductImage collection
            const productImages = await ProductImage.findOne({ productId: item.productId._id }).lean()
            return {
              ...item,
              productId: {
                ...item.productId,
                images: productImages ? productImages.img : (item.productId.images || [])
              }
            }
          }
          return item
        })
      )
      order.items = itemsWithImages
    }

    // Check authentication and authorization
    const session = await getServerSession(authOptions)
    
    // Allow access if:
    // 1. User is logged in with NextAuth and the order belongs to them
    // 2. User is logged in with custom auth (check via Authorization header)
    // 3. Admin access
    
    let isAuthorized = false
    
    if (session?.user) {
      // NextAuth session
      const userId = session.user._id || session.user.id
      isAuthorized = order.userId?.toString() === userId?.toString() || 
                    order.customerEmail === session.user.email ||
                    session.user.role === 'admin'
    } else {
      // Check custom auth header
      const authHeader = request.headers.get('Authorization')
      if (authHeader?.startsWith('Bearer ')) {
        // For now, we'll allow access with valid token
        // In a real app, you'd verify the token and get user info
        isAuthorized = true
      }
    }

    if (!isAuthorized) {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    return Response.json({ success: true, order })
  } catch (error) {
    console.error('Error fetching order:', error)
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    await connectDB()
    
    const { id } = await params
    if (!id) {
      return Response.json({ success: false, error: "Order ID is required" }, { status: 400 })
    }

    const body = await request.json()
    const { status } = body
    
    if (!status) {
      return Response.json({ success: false, error: "Status is required" }, { status: 400 })
    }

    // Validate status values
    const validStatuses = [
      'pending', 
      'processing', 
      'shipping', 
      'out_for_delivery', 
      'delivered', 
      'cancelled',
      'return_accepted',
      'return_not_accepted'
    ]
    if (!validStatuses.includes(status)) {
      return Response.json({ 
        success: false, 
        error: `Invalid status value. Allowed values: ${validStatuses.join(', ')}` 
      }, { status: 400 })
    }

    // Get current order to check existing status
    const currentOrder = await Order.findById(id)
    if (!currentOrder) {
      return Response.json({ success: false, error: "Order not found" }, { status: 404 })
    }

    // Optional: Add business logic for status transitions
    // For example, prevent updating delivered orders to pending
    const restrictedTransitions = {
      'delivered': ['pending', 'processing', 'shipping'],
      'cancelled': ['pending', 'processing', 'shipping', 'out_for_delivery', 'delivered']
    }
    
    if (restrictedTransitions[currentOrder.status]?.includes(status)) {
      return Response.json({ 
        success: false, 
        error: `Cannot change order status from '${currentOrder.status}' to '${status}'` 
      }, { status: 400 })
    }

    // Check if user is admin
    // TODO: Add proper admin authentication
    // For now, allow status updates from admin dashboard
    // const session = await getServerSession(authOptions)
    // if (!session?.user || session.user.role !== 'admin') {
    //   return Response.json({ success: false, error: "Admin access required" }, { status: 403 })
    // }

    // Log the status change
    console.log(`Updating order ${id} status from '${currentOrder.status}' to '${status}'`)

    // Update the order
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { 
        status,
        updatedAt: new Date() // Explicitly update timestamp
      },
      { new: true }
    )
    
    if (!updatedOrder) {
      return Response.json({ success: false, error: "Order not found" }, { status: 404 })
    }

    // Log successful update
    console.log(`Successfully updated order ${id} to status '${status}'`)

    return Response.json({ 
      success: true, 
      message: "Order status updated successfully",
      order: updatedOrder 
    })
  } catch (error) {
    console.error('Error updating order:', error)
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}
