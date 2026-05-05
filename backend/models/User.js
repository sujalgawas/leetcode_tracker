const mongoose = require("mongoose");

const solvedProblemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true },
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      default: "Medium",
    },
    topics: [{ type: String }],
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    leetcodeUsername: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    solvedProblems: [solvedProblemSchema],
    totalSolved: {
      easy: { type: Number, default: 0 },
      medium: { type: Number, default: 0 },
      hard: { type: Number, default: 0 },
      all: { type: Number, default: 0 },
    },
    lastSynced: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
