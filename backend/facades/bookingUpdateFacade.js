const BookingRecord = require("../models/BookingRecords");
const AviationData = require("../models/AviationDatas");

class BookingError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = "BookingError";
    this.statusCode = statusCode;
  }
}

class BookingUpdateFacade {
  // Orchestrate complex business validations and update an existing booking record
  static async updateBooking(
    bookingId,
    { newPassengers, adminPriceOverride },
    currentUser,
  ) {
    if (newPassengers !== undefined && newPassengers < 1) {
      throw new BookingError("Passenger count must be at least 1.", 400);
    }

    const booking = await BookingRecord.findById(bookingId);

    if (!booking) {
      throw new BookingError("Booking not found", 404);
    }

    // Encapsulated model check for booking ownership/admin privileges
    if (!booking.canBeModifiedBy(currentUser)) {
      throw new BookingError("Not authorised to modify this booking.", 403);
    }

    if (booking.bookingStatus === "cancelled") {
      throw new BookingError("Cannot update a cancelled booking", 400);
    }

    const flight = await AviationData.findById(booking.flight);

    // Encapsulated model check for the restricted 24-hour departure lockout window
    if (flight.isLockedForModifications() && currentUser.role !== "admin") {
      throw new BookingError(
        "Modifications are locked within 24 hours of departure.",
        400,
      );
    }

    if (newPassengers && newPassengers !== booking.passengers) {
      const passengerDifference = newPassengers - booking.passengers;

      // Encapsulated model check for seat availability
      if (
        passengerDifference > 0 &&
        !flight.hasAvailableSeats(passengerDifference)
      ) {
        throw new BookingError(
          "Not enough extra seats available on this flight",
          400,
        );
      }

      flight.availableSeats = flight.availableSeats - passengerDifference;
      await flight.save();

      booking.passengers = newPassengers;
      booking.totalPrice = flight.price * newPassengers;
    }

    if (adminPriceOverride !== undefined) {
      if (currentUser.role !== "admin") {
        throw new BookingError(
          "Only administrators can override booking pricing.",
          403,
        );
      }
      booking.totalPrice = adminPriceOverride;
    }

    await booking.save();
    return booking;
  }
}

module.exports = {
  BookingUpdateFacade,
  BookingError,
};
