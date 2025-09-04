import { NextResponse } from "next/server"
import connectDB from "../../../../lib/mongodb"
import User from "../../../../lib/models/User"
import OTP from "../../../../lib/models/OTP"
import jwt from "jsonwebtoken"
import { validateUserNotBlocked } from "../../../../lib/auth"
import { sendLoginNotificationEmail, sendAdminLoginNotificationEmail } from "../../../../lib/email"
import { getClientIP, getUserAgent } from "../../../../lib/clientInfo"

export async function POST(request) {
  try {
    await connectDB()
    const { email, otp, type, userData } = await request.json()

    if (!email || !otp || !type) {
      return NextResponse.json({ success: false, error: "Email, OTP, and type are required" }, { status: 400 })
    }

    // Find and verify OTP
    const otpRecord = await OTP.findOne({
      email,
      otp,
      type,
      expiresAt: { $gt: new Date() },
      verified: false,
    })

    if (!otpRecord) {
      return NextResponse.json({ success: false, error: "Invalid or expired OTP" }, { status: 400 })
    }

    // Mark OTP as verified
    otpRecord.verified = true
    await otpRecord.save()

    let user

    if (type === "login") {
      // Find existing user for login
      user = await User.findOne({ email })
      if (!user) {
        return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
      }

      // Check if user is blocked
      const blockValidation = await validateUserNotBlocked(user._id)
      if (!blockValidation.success) {
        return NextResponse.json({ success: false, error: blockValidation.error }, { status: 403 })
      }
    } else if (type === "register") {
      // Create new user for registration
      if (!userData || !userData.name || !userData.password) {
        return NextResponse.json(
          { success: false, error: "Name and password are required for registration" },
          { status: 400 },
        )
      }

      const bcrypt = require("bcryptjs")
      const hashedPassword = await bcrypt.hash(userData.password, 12)

      user = await User.create({
        name: userData.name,
        email,
        password: hashedPassword,
        role: "user",
      })

      // Check if newly created user account is blocked (edge case)
      const blockValidation = await validateUserNotBlocked(user._id)
      if (!blockValidation.success) {
        // Delete the newly created user if they're blocked
        await User.findByIdAndDelete(user._id)
        return NextResponse.json({ success: false, error: blockValidation.error }, { status: 403 })
      }
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "7d" })

    // Remove password from user object
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    }

    // Send login notification email for OTP login (only if it's login, not registration)
    if (type === "login") {
      const clientIP = getClientIP(request)
      const userAgent = getUserAgent(request)
      const loginTime = new Date()
      
      try {
        if (user.role === 'admin') {
          console.log('📧 Sending admin OTP login notification to:', user.email)
          await sendAdminLoginNotificationEmail(
            user.email,
            user.name,
            loginTime,
            clientIP,
            userAgent
          )
          console.log('✅ Admin OTP login notification sent successfully')
        } else {
          console.log('📧 Sending OTP login notification to:', user.email)
          await sendLoginNotificationEmail(
            user.email,
            user.name,
            'OTP Login',
            loginTime,
            clientIP,
            userAgent
          )
          console.log('✅ OTP login notification sent successfully')
        }
      } catch (emailError) {
        console.error('❌ Failed to send OTP login notification:', emailError)
        // Don't block login if email fails
      }
    }

    return NextResponse.json({
      success: true,
      user: userResponse,
      token,
    })
  } catch (error) {
    console.error("Verify OTP error:", error)
    return NextResponse.json({ success: false, error: "Failed to verify OTP" }, { status: 500 })
  }
}
