const express = require("express");
const router = express.Router();

const {
  getBookings,
  createBooking,
  updateBooking,
  cancelBooking,
} = require("../controllers/bookingRecordController");
const AuthMiddleware = require("../middleware/authMiddleware");
const responseDecorator = require("../middleware/responseDecorator");

router.use(responseDecorator);

router.route("/").get(AuthMiddleware.protect, getBookings).post(AuthMiddleware.protect, createBooking);
router.route("/:id").put(AuthMiddleware.protect, updateBooking);
router.route("/:id/cancel").patch(AuthMiddleware.protect, cancelBooking);

module.exports = router;
