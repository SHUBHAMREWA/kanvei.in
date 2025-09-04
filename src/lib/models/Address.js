import mongoose from "mongoose"

const AddressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    street: {
      type: String,
      maxlength: 255,
      trim: true
    },
    city: {
      type: String,
      maxlength: 100,
      trim: true,
      required: true
    },
    state: {
      type: String,
      maxlength: 100,
      trim: true
    },
    pinCode: {
      type: String,
      maxlength: 20,
      trim: true
    },
    isHomeAddress: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
)

// Index for faster queries on userId
AddressSchema.index({ userId: 1 })

// Ensure user can't have more than 3 addresses
AddressSchema.pre('save', async function(next) {
  if (this.isNew) {
    const addressCount = await this.constructor.countDocuments({ userId: this.userId })
    if (addressCount >= 3) {
      const error = new Error('Maximum 3 addresses allowed per user')
      error.code = 'MAX_ADDRESSES_EXCEEDED'
      return next(error)
    }
  }
  next()
})

// Ensure only one home address per user
AddressSchema.pre('save', async function(next) {
  if (this.isHomeAddress) {
    // If this is being set as home address, unset others
    await this.constructor.updateMany(
      { userId: this.userId, _id: { $ne: this._id } },
      { isHomeAddress: false }
    )
  }
  next()
})

if (mongoose.models.Address) {
  delete mongoose.models.Address
}

const Address = mongoose.model("Address", AddressSchema)
export default Address
