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

// PUT /flights/:id
const updateFlight = async (req, res) => {
  try {
    const flight = await Flight.findById(req.params.id);
    if (!flight) {
      return res.status(404).json({ message: "Flight not found" });
    }
    if (flight.user.toString() !== req.user.id) {
      return res.status(404).json({ message: "User not authorized" });
    }
    const updatedFlight = await Flight.findByIdAndUpdate(
      req.params.id,
      req.body, // get data from front-end
      { new: true }, //tell Mongo to return updated document
    );
    res.status(200).json(updatedFlight);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update flight", error: error.message });
  }
};

// DELETE flights/:id
const cancleFlight = async (req, res) => {
  try {
    const flight = await Flight.findById(req.params.id);
    if (!flight) {
      return res.status(404).json({ message: "Flight not found" });
    }
    if (flight.user.toString() !== req.user.id) {
      return res.status(404).json({ mmessage: "User not authorized" });
    }
    await flight.deleteOne();
    res
      .status(200)
      .json({ id: req.params.id, message: "Flight successfully cancelled" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to delete flight", error: error.message });
  }
};
module.exports = { getFlights, addFlights, updateFlight, cancleFlight };
