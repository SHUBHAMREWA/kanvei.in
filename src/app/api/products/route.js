import connectDB from "../../../lib/mongodb"
import Product from "../../../lib/models/Product"
import ProductAttribute from "../../../lib/models/ProductAttribute"
import ProductImage from "../../../lib/models/ProductImage"
import ProductOption from "../../../lib/models/ProductOption"
import OptionImage from "../../../lib/models/OptionImage"
import ProductView from "../../../lib/models/ProductView"
import User from "../../../lib/models/User"
import { getAuthUser } from "../../../lib/auth"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/route"

export async function GET(request) {
  try {
    // Ensure database connection with retry logic
    let connectionAttempts = 0
    const maxAttempts = 3
    
    while (connectionAttempts < maxAttempts) {
      try {
        await connectDB()
        break
      } catch (dbError) {
        connectionAttempts++
        console.error(`Database connection attempt ${connectionAttempts} failed:`, dbError)
        
        if (connectionAttempts >= maxAttempts) {
          throw new Error(`Failed to connect to database after ${maxAttempts} attempts`)
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const subcategory = searchParams.get("subcategory")
    const featured = searchParams.get("featured")
    const search = searchParams.get("search")
    const priceMin = searchParams.get("priceMin")
    const priceMax = searchParams.get("priceMax")
    const inStock = searchParams.get("inStock")
    const sortBy = searchParams.get("sortBy") || "name"
    const page = parseInt(searchParams.get("page")) || 1
    const limit = parseInt(searchParams.get("limit")) || 10 // Default to 10 for filtering, 0 for no filters
    const skip = (page - 1) * limit

    const filter = {}
    
    // Check if any filters are applied
    const hasFilters = search || priceMin || priceMax || inStock === 'true'
    
    console.log('🔍 API Filter Parameters:', {
      category,
      subcategory,
      search,
      priceMin,
      priceMax,
      inStock,
      sortBy,
      page,
      limit,
      hasFilters
    })
    
    // Filter by category name if provided (supports hierarchical categories)
    if (category) {
      const Category = (await import("../../../lib/models/Category")).default
      
      // Find the main category by name (case insensitive)
      const categoryDoc = await Category.findOne({ 
        name: { $regex: new RegExp(`^${category}$`, 'i') } 
      }).lean()
      
      if (categoryDoc) {
        // Find all child categories of this parent category
        const childCategories = await Category.find({ 
          parentCategory: categoryDoc._id 
        }).lean()
        
        // Create array of category IDs to include (parent + all children)
        const categoryIds = [categoryDoc._id]
        childCategories.forEach(child => {
          categoryIds.push(child._id)
        })
        
        console.log(`🔍 Category Filter: ${category}`, {
          mainCategoryId: categoryDoc._id,
          childCategoryIds: childCategories.map(c => c._id),
          totalCategoriesIncluded: categoryIds.length
        })
        
        // If subcategory is specified, only include that specific subcategory
        if (subcategory) {
          const subcategoryDoc = childCategories.find(child => 
            child.name.toLowerCase().includes(subcategory.toLowerCase()) ||
            child.slug === subcategory
          )
          
          if (subcategoryDoc) {
            console.log(`🎨 Subcategory Filter: ${subcategory} (${subcategoryDoc.name})`)
            filter.categoryId = subcategoryDoc._id
          } else {
            console.log(`❌ Subcategory '${subcategory}' not found under '${category}'`)
            return Response.json({ 
              success: true, 
              products: [], 
              pagination: {
                currentPage: 1,
                totalPages: 0,
                totalCount: 0,
                hasMore: false,
                limit: 0
              }
            })
          }
        } else {
          // Filter products that belong to parent category OR any child category
          filter.categoryId = { $in: categoryIds }
        }
      } else {
        // If category not found, return empty results
        console.log(`❌ Category '${category}' not found in database`)
        return Response.json({ 
          success: true, 
          products: [], 
          pagination: {
            currentPage: 1,
            totalPages: 0,
            totalCount: 0,
            hasMore: false,
            limit: 0
          }
        })
      }
    }
    
    if (featured) filter.featured = featured === "true"
    
    // Apply search filter
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } }
      ]
      console.log(`🔍 Search Filter: "${search}"`)
    }
    
    // Apply price range filters
    if (priceMin || priceMax) {
      filter.price = {}
      if (priceMin) {
        filter.price.$gte = parseInt(priceMin)
        console.log(`💰 Min Price Filter: ≥₹${priceMin}`)
      }
      if (priceMax && priceMax !== '10000') {
        filter.price.$lte = parseInt(priceMax)
        console.log(`💰 Max Price Filter: ≤₹${priceMax}`)
      }
    }
    
    // Apply stock filter
    if (inStock === 'true') {
      filter.stock = { $gt: 0 }
      console.log('📦 Stock Filter: In stock only')
    }
    
    console.log('🎯 Final MongoDB Filter:', JSON.stringify(filter, null, 2))

    // Get total count for pagination
    const totalCount = await Product.countDocuments(filter)
    
    // Build sort options
    let sortOptions = {}
    switch (sortBy) {
      case 'price-low':
        sortOptions = { price: 1 }
        break
      case 'price-high':
        sortOptions = { price: -1 }
        break
      case 'name':
        sortOptions = { name: 1 }
        break
      case 'newest':
        sortOptions = { createdAt: -1 }
        break
      default:
        sortOptions = { name: 1 }
    }
    console.log(`🔄 Sort Options: ${JSON.stringify(sortOptions)}`)

    // Build query with pagination and sorting
    let query = Product.find(filter)
      .populate('categoryId', 'name slug')
      .sort(sortOptions)
    
    if (limit > 0) {
      query = query.skip(skip).limit(limit)
    }
    const productsFromDB = await query.lean()

    // For each product, fetch its images from the ProductImage collection
    const products = await Promise.all(
      productsFromDB.map(async (product) => {
        const productImages = await ProductImage.findOne({ productId: product._id }).lean()
        return {
          ...product,
          images: productImages ? productImages.img : [],
          category: product.categoryId?.name || '',
          categorySlug: product.categoryId?.slug || ''
        }
      })
    )

    // Calculate pagination metadata
    const hasMore = limit > 0 ? (skip + limit) < totalCount : false
    const currentPage = page
    const totalPages = limit > 0 ? Math.ceil(totalCount / limit) : 1

    return Response.json({ 
      success: true, 
      products: products || [], 
      pagination: {
        currentPage,
        totalPages,
        totalCount: totalCount || 0,
        hasMore: hasMore || false,
        limit
      }
    })
  } catch (error) {
    console.error('Products API Error:', error)
    return Response.json({ 
      success: false, 
      error: error.message || 'Failed to fetch products',
      products: [],
      pagination: {
        currentPage: 1,
        totalPages: 0,
        totalCount: 0,
        hasMore: false,
        limit: 0
      }
    }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    await connectDB()
    const session = await getServerSession(authOptions)
    let isAdmin = Boolean(session && session.user?.role === "admin")

    if (!isAdmin) {
      const authUser = await getAuthUser(request)
      if (authUser?.userId) {
        const dbUser = await User.findById(authUser.userId)
        if (dbUser && dbUser.role === "admin") {
          isAdmin = true
        }
      }
    }

    if (!isAdmin) {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    // Create base product
    const product = await Product.create({
      name: body.name,
      title: body.title,
      description: body.description,
      brand: body.brand,
      slug: body.slug,
      weight: body.weight,
      height: body.height,
      width: body.width,
      mrp: body.mrp,
      price: body.price,
      categoryId: body.categoryId,
      stock: body.stock,
      featured: body.featured,
    })

    // Product images
    if (Array.isArray(body.images) && body.images.length) {
      await ProductImage.create({ img: body.images, productId: product._id })
    }

    // Attributes
    if (Array.isArray(body.attributes)) {
      const attrs = body.attributes
        .filter((a) => a && (a.name || a.type))
        .map((a) => ({ name: a.name || "", type: a.type || "", productId: product._id }))
      if (attrs.length) await ProductAttribute.insertMany(attrs)
    }

    // Options and their images
    if (Array.isArray(body.options)) {
      for (const opt of body.options) {
        const createdOpt = await ProductOption.create({
          productId: product._id,
          size: opt.size,
          price: opt.price,
          mrp: opt.mrp,
          color: opt.color,
          stock: opt.stock,
        })
        if (Array.isArray(opt.images) && opt.images.length) {
          await OptionImage.create({ img: opt.images, optionId: createdOpt._id })
        }
      }
    }

    // Initialize views row
    await ProductView.create({ productId: product._id, views: 0 })

    return Response.json({ success: true, productId: product._id })
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}
