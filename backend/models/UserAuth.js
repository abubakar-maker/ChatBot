import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    favoriteLanguage: { type: String }, // Add this
    password: { type: String, required: true },
  },
  { timestamps: true },
);

export default mongoose.models.UserAuth ||
  mongoose.model("UserAuth", userSchema);
