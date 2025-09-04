import connectDB from "../../../../lib/mongodb"
import Cart from "../../../../lib/models/Cart"
import CartItem from "../../../../lib/models/CartItem"

export async function GET(request) {
  try {
    await connectDB()
    
    // Get all carts
    const allCarts = await Cart.find({})
    console.log(`Found ${allCarts.length} carts`)
    
    for (const cart of allCarts) {
      // Clear each cart
      await cart.clearCart()
      console.log(`Cleared cart for user: ${cart.userId}`)
    }
    
    return Response.json({ 
      success: true,
      message: `Cleared ${allCarts.length} carts`,
      cartsCleared: allCarts.length
    })
  } catch (error) {
    console.error('Clear cart error:', error)
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}
