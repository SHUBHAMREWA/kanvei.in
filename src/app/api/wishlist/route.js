import connectDB from "../../../lib/mongodb"
import Wishlist from "../../../lib/models/Wishlist"
import Product from "../../../lib/models/Product"
import ProductImage from "../../../lib/models/ProductImage"
import Cart from "../../../lib/models/Cart"
import CartItem from "../../../lib/models/CartItem"
import mongoose from "mongoose"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/route"

export async function GET(request) {
  try {
    await connectDB()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    if (!userId) {
      return Response.json({ success: false, error: "User ID required" }, { status: 400 })
    }
    
    // Get wishlist items with populated product data
    const items = await Wishlist.find({ userId })
      .populate({ path: "productId", model: Product })
      .lean()
    
    // For each item, fetch product images and check if product is in cart
    const itemsWithImages = await Promise.all(
      items.map(async (item) => {
        if (item.productId) {
          const productImages = await ProductImage.findOne({ productId: item.productId._id }).lean()
          
          // Check if this product is already in the user's cart
          const cartItem = await CartItem.findOne({
            userId: new mongoose.Types.ObjectId(userId),
            product: item.productId._id,
            itemType: 'product'
          }).lean()
          
          return {
            ...item,
            productId: {
              ...item.productId,
              images: productImages ? productImages.img : []
            },
            inCart: {
              isInCart: !!cartItem,
              cartItemId: cartItem?._id,
              quantityInCart: cartItem?.quantity || 0
            }
          }
        }
        return item
      })
    )
    
    return Response.json({ success: true, wishlist: itemsWithImages })
  } catch (error) {
    console.error("Error fetching wishlist:", error)
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    await connectDB()
    const session = await getServerSession(authOptions)
    if (!session) {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }
    const { userId, productId } = await request.json()
    if (!userId || !productId) {
      return Response.json({ success: false, error: "userId and productId are required" }, { status: 400 })
    }
    const existing = await Wishlist.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      productId: new mongoose.Types.ObjectId(productId),
    })
    if (existing) {
      await Wishlist.deleteOne({ _id: existing._id })
      return Response.json({ success: true, action: "removed" })
    }
    await Wishlist.create({ userId, productId })
    return Response.json({ success: true, action: "added" })
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}
