import mongoose from "mongoose"

const OptionImageSchema = new mongoose.Schema(
  {
    img: { type: [String], default: [] },
    optionId: { type: mongoose.Schema.Types.ObjectId, ref: "ProductOption", required: true, index: true },
  },
  { timestamps: true },
)

if (mongoose.models.OptionImage) {
  delete mongoose.models.OptionImage
}

const OptionImage = mongoose.model("OptionImage", OptionImageSchema)
export default OptionImage


