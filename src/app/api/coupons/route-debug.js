import { NextResponse } from 'next/server'
import connectDB from '../../../lib/mongodb'
import Coupon from '../../../lib/models/Coupon'
import { getServerSession } from 'next-auth/next'

// Simple test auth options without external dependencies
const testAuthOptions = {
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.phone = user.phone
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id
        session.user.role = token.role
        session.user.phone = token.phone
      }
      return session
    },
  },
}

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

      return NextResponse.json({
        success: true,
        coupon: {
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          minOrderAmount: coupon.minOrderAmount,
        }
      })
    }

    // Admin route - get all coupons
    const session = await getServerSession(testAuthOptions)
    
    // Debug logging
    console.log('Session in GET /api/coupons:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      userRole: session?.user?.role,
      userEmail: session?.user?.email,
      fullSession: session
    })
    
    if (!session || !session.user || session.user.role !== 'admin') {
      console.log('Access denied - not admin')
      return NextResponse.json({
        success: false,
        error: 'Admin access required - Debug: Session=' + JSON.stringify(session)
      }, { status: 403 })
    }

    const coupons = await Coupon.find({})
      .sort({ createdAt: -1 })

    return NextResponse.json({
      success: true,
      coupons
    })

  } catch (error) {
    console.error('Error in GET /api/coupons:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error: ' + error.message
    }, { status: 500 })
  }
}

// POST - Create new coupon (Admin only)
export async function POST(request) {
  try {
    const session = await getServerSession(testAuthOptions)
    
    // Debug logging
    console.log('Session in POST /api/coupons:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      userRole: session?.user?.role,
      userEmail: session?.user?.email,
      fullSession: session
    })
    
    // Check if session exists and user is admin
    if (!session || !session.user || session.user.role !== 'admin') {
      console.log('POST Access denied - not admin')
      return NextResponse.json({
        success: false,
        error: 'Admin access required. Please login as admin. Debug: Session=' + JSON.stringify(session)
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
