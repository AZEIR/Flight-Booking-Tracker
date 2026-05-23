const express = require("express");
const router = express.Router();
const {
  getAvailableFlights,
} = require("../controllers/flightRoutesController");

router.get("/", getAvailableFlights);

module.exports = router;
