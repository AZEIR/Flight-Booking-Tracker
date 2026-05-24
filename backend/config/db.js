const mongoose = require("mongoose");

class DatabaseConnection {
  constructor() {
    if (DatabaseConnection.instance) {
      return DatabaseConnection.instance;
    }

    DatabaseConnection.instance = this;

    this.isConnected = false;

    mongoose.set("strictQuery", false);
  }

  async connect() {
    if (this.isConnected) {
      console.log("Using existing MongoDB connection instance");
      return;
    }

    try {
      await mongoose.connect(process.env.MONGO_URI);
      console.log(
        "MongoDB connected successfully via Singleton Connection Manager",
      );

      this.isConnected = true;
    } catch (error) {
      console.error("MongoDB connection error:", error.message);
      process.exit(1);
    }
  }
}

const connectDB = new DatabaseConnection();
module.exports = connectDB;
