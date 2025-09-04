import connectDB from "../../../../lib/mongodb"
import Cart from "../../../../lib/models/Cart"
import CartItem from "../../../../lib/models/CartItem"
import Product from "../../../../lib/models/Product"
import ProductOption from "../../../../lib/models/ProductOption"
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route'
import { getAuthUser } from '../../../../lib/auth'
import User from '../../../../lib/models/User'

// Helper function to get authenticated user from either NextAuth or custom auth
async function getAuthenticatedUser(request) {
  try {
    // Try NextAuth session first
    const session = await getServerSession(authOptions)
    if (session?.user?.id) {
      return {
        success: true,
        userId: session.user.id,
        user: session.user,
        method: 'nextauth'
      }
    }
    
    // Try custom auth token
    const authUser = await getAuthUser(request)
    if (authUser?.userId) {
      await connectDB()
      const user = await User.findById(authUser.userId)
      if (user) {
        return {
          success: true,
          userId: authUser.userId,
          user: {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role
          },
          method: 'custom'
        }
      }
    }
    
    return {
      success: false,
      error: 'Unauthorized'
    }
  } catch (error) {
    console.error('Authentication error:', error)
    return {
      success: false,
      error: 'Authentication failed'
    }
  }
}

export async function GET(request) {
  try {
    const auth = await getAuthenticatedUser(request)
    if (!auth.success) {
      return Response.json({ error: auth.error }, { status: 401 })
    }

    await connectDB()
    
    // Get all cart items for the user
    const cartItems = await CartItem.find({ userId: auth.userId })
    
    console.log(`🔄 Found ${cartItems.length} cart items to refresh`)
    
    let refreshedCount = 0
    
    for (const cartItem of cartItems) {
      let updated = false
      
      if (cartItem.itemType === 'product' && cartItem.product) {
        // Refresh product snapshot with latest product data
        const product = await Product.findById(cartItem.product)
        if (product && product.images && product.images.length > 0) {
          cartItem.productSnapshot = {
            name: product.name,
            image: product.images[0],
            slug: product.slug
          }
          updated = true
          console.log(`✅ Updated product snapshot for: ${product.name}`)
        }
      } else if (cartItem.itemType === 'productOption' && cartItem.productOption) {
        // Refresh product option snapshot
        const productOption = await ProductOption.findById(cartItem.productOption).populate('productId')
        if (productOption) {
          const optionImage = productOption.images?.[0] || productOption.productId?.images?.[0]
          cartItem.productSnapshot = {
            name: productOption.productId.name,
            image: optionImage || '',
            size: productOption.size,
            color: productOption.color,
            parentProductId: productOption.productId._id
          }
          updated = true
          console.log(`✅ Updated option snapshot for: ${productOption.productId.name}`)
        }
      }
      
      if (updated) {
        await cartItem.save()
        refreshedCount++
      }
    }
    
    console.log(`🎉 Refreshed ${refreshedCount} cart items`)
    
    return Response.json({ 
      success: true,
      message: `Refreshed ${refreshedCount} cart items with updated images`,
      cartItemsFound: cartItems.length,
      cartItemsRefreshed: refreshedCount
    })
  } catch (error) {
    console.error('Refresh cart error:', error)
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}
