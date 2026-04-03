const express = require("express");
const router = express.Router();

const { getFlights, addFlights } = require("../controllers/flightController");
const { protect } = require("../middleware/authMiddleware");

router.route("/").get(protect, getFlights).post(protect, addFlights);

module.exports = router;
