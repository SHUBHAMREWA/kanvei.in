import connectDB from "../../../../lib/mongodb"
import Product from "../../../../lib/models/Product"

export async function GET(request) {
  try {
    await connectDB()
    
    // Get first 5 products with full details
    const products = await Product.find({}).limit(5)
    
    console.log('🔍 PRODUCTS IN DATABASE:')
    products.forEach((product, index) => {
      console.log(`\n📦 Product ${index + 1}: ${product.name}`)
      console.log(`  - ID: ${product._id}`)
      console.log(`  - Images type: ${typeof product.images}`)
      console.log(`  - Images array: ${Array.isArray(product.images)}`)
      console.log(`  - Images length: ${product.images ? product.images.length : 'NULL'}`)
      console.log(`  - Images content:`, product.images)
      if (product.images && product.images.length > 0) {
        console.log(`  - First image: ${product.images[0]}`)
      }
    })
    
    return Response.json({ 
      success: true,
      message: 'Check server console for product details',
      productsCount: products.length,
      products: products.map(p => ({
        _id: p._id,
        name: p.name,
        images: p.images,
        imagesCount: p.images ? p.images.length : 0,
        firstImage: p.images && p.images.length > 0 ? p.images[0] : null
      }))
    })
  } catch (error) {
    console.error('Check products error:', error)
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}
