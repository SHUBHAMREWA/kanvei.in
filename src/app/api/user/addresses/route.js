import { NextResponse } from 'next/server'
import connectDB from '../../../../lib/mongodb'
import Address from '../../../../lib/models/Address'
import User from '../../../../lib/models/User'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route'
import { getAuthUser } from '../../../../lib/auth'

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

// GET - Fetch all user addresses
export async function GET(request) {
  try {
    const auth = await getAuthenticatedUser(request)
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: 401 })
    }

    await connectDB()
    
    const addresses = await Address.find({ userId: auth.userId })
      .sort({ isHomeAddress: -1, createdAt: -1 }) // Home address first, then by creation date

    return NextResponse.json({
      success: true,
      addresses,
      count: addresses.length,
      maxAddresses: 3
    })
  } catch (error) {
    console.error('Error fetching addresses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch addresses' },
      { status: 500 }
    )
  }
}

// POST - Add new address
export async function POST(request) {
  try {
    const auth = await getAuthenticatedUser(request)
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: 401 })
    }

    await connectDB()
    
    // Check if user already has 3 addresses
    const addressCount = await Address.countDocuments({ userId: auth.userId })
    if (addressCount >= 3) {
      return NextResponse.json(
        { error: 'Maximum 3 addresses allowed per user' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { street, city, state, pinCode, isHomeAddress = false } = body

    // Validate required fields
    if (!city || !city.trim()) {
      return NextResponse.json({ error: 'City is required' }, { status: 400 })
    }

    // Create new address
    const newAddress = new Address({
      userId: auth.userId,
      street: street?.trim() || '',
      city: city.trim(),
      state: state?.trim() || '',
      pinCode: pinCode?.trim() || '',
      isHomeAddress: Boolean(isHomeAddress)
    })

    const savedAddress = await newAddress.save()

    // Fetch updated addresses list
    const addresses = await Address.find({ userId: auth.userId })
      .sort({ isHomeAddress: -1, createdAt: -1 })

    return NextResponse.json({
      success: true,
      message: 'Address added successfully',
      address: savedAddress,
      addresses,
      count: addresses.length,
      maxAddresses: 3
    })
  } catch (error) {
    console.error('Error adding address:', error)
    
    if (error.code === 'MAX_ADDRESSES_EXCEEDED') {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message)
      return NextResponse.json({ error: errors.join(', ') }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'Failed to add address' },
      { status: 500 }
    )
  }
}

// PUT - Update address
export async function PUT(request) {
  try {
    const auth = await getAuthenticatedUser(request)
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: 401 })
    }

    await connectDB()
    
    const body = await request.json()
    const { addressId, street, city, state, pinCode, isHomeAddress } = body

    if (!addressId) {
      return NextResponse.json({ error: 'Address ID is required' }, { status: 400 })
    }

    // Validate required fields
    if (!city || !city.trim()) {
      return NextResponse.json({ error: 'City is required' }, { status: 400 })
    }

    // Find and update the address (ensure it belongs to the user)
    const address = await Address.findOne({ _id: addressId, userId: auth.userId })
    if (!address) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 })
    }

    // Update address fields
    address.street = street?.trim() || ''
    address.city = city.trim()
    address.state = state?.trim() || ''
    address.pinCode = pinCode?.trim() || ''
    
    if (isHomeAddress !== undefined) {
      address.isHomeAddress = Boolean(isHomeAddress)
    }

    const updatedAddress = await address.save()

    // Fetch updated addresses list
    const addresses = await Address.find({ userId: auth.userId })
      .sort({ isHomeAddress: -1, createdAt: -1 })

    return NextResponse.json({
      success: true,
      message: 'Address updated successfully',
      address: updatedAddress,
      addresses,
      count: addresses.length,
      maxAddresses: 3
    })
  } catch (error) {
    console.error('Error updating address:', error)
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message)
      return NextResponse.json({ error: errors.join(', ') }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'Failed to update address' },
      { status: 500 }
    )
  }
}

// DELETE - Remove address
export async function DELETE(request) {
  try {
    const auth = await getAuthenticatedUser(request)
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: 401 })
    }

    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const addressId = searchParams.get('id')

    if (!addressId) {
      return NextResponse.json({ error: 'Address ID is required' }, { status: 400 })
    }

    // Find and delete the address (ensure it belongs to the user)
    const deletedAddress = await Address.findOneAndDelete({ 
      _id: addressId, 
      userId: auth.userId 
    })

    if (!deletedAddress) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 })
    }

    // Fetch updated addresses list
    const addresses = await Address.find({ userId: auth.userId })
      .sort({ isHomeAddress: -1, createdAt: -1 })

    return NextResponse.json({
      success: true,
      message: 'Address deleted successfully',
      addresses,
      count: addresses.length,
      maxAddresses: 3
    })
  } catch (error) {
    console.error('Error deleting address:', error)
    return NextResponse.json(
      { error: 'Failed to delete address' },
      { status: 500 }
    )
  }
}
