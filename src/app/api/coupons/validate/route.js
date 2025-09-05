import { NextResponse } from 'next/server'
import connectDB from '../../../../lib/mongodb'
import Coupon from '../../../../lib/models/Coupon'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route'
import { formatPrice, formatPriceDisplay, calculateFinalAmount } from '../../../../lib/utils/priceUtils.js'

// POST - Validate coupon (for preview/check only - does not consume usage)
export async function POST(request) {
  try {
    await connectDB()
    const { code, orderAmount, cartItems, userId } = await request.json()

    if (!code || !orderAmount) {
      return NextResponse.json({
        success: false,
        error: 'Coupon code and order amount are required'
      }, { status: 400 })
    }

    const coupon = await Coupon.findOne({ 
      code: code.toUpperCase()
    })

    if (!coupon) {
      return NextResponse.json({
        success: false,
        error: 'Invalid coupon code'
      }, { status: 404 })
    }

    // Check if coupon is active
    if (!coupon.isActive) {
      return NextResponse.json({
        success: false,
        error: 'This coupon is not active'
      }, { status: 400 })
    }

    // Check if usage limit reached
    if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
      return NextResponse.json({
        success: false,
        error: 'This coupon has reached its usage limit'
      }, { status: 400 })
    }

    const orderAmountNum = parseFloat(orderAmount)
    
    // Check minimum order amount
    if (orderAmountNum < coupon.minimumOrderAmount) {
      return NextResponse.json({
        success: false,
        error: `Minimum order amount is ₹${coupon.minimumOrderAmount}. Your current order is ₹${orderAmountNum}`
      }, { status: 400 })
    }

    // Calculate discount with proper rounding using utility functions
    const discountAmount = formatPrice(coupon.calculateDiscount(orderAmountNum))
    const finalAmount = calculateFinalAmount(orderAmountNum, discountAmount)

    return NextResponse.json({
      success: true,
      message: `Great! You will save ${formatPriceDisplay(discountAmount)} with this coupon`,
      coupon: {
        _id: coupon._id,
        code: coupon.code,
        description: coupon.description,
        discountValue: coupon.discountValue,
        minimumOrderAmount: coupon.minimumOrderAmount,
        usageLimit: coupon.usageLimit,
        usageCount: coupon.usageCount
      },
      discount: {
        discountAmount,
        finalAmount,
        originalAmount: orderAmountNum
      }
    })

  } catch (error) {
    console.error('Error in POST /api/coupons/validate:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// PUT - Apply coupon (mark as used)
export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }

    await connectDB()
    const { couponId, orderAmount, discountAmount } = await request.json()

    if (!couponId || !orderAmount || discountAmount === undefined) {
      return NextResponse.json({
        success: false,
        error: 'Coupon ID, order amount, and discount amount are required'
      }, { status: 400 })
    }

    const coupon = await Coupon.findById(couponId)
    if (!coupon) {
      return NextResponse.json({
        success: false,
        error: 'Coupon not found'
      }, { status: 404 })
    }

    // Double-check validity
    if (!coupon.isCurrentlyValid || !coupon.canUserUse(session.user.id)) {
      return NextResponse.json({
        success: false,
        error: 'Coupon is no longer valid'
      }, { status: 400 })
    }

    // Mark coupon as used
    coupon.usedCount += 1
    coupon.usedBy.push({
      userId: session.user.id,
      usedAt: new Date(),
      orderAmount: parseFloat(orderAmount),
      discountAmount: parseFloat(discountAmount)
    })

    await coupon.save()

    return NextResponse.json({
      success: true,
      message: 'Coupon usage recorded successfully'
    })

  } catch (error) {
    console.error('Error in PUT /api/coupons/validate:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
