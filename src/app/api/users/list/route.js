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
    
    const users = await User.find({}, {
      password: 0  // Exclude password field
    }).sort({ createdAt: -1 })
    
    return NextResponse.json({
      success: true,
      users: users.map(user => ({
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt
      }))
    })
    
  } catch (error) {
    console.error('Error listing users:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
