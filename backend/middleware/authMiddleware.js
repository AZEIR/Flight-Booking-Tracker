const jwt = require("jsonwebtoken");
const User = require("../models/User");

class AuthMiddleware {
  // Protect routes by validating JWT session tokens stored in cookies
  static protect = async (req, res, next) => {
    let token;

    // Primary Check: Look for Token in the Authorization Header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }
    // Backup Check: Fallback to the Cookie if no header is present
    else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res
        .status(401)
        .json({ message: "Not authorized, no token provided" });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");
      next();
    } catch (error) {
      return res
        .status(401)
        .json({ message: "Not authorized, session token failed" });
    }
  };

  // Restrict route access exclusively to users with the 'admin' role
  static admin = (req, res, next) => {
    if (req.user && req.user.role === "admin") {
      next();
    } else {
      res
        .status(403)
        .json({ message: "Access denied. Administrator privileges required." });
    }
  };
}

module.exports = AuthMiddleware;
