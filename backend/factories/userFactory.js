const User = require("../models/User");

class UserFactory {
  static async createUser(role, userData) {
    const { name, email, password } = userData;

    // The factory uses a switch statement to determine exactly how to build each object type
    switch (role) {
      case "admin":
        return await User.create({
          name,
          email,
          password,
          role: "admin",
        });

      case "user":
      default:
        return await User.create({
          name,
          email,
          password,
          role: "user",
        });
    }
  }
}

module.exports = UserFactory;

