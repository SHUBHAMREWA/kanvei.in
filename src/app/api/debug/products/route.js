import connectDB from "../../../../lib/mongodb"
import Product from "../../../../lib/models/Product"

export async function GET(request) {
  try {
    await connectDB()
    
    // Get all products with their images
    const products = await Product.find({}, { name: 1, images: 1, slug: 1 }).limit(5)
    
    console.log('📊 Debug - Products in database:', products)
    
    return Response.json({ 
      success: true, 
      products: products,
      count: products.length,
      message: 'Check console logs for detailed product data'
    })
  } catch (error) {
    console.error('Debug error:', error)
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}
