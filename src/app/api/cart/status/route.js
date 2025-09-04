import { NextResponse } from 'next/server'
import connectDB from '../../../../lib/mongodb'
import CartItem from '../../../../lib/models/CartItem'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route'

// GET - Check cart status for multiple items
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const productIds = searchParams.get('productIds')?.split(',') || []
    const productOptionIds = searchParams.get('productOptionIds')?.split(',') || []

    if (productIds.length === 0 && productOptionIds.length === 0) {
      return NextResponse.json({ 
        cartStatus: {},
        message: 'No items to check'
      })
    }

    await connectDB()

    // Find cart items for user
    const cartItems = await CartItem.find({ userId: session.user.id })
    
    const cartStatus = {}

    // Check product items
    productIds.forEach(productId => {
      const cartItem = cartItems.find(item => 
        item.product?.toString() === productId && item.itemType === 'product'
      )
      cartStatus[`product_${productId}`] = {
        inCart: !!cartItem,
        quantity: cartItem?.quantity || 0,
        cartItemId: cartItem?._id
      }
    })

    // Check product option items
    productOptionIds.forEach(productOptionId => {
      const cartItem = cartItems.find(item => 
        item.productOption?.toString() === productOptionId && item.itemType === 'productOption'
      )
      cartStatus[`productOption_${productOptionId}`] = {
        inCart: !!cartItem,
        quantity: cartItem?.quantity || 0,
        cartItemId: cartItem?._id
      }
    })

    return NextResponse.json({ cartStatus })
  } catch (error) {
    console.error('Error checking cart status:', error)
    return NextResponse.json(
      { error: 'Failed to check cart status' },
      { status: 500 }
    )
  }
}
