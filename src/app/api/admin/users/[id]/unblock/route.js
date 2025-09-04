import connectDB from "../../../../../../lib/mongodb"
import User from "../../../../../../lib/models/User"
import BlockedAccount from "../../../../../../lib/models/BlockedAccount"
import { getServerSession } from "next-auth"
import { authOptions } from "../../../../auth/[...nextauth]/route"
import { getAuthUser } from "../../../../../../lib/auth"

export async function POST(request, { params }) {
  try {
    await connectDB()
    
    // Check admin authentication
    const session = await getServerSession(authOptions)
    let isAdmin = Boolean(session && session.user?.role === "admin")

    if (!isAdmin) {
      const authUser = await getAuthUser(request)
      if (authUser?.userId) {
        const dbUser = await User.findById(authUser.userId)
        if (dbUser && dbUser.role === "admin") {
          isAdmin = true
        }
      }
    }

    if (!isAdmin) {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { id: userId } = await params

    // Validate user ID
    if (!userId) {
      return Response.json({ success: false, error: "User ID is required" }, { status: 400 })
    }

    // Check if user exists
    const user = await User.findById(userId)
    if (!user) {
      return Response.json({ success: false, error: "User not found" }, { status: 404 })
    }

    // Unblock the user
    const result = await BlockedAccount.unblockUser(userId)

    if (!result.success) {
      return Response.json({ success: false, error: result.error }, { status: 400 })
    }

    return Response.json({ 
      success: true, 
      message: `User ${user.name} has been unblocked successfully`,
      unblockedAccount: result.unblockedAccount
    })
  } catch (error) {
    console.error("Error unblocking user:", error)
    return Response.json({ success: false, error: "Failed to unblock user" }, { status: 500 })
  }
}
