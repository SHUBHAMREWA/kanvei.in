import connectDB from "../../../../lib/mongodb"
import User from "../../../../lib/models/User"
import bcrypt from "bcryptjs"

export async function GET(request, { params }) {
  try {
    await connectDB()
    
    const { id } = await params
    if (!id) {
      return Response.json({ success: false, error: "User ID is required" }, { status: 400 })
    }

    const user = await User.findById(id).select('-password').lean()
    
    if (!user) {
      return Response.json({ success: false, error: "User not found" }, { status: 404 })
    }

    return Response.json({ success: true, user })
  } catch (error) {
    console.error('Error fetching user:', error)
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    await connectDB()
    
    const { id } = await params
    if (!id) {
      return Response.json({ success: false, error: "User ID is required" }, { status: 400 })
    }

    const body = await request.json()
    const { name, email, phone, role, emailVerified, password } = body
    
    // Validate required fields
    if (!name || !email) {
      return Response.json({ success: false, error: "Name and email are required" }, { status: 400 })
    }

    // Check if user exists
    const existingUser = await User.findById(id)
    if (!existingUser) {
      return Response.json({ success: false, error: "User not found" }, { status: 404 })
    }

    // Check if email is already taken by another user
    if (email !== existingUser.email) {
      const emailExists = await User.findOne({ 
        email: email.toLowerCase(), 
        _id: { $ne: id } 
      })
      if (emailExists) {
        return Response.json({ success: false, error: "Email is already taken by another user" }, { status: 400 })
      }
    }

    // Prepare update data
    const updateData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone ? phone.trim() : undefined,
      role: role || 'user',
      emailVerified: emailVerified !== undefined ? emailVerified : existingUser.emailVerified
    }

    // Hash new password if provided
    if (password && password.trim()) {
      const saltRounds = 10
      updateData.password = await bcrypt.hash(password.trim(), saltRounds)
    }

    // Update the user
    const updatedUser = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password')
    
    if (!updatedUser) {
      return Response.json({ success: false, error: "User not found" }, { status: 404 })
    }

    return Response.json({ 
      success: true, 
      message: "User updated successfully",
      user: updatedUser 
    })
  } catch (error) {
    console.error('Error updating user:', error)
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB()
    
    const { id } = await params
    if (!id) {
      return Response.json({ success: false, error: "User ID is required" }, { status: 400 })
    }

    // Check if user exists
    const user = await User.findById(id)
    if (!user) {
      return Response.json({ success: false, error: "User not found" }, { status: 404 })
    }

    // Prevent deletion of admin users (optional safety measure)
    if (user.role === 'admin') {
      return Response.json({ success: false, error: "Cannot delete admin users" }, { status: 403 })
    }

    await User.findByIdAndDelete(id)

    return Response.json({ 
      success: true, 
      message: "User deleted successfully"
    })
  } catch (error) {
    console.error('Error deleting user:', error)
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}
