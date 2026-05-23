const express = require("express");
const {
  registerUser,
  loginUser,
  logoutUser,
  updateUserProfile,
  getProfile,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const router = express.Router();
const responseDecorator = require("../middleware/responseDecorator");

router.use(responseDecorator);

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateUserProfile);

module.exports = router;
