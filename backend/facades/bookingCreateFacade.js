const BookingRecord = require("../models/BookingRecords");
const AviationData = require("../models/AviationDatas");
const mongoose = require("mongoose");
const crypto = require("crypto");
const User = require("../models/User");

class BookingCreateError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = "BookingCreateError";
    this.statusCode = statusCode;
  }
}

class BookingCreateFacade {
  static async createBooking(
    flightId,
    passengers,
    seats,
    targetUserEmail,
    currentUser,
  ) {
    if (!passengers || passengers < 1) {
      throw new BookingCreateError("Passenger count must be at least 1.", 400);
    }

    if (!seats || !Array.isArray(seats) || seats.length !== passengers) {
      throw new BookingCreateError(
        `Must select exactly ${passengers} seat(s).`,
        400,
      );
    }

    // Check flightId format
    if (!mongoose.Types.ObjectId.isValid(flightId)) {
      throw new BookingCreateError("Invalid flight ID format.", 400);
    }

    let bookingOwnerId = currentUser.id;

    // Check if user try to pass targetUserEmail
    if (currentUser.role !== "admin" && targetUserEmail) {
      throw new BookingCreateError(
        "You do not have permission to specify a target user email.",
        403, // Forbidden
      );
    }

    if (currentUser.role === "admin" && targetUserEmail) {
      const targetUser = await User.findOne({
        email: targetUserEmail.toLowerCase(),
      });

      if (!targetUser) {
        throw new BookingCreateError(
          `No account registered with email address "${targetUserEmail}".`,
          404,
        );
      }

      bookingOwnerId = targetUser._id;
    }
    const flight = await AviationData.findById(flightId);
    if (!flight) {
      throw new BookingCreateError("Flight not found", 404);
    }

    // Check seats format
    const invalidSeats = seats.filter(
      (seatNum) => !seatNum.match(/^([1-9]|1\d|2[0-5])([A-F])$/),
    );

    if (invalidSeats.length > 0) {
      throw new BookingCreateError(
        `Invalid seat selection: ${invalidSeats.join(", ")}.`,
        400,
      );
    }
    // Check seats Availability
    const unavailableSeats = seats.filter((seatNum) =>
      flight.bookedSeats.includes(seatNum),
    );

    if (unavailableSeats.length > 0) {
      throw new BookingCreateError(
        `The following seat(s) are already booked: ${unavailableSeats.join(", ")}.`,
        400,
      );
    }

    // Encapsulated rich model validation check
    if (!flight.hasAvailableSeats(passengers)) {
      throw new BookingCreateError("Not enough seats available", 400);
    }

    const totalPrice = flight.price * passengers;

    const bookingReference = crypto
      .randomBytes(4)
      .toString("base64")
      .slice(0, 6)
      .toUpperCase()
      .replace(/[^a-zA-Z0-9]/g, "X");

    // Reserve the seats
    flight.bookedSeats.push(...seats);

    const newBooking = await BookingRecord.create({
      user: bookingOwnerId,
      flight: flightId,
      bookingReference: bookingReference,
      passengers: passengers,
      seats: seats,
      totalPrice: totalPrice,
      bookingStatus: "active",
    });

    flight.availableSeats = flight.availableSeats - passengers;
    await flight.save();

    return newBooking;
  }
}

module.exports = {
  BookingCreateFacade,
  BookingCreateError,
};
