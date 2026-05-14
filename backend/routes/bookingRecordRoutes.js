const express = require("express");
const router = express.Router();

const {
  getBookingRecords,
  addBookingRecords,
  updateBookingRecords,
  cancleBookingRecords,
} = require("../controllers/bookingRecordController");
const { protect } = require("../middleware/authMiddleware");

router
  .route("/")
  .get(protect, getBookingRecords)
  .post(protect, addBookingRecords);
router
  .route("/:id")
  .put(protect, updateBookingRecords)
  .delete(protect, cancleBookingRecords);

module.exports = router;
