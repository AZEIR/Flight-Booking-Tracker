const BookingRecord = require("../models/BookingRecords");
const AviationData = require("../models/AviationDatas");
const User = require("../models/User");
const { AdminBookingFetcher, UserBookingFetcher } = require("./bookingFetchTemplate");
const crypto = require("crypto");
const {
  BookingUpdateFacade,
  BookingError,
} = require("../facades/bookingUpdateFacade");

// @route   GET /bookings
const getBookings = async (req, res) => {
  let fetcher;
  if (req.user.role === "admin") {
    fetcher = new AdminBookingFetcher(req, res);
  }
  else {
    fetcher = new UserBookingFetcher(req, res);
   }
   await fetcher.execute();
  };


// @route   POST /bookings
const createBooking = async (req, res) => {
  const { flightId, passengers, targetUserEmail } = req.body;

  if (!passengers || passengers < 1) {
    return res
      .status(400)
      .json({ message: "Passenger count must be at least 1." });
  }

  try {
    let bookingOwnerId = req.user.id;

    if (req.user.role === "admin" && targetUserEmail) {
      const targetUser = await User.findOne({
        email: targetUserEmail.toLowerCase(),
      });

      if (!targetUser) {
        return res.status(404).json({
          message: `Administrative Error: No account registered with email address "${targetUserEmail}".`,
        });
      }
      bookingOwnerId = targetUser._id;
    }

    const flight = await AviationData.findById(flightId);
    if (!flight) {
      return res.status(404).json({ message: "Flight not found" });
    }

    if (flight.availableSeats < passengers) {
      return res.status(400).json({ message: "Not enough seats available" });
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

    res.status(201).json(newBooking);
  } catch (error) {
    res.status(500).json({
      message: "Server error while creating booking",
      error: error.message,
    });
  }
};

// @route   PUT /bookings/:id
const updateBooking = async (req, res) => {
  const { newPassengers, adminPriceOverride } = req.body;

  try {
    const updatedBooking = await BookingUpdateFacade.updateBooking(
      req.params.id,
      { newPassengers, adminPriceOverride },
      req.user,
    );

    res.status(200).json({
      message: "Booking updated successfully",
      booking: updatedBooking,
    });
  } catch (error) {
    if (error instanceof BookingError || error.statusCode) {
      return res
        .status(error.statusCode || 400)
        .json({ message: error.message });
    }

    res.status(500).json({
      message: "Server error while updating booking",
      error: error.message,
    });
  }
};

// @route   PATCH /bookings/:id/cancel
const cancelBooking = async (req, res) => {
  try {
    const booking = await BookingRecord.findById(req.params.id);
    // Validate booking
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // check ownership
    if (booking.user.toString() !== req.user.id && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Not authorised to modify this booking." });
    }

    if (booking.bookingStatus === "cancelled") {
      return res.status(400).json({ message: "Booking is already cancelled" });
    }

    const flight = await AviationData.findById(booking.flight);
    // check if flight data was deleted
    if (!flight) {
      return res
        .status(404)
        .json({ message: "Associated flight data not found." });
    }

    const hasDeparted = new Date() > new Date(flight.departureTime);
    // let Admin bypass cancel flight that's been departed
    if (hasDeparted && req.user.role !== "admin") {
      return res
        .status(400)
        .json({ message: "Cannot cancel a flight that has already departed." });
    }

    // update database
    booking.bookingStatus = "cancelled";
    await booking.save();

    flight.availableSeats = flight.availableSeats + booking.passengers;
    await flight.save();

    res.status(200).json({
      message: "Booking cancelled successfully",
      booking: booking,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error while cancelling booking",
      error: error.message,
    });
  }
};

module.exports = {
  getBookings,
  createBooking,
  updateBooking,
  cancelBooking,
};
