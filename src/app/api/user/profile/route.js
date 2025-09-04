import { NextResponse } from 'next/server'
import connectDB from '../../../../lib/mongodb'
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

// GET - Fetch user profile
export async function GET(request) {
  try {
    const auth = await getAuthenticatedUser(request)
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: 401 })
    }

    await connectDB()
    
    const user = await User.findById(auth.userId).select('-password')
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        emailVerified: user.emailVerified,
        googleId: user.googleId,
        facebookId: user.facebookId,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    })
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

// PUT - Update user profile
export async function PUT(request) {
  try {
    const auth = await getAuthenticatedUser(request)
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: 401 })
    }

    await connectDB()
    
    const body = await request.json()
    const { name, phone } = body

    // Validate input
    const updateData = {}
    
    if (name !== undefined) {
      if (!name.trim()) {
        return NextResponse.json({ error: 'Name is required' }, { status: 400 })
      }
      updateData.name = name.trim()
    }

    if (phone !== undefined) {
      updateData.phone = phone.trim()
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      auth.userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password')

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        emailVerified: updatedUser.emailVerified,
        googleId: updatedUser.googleId,
        facebookId: updatedUser.facebookId,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt
      }
    })
  } catch (error) {
    console.error('Error updating user profile:', error)
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message)
      return NextResponse.json({ error: errors.join(', ') }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}
