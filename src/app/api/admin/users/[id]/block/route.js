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
    let adminUserId = session?.user?.id

    if (!isAdmin) {
      const authUser = await getAuthUser(request)
      if (authUser?.userId) {
        const dbUser = await User.findById(authUser.userId)
        if (dbUser && dbUser.role === "admin") {
          isAdmin = true
          adminUserId = authUser.userId
        }
      }
    }

    if (!isAdmin) {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { id: userId } = await params
    const { reason } = await request.json()

    // Validate user ID
    if (!userId) {
      return Response.json({ success: false, error: "User ID is required" }, { status: 400 })
    }

    // Check if user exists
    const user = await User.findById(userId)
    if (!user) {
      return Response.json({ success: false, error: "User not found" }, { status: 404 })
    }

    // Prevent admin from blocking themselves
    if (userId === adminUserId) {
      return Response.json({ success: false, error: "Cannot block your own account" }, { status: 400 })
    }

    // Prevent blocking other admins
    if (user.role === "admin") {
      return Response.json({ success: false, error: "Cannot block admin accounts" }, { status: 400 })
    }

    // Block the user
    const result = await BlockedAccount.blockUser(
      userId, 
      adminUserId, 
      reason || "Account blocked by administrator"
    )

    if (!result.success) {
      return Response.json({ success: false, error: result.error }, { status: 400 })
    }

    return Response.json({ 
      success: true, 
      message: `User ${user.name} has been blocked successfully`,
      blockedAccount: result.blockedAccount
    })
  } catch (error) {
    console.error("Error blocking user:", error)
    return Response.json({ success: false, error: "Failed to block user" }, { status: 500 })
  }
}
