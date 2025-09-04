import mongoose from "mongoose"

const BlockedAccountSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // One block record per user
      index: true
    },
    blockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    reason: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "Account blocked by administrator"
    },
    blockedAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
)

// Index for efficient queries
BlockedAccountSchema.index({ userId: 1, blockedAt: -1 })

// Static method to check if user is blocked
BlockedAccountSchema.statics.isUserBlocked = async function(userId) {
  try {
    const blockedAccount = await this.findOne({ userId })
    return {
      isBlocked: !!blockedAccount,
      blockedAccount: blockedAccount || null
    }
  } catch (error) {
    console.error("Error checking blocked status:", error)
    return { isBlocked: false, blockedAccount: null }
  }
}

// Static method to block a user
BlockedAccountSchema.statics.blockUser = async function(userId, blockedBy, reason = "Account blocked by administrator") {
  try {
    // Check if already blocked
    const existing = await this.findOne({ userId })
    if (existing) {
      return { success: false, error: "User is already blocked" }
    }

    const blockedAccount = await this.create({
      userId,
      blockedBy,
      reason,
      blockedAt: new Date()
    })

    return { success: true, blockedAccount }
  } catch (error) {
    console.error("Error blocking user:", error)
    return { success: false, error: error.message }
  }
}

// Static method to unblock a user
BlockedAccountSchema.statics.unblockUser = async function(userId) {
  try {
    const result = await this.findOneAndDelete({ userId })
    if (!result) {
      return { success: false, error: "User is not blocked" }
    }

    return { success: true, unblockedAccount: result }
  } catch (error) {
    console.error("Error unblocking user:", error)
    return { success: false, error: error.message }
  }
}

// Avoid model overwrite in Next.js
if (mongoose.models.BlockedAccount) {
  delete mongoose.models.BlockedAccount
}

const BlockedAccount = mongoose.model("BlockedAccount", BlockedAccountSchema)

export default BlockedAccount
