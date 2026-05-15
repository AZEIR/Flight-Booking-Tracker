const express = require("express");
const router = express.Router();

const {
  getBookings,
  createBooking,
  updateBooking,
  cancelBooking,
} = require("../controllers/bookingRecordController");
const { protect } = require("../middleware/authMiddleware");

router.route("/").get(protect, getBookings).post(protect, createBooking);
router.route("/:id").put(protect, updateBooking);
router.route("/:id/cancel").patch(protect, cancelBooking);

module.exports = router;
