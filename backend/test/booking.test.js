const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const chai = require("chai");
const chaiHttp = require("chai-http");
const app = require("../server");
const User = require("../models/User");
const AviationData = require("../models/AviationDatas");
const BookingRecord = require("../models/BookingRecords");
const connectDB = require("../config/db"); // Import the connection manager
const mongoose = require("mongoose");
const expect = chai.expect;

chai.use(chaiHttp);

describe("Flight Booking Record Tests", function () {
  this.timeout(20000); // 20 sec

  let authToken;
  let testUser;
  let testFlight;
  let createdBookingId;

  let otherUser;
  let otherBooking;
  // Create temp user before test
  before(async () => {
    // Connect to mongodb
    await connectDB.connect();
    // Just in case user duplicated
    await User.deleteOne({ email: "testcase_user@testing.com" });
    await AviationData.deleteMany({ airline: "Mocha Testing Airline" });
    // Create User
    testUser = await User.create({
      name: "Test Case User",
      email: "testcase_user@testing.com",
      password: "testingpassword",
      role: "user",
    });

    // Login user
    const loginRes = await chai.request(app).post("/api/auth/login").send({
      email: "testcase_user@testing.com",
      password: "testingpassword",
    });
    // save login "token"
    authToken = loginRes.body.data.token;

    testFlight = await AviationData.create({
      airline: "Mocha Testing Airline",
      flightNumber: "MT-911",
      departureAirport: "IDK",
      arrivalAirport: "WTF",
      departureTime: new Date(Date.now() + 48 * 60 * 60 * 1000),
      arrivalTime: new Date(Date.now() + 54 * 60 * 60 * 1000),
      price: 300,
      availableSeats: 150,
      bookedSeats: [],
      status: "scheduled",
    });

    await User.deleteOne({ email: "othertestcase_user@testing.com" });

    otherUser = await User.create({
      name: "Another Test Case User",
      email: "othertestcase_user@testing.com",
      password: "testingpassword",
      role: "user",
    });

    otherBooking = await BookingRecord.create({
      user: otherUser._id,
      flight: testFlight._id,
      bookingReference: "TXA69X",
      passengers: 1,
      seats: ["11A"],
      totalPrice: 300,
      bookingStatus: "active",
    });
  });

  // Delete user after test
  after(async () => {
    if (testUser) {
      await User.deleteOne({ _id: testUser._id });
    }
    if (testFlight) {
      await AviationData.deleteOne({ _id: testFlight._id });
    }
    if (createdBookingId) {
      await BookingRecord.deleteOne({ _id: createdBookingId });
    }
    if (otherUser) {
      await User.deleteOne({ _id: otherUser._id });
    }
    if (otherBooking) {
      await BookingRecord.deleteOne({ _id: otherBooking._id });
    }

    // Close connection
    await mongoose.connection.close();
  });

  // =============================
  // Testing
  // =============================

  describe("POST /api/bookings", async () => {
    it("Should successfully create a new booking", async () => {
      const createPlayload = {
        flightId: testFlight._id,
        passengers: 1,
        seats: ["1A"],
        targetUserEmail: null,
      };

      const res = await chai
        .request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${authToken}`)
        .send(createPlayload);

      expect(res).to.have.status(201);
      expect(res.body).to.have.property("success", true);
      expect(res.body.data).to.have.property("bookingReference");
      expect(res.body.data.totalPrice).to.equal(300);

      createdBookingId = res.body.data._id;
    });
  });

  describe("GET /api/bookings", async () => {
    it("Should successfully get user's list of bookings", async () => {
      const res = await chai
        .request(app)
        .get("/api/bookings")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res).to.have.status(200);
      expect(res.body).to.have.property("success", true);
      expect(res.body.data).to.be.an("array");

      const myBooking = res.body.data.find((b) => b._id === createdBookingId);
      expect(myBooking).to.not.be.undefined;
    });

    it("Should NOT retrieve other user's booking record", async () => {
      const res = await chai
        .request(app)
        .get("/api/bookings")
        .set("Authorization", `Bearer ${authToken}`);

      const leakedBooking = res.body.data.find(
        (b) => b.bookingReference === "TXA69X",
      );

      expect(leakedBooking).to.be.undefined;
    });
  });

  describe("PUT /api/bookings/:id", async () => {
    it("Should successfully update passenger count and seats", async () => {
      const updatePlayload = {
        newPassengers: 2,
        newSeats: ["2A", "2B"],
      };

      const res = await chai
        .request(app)
        .put(`/api/bookings/${createdBookingId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(updatePlayload);

      expect(res).to.have.status(200);
      expect(res.body).to.have.property("success", true);
      expect(res.body).to.have.property(
        "message",
        "Booking updated successfully",
      );

      expect(res.body.data.booking.passengers).to.equal(2);
      expect(res.body.data.booking.seats).to.deep.equal(["2A", "2B"]);
      expect(res.body.data.booking.totalPrice).to.equal(600);
    });
  });

  describe("PATCH /api/bookings/:id/cancel", async () => {
    it("Should successfully cancel the booking", async () => {
      const res = await chai
        .request(app)
        .patch(`/api/bookings/${createdBookingId}/cancel`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(res).to.have.status(200);
      expect(res.body).to.have.property("success", true);
      expect(res.body).to.have.property(
        "message",
        "Booking cancelled successfully",
      );
      expect(res.body.data.booking.bookingStatus).to.equal("cancelled");
    });
  });
});
