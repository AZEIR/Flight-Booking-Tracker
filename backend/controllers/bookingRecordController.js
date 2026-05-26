const BookingRecord = require("../models/BookingRecords");
const AviationData = require("../models/AviationDatas");
const User = require("../models/User");

const {
  AdminBookingFetcher,
  UserBookingFetcher,
} = require("./bookingFetchTemplate");
const crypto = require("crypto");
const {
  BookingUpdateFacade,
  BookingUpdateError,
} = require("../facades/bookingUpdateFacade");

const {
  BookingCreateFacade,
  BookingCreateError,
} = require("../facades/bookingCreateFacade");

const BaseController = require("./baseController");

class BookingRecordController extends BaseController {
  // Retrieve booking records (all bookings for admin, personal bookings for regular user)
  getBookings = async (req, res) => {
    let fetcher;
    if (req.user.role === "admin") {
      fetcher = new AdminBookingFetcher(req, res);
    } else {
      fetcher = new UserBookingFetcher(req, res);
    }
    await fetcher.execute();
  };

  // Create a new flight booking record and update remaining seat counts
  createBooking = async (req, res) => {
    const { flightId, passengers, seats, targetUserEmail } = req.body;
    try {
      const newBooking = await BookingCreateFacade.createBooking(
        flightId,
        passengers,
        seats,
        targetUserEmail,
        req.user,
      );
      this.sendSuccess(res, newBooking, "Booking created successfully", 201);
    } catch (error) {
      if (error instanceof BookingCreateError || error.statusCode) {
        return this.sendError(
          res,
          error,
          error.message,
          error.statusCode || 400,
        );
      }

      console.error("Booking Error Detail:", error);
      return this.sendError(
        res,
        "An unexpected server error occurred while creating your booking.",
        null,
        500,
      );
    }
  };

  // Modify an existing booking record using the BookingUpdateFacade
  updateBooking = async (req, res) => {
    const { newPassengers, adminPriceOverride, newSeats } = req.body;

    try {
      const updatedBooking = await BookingUpdateFacade.updateBooking(
        req.params.id,
        { newPassengers, adminPriceOverride, newSeats },
        req.user,
      );

      this.sendSuccess(
        res,
        { booking: updatedBooking },
        "Booking updated successfully",
      );
    } catch (error) {
      if (error instanceof BookingUpdateError || error.statusCode) {
        return this.sendError(
          res,
          error,
          error.message,
          error.statusCode || 400,
        );
      }

      this.sendError(res, error, "Server error while updating booking");
    }
  };

  // Cancel an active booking record and return seats back to flight capacity
  cancelBooking = async (req, res) => {
    try {
      const booking = await BookingRecord.findById(req.params.id);
      if (!booking) {
        return this.sendError(res, "Booking not found", null, 404);
      }

      // Encapsulated rich model validation check for user modify privileges
      if (!booking.canBeModifiedBy(req.user)) {
        return this.sendError(
          res,
          "Not authorised to modify this booking.",
          null,
          403,
        );
      }

      if (booking.bookingStatus === "cancelled") {
        return this.sendError(res, "Booking is already cancelled", null, 400);
      }

      const flight = await AviationData.findById(booking.flight);
      if (!flight) {
        return this.sendError(
          res,
          "Associated flight data not found.",
          null,
          404,
        );
      }

      // Encapsulated rich model validation check for flight departure
      if (flight.hasDeparted() && req.user.role !== "admin") {
        return this.sendError(
          res,
          "Cannot cancel a flight that has already departed.",
          null,
          400,
        );
      }

      booking.bookingStatus = "cancelled";
      await booking.save();

      if (booking.seats && booking.seats.length > 0) {
        flight.bookedSeats = flight.bookedSeats.filter(
          (seat) => !booking.seats.includes(seat),
        );
      }

      flight.availableSeats = flight.availableSeats + booking.passengers;
      await flight.save();

      this.sendSuccess(
        res,
        { booking: booking },
        "Booking cancelled successfully",
      );
    } catch (error) {
      this.sendError(res, error, "Server error while cancelling booking");
    }
  };
}

module.exports = new BookingRecordController();
