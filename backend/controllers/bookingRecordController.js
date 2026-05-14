const BookingRecord = require("../models/BookingRecords");

// GET /flights
const getBookingRecords = async (req, res) => {
  try {
    const bookingRecord = await BookingRecord.find({ user: req.user.id });
    res.status(200).json(bookingRecord);
  } catch (error) {
    res.status(500).json({
      message: "Failed to retrieve Booking Records",
      error: error.message,
    });
  }
};

// POST /flights
const addBookingRecords = async (req, res) => {
  const { flightNumber, destination, departureDate, status } = req.body;

  // maybe add validation
  if (!flightNumber || !destination || !departureDate) {
    return res.status(400).json({ message: "Please add all required fields" });
  }

  try {
    const bookingRecord = await BookingRecord.create({
      user: req.user.id,
      flightNumber,
      destination,
      departureDate,
      status,
    });
    res.status(201).json(bookingRecord);
  } catch (error) {
    res.status(500).json({
      message: "Failed to create a new booking record",
      error: error.message,
    });
  }
};

// PUT /flights/:id
const updateBookingRecords = async (req, res) => {
  try {
    const bookingRecord = await BookingRecord.findById(req.params.id);
    if (!bookingRecord) {
      return res.status(404).json({ message: "Booking not found" });
    }
    if (bookingRecord.user.toString() !== req.user.id) {
      return res.status(404).json({ message: "User not authorized" });
    }
    const updatedbookingRecord = await Booking.findByIdAndUpdate(
      req.params.id,
      req.body, // get data from front-end
      { new: true }, //tell Mongo to return updated document
    );
    res.status(200).json(updatedbookingRecord);
  } catch (error) {
    res.status(500).json({
      message: "Failed to update a booking record",
      error: error.message,
    });
  }
};

// DELETE flights/:id
const cancleBookingRecords = async (req, res) => {
  try {
    const bookingRecord = await BookingRecord.findById(req.params.id);
    if (!bookingRecord) {
      return res.status(404).json({ message: "Booking record not found" });
    }
    if (bookingRecord.user.toString() !== req.user.id) {
      return res.status(404).json({ mmessage: "User not authorized" });
    }
    await bookingRecord.deleteOne();
    res.status(200).json({
      id: req.params.id,
      message: "Booking record cancelled successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete a booking record",
      error: error.message,
    });
  }
};
module.exports = {
  getBookingRecords,
  addBookingRecords,
  updateBookingRecords,
  cancleBookingRecords,
};
