import { NextResponse } from "next/server"
import connectDB from "../../../../lib/mongodb"
import User from "../../../../lib/models/User"

export async function POST(request) {
  try {
    await connectDB()
    const { email, secret } = await request.json()

    // Simple secret key check for security
    if (secret !== "kanvei-admin-secret-2025") {
      return NextResponse.json({ success: false, error: "Invalid secret key" }, { status: 401 })
    }

    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 })
    }

    // Find user by email
    const user = await User.findOne({ email })
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    // Update user role to admin
    await User.findOneAndUpdate({ email }, { role: "admin" })

    console.log(`✅ User ${email} is now an admin!`)

    return NextResponse.json({
      success: true,
      message: `User ${email} has been made an admin`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: "admin"
      }
    })
  } catch (error) {
    console.error("Make admin error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
