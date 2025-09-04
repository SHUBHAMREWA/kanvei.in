import { NextResponse } from 'next/server'
import connectDB from '../../../../lib/mongodb'
import Coupon from '../../../../lib/models/Coupon'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route'

// GET - Fetch single coupon (Admin only)
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.role === 'admin') {
      return NextResponse.json({
        success: false,
        error: 'Admin access required'
      }, { status: 403 })
    }

    await connectDB()
    const { id } = params

    const coupon = await Coupon.findById(id)
      .populate('createdBy', 'name email')

    if (!coupon) {
      return NextResponse.json({
        success: false,
        error: 'Coupon not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      coupon
    })

  } catch (error) {
    console.error('Error in GET /api/coupons/[id]:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// PUT - Update coupon (Admin only)
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.role === 'admin') {
      return NextResponse.json({
        success: false,
        error: 'Admin access required'
      }, { status: 403 })
    }

    await connectDB()
    const { id } = params
    const data = await request.json()

    const coupon = await Coupon.findById(id)
    if (!coupon) {
      return NextResponse.json({
        success: false,
        error: 'Coupon not found'
      }, { status: 404 })
    }

    // Check if code is being changed and if new code already exists
    if (data.code && data.code.toUpperCase() !== coupon.code) {
      const existingCoupon = await Coupon.findOne({ 
        code: data.code.toUpperCase(),
        _id: { $ne: id }
      })
      
      if (existingCoupon) {
        return NextResponse.json({
          success: false,
          error: 'Coupon code already exists'
        }, { status: 400 })
      }
    }

    // Update coupon
    const updateData = {
      ...data,
      code: data.code ? data.code.toUpperCase() : coupon.code,
    }

    if (data.validFrom) updateData.validFrom = new Date(data.validFrom)
    if (data.validTo) updateData.validTo = new Date(data.validTo)

    const updatedCoupon = await Coupon.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )

    return NextResponse.json({
      success: true,
      message: 'Coupon updated successfully',
      coupon: updatedCoupon
    })

  } catch (error) {
    console.error('Error in PUT /api/coupons/[id]:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 })
  }
}

// DELETE - Delete coupon (Admin only)
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.role === 'admin') {
      return NextResponse.json({
        success: false,
        error: 'Admin access required'
      }, { status: 403 })
    }

    await connectDB()
    const { id } = params

    const coupon = await Coupon.findById(id)
    if (!coupon) {
      return NextResponse.json({
        success: false,
        error: 'Coupon not found'
      }, { status: 404 })
    }

    // Check if coupon has been used
    if (coupon.usedCount > 0) {
      return NextResponse.json({
        success: false,
        error: 'Cannot delete coupon that has been used. You can deactivate it instead.'
      }, { status: 400 })
    }

    await Coupon.findByIdAndDelete(id)

    return NextResponse.json({
      success: true,
      message: 'Coupon deleted successfully'
    })

  } catch (error) {
    console.error('Error in DELETE /api/coupons/[id]:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
