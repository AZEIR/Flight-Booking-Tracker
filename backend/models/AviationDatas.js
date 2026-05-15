const mongoose = require("mongoose");

const aviationDataSchema = new mongoose.Schema(
  {
    airline: {
      type: String,
      required: true,
    },
    flightNumber: {
      type: String,
      required: true,
      unique: true,
    },
    departureAirport: {
      type: String,
      required: true,
      maxLength: 3, // e.g., JFK, SFO
    },
    arrivalAirport: {
      type: String,
      required: true,
      maxLength: 3,
    },
    departureTime: {
      type: Date,
      required: true,
    },
    arrivalTime: {
      type: Date,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    availableSeats: {
      type: Number,
      required: true,
      default: 150,
    },
    status: {
      type: String,
      enum: ["scheduled", "delayed", "cancelled", "completed"],
      default: "scheduled",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("AviationData", aviationDataSchema);
