const express = require("express");
const router = express.Router();

const {
  getFlights,
  addFlights,
  updateFlight,
  cancleFlight,
} = require("../controllers/flightController");
const { protect } = require("../middleware/authMiddleware");

router.route("/").get(protect, getFlights).post(protect, addFlights);
router.route("/:id").put(protect, updateFlight).delete(protect, cancleFlight);

module.exports = router;
