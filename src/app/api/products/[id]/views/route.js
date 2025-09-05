import connectDB from "../../../../../lib/mongodb"
import Product from "../../../../../lib/models/Product"
import ProductView from "../../../../../lib/models/ProductView"
import Category from "../../../../../lib/models/Category"

export async function POST(request, { params }) {
  try {
    await connectDB()
    
    const { id: productSlugOrId } = await params
    
    if (!productSlugOrId) {
      return Response.json({ success: false, error: "Product ID or slug is required" }, { status: 400 })
    }

    // Find product by slug or ID
    let product
    if (productSlugOrId.match(/^[0-9a-fA-F]{24}$/)) {
      // If it looks like an ObjectId, search by ID
      product = await Product.findById(productSlugOrId).lean()
    } else {
      // Otherwise, search by slug
      product = await Product.findOne({ slug: productSlugOrId }).lean()
    }

    if (!product) {
      return Response.json({ success: false, error: "Product not found" }, { status: 404 })
    }

    // Increment view count with error handling
    try {
      const existingView = await ProductView.findOne({ productId: product._id }).lean()
      
      if (existingView) {
        await ProductView.findOneAndUpdate(
          { productId: product._id },
          { $inc: { views: 1 } },
          { new: true }
        )
      } else {
        // Create new view record if it doesn't exist
        await ProductView.create({ 
          productId: product._id, 
          views: 1 
        })
      }

      // Get updated view count
      const updatedView = await ProductView.findOne({ productId: product._id }).lean()
      const newViewCount = updatedView ? updatedView.views : 1

      return Response.json({ 
        success: true, 
        views: newViewCount,
        message: "View count incremented successfully"
      })

    } catch (viewError) {
      // Log the error but don't fail the request
      console.error('Error incrementing view count:', viewError)
      
      // Try to get current view count even if increment failed
      try {
        const currentView = await ProductView.findOne({ productId: product._id }).lean()
        return Response.json({ 
          success: true, 
          views: currentView ? currentView.views : 0,
          warning: "View increment may have failed, returning current count"
        })
      } catch (getCurrentError) {
        console.error('Error getting current view count:', getCurrentError)
        return Response.json({ 
          success: true, 
          views: 0,
          warning: "Could not retrieve current view count"
        })
      }
    }

  } catch (error) {
    console.error('Error in view increment API:', error)
    return Response.json({ 
      success: false, 
      error: "Internal server error",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}

// GET method to retrieve current view count
export async function GET(request, { params }) {
  try {
    await connectDB()
    
    const { id: productSlugOrId } = await params
    
    if (!productSlugOrId) {
      return Response.json({ success: false, error: "Product ID or slug is required" }, { status: 400 })
    }

    // Find product by slug or ID
    let product
    if (productSlugOrId.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(productSlugOrId).lean()
    } else {
      product = await Product.findOne({ slug: productSlugOrId }).lean()
    }

    if (!product) {
      return Response.json({ success: false, error: "Product not found" }, { status: 404 })
    }

    // Get current view count
    const productView = await ProductView.findOne({ productId: product._id }).lean()
    const viewCount = productView ? productView.views : 0

    return Response.json({ 
      success: true, 
      views: viewCount,
      productId: product._id
    })

  } catch (error) {
    console.error('Error getting view count:', error)
    return Response.json({ 
      success: false, 
      error: "Internal server error",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}
