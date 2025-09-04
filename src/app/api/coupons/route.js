import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Coupon from '@/lib/models/Coupon'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]/route'

// GET - Fetch all coupons (Admin only) or validate coupon (Public)
export async function GET(request) {
  try {
    await connectDB()
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const validate = searchParams.get('validate')
    const userId = searchParams.get('userId')
    const orderAmount = searchParams.get('orderAmount')

    // If validating a specific coupon
    if (validate && code) {
      const coupon = await Coupon.findOne({ 
        code: code.toUpperCase(),
        isActive: true 
      })

      if (!coupon) {
        return NextResponse.json({
          success: false,
          error: 'Invalid coupon code'
        }, { status: 404 })
      }

      // Check if coupon is currently valid
      if (!coupon.isCurrentlyValid) {
        let errorMessage = 'Coupon has expired'
        const now = new Date()
        
        if (coupon.validFrom > now) {
          errorMessage = 'Coupon is not yet active'
        } else if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
          errorMessage = 'Coupon usage limit reached'
        }

        return NextResponse.json({
          success: false,
          error: errorMessage
        }, { status: 400 })
      }

      // Check if user can use this coupon
      if (userId && !coupon.canUserUse(userId)) {
        return NextResponse.json({
          success: false,
          error: 'You have already used this coupon maximum allowed times'
        }, { status: 400 })
      }

      // Calculate discount if order amount provided
      let discountInfo = null
      if (orderAmount) {
        const amount = parseFloat(orderAmount)
        const calculation = coupon.calculateDiscount(amount)
        
        if (!calculation.isValid) {
          return NextResponse.json({
            success: false,
            error: calculation.error
          }, { status: 400 })
        }
        
        discountInfo = calculation
      }

      return NextResponse.json({
        success: true,
        coupon: {
          code: coupon.code,
          description: coupon.description,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          minOrderAmount: coupon.minOrderAmount,
          maxDiscountAmount: coupon.maxDiscountAmount,
          validTo: coupon.validTo
        },
        discountInfo
      })
    }

    // Admin route - get all coupons
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user || session.user.role !== 'admin') {
      console.log('Admin access check failed:', {
        hasSession: !!session,
        hasUser: !!session?.user,
        userRole: session?.user?.role
      })
      return NextResponse.json({
        success: false,
        error: 'Admin access required'
      }, { status: 403 })
    }

    const coupons = await Coupon.find({})
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })

    return NextResponse.json({
      success: true,
      coupons
    })

  } catch (error) {
    console.error('Error in GET /api/coupons:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// POST - Create new coupon (Admin only)
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    
    // Debug logging
    console.log('Session in POST /api/coupons:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      userRole: session?.user?.role,
      userEmail: session?.user?.email
    })
    
    // Check if session exists and user is admin
    if (!session || !session.user || session.user.role !== 'admin') {
      console.log('POST Access denied - not admin')
      return NextResponse.json({
        success: false,
        error: 'Admin access required. Please login as admin.'
      }, { status: 403 })
    }

    await connectDB()
    const data = await request.json()

    // Validate required fields
    const requiredFields = ['code', 'discountType', 'discountValue']
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json({
          success: false,
          error: `${field} is required`
        }, { status: 400 })
      }
    }

    // Check if coupon code already exists
    const existingCoupon = await Coupon.findOne({ code: data.code.toUpperCase() })
    if (existingCoupon) {
      return NextResponse.json({
        success: false,
        error: 'Coupon code already exists'
      }, { status: 400 })
    }

    // Create new coupon
    const couponData = {
      ...data,
      code: data.code.toUpperCase(),
      createdBy: session.user.id
    }

    const coupon = new Coupon(couponData)
    await coupon.save()

    return NextResponse.json({
      success: true,
      message: 'Coupon created successfully',
      coupon
    }, { status: 201 })

  } catch (error) {
    console.error('Error in POST /api/coupons:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 })
  }
}
