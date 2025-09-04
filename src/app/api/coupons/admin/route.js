import { NextResponse } from 'next/server'
import mongoose from 'mongoose'
import connectDB from '@/lib/mongodb'
import Coupon from '@/lib/models/Coupon'

// Admin bypass route for coupons - temporary solution
export async function GET(request) {
  try {
    await connectDB()
    
    const coupons = await Coupon.find({})
      .sort({ createdAt: -1 })

    return NextResponse.json({
      success: true,
      message: 'Admin bypass - all coupons retrieved',
      coupons
    })

  } catch (error) {
    console.error('Error in GET /api/coupons/admin:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// Admin bypass POST for creating coupons
export async function POST(request) {
  try {
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

    // Create new coupon without user authentication
    const couponData = {
      ...data,
      code: data.code.toUpperCase(),
      description: `${data.discountValue}% discount coupon`,
      minimumOrderAmount: data.minOrderAmount || 0,
      createdBy: new mongoose.Types.ObjectId() // Dummy ObjectId for bypass
    }

    const coupon = new Coupon(couponData)
    await coupon.save()

    return NextResponse.json({
      success: true,
      message: 'Coupon created successfully (admin bypass)',
      coupon
    }, { status: 201 })

  } catch (error) {
    console.error('Error in POST /api/coupons/admin:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 })
  }
}
