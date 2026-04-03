const mongoose = require("mongoose");

const flightSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    flightNumber: {
      type: String,
      required: true,
      unique: true,
      match: /^[A-Z]{2}\d{3}$/,
    },
    destination: {
      type: String,
      required: true,
      match: /^[A-Z]{3}$/,
    },
    departureDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["Scheduled", "Delayed", "Cancelled", "Departed"],
      default: "Scheduled",
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Flight", flightSchema);
