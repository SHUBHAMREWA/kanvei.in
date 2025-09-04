import connectDB from "../../../../lib/mongodb"
import Product from "../../../../lib/models/Product"

export async function POST(request) {
  return handleFixImages()
}

export async function GET(request) {
  return handleFixImages()
}

async function handleFixImages() {
  try {
    await connectDB()
    
    // Sample product images (you can replace these with actual product images)
    const sampleImages = [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop",
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop",
      "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=500&h=500&fit=crop",
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop",
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&h=500&fit=crop"
    ]
    
    // Find products without images
    const productsWithoutImages = await Product.find({ 
      $or: [
        { images: { $exists: false } },
        { images: { $size: 0 } },
        { images: null }
      ]
    })
    
    console.log(`Found ${productsWithoutImages.length} products without images`)
    
    let updatedCount = 0
    
    for (let i = 0; i < productsWithoutImages.length; i++) {
      const product = productsWithoutImages[i]
      const imageUrl = sampleImages[i % sampleImages.length] // Cycle through sample images
      
      const result = await Product.updateOne(
        { _id: product._id },
        { $set: { images: [imageUrl] } }
      )
      
      if (result.modifiedCount > 0) {
        updatedCount++
        console.log(`✅ Added image to product: ${product.name}`)
      }
    }
    
    return Response.json({ 
      success: true,
      message: `Updated ${updatedCount} products with sample images`,
      productsFound: productsWithoutImages.length,
      productsUpdated: updatedCount
    })
  } catch (error) {
    console.error('Fix images error:', error)
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}
