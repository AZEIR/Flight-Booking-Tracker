const BookingRecord = require("../models/BookingRecords");
const AviationData = require("../models/AviationDatas");

// @route   GET /bookings
const getBookings = async (req, res) => {
  try {
    const bookingRecords = await BookingRecord.find({ user: req.user.id });
    res.status(200).json(bookingRecords);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to restieve booking", error: error.message });
  }
};

// @route   POST /bookings
const createBooking = async (req, res) => {
  const { flightId, passengers } = req.body;
  try {
    const flight = await AviationData.findById(flightId);
    //    Error for failing to retrieve flight.
    if (!flight) {
      return res.status(404).json({ message: "Flight not found" });
    }
    //    Check flight available seats
    if (flight.availableSeats < passengers) {
      return res.status(404).json({ message: "Not enough seats available" });
    }

    // Generate random 6-character ref code
    const totalPrice = flight.price * passengers;
    const bookingReference = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();

    const newBooking = await BookingRecord.create({
      user: req.user.id,
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
    const booking = await BookingRecord.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.bookingStatus === "cancelled") {
      return res
        .status(400)
        .json({ message: "Cannot update a cancelled booking" });
    }

    if (newPassengers && newPassengers !== booking.passengers) {
      const flight = await AviationData.findById(booking.flight);

      // Positive = adding people, Negative = removing people
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

    if (adminPriceOverride != undefined) {
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

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.bookingStatus === "cancelled") {
      return res.status(400).json({ message: "Booking is already cancelled" });
    }
    // Change status to cancelled
    booking.bookingStatus = "cancelled";
    await booking.save();

    // Add passenger availablity back to aviationdata
    const flight = await AviationData.findById(booking.flight);
    if (flight) {
      flight.availableSeats = flight.availableSeats + booking.passengers;
      await flight.save();
    }

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
