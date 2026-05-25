const User = require("../models/User");
const UserFactory = require("../factories/userFactory");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const BaseController = require("./baseController");

class AuthController extends BaseController {
  // Generate a JWT token for a user session (expires in 30 days)
  generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
  };

  // Register a new user or administrator and set authorization cookie
  registerUser = async (req, res) => {
    const { name, email, password, role = "user" } = req.body;
    try {
      const userExists = await User.findOne({ email });
      if (userExists) {
        return this.sendError(res, "User already exists", null, 400);
      }

      const user = await UserFactory.createUser(role, {
        name,
        email,
        password,
      });
      const token = this.generateToken(user.id);

      res.cookie("token", token, {
        httpOnly: true,
        secure: false,
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in ms
      });

      this.sendSuccess(
        res,
        {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          token: token,
        },
        "User registered successfully",
        201,
      );
    } catch (error) {
      this.sendError(res, error);
    }
  };

  // Authenticate user credentials and set user session cookie
  loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return this.sendError(res, "Email and password are required", null, 400);
    }

    try {
      const user = await User.findOne({ email });

      if (user && (await bcrypt.compare(password, user.password))) {
        const token = this.generateToken(user.id);

        res.cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production", // require HTTPS in production
          sameSite: "strict",
          maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in ms
        });

        this.sendSuccess(
          res,
          {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: token,
          },
          "Login successful",
        );
      } else {
        this.sendError(res, "Invalid email or password", null, 401);
      }
    } catch (error) {
      this.sendError(res, error);
    }
  };

  // Clear user authorization cookie to log out user
  logoutUser = (req, res) => {
    res.cookie("token", "", {
      httpOnly: true,
      expires: new Date(0), // set expiration to past date to delete
    });
    this.sendSuccess(res, null, "Logged out successfully");
  };

  // Retrieve the current authenticated user's profile details
  getProfile = async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return this.sendError(res, "User not found", null, 404);
      }

      this.sendSuccess(
        res,
        {
          role: user.role,
          name: user.name,
          email: user.email,
        },
        "Profile retrieved successfully",
      );
    } catch (error) {
      this.sendError(res, error, "Server error");
    }
  };

  // Update the current user's profile name and email address

  updateUserProfile = async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return this.sendError(res, "User not found", null, 404);
      }

      const { name, email } = req.body;
      user.name = name || user.name;
      user.email = email || user.email;

      const updatedUser = await user.save();
      this.sendSuccess(
        res,
        {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          token: this.generateToken(updatedUser.id),
        },
        "Profile updated successfully",
      );
    } catch (error) {
      this.sendError(res, error);
    }
  };
}

module.exports = new AuthController();
