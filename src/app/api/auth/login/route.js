import { NextResponse } from "next/server"
import connectDB from "../../../../lib/mongodb"
import User from "../../../../lib/models/User"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { validateUserNotBlocked } from "../../../../lib/auth"
import { sendLoginNotificationEmail, sendAdminLoginNotificationEmail } from "../../../../lib/email"
import { getClientIP, getUserAgent } from "../../../../lib/clientInfo"

export async function POST(request) {
  try {
    const connection = await connectDB()
    console.log("🔗 Connected to database:", connection.connection.db.databaseName)
    const { email, password } = await request.json()

    // Validation
    if (!email || !password) {
      return NextResponse.json({ success: false, error: "Email and password are required" }, { status: 400 })
    }

    // Find user
    console.log("🔍 Looking for user with email:", email, "in database:", connection.connection.db.databaseName)
    const user = await User.findOne({ email })
    if (!user) {
      console.log("❌ User not found with email:", email)
      return NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 401 })
    }
    console.log("✅ User found:", user._id)

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 401 })
    }

    // Check if user is blocked
    const blockValidation = await validateUserNotBlocked(user._id)
    if (!blockValidation.success) {
      return NextResponse.json({ success: false, error: blockValidation.error }, { status: 403 })
    }

    // Generate token
    const token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "7d" })

    // Remove password from response
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    }

    // Send login notification email
    const clientIP = getClientIP(request)
    const userAgent = getUserAgent(request)
    const loginTime = new Date()
    
    try {
      if (user.role === 'admin') {
        console.log('📧 Sending admin login notification to:', user.email)
        await sendAdminLoginNotificationEmail(
          user.email,
          user.name,
          loginTime,
          clientIP,
          userAgent
        )
        console.log('✅ Admin login notification sent successfully')
      } else {
        console.log('📧 Sending login notification to:', user.email)
        await sendLoginNotificationEmail(
          user.email,
          user.name,
          'Regular',
          loginTime,
          clientIP,
          userAgent
        )
        console.log('✅ Login notification sent successfully')
      }
    } catch (emailError) {
      console.error('❌ Failed to send login notification:', emailError)
      // Don't block login if email fails
    }

    return NextResponse.json({
      success: true,
      user: userResponse,
      token,
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
