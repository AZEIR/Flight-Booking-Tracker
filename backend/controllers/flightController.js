const Flight = require("../models/Flight");

// GET /flights
const getFlights = async (req, res) => {
  try {
    const flights = await Flight.find({ user: req.user.id });
    res.status(200).json(flights);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to retrieve flights", error: error.message });
  }
};

// POST /flights
const addFlights = async (req, res) => {
  const { flightNumber, destination, departureDate, status } = req.body;

  // maybe add validation
  if (!flightNumber || !destination || !departureDate) {
    return res.status(400).json({ message: "Please add all required fields" });
  }

  try {
    const flight = await Flight.create({
      user: req.user.id,
      flightNumber,
      destination,
      departureDate,
      status,
    });
    res.status(201).json(flight);
  } catch (error) {
    res.status(500).json({
      message: "Failed to create flight",
      error: error.message,
    });
  }
};

module.exports = { getFlights, addFlights };
