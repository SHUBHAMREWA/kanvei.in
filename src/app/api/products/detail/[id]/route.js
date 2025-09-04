import connectDB from "../../../../../lib/mongodb"
import Product from "../../../../../lib/models/Product"
import ProductAttribute from "../../../../../lib/models/ProductAttribute"
import ProductOption from "../../../../../lib/models/ProductOption"
import ProductImage from "../../../../../lib/models/ProductImage"
import OptionImage from "../../../../../lib/models/OptionImage"
import ProductView from "../../../../../lib/models/ProductView"

export async function GET(request, { params }) {
  try {
    await connectDB()
    
    const { id } = await params
    
    // Check if id is slug or ObjectId
    let product
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      // It's an ObjectId
      product = await Product.findById(id).lean()
    } else {
      // It's a slug
      product = await Product.findOne({ slug: id }).lean()
    }
    
    if (!product) {
      return Response.json({ success: false, error: "Product not found" }, { status: 404 })
    }

    const productId = product._id

    // Fetch all related data in parallel for better performance
    const [
      productImages,
      productAttributes,
      productOptions,
      productView
             ]                                = await Promise.all([
                                                      ProductImage.find({ productId }).lean(),
                                                      ProductAttribute.find({ productId }).lean(),
                                                      ProductOption.find({ productId }).lean(),
                                                      ProductView.findOne({ productId }).lean()
                                                    ])

    // Get option IDs for fetching option images
    const optionIds = productOptions.map(opt => opt._id)
    
    // Fetch option images if there are options
    let optionImages = []
    if (optionIds.length > 0) {
      optionImages = await OptionImage.find({ optionId: { $in: optionIds } }).lean()
    }

    // Create a map of option images grouped by optionId
    const optionImagesMap = {}
    optionImages.forEach(optImg => {
      if (!optionImagesMap[optImg.optionId]) {
        optionImagesMap[optImg.optionId] = []
      }
      if (Array.isArray(optImg.img)) {
        optionImagesMap[optImg.optionId].push(...optImg.img)
      }
    })

    // Add images to each option
    const optionsWithImages = productOptions.map(option => ({
      ...option,
      images: optionImagesMap[option._id] || []
    }))

    // Increment view count (upsert)
    await ProductView.findOneAndUpdate(
      { productId },
      { $inc: { views: 1 } },
      { upsert: true, new: true }
    )

    // Combine all product images (main + ProductImage collection)
    const allProductImages = [
      ...(product.images || []),
      ...productImages.flatMap(img => img.img || [])
    ]

    // Prepare the response
    const productDetail = {
      ...product,
      images: allProductImages,
      attributes: productAttributes,
      options: optionsWithImages,
      views: (productView?.views || 0) + 1 // Add the incremented view
    }

    return Response.json({ 
      success: true, 
      product: productDetail,
      totalImages: allProductImages.length,
      totalOptions: optionsWithImages.length,
      totalAttributes: productAttributes.length
    })

  } catch (error) {
    console.error('Product detail fetch error:', error)
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}
