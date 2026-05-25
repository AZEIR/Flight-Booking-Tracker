const express = require("express");
const router = express.Router();
const {
  getAvailableFlights,
  getFlightById,
} = require("../controllers/flightRoutesController");

router.get("/", getAvailableFlights);
router.get("/:id", getFlightById);

module.exports = router;
