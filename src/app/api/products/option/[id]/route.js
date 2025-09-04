import connectDB from "../../../../../lib/mongodb"
import ProductOption from "../../../../../lib/models/ProductOption"
import OptionImage from "../../../../../lib/models/OptionImage"

export async function GET(request, { params }) {
  try {
    await connectDB()
    
    const { id } = await params
    
    // Fetch option details
    const option = await ProductOption.findById(id).lean()
    
    if (!option) {
      return Response.json({ success: false, error: "Product option not found" }, { status: 404 })
    }

    // Fetch option images
    const optionImages = await OptionImage.find({ optionId: id }).lean()
    
    // Combine images from OptionImage collection
    const allOptionImages = optionImages.flatMap(img => img.img || [])

    // Prepare the response
    const optionDetail = {
      ...option,
      images: allOptionImages
    }

    return Response.json({ 
      success: true, 
      option: optionDetail
    })

  } catch (error) {
    console.error('Product option fetch error:', error)
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}
