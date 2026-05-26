const express = require("express");
const {
  registerUser,
  loginUser,
  logoutUser,
  getProfile,
} = require("../controllers/authController");
const AuthMiddleware = require("../middleware/authMiddleware");
const router = express.Router();
const responseDecorator = require("../middleware/responseDecorator");

router.use(responseDecorator);

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.get("/profile", AuthMiddleware.protect, getProfile);

module.exports = router;
