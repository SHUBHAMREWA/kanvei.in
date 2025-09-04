import { NextResponse } from 'next/server'
import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable')
}

// Simple connection without external imports
async function connectDB() {
  if (mongoose.connections[0].readyState) {
    return
  }
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('Connected to MongoDB')
  } catch (error) {
    console.error('MongoDB connection error:', error)
    throw error
  }
}

// Simple User schema without external imports
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: { type: String, default: 'user' },
  phone: String,
  googleId: String,
  facebookId: String,
  emailVerified: { type: Boolean, default: false }
}, { timestamps: true })

const User = mongoose.models.User || mongoose.model('User', userSchema)

export async function GET(request) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    
    if (!email) {
      return NextResponse.json({
        success: false,
        error: 'Email parameter required'
      }, { status: 400 })
    }
    
    const user = await User.findOne({ email })
    
    if (!user) {
      return NextResponse.json({
        success: false,
        isAdmin: false,
        message: 'User not found'
      })
    }
    
    return NextResponse.json({
      success: true,
      isAdmin: user.role === 'admin',
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role
      }
    })
    
  } catch (error) {
    console.error('Error in admin check:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    await connectDB()
    
    const data = await request.json()
    const { email } = data
    
    if (!email) {
      return NextResponse.json({
        success: false,
        error: 'Email is required'
      }, { status: 400 })
    }
    
    // Update user to admin role
    const user = await User.findOneAndUpdate(
      { email },
      { role: 'admin' },
      { new: true, upsert: false }
    )
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 })
    }
    
    return NextResponse.json({
      success: true,
      message: 'User role updated to admin',
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role
      }
    })
    
  } catch (error) {
    console.error('Error updating user role:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
