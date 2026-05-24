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

    if (
      booking.user.toString() !== currentUser.id &&
      currentUser.role !== "admin"
    ) {
      throw new BookingError("Not authorised to modify this booking.", 403);
    }

    if (booking.bookingStatus === "cancelled") {
      throw new BookingError("Cannot update a cancelled booking", 400);
    }

    const flight = await AviationData.findById(booking.flight);

    const hoursUntilDeparture =
      (new Date(flight.departureTime) - new Date()) / (1000 * 60 * 60);

    if (hoursUntilDeparture < 24 && currentUser.role !== "admin") {
      throw new BookingError(
        "Modifications are locked within 24 hours of departure.",
        400,
      );
    }

    if (newPassengers && newPassengers !== booking.passengers) {
      const passengerDifference = newPassengers - booking.passengers;

      if (
        passengerDifference > 0 &&
        flight.availableSeats < passengerDifference
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
