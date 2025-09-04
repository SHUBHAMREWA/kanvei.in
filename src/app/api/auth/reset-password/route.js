import { NextResponse } from "next/server"
import dbConnect from "../../../../lib/mongodb"
import User from "../../../../lib/models/User"
import OTP from "../../../../lib/models/OTP"
import crypto from "crypto"
import bcrypt from "bcryptjs"

export async function POST(request) {
  await dbConnect()

  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json({ success: false, error: "Token and password are required" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ success: false, error: "Password must be at least 6 characters long" }, { status: 400 })
    }

    // Hash the token from the user to match the one in the DB
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex")

    // Find the token in the DB
    const resetTokenRecord = await OTP.findOne({
      otp: hashedToken,
      type: "password-reset",
      expiresAt: { $gt: new Date() }, // Check if the token is not expired
    })

    if (!resetTokenRecord) {
      return NextResponse.json({ success: false, error: "Invalid or expired password reset token." }, { status: 400 })
    }

    // Find the user associated with the token
    const user = await User.findOne({ email: resetTokenRecord.email })

    if (!user) {
      // This should technically not happen if the token is valid, but as a safeguard:
      return NextResponse.json({ success: false, error: "User not found." }, { status: 404 })
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // Update the user's password
    user.password = hashedPassword
    await user.save()

    // Delete the used reset token from the OTP collection
    await OTP.deleteOne({ _id: resetTokenRecord._id })

    return NextResponse.json({ success: true, message: "Password has been reset successfully." })

  } catch (error) {
    console.error("Reset Password Error:", error)
    return NextResponse.json({ success: false, error: "An internal server error occurred." }, { status: 500 })
  }
}
