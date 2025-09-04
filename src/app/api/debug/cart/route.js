import connectDB from "../../../../lib/mongodb"
import Cart from "../../../../lib/models/Cart"
import CartItem from "../../../../lib/models/CartItem"
import Product from "../../../../lib/models/Product"

export async function GET(request) {
  try {
    await connectDB()
    
    // Get all cart items
    const cartItems = await CartItem.find({}).populate('product').populate('productOption')
    
    console.log('🛒 Debug - Cart items in database:', cartItems.map(item => ({
      _id: item._id,
      itemType: item.itemType,
      productId: item.product?._id,
      productName: item.product?.name,
      productImages: item.product?.images,
      productSnapshot: item.productSnapshot
    })))
    
    // Also check individual products by ID
    for (const item of cartItems) {
      if (item.product) {
        const fullProduct = await Product.findById(item.product._id)
        console.log(`🔍 Product ${item.product._id} full data:`, {
          name: fullProduct?.name,
          images: fullProduct?.images,
          imagesLength: fullProduct?.images?.length
        })
      }
    }
    
    return Response.json({ 
      success: true, 
      cartItems: cartItems.length,
      message: 'Check console logs for detailed cart and product data'
    })
  } catch (error) {
    console.error('Debug error:', error)
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}
