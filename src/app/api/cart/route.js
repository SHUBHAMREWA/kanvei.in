import { NextResponse } from 'next/server'
import connectDB from '../../../lib/mongodb'
import Cart from '../../../lib/models/Cart'
import CartItem from '../../../lib/models/CartItem'
import Product from '../../../lib/models/Product'
import ProductOption from '../../../lib/models/ProductOption'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]/route'
import { getAuthUser } from '../../../lib/auth'
import User from '../../../lib/models/User'

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

// GET - Fetch user's cart
export async function GET(request) {
  try {
    const auth = await getAuthenticatedUser(request)
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: 401 })
    }

    await connectDB()
    
    const cart = await Cart.findByUserId(auth.userId)
    
    if (!cart) {
      return NextResponse.json({ 
        cart: { items: [], totalItems: 0, totalAmount: 0 } 
      })
    }

    // Format cart items for frontend display
    const formattedItems = cart.items.map(item => {
      let formattedItem = {
        _id: item._id,
        quantity: item.quantity,
        price: item.price,
        addedAt: item.addedAt,
        itemType: item.itemType
      }

      if (item.itemType === 'product' && item.product) {
        // Main product
        // Use actual product images - first image from product.images array
        const productImages = item.product.images || []
        const snapshotImage = item.productSnapshot?.image || ''
        
        // Priority: product images -> snapshot image -> no image (will show "No Image" placeholder)
        const imageUrl = productImages[0] || snapshotImage
        
        console.log('🖼️ MAIN PRODUCT DEBUG:', {
          productId: item.product._id,
          productName: item.product.name,
          
          // Product images debugging
          productImagesRaw: item.product.images,
          productImagesType: typeof item.product.images,
          productImagesIsArray: Array.isArray(item.product.images),
          productImagesLength: item.product.images ? item.product.images.length : 'NULL',
          productImagesArray: productImages,
          firstImage: productImages[0],
          firstImageType: typeof productImages[0],
          
          // Snapshot debugging
          snapshotRaw: item.productSnapshot,
          snapshotImage: snapshotImage,
          snapshotImageType: typeof snapshotImage,
          
          // Final result
          finalImageUrl: imageUrl,
          finalImageType: typeof imageUrl,
          hasImage: !!imageUrl,
          imageLength: imageUrl ? imageUrl.length : 'NULL',
          imageStartsWith: imageUrl ? imageUrl.substring(0, 50) + '...' : 'NULL'
        })
        
        formattedItem = {
          ...formattedItem,
          name: item.product.name,
          image: imageUrl,
          slug: item.product.slug,
          stock: item.product.stock,
          mrp: item.product.mrp,
          isOption: false,
          // Include product reference for order creation
          product: {
            _id: item.product._id,
            name: item.product.name,
            slug: item.product.slug
          }
        }
      } else if (item.itemType === 'productOption' && item.productOption) {
        // Product option - use main product name with option details
        const mainProductName = item.productOption.productId?.name || item.productSnapshot?.name
        const optionDetails = [item.productOption.size, item.productOption.color].filter(Boolean).join(' - ')
        
        formattedItem = {
          ...formattedItem,
          name: optionDetails ? `${mainProductName} - ${optionDetails}` : mainProductName,
          image: item.productOption.images?.[0] || item.productOption.productId?.images?.[0] || item.productSnapshot?.image,
          slug: item.productOption.productId?.slug,
          stock: item.productOption.stock,
          isOption: true,
          size: item.productOption.size,
          color: item.productOption.color,
          mrp: item.productOption.mrp,
          productOptionId: item.productOption._id,
          // Include product reference for order creation
          productOption: {
            _id: item.productOption._id,
            productId: item.productOption.productId?._id
          }
        }
      }

      return formattedItem
    })

    const formattedCart = {
      items: formattedItems,
      totalItems: cart.totalItems,
      totalAmount: cart.totalAmount
    }

    return NextResponse.json({ cart: formattedCart })
  } catch (error) {
    console.error('Error fetching cart:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cart' },
      { status: 500 }
    )
  }
}

// POST - Add item to cart
export async function POST(request) {
  try {
    const auth = await getAuthenticatedUser(request)
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: 401 })
    }

    const { productId, productOptionId, quantity = 1 } = await request.json()

    if (!productId && !productOptionId) {
      return NextResponse.json(
        { error: 'Product ID or Product Option ID is required' },
        { status: 400 }
      )
    }

    await connectDB()

    let item, itemType, price, stock, productSnapshot

    if (productOptionId) {
      // Adding product option to cart
      const productOption = await ProductOption.findById(productOptionId).populate('productId')
      if (!productOption) {
        return NextResponse.json({ error: 'Product option not found' }, { status: 404 })
      }

      item = productOption
      itemType = 'productOption'
      price = productOption.price
      stock = productOption.stock
      
      productSnapshot = {
        name: productOption.productId.name,
        image: productOption.productId.images?.[0] || '',
        size: productOption.size,
        color: productOption.color,
        parentProductId: productOption.productId._id
      }
    } else {
      // Adding regular product to cart
      const product = await Product.findById(productId)
      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 })
      }

      item = product
      itemType = 'product'
      price = product.price
      stock = product.stock
      
      productSnapshot = {
        name: product.name,
        image: product.images?.[0] || '',
        slug: product.slug
      }
    }

    // Check stock availability
    if (stock < quantity) {
      return NextResponse.json(
        { error: `Only ${stock} items available in stock` },
        { status: 400 }
      )
    }

    // Check if item already exists in cart
    const existingCartItem = await CartItem.findCartItem(
      auth.userId,
      productId || productOptionId,
      itemType
    )

    if (existingCartItem) {
      // Check if adding more would exceed stock
      const newQuantity = existingCartItem.quantity + quantity
      if (stock < newQuantity) {
        return NextResponse.json(
          { 
            error: `Cannot add ${quantity} more. Only ${stock - existingCartItem.quantity} items available.`,
            currentInCart: existingCartItem.quantity,
            maxAvailable: stock
          },
          { status: 400 }
        )
      }

      // Update existing cart item
      existingCartItem.quantity = newQuantity
      existingCartItem.addedAt = new Date()
      await existingCartItem.save()
      
      // Get or create cart and add reference
      const cart = await Cart.getOrCreateCart(auth.userId)
      await cart.addCartItem(existingCartItem._id)
      
      const populatedCart = await Cart.findByUserId(auth.userId)
      
      // Format the cart before returning
      const formattedItems = populatedCart.items.map(item => {
        let formattedItem = {
          _id: item._id,
          quantity: item.quantity,
          price: item.price,
          addedAt: item.addedAt,
          itemType: item.itemType
        }

        if (item.itemType === 'product' && item.product) {
          formattedItem = {
            ...formattedItem,
            name: item.product.name,
            image: item.product.images?.[0] || item.productSnapshot?.image,
            slug: item.product.slug,
            stock: item.product.stock,
            mrp: item.product.mrp,
            isOption: false,
            // Include product reference for order creation
            product: {
              _id: item.product._id,
              name: item.product.name,
              slug: item.product.slug
            }
          }
        } else if (item.itemType === 'productOption' && item.productOption) {
          const mainProductName = item.productOption.productId?.name || item.productSnapshot?.name
          const optionDetails = [item.productOption.size, item.productOption.color].filter(Boolean).join(' - ')
          
          formattedItem = {
            ...formattedItem,
            name: optionDetails ? `${mainProductName} - ${optionDetails}` : mainProductName,
            image: item.productOption.images?.[0] || item.productOption.productId?.images?.[0] || item.productSnapshot?.image,
            slug: item.productOption.productId?.slug,
            stock: item.productOption.stock,
            isOption: true,
            size: item.productOption.size,
            color: item.productOption.color,
            mrp: item.productOption.mrp,
            productOptionId: item.productOption._id,
            // Include product reference for order creation
            productOption: {
              _id: item.productOption._id,
              productId: item.productOption.productId?._id
            }
          }
        }

        return formattedItem
      })

      const formattedCart = {
        items: formattedItems,
        totalItems: populatedCart.totalItems,
        totalAmount: populatedCart.totalAmount
      }

      return NextResponse.json({
        message: `Updated quantity to ${newQuantity}`,
        cart: formattedCart,
        updated: true
      })
    } else {
      // Create new cart item
      const newCartItem = new CartItem({
        userId: auth.userId,
        [itemType === 'product' ? 'product' : 'productOption']: productId || productOptionId,
        quantity,
        price,
        productSnapshot,
        itemType
      })

      await newCartItem.save()
      
      // Get or create cart and add reference
      const cart = await Cart.getOrCreateCart(auth.userId)
      await cart.addCartItem(newCartItem._id)
      
      const populatedCart = await Cart.findByUserId(auth.userId)
      
      // Format the cart before returning
      const formattedItems = populatedCart.items.map(item => {
        let formattedItem = {
          _id: item._id,
          quantity: item.quantity,
          price: item.price,
          addedAt: item.addedAt,
          itemType: item.itemType
        }

        if (item.itemType === 'product' && item.product) {
          formattedItem = {
            ...formattedItem,
            name: item.product.name,
            image: item.product.images?.[0] || item.productSnapshot?.image,
            slug: item.product.slug,
            stock: item.product.stock,
            mrp: item.product.mrp,
            isOption: false
          }
        } else if (item.itemType === 'productOption' && item.productOption) {
          const mainProductName = item.productOption.productId?.name || item.productSnapshot?.name
          const optionDetails = [item.productOption.size, item.productOption.color].filter(Boolean).join(' - ')
          
          formattedItem = {
            ...formattedItem,
            name: optionDetails ? `${mainProductName} - ${optionDetails}` : mainProductName,
            image: item.productOption.images?.[0] || item.productOption.productId?.images?.[0] || item.productSnapshot?.image,
            slug: item.productOption.productId?.slug,
            stock: item.productOption.stock,
            isOption: true,
            size: item.productOption.size,
            color: item.productOption.color,
            mrp: item.productOption.mrp,
            productOptionId: item.productOption._id
          }
        }

        return formattedItem
      })

      const formattedCart = {
        items: formattedItems,
        totalItems: populatedCart.totalItems,
        totalAmount: populatedCart.totalAmount
      }

      return NextResponse.json({
        message: 'Item added to cart successfully',
        cart: formattedCart,
        added: true
      })
    }
  } catch (error) {
    console.error('Error adding to cart:', error)
    return NextResponse.json(
      { error: 'Failed to add item to cart' },
      { status: 500 }
    )
  }
}

// PUT - Update cart item quantity
export async function PUT(request) {
  try {
    console.log('🔄 PUT /api/cart - Starting cart update')
    
    const auth = await getAuthenticatedUser(request)
    if (!auth.success) {
      console.log('❌ Authentication failed:', auth.error)
      return NextResponse.json({ error: auth.error }, { status: 401 })
    }
    console.log('✅ Authenticated user:', auth.userId)

    const body = await request.json()
    console.log('📝 Request body:', body)
    const { cartItemId, quantity } = body

    if (!cartItemId || quantity === null || quantity === undefined || quantity < 0) {
      console.log('❌ Invalid parameters:', { cartItemId, quantity, type: typeof quantity })
      return NextResponse.json(
        { error: 'Invalid cart item ID or quantity' },
        { status: 400 }
      )
    }

    await connectDB()
    console.log('✅ Database connected')

    // Find the cart item
    console.log('🔍 Looking for cart item:', cartItemId)
    const cartItem = await CartItem.findById(cartItemId)
    console.log('🎯 Found cart item:', cartItem ? 'YES' : 'NO')
    
    if (!cartItem) {
      console.log('❌ Cart item not found in database')
      return NextResponse.json(
        { error: 'Cart item not found' },
        { status: 404 }
      )
    }
    
    if (cartItem.userId.toString() !== auth.userId) {
      console.log('❌ Cart item belongs to different user:', {
        cartItemUserId: cartItem.userId.toString(),
        authUserId: auth.userId
      })
      return NextResponse.json(
        { error: 'Cart item not found' },
        { status: 404 }
      )
    }
    
    console.log('✅ Cart item verified, current quantity:', cartItem.quantity)

    if (quantity === 0) {
      console.log('🗑️ Removing cart item (quantity = 0)')
      // Remove cart item
      const cart = await Cart.findOne({ userId: auth.userId })
      if (cart) {
        await cart.removeCartItem(cartItemId)
        console.log('✅ Removed from cart')
      }
      await CartItem.findByIdAndDelete(cartItemId)
      console.log('✅ Deleted cart item')
    } else {
      console.log('📦 Updating quantity to:', quantity)
      // Update quantity - first verify stock
      let item, stock
      if (cartItem.itemType === 'product') {
        console.log('📦 Item type: product')
        item = await Product.findById(cartItem.product)
        stock = item?.stock || 0
      } else {
        console.log('🔧 Item type: productOption')
        item = await ProductOption.findById(cartItem.productOption)
        stock = item?.stock || 0
      }
      
      console.log('📊 Stock check:', { available: stock, requested: quantity })

      if (!item) {
        console.log('❌ Referenced item not found in database')
        return NextResponse.json(
          { error: 'Referenced item not found' },
          { status: 404 }
        )
      }

      if (stock < quantity) {
        console.log('❌ Insufficient stock:', { stock, quantity })
        return NextResponse.json(
          { error: `Only ${stock} items available in stock` },
          { status: 400 }
        )
      }

      console.log('💾 Updating cart item...')
      // Update cart item quantity
      cartItem.quantity = quantity
      cartItem.addedAt = new Date()
      await cartItem.save()
      console.log('✅ Cart item saved')
      
      // Update cart totals
      const cart = await Cart.findOne({ userId: auth.userId })
      if (cart) {
        console.log('🧮 Recalculating cart totals...')
        await cart.calculateTotals()
        console.log('✅ Cart totals updated')
      } else {
        console.log('⚠️ Cart not found for totals calculation')
      }
    }

    console.log('📋 Fetching updated cart...')
    // Get updated cart
    const updatedCart = await Cart.findByUserId(auth.userId)
    console.log('📦 Updated cart:', updatedCart ? 'Found' : 'Not found')
    
    return NextResponse.json({ 
      message: 'Cart updated successfully',
      cart: updatedCart
    })
  } catch (error) {
    console.error('Error updating cart:', error)
    return NextResponse.json(
      { error: 'Failed to update cart' },
      { status: 500 }
    )
  }
}

// DELETE - Remove item from cart or clear cart
export async function DELETE(request) {
  try {
    const auth = await getAuthenticatedUser(request)
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const cartItemId = searchParams.get('cartItemId')
    const clearAll = searchParams.get('clearAll') === 'true'

    await connectDB()

    const cart = await Cart.findOne({ userId: auth.userId })
    if (!cart) {
      return NextResponse.json(
        { error: 'Cart not found' },
        { status: 404 }
      )
    }

    if (clearAll) {
      await cart.clearCart()
    } else if (cartItemId) {
      // Verify cart item belongs to user
      const cartItem = await CartItem.findById(cartItemId)
      if (!cartItem || cartItem.userId.toString() !== auth.userId) {
        return NextResponse.json(
          { error: 'Cart item not found' },
          { status: 404 }
        )
      }

      // Remove from cart and delete cart item
      await cart.removeCartItem(cartItemId)
      await CartItem.findByIdAndDelete(cartItemId)
    } else {
      return NextResponse.json(
        { error: 'Cart item ID required or use clearAll=true' },
        { status: 400 }
      )
    }

    // Get updated cart
    const updatedCart = await Cart.findByUserId(auth.userId)
    
    return NextResponse.json({ 
      message: clearAll ? 'Cart cleared successfully' : 'Item removed from cart',
      cart: updatedCart
    })
  } catch (error) {
    console.error('Error removing from cart:', error)
    return NextResponse.json(
      { error: 'Failed to remove item from cart' },
      { status: 500 }
    )
  }
}
