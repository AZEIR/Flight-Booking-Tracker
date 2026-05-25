const mongoose = require("mongoose");

const bookingRecordSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    flight: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "AviationData",
    },
    // Generate human readable Ref code via bycrypt
    bookingReference: {
      type: String,
      required: true,
      unique: true,
    },
    passengers: {
      type: Number,
      required: true,
      default: 1,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    bookingStatus: {
      type: String,
      enum: ["active", "cancelled"],
      default: "active",
    },
  },
  { timestamps: true, autoIndex: true },
);

bookingRecordSchema.index({ flightNumber: 1 }, { unique: false, sparse: true });

bookingRecordSchema.methods.canBeModifiedBy = function (user) {
  return this.user.toString() === user.id || user.role === "admin";
};
module.exports = mongoose.model("BookingRecord", bookingRecordSchema);
