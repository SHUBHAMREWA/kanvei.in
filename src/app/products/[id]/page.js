import { notFound } from 'next/navigation'
import ProductDetailClient from '../../../components/ProductDetailClient'
import connectDB from '../../../lib/mongodb'
import Product from '../../../lib/models/Product'
import ProductImage from '../../../lib/models/ProductImage'
import ProductAttribute from '../../../lib/models/ProductAttribute'
import ProductOption from '../../../lib/models/ProductOption'
import OptionImage from '../../../lib/models/OptionImage'
import ProductView from '../../../lib/models/ProductView'

// Server-side function to fetch complete product data
async function getProduct(slug) {
  try {
    await connectDB()
    
    // Try to find by slug first, then by ID if slug fails
    let product = await Product.findOne({ slug }).populate('categoryId', 'name slug').lean()
    
    // If not found by slug, try by ID
    if (!product && slug.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(slug).populate('categoryId', 'name slug').lean()
    }
    
    if (!product) {
      return null
    }

    // Get product images
    const productImages = await ProductImage.findOne({ productId: product._id }).lean()
    
    // Get product attributes
    const productAttributes = await ProductAttribute.find({ productId: product._id }).lean()
    
    // Get product options
    const productOptions = await ProductOption.find({ productId: product._id }).lean()
    
    // Get option images for each option
    const optionsWithImages = await Promise.all(
      productOptions.map(async (option) => {
        const optionImages = await OptionImage.findOne({ optionId: option._id }).lean()
        return {
          ...option,
          images: optionImages ? optionImages.img : []
        }
      })
    )
    
    // Get product views
    const productViews = await ProductView.findOne({ productId: product._id }).lean()
    
    // Increment view count
    if (productViews) {
      await ProductView.findOneAndUpdate(
        { productId: product._id },
        { $inc: { views: 1 } }
      )
    } else {
      await ProductView.create({ productId: product._id, views: 1 })
    }
    
    return {
      ...product,
      _id: product._id.toString(),
      categoryId: product.categoryId ? {
        ...product.categoryId,
        _id: product.categoryId._id.toString()
      } : null,
      images: productImages ? productImages.img : [],
      attributes: productAttributes.map(attr => ({
        ...attr,
        _id: attr._id.toString(),
        productId: attr.productId.toString()
      })) || [],
      options: optionsWithImages.map(opt => ({
        ...opt,
        _id: opt._id.toString(),
        productId: opt.productId.toString()
      })) || [],
      views: productViews ? productViews.views + 1 : 1,
      category: product.categoryId?.name || '',
      categorySlug: product.categoryId?.slug || ''
    }
  } catch (error) {
    console.error('Error fetching product:', error)
    return null
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }) {
  const product = await getProduct(params.id)
  
  if (!product) {
    return {
      title: 'Product Not Found - Kanvei',
      description: 'The product you are looking for is not available.',
    }
  }

  const title = product.title || product.name
  const description = product.description || `${product.name} - Premium quality product available at Kanvei. ${product.brand ? `Brand: ${product.brand}. ` : ''}Price: ₹${product.price}.`
  const imageUrl = product.images && product.images[0] ? product.images[0] : '/placeholder.svg'
  
  return {
    title: `${title} - Kanvei`,
    description: description.length > 160 ? description.substring(0, 157) + '...' : description,
    keywords: [
      product.name,
      product.brand,
      product.category,
      'Kanvei',
      'premium products',
      'online shopping',
      ...(product.attributes?.map(attr => attr.name) || [])
    ].filter(Boolean).join(', '),
    
    openGraph: {
      title: `${title} - Kanvei`,
      description: description.length > 200 ? description.substring(0, 197) + '...' : description,
      images: [
        {
          url: imageUrl,
          width: 800,
          height: 800,
          alt: product.name,
        },
      ],
      type: 'website',
      siteName: 'Kanvei',
    },
    
    twitter: {
      card: 'summary_large_image',
      title: `${title} - Kanvei`,
      description: description.length > 200 ? description.substring(0, 197) + '...' : description,
      images: [imageUrl],
    },
    
    // Additional SEO meta tags
    other: {
      'product:price:amount': product.price,
      'product:price:currency': 'INR',
      'product:availability': product.stock > 0 ? 'in stock' : 'out of stock',
      'product:condition': 'new',
      'product:brand': product.brand || 'Kanvei',
      'product:category': product.category,
    },
  }
}

// Generate static params for better SEO (optional - for static generation)
export async function generateStaticParams() {
  try {
    await connectDB()
    const products = await Product.find({ slug: { $exists: true, $ne: null } })
      .select('slug')
      .limit(100) // Limit for initial static generation
      .lean()
    
    return products.map((product) => ({
      id: product.slug,
    }))
  } catch (error) {
    console.error('Error generating static params:', error)
    return []
  }
}

// Main server component
export default async function ProductPage({ params }) {
  const product = await getProduct(params.id)
  
  if (!product) {
    notFound()
  }
  
  return <ProductDetailClient product={product} />
}
