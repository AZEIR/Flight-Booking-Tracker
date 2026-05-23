// factories/userFactory.js
const User = require("../models/User");

class UserFactory {
  /**
   * Static method to create a user based on their role
   * @param {string} role - The role of the user ('user' or 'admin')
   * @param {Object} userData - The rest of the user details (name, email, password)
   */
  static async createUser(role, userData) {
    const { name, email, password } = userData;

    // The factory uses a switch statement to determine exactly how to build each object type
    switch (role) {
      case "admin":
        return await User.create({
          name,
          email,
          password,
          role: "admin"
        });

      case "user":
      default:
        return await User.create({
          name,
          email,
          password,
          role: "user"
        });
    }
  }
}

module.exports = UserFactory;