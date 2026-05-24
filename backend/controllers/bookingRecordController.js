const BookingRecord = require("../models/BookingRecords");
const AviationData = require("../models/AviationDatas");
const User = require("../models/User");
const crypto = require("crypto");

// @route   GET /bookings
const getBookings = async (req, res) => {
  try {
    let bookingRecords;
    if (req.user.role === "admin") {
      bookingRecords = await BookingRecord.find()
        .populate("user", "name email")
        .populate("flight");
    } else {
      bookingRecords = await BookingRecord.find({ user: req.user.id }).populate(
        "flight",
      );
    }
    res.status(200).json(bookingRecords);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to retrieve booking", error: error.message });
  }
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

  // validate newPassengers is more then 1 and is not undefined
  if (newPassengers !== undefined && newPassengers < 1) {
    return res
      .status(400)
      .json({ message: "Passenger count must be at least 1." });
  }
  try {
    const booking = await BookingRecord.findById(req.params.id);

    // check if booking exist
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // check ownership
    if (booking.user.toString() !== req.user.id && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Not authorised to modify this booking." });
    }

    // check if booking is cancelled
    if (booking.bookingStatus === "cancelled") {
      return res
        .status(400)
        .json({ message: "Cannot update a cancelled booking" });
    }

    const flight = await AviationData.findById(booking.flight);

    // check if departure time is within 24hr
    const hoursUntilDeparture =
      (new Date(flight.departureTime) - new Date()) / (1000 * 60 * 60);
    if (hoursUntilDeparture < 24 && req.user.role !== "admin") {
      return res.status(400).json({
        message: "Modifications are locked within 24 hours of departure.",
      });
    }

    if (newPassengers && newPassengers !== booking.passengers) {
      const passengerDifference = newPassengers - booking.passengers;

      if (
        passengerDifference > 0 &&
        flight.availableSeats < passengerDifference
      ) {
        return res
          .status(400)
          .json({ message: "Not enough extra seats available on this flight" });
      }

      flight.availableSeats = flight.availableSeats - passengerDifference;
      await flight.save();

      booking.passengers = newPassengers;
      booking.totalPrice = flight.price * newPassengers;
    }

    if (adminPriceOverride !== undefined) {
      if (req.user.role !== "admin") {
        return res
          .status(403)
          .json({ message: "Only administrators can override booking pricing." });
      }
      booking.totalPrice = adminPriceOverride;
    }

    await booking.save();

    res.status(200).json({
      message: "Booking updated successfully",
      booking: booking,
    });
  } catch (error) {
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
