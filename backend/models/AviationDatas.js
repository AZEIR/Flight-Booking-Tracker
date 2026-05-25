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

// Check if the flight has already departed
aviationDataSchema.methods.hasDeparted = function () {
  return new Date() > this.departureTime;
};
// Check if a flight is within the restricted 24-hour departure lockout window
aviationDataSchema.methods.isLockedForModifications = function () {
  const hoursUntilDeparture =
    (new Date(this.departureTime) - new Date()) / (1000 * 60 * 60);
  return hoursUntilDeparture < 24;
};
// Check if there are enough available seats
aviationDataSchema.methods.hasAvailableSeats = function (requestedSeats) {
  return this.availableSeats >= requestedSeats;
};

module.exports = mongoose.model("AviationData", aviationDataSchema);
