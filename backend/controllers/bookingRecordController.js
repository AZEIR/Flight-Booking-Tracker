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
  BookingError,
} = require("../facades/bookingUpdateFacade");
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

  //Create a new flight booking record and update remaining seat counts

  createBooking = async (req, res) => {
    const { flightId, passengers, targetUserEmail } = req.body;

    if (!passengers || passengers < 1) {
      return this.sendError(
        res,
        "Passenger count must be at least 1.",
        null,
        400,
      );
    }

    try {
      let bookingOwnerId = req.user.id;

      if (req.user.role === "admin" && targetUserEmail) {
        const targetUser = await User.findOne({
          email: targetUserEmail.toLowerCase(),
        });

        if (!targetUser) {
          return this.sendError(
            res,
            `No account registered with email address "${targetUserEmail}".`,
            `Administrative Error: No account registered with email address "${targetUserEmail}".`,
            404,
          );
        }
        bookingOwnerId = targetUser._id;
      }

      const flight = await AviationData.findById(flightId);
      if (!flight) {
        return this.sendError(res, "Flight not found", null, 404);
      }

      if (flight.availableSeats < passengers) {
        return this.sendError(res, "Not enough seats available", null, 400);
      }

      const totalPrice = flight.price * passengers;

      const bookingReference = crypto
        .randomBytes(4)
        .toString("base64")
        .slice(0, 6)
        .toUpperCase()
        .replace(/[^a-zA-Z0-9]/g, "X");

      const newBooking = await BookingRecord.create({
        user: bookingOwnerId,
        flight: flightId,
        bookingReference: bookingReference,
        passengers: passengers,
        totalPrice: totalPrice,
        bookingStatus: "active",
      });

      flight.availableSeats = flight.availableSeats - passengers;
      await flight.save();

      this.sendSuccess(res, newBooking, "Booking created successfully", 201);
    } catch (error) {
      this.sendError(res, error, "Server error while creating booking");
    }
  };

  // Modify an existing booking record using the BookingUpdateFacade
  updateBooking = async (req, res) => {
    const { newPassengers, adminPriceOverride } = req.body;

    try {
      const updatedBooking = await BookingUpdateFacade.updateBooking(
        req.params.id,
        { newPassengers, adminPriceOverride },
        req.user,
      );

      this.sendSuccess(
        res,
        { booking: updatedBooking },
        "Booking updated successfully",
      );
    } catch (error) {
      if (error instanceof BookingError || error.statusCode) {
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

      if (
        booking.user.toString() !== req.user.id &&
        req.user.role !== "admin"
      ) {
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

      const hasDeparted = new Date() > new Date(flight.departureTime);
      if (hasDeparted && req.user.role !== "admin") {
        return this.sendError(
          res,
          "Cannot cancel a flight that has already departed.",
          null,
          400,
        );
      }

      booking.bookingStatus = "cancelled";
      await booking.save();

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
