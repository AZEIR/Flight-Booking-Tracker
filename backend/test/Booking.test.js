const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const chai = require("chai");
const chaiHttp = require("chai-http");
const app = require("../server");
const User = require("../models/User");
const AviationData = require("../models/AviationDatas");
const BookingRecord = require("../models/BookingRecords");
const connectDB = require("../config/db"); // Import connection manager
const mongoose = require("mongoose");
const expect = chai.expect;

chai.use(chaiHttp);

describe("Flight Booking Record Tests", function () {
  this.timeout(20000); // 20 sec

  let testAuthToken;
  let adminAuthToken;
  let testUser;
  let adminUser;
  let testFlight;
  let testFlightLocked; // Flight departing in 5 hours
  let testFlightDeparted; // Flight departed 2 hours ago
  let createdBookingId;
  let lockedBookingId; // Booking ID for locked flight
  let departedBookingId; // Booking ID for departed flight
  let missingFlightBookingId; // Booking ID with fake flight

  let otherUser;
  let otherBooking;

  // Create temp user before test
  before(async () => {
    // Connect to mongodb
    await connectDB.connect();

    // Just in case user duplicated
    await User.deleteOne({ email: "test_case_user@testing.com" });
    await User.deleteOne({ email: "other_case_user@testing.com" });
    await User.deleteOne({ email: "admin_case_user@testing.com" });
    await AviationData.deleteMany({ airline: "Mocha Testing Airline" });
    await BookingRecord.deleteMany({
      bookingReference: {
        $in: ["TXA69X", "LCK777", "DEP999", "MSF888", "TMP888", "CNL999"],
      },
    });

    // Create User
    testUser = await User.create({
      name: "Test Case User",
      email: "test_case_user@testing.com",
      password: "testingpassword",
      role: "user",
    });

    // Login user
    const loginRes = await chai.request(app).post("/api/auth/login").send({
      email: "test_case_user@testing.com",
      password: "testingpassword",
    });
    // save login "token"
    testAuthToken = loginRes.body.data.token;

    // Create Admin User
    adminUser = await User.create({
      name: "Admin User",
      email: "admin_case_user@testing.com",
      password: "testingpassword",
      role: "admin",
    });

    // Login admin
    const adminLoginRes = await chai.request(app).post("/api/auth/login").send({
      email: "admin_case_user@testing.com",
      password: "testingpassword",
    });
    adminAuthToken = adminLoginRes.body.data.token;

    // Create main test flight (departs in 48 hours)
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

    // Create locked test flight (departs in 5 hours)
    testFlightLocked = await AviationData.create({
      airline: "Mocha Testing Airline",
      flightNumber: "MT-444",
      departureAirport: "IDK",
      arrivalAirport: "WTF",
      departureTime: new Date(Date.now() + 5 * 60 * 60 * 1000),
      arrivalTime: new Date(Date.now() + 11 * 60 * 60 * 1000),
      price: 300,
      availableSeats: 150,
      bookedSeats: [],
      status: "scheduled",
    });

    // Create departed test flight (departed 2 hours ago)
    testFlightDeparted = await AviationData.create({
      airline: "Mocha Testing Airline",
      flightNumber: "MT-111",
      departureAirport: "IDK",
      arrivalAirport: "WTF",
      departureTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
      arrivalTime: new Date(Date.now() + 4 * 60 * 60 * 1000),
      price: 300,
      availableSeats: 150,
      bookedSeats: [],
      status: "completed",
    });

    await User.deleteOne({ email: "other_case_user@testing.com" });

    // Create other user
    otherUser = await User.create({
      name: "Another Test Case User",
      email: "other_case_user@testing.com",
      password: "testingpassword",
      role: "user",
    });

    // Create booking for other user
    otherBooking = await BookingRecord.create({
      user: otherUser._id,
      flight: testFlight._id,
      bookingReference: "TXA69X",
      passengers: 1,
      seats: ["11A"],
      totalPrice: 300,
      bookingStatus: "active",
    });

    // Seed locked booking
    const lockedBooking = await BookingRecord.create({
      user: testUser._id,
      flight: testFlightLocked._id,
      bookingReference: "LCK777",
      passengers: 1,
      seats: ["7A"],
      totalPrice: 300,
      bookingStatus: "active",
    });
    lockedBookingId = lockedBooking._id;

    // Seed departed booking
    const departedBooking = await BookingRecord.create({
      user: testUser._id,
      flight: testFlightDeparted._id,
      bookingReference: "DEP999",
      passengers: 1,
      seats: ["9A"],
      totalPrice: 300,
      bookingStatus: "active",
    });
    departedBookingId = departedBooking._id;

    // Seed booking with missing flight data
    const missingFlightBooking = await BookingRecord.create({
      user: testUser._id,
      flight: new mongoose.Types.ObjectId(), // Fake flight ID
      bookingReference: "MSF888",
      passengers: 1,
      seats: ["8A"],
      totalPrice: 300,
      bookingStatus: "active",
    });
    missingFlightBookingId = missingFlightBooking._id;

    // Reserve seats on flight
    testFlight.bookedSeats.push("11A");
    await testFlight.save();

    testFlightLocked.bookedSeats.push("7A");
    await testFlightLocked.save();

    testFlightDeparted.bookedSeats.push("9A");
    await testFlightDeparted.save();
  });

  // Delete user after test
  after(async () => {
    if (testUser) {
      await User.deleteOne({ _id: testUser._id });
      // Delete test user bookings
      await BookingRecord.deleteMany({ user: testUser._id });
    }
    if (adminUser) {
      await User.deleteOne({ _id: adminUser._id });
    }
    if (otherUser) {
      await User.deleteOne({ _id: otherUser._id });
      // Delete other user bookings
      await BookingRecord.deleteMany({ user: otherUser._id });
    }
    if (testFlight) {
      await AviationData.deleteOne({ _id: testFlight._id });
    }
    if (testFlightLocked) {
      await AviationData.deleteOne({ _id: testFlightLocked._id });
    }
    if (testFlightDeparted) {
      await AviationData.deleteOne({ _id: testFlightDeparted._id });
    }

    // Close connection
    await mongoose.connection.close();
    connectDB.isConnected = false; // Reset connection state
  });

  // =============================
  // Testing
  // =============================

  describe("POST /api/bookings", async () => {
    // ==========================================
    // HAPPY PATH TESTS
    // ==========================================

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
        .set("Authorization", `Bearer ${testAuthToken}`)
        .send(createPlayload);

      expect(res).to.have.status(201);
      expect(res.body).to.have.property("success", true);

      createdBookingId = res.body.data._id;
    });

    it("Should generate a unique booking reference code", async () => {
      const createPlayload = {
        flightId: testFlight._id,
        passengers: 1,
        seats: ["2A"],
        targetUserEmail: null,
      };

      const res = await chai
        .request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${testAuthToken}`)
        .send(createPlayload);

      expect(res).to.have.status(201);
      expect(res.body.data).to.have.property("bookingReference");
    });

    it("Should correctly calculate the total booking price", async () => {
      const createPlayload = {
        flightId: testFlight._id,
        passengers: 1,
        seats: ["3A"],
        targetUserEmail: null,
      };

      const res = await chai
        .request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${testAuthToken}`)
        .send(createPlayload);

      expect(res).to.have.status(201);
      expect(res.body.data.totalPrice).to.equal(300);
    });

    it("Should successfully create a booking on behalf of another user when logged in as an admin", async () => {
      const payload = {
        flightId: testFlight._id,
        passengers: 1,
        seats: ["6A"],
        targetUserEmail: "other_case_user@testing.com",
      };

      const res = await chai
        .request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${adminAuthToken}`) // Logged in as Admin
        .send(payload);

      expect(res).to.have.status(201);
      expect(res.body).to.have.property("success", true);
      expect(res.body.data.user).to.equal(otherUser._id.toString());
    });

    // ==========================================
    // UNHAPPY PATH TESTS
    // ==========================================

    it("Should fail with 400 if passenger count is less than 1", async () => {
      const payload = {
        flightId: testFlight._id,
        passengers: 0,
        seats: [],
      };

      const res = await chai
        .request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${testAuthToken}`)
        .send(payload);

      expect(res).to.have.status(400);
      expect(res.body.message).to.equal("Passenger count must be at least 1.");
    });

    it("Should fail with 400 if seats selected doesn't match passenger count", async () => {
      const payload = {
        flightId: testFlight._id,
        passengers: 2,
        seats: ["1A"],
      };

      const res = await chai
        .request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${testAuthToken}`)
        .send(payload);

      expect(res).to.have.status(400);
      expect(res.body.message).to.equal("Must select exactly 2 seat(s).");
    });

    it("Should fail with 400 if flight ID format is invalid", async () => {
      const payload = {
        flightId: "invalid-id-123",
        passengers: 1,
        seats: ["1A"],
      };

      const res = await chai
        .request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${testAuthToken}`)
        .send(payload);

      expect(res).to.have.status(400);
      expect(res.body.message).to.equal("Invalid flight ID format.");
    });

    it("Should fail with 403 if a regular user tries to specify a target user email", async () => {
      const payload = {
        flightId: testFlight._id,
        passengers: 1,
        seats: ["1A"],
        targetUserEmail: "other_case_user@testing.com",
      };

      const res = await chai
        .request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${testAuthToken}`)
        .send(payload);

      expect(res).to.have.status(403);
      expect(res.body.message).to.equal(
        "You do not have permission to specify a target user email.",
      );
    });

    it("Should fail with 404 if an admin specifies a target user email that does not exist", async () => {
      const payload = {
        flightId: testFlight._id,
        passengers: 1,
        seats: ["1A"],
        targetUserEmail: "nonexistent@testing.com",
      };

      const res = await chai
        .request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${adminAuthToken}`)
        .send(payload);

      expect(res).to.have.status(404);
      expect(res.body.message).to.equal(
        'No account registered with email address "nonexistent@testing.com".',
      );
    });

    it("Should fail with 404 if the flight does not exist in the database", async () => {
      const nonExistentFlightId = new mongoose.Types.ObjectId();
      const payload = {
        flightId: nonExistentFlightId,
        passengers: 1,
        seats: ["1A"],
      };

      const res = await chai
        .request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${testAuthToken}`)
        .send(payload);

      expect(res).to.have.status(404);
      expect(res.body.message).to.equal("Flight not found");
    });

    it("Should fail with 400 if seat format is invalid", async () => {
      const payload = {
        flightId: testFlight._id,
        passengers: 1,
        seats: ["99Z"],
      };

      const res = await chai
        .request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${testAuthToken}`)
        .send(payload);

      expect(res).to.have.status(400);
      expect(res.body.message).to.equal("Invalid seat selection: 99Z.");
    });

    it("Should fail with 400 if the selected seat is already booked", async () => {
      const payload = {
        flightId: testFlight._id,
        passengers: 1,
        seats: ["11A"], // 11A is already booked
      };

      const res = await chai
        .request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${testAuthToken}`)
        .send(payload);

      expect(res).to.have.status(400);
      expect(res.body.message).to.equal(
        "The following seat(s) are already booked: 11A.",
      );
    });

    it("Should fail with 400 if the flight does not have enough available seats", async () => {
      // Temp set available seats to 0
      testFlight.availableSeats = 0;
      await testFlight.save();

      const payload = {
        flightId: testFlight._id,
        passengers: 1,
        seats: ["4A"],
      };

      const res = await chai
        .request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${testAuthToken}`)
        .send(payload);

      // Restore available seats to 150
      testFlight.availableSeats = 150;
      await testFlight.save();

      expect(res).to.have.status(400);
      expect(res.body.message).to.equal("Not enough seats available");
    });
  });

  describe("GET /api/bookings", async () => {
    it("Should successfully get user's list of bookings", async () => {
      const res = await chai
        .request(app)
        .get("/api/bookings")
        .set("Authorization", `Bearer ${testAuthToken}`);
      expect(res).to.have.status(200);
      expect(res.body).to.have.property("success", true);
      expect(res.body.data).to.be.an("array");

      const myBooking = res.body.data.find((b) => b._id === createdBookingId);
      expect(myBooking).to.not.be.undefined;
    });

    it("Should populate flight data for regular user's bookings", async () => {
      const res = await chai
        .request(app)
        .get("/api/bookings")
        .set("Authorization", `Bearer ${testAuthToken}`);

      const myBooking = res.body.data.find((b) => b._id === createdBookingId);
      expect(myBooking).to.not.be.undefined;
      expect(myBooking.flight).to.be.an("object");
      expect(myBooking.flight.flightNumber).to.equal("MT-911");
    });

    it("Should NOT retrieve other user's booking record", async () => {
      const res = await chai
        .request(app)
        .get("/api/bookings")
        .set("Authorization", `Bearer ${testAuthToken}`);

      const leakedBooking = res.body.data.find(
        (b) => b.bookingReference === "TXA69X",
      );

      expect(leakedBooking).to.be.undefined;
    });

    it("Should successfully retrieve ALL bookings when logged in as an admin", async () => {
      const res = await chai
        .request(app)
        .get("/api/bookings")
        .set("Authorization", `Bearer ${adminAuthToken}`);

      expect(res).to.have.status(200);
      expect(res.body).to.have.property("success", true);
      expect(res.body.data).to.be.an("array");

      const userBooking = res.body.data.find((b) => b._id === createdBookingId);
      const anotherBooking = res.body.data.find(
        (b) => b.bookingReference === "TXA69X",
      );

      expect(userBooking).to.not.be.undefined;
      expect(anotherBooking).to.not.be.undefined;
    });

    it("Should not leak user passwords when populating records for admin", async () => {
      const res = await chai
        .request(app)
        .get("/api/bookings")
        .set("Authorization", `Bearer ${adminAuthToken}`);

      const userBooking = res.body.data.find((b) => b._id === createdBookingId);
      expect(userBooking).to.not.be.undefined;
      expect(userBooking.user).to.be.an("object");
      expect(userBooking.user.name).to.equal("Test Case User");
      expect(userBooking.user).to.not.have.property("password");
    });

    it("Should fail with 401 if no authorization token is provided", async () => {
      const res = await chai.request(app).get("/api/bookings");

      expect(res).to.have.status(401);
      expect(res.body).to.have.property(
        "message",
        "Not authorized, no token provided",
      );
    });
  });

  describe("PUT /api/bookings/:id", async () => {
    // ==========================================
    // HAPPY PATH TESTS
    // ==========================================

    it("Should successfully update passenger count and seats", async () => {
      const updatePlayload = {
        newPassengers: 2,
        newSeats: ["5A", "5B"], // Use fresh seats 5A and 5B
      };

      const res = await chai
        .request(app)
        .put(`/api/bookings/${createdBookingId}`)
        .set("Authorization", `Bearer ${testAuthToken}`)
        .send(updatePlayload);

      expect(res).to.have.status(200);
      expect(res.body).to.have.property("success", true);
      expect(res.body).to.have.property(
        "message",
        "Booking updated successfully",
      );
    });

    it("Should correctly save updated passengers and seats in database", async () => {
      const updatePlayload = {
        newPassengers: 2,
        newSeats: ["5A", "5B"],
      };

      const res = await chai
        .request(app)
        .put(`/api/bookings/${createdBookingId}`)
        .set("Authorization", `Bearer ${testAuthToken}`)
        .send(updatePlayload);

      expect(res).to.have.status(200);
      expect(res.body.data.booking.passengers).to.equal(2);
      expect(res.body.data.booking.seats).to.deep.equal(["5A", "5B"]);
    });

    it("Should correctly recalculate totalPrice on passenger count increase", async () => {
      const updatePlayload = {
        newPassengers: 2,
        newSeats: ["5A", "5B"],
      };

      const res = await chai
        .request(app)
        .put(`/api/bookings/${createdBookingId}`)
        .set("Authorization", `Bearer ${testAuthToken}`)
        .send(updatePlayload);

      expect(res).to.have.status(200);
      expect(res.body.data.booking.totalPrice).to.equal(600);
    });

    it("Should successfully override booking price when logged in as an admin", async () => {
      const updatePayload = {
        adminPriceOverride: 99.99,
      };

      const res = await chai
        .request(app)
        .put(`/api/bookings/${createdBookingId}`)
        .set("Authorization", `Bearer ${adminAuthToken}`) // Logged in as Admin
        .send(updatePayload);

      expect(res).to.have.status(200);
      expect(res.body.data.booking.totalPrice).to.equal(99.99);
    });

    // ==========================================
    // UNHAPPY PATH TESTS
    // ==========================================

    it("Should fail with 400 if passenger count is less than 1", async () => {
      const updatePayload = {
        newPassengers: 0,
      };

      const res = await chai
        .request(app)
        .put(`/api/bookings/${createdBookingId}`)
        .set("Authorization", `Bearer ${testAuthToken}`)
        .send(updatePayload);

      expect(res).to.have.status(400);
      expect(res.body.message).to.equal("Passenger count must be at least 1.");
    });

    it("Should fail with 404 if the booking does not exist in the database", async () => {
      const nonExistentBookingId = new mongoose.Types.ObjectId();
      const updatePayload = {
        newPassengers: 2,
        newSeats: ["5A", "5B"],
      };

      const res = await chai
        .request(app)
        .put(`/api/bookings/${nonExistentBookingId}`)
        .set("Authorization", `Bearer ${testAuthToken}`)
        .send(updatePayload);

      expect(res).to.have.status(404);
      expect(res.body.message).to.equal("Booking not found");
    });

    it("Should fail with 403 if a regular user tries to update someone else's booking", async () => {
      const updatePayload = {
        newPassengers: 2,
        newSeats: ["11B", "11C"],
      };

      const res = await chai
        .request(app)
        .put(`/api/bookings/${otherBooking._id}`) // Attempt to modify other user booking
        .set("Authorization", `Bearer ${testAuthToken}`) // Logged in as normal user
        .send(updatePayload);

      expect(res).to.have.status(403);
      expect(res.body.message).to.equal(
        "Not authorised to modify this booking.",
      );
    });

    it("Should fail with 400 if a regular user tries to modify seats within 24h of departure", async () => {
      const updatePayload = {
        newSeats: ["7B"], // Change seat on locked flight
      };

      const res = await chai
        .request(app)
        .put(`/api/bookings/${lockedBookingId}`)
        .set("Authorization", `Bearer ${testAuthToken}`)
        .send(updatePayload);

      expect(res).to.have.status(400);
      expect(res.body.message).to.equal(
        "Modifications are locked within 24 hours of departure.",
      );
    });

    it("Should successfully allow an admin to modify seats within 24h of departure", async () => {
      const updatePayload = {
        newSeats: ["7C"], // Change seat on locked flight
      };

      const res = await chai
        .request(app)
        .put(`/api/bookings/${lockedBookingId}`)
        .set("Authorization", `Bearer ${adminAuthToken}`) // Admin bypasses lockout
        .send(updatePayload);

      expect(res).to.have.status(200);
      expect(res.body.data.booking.seats).to.deep.equal(["7C"]);
    });

    it("Should fail with 400 if passengers count changes but no new seats are provided", async () => {
      const updatePayload = {
        newPassengers: 2, // Passenger count changes without new seats
      };

      // Create fresh booking
      const tempBooking = await BookingRecord.create({
        user: testUser._id,
        flight: testFlight._id,
        bookingReference: "TMP888",
        passengers: 1,
        seats: ["8A"],
        totalPrice: 300,
        bookingStatus: "active",
      });

      const res = await chai
        .request(app)
        .put(`/api/bookings/${tempBooking._id}`)
        .set("Authorization", `Bearer ${testAuthToken}`)
        .send(updatePayload);

      // Delete temp booking
      await BookingRecord.deleteOne({ _id: tempBooking._id });

      expect(res).to.have.status(400);
      expect(res.body.message).to.equal(
        "Must select new seats matching the ticket count.",
      );
    });

    it("Should fail with 400 if seat array size does not match target passenger count", async () => {
      const updatePayload = {
        newPassengers: 2,
        newSeats: ["5A"], // Passenger count is 2 with 1 seat
      };

      const res = await chai
        .request(app)
        .put(`/api/bookings/${createdBookingId}`)
        .set("Authorization", `Bearer ${testAuthToken}`)
        .send(updatePayload);

      expect(res).to.have.status(400);
      expect(res.body.message).to.equal("Must select exactly 2 seat(s).");
    });

    it("Should fail with 400 if seat update uses an invalid seat code format", async () => {
      const updatePayload = {
        newPassengers: 1, // Reset passenger count to 1
        newSeats: ["99Z"], // Invalid seat code
      };

      const res = await chai
        .request(app)
        .put(`/api/bookings/${createdBookingId}`)
        .set("Authorization", `Bearer ${testAuthToken}`)
        .send(updatePayload);

      expect(res).to.have.status(400);
      expect(res.body.message).to.equal("Invalid seat selection: 99Z.");
    });

    it("Should fail with 400 if updated seat selection contains a seat that is already booked", async () => {
      const updatePayload = {
        newPassengers: 1, // Reset passenger count to 1
        newSeats: ["11A"], // Seat 11A is booked
      };

      const res = await chai
        .request(app)
        .put(`/api/bookings/${createdBookingId}`)
        .set("Authorization", `Bearer ${testAuthToken}`)
        .send(updatePayload);

      expect(res).to.have.status(400);
      expect(res.body.message).to.equal(
        "The following seat(s) are already booked: 11A.",
      );
    });

    it("Should fail with 403 if a regular user tries to override booking price", async () => {
      const updatePayload = {
        adminPriceOverride: 50.0,
      };

      const res = await chai
        .request(app)
        .put(`/api/bookings/${createdBookingId}`)
        .set("Authorization", `Bearer ${testAuthToken}`) // Regular user tries price override
        .send(updatePayload);

      expect(res).to.have.status(403);
      expect(res.body.message).to.equal(
        "Only administrators can override booking pricing.",
      );
    });

    it("Should fail with 400 if trying to update a cancelled booking", async () => {
      // Create and cancel a temp booking
      const tempBooking = await BookingRecord.create({
        user: testUser._id,
        flight: testFlight._id,
        bookingReference: "CNL999",
        passengers: 1,
        seats: ["12F"],
        totalPrice: 300,
        bookingStatus: "cancelled",
      });

      const updatePayload = {
        newPassengers: 2,
        newSeats: ["12F", "12E"],
      };

      const res = await chai
        .request(app)
        .put(`/api/bookings/${tempBooking._id}`)
        .set("Authorization", `Bearer ${testAuthToken}`)
        .send(updatePayload);

      await BookingRecord.deleteOne({ _id: tempBooking._id });

      expect(res).to.have.status(400);
      expect(res.body.message).to.equal("Cannot update a cancelled booking");
    });

    it("Should fail with 400 if there are not enough extra seats available on this flight when increasing passenger count", async () => {
      const originalAvailable = testFlight.availableSeats;
      testFlight.availableSeats = 1;
      await testFlight.save();

      const updatePayload = {
        newPassengers: 4, // Attempt to add more passengers than available seats
        newSeats: ["13A", "13B", "13C", "13D"],
      };

      const res = await chai
        .request(app)
        .put(`/api/bookings/${createdBookingId}`)
        .set("Authorization", `Bearer ${testAuthToken}`)
        .send(updatePayload);

      testFlight.availableSeats = originalAvailable;
      await testFlight.save();

      expect(res).to.have.status(400);
      expect(res.body.message).to.equal(
        "Not enough extra seats available on this flight",
      );
    });
  });

  describe("PATCH /api/bookings/:id/cancel", async () => {
    // ==========================================
    // HAPPY PATH TESTS
    // ==========================================
    let seatsBeforeCancel;

    it("Should successfully cancel the booking", async () => {
      // Fetch available seats before cancelling to allow relative checks
      const flightBefore = await AviationData.findById(testFlight._id);
      seatsBeforeCancel = flightBefore.availableSeats;

      const res = await chai
        .request(app)
        .patch(`/api/bookings/${createdBookingId}/cancel`)
        .set("Authorization", `Bearer ${testAuthToken}`);

      expect(res).to.have.status(200);
      expect(res.body).to.have.property("success", true);
      expect(res.body).to.have.property(
        "message",
        "Booking cancelled successfully",
      );
    });

    it("Should change bookingStatus to cancelled in the database", async () => {
      // Query database directly to check status
      const bookingInDb = await BookingRecord.findById(createdBookingId);
      expect(bookingInDb).to.not.be.null;
      expect(bookingInDb.bookingStatus).to.equal("cancelled");
    });

    it("Should release the booked seats from the flight capacity", async () => {
      // Check that testFlight bookedSeats no longer contains 5A and 5B
      const updatedFlight = await AviationData.findById(testFlight._id);
      expect(updatedFlight.bookedSeats).to.not.include("5A");
      expect(updatedFlight.bookedSeats).to.not.include("5B");
    });

    it("Should restore available seats capacity to the flight", async () => {
      const updatedFlight = await AviationData.findById(testFlight._id);
      // Booking has passengers = 2, so available seats must increase by exactly 2 relatives to before cancel
      expect(updatedFlight.availableSeats).to.equal(seatsBeforeCancel + 2);
    });

    // ==========================================
    // UNHAPPY PATH TESTS
    // ==========================================

    it("Should fail with 404 if the booking does not exist in the database", async () => {
      const nonExistentBookingId = new mongoose.Types.ObjectId();
      const res = await chai
        .request(app)
        .patch(`/api/bookings/${nonExistentBookingId}/cancel`)
        .set("Authorization", `Bearer ${testAuthToken}`);

      expect(res).to.have.status(404);
      expect(res.body.message).to.equal("Booking not found");
    });

    it("Should fail with 403 if a regular user tries to cancel someone else's booking", async () => {
      const res = await chai
        .request(app)
        .patch(`/api/bookings/${otherBooking._id}/cancel`) // Trying to cancel other user booking
        .set("Authorization", `Bearer ${testAuthToken}`); // Logged in as normal testUser

      expect(res).to.have.status(403);
      expect(res.body.message).to.equal(
        "Not authorised to modify this booking.",
      );
    });

    it("Should fail with 400 if a regular user tries to cancel a booking that is already cancelled", async () => {
      // createdBookingId was already cancelled in the first happy path cancel test!
      const res = await chai
        .request(app)
        .patch(`/api/bookings/${createdBookingId}/cancel`)
        .set("Authorization", `Bearer ${testAuthToken}`);

      expect(res).to.have.status(400);
      expect(res.body.message).to.equal("Booking is already cancelled");
    });

    it("Should fail with 404 if the associated flight data does not exist in the database", async () => {
      const res = await chai
        .request(app)
        .patch(`/api/bookings/${missingFlightBookingId}/cancel`)
        .set("Authorization", `Bearer ${testAuthToken}`);

      expect(res).to.have.status(404);
      expect(res.body.message).to.equal("Associated flight data not found.");
    });

    it("Should fail with 400 if a regular user tries to cancel a flight that has already departed", async () => {
      const res = await chai
        .request(app)
        .patch(`/api/bookings/${departedBookingId}/cancel`) // Booking on a departed flight
        .set("Authorization", `Bearer ${testAuthToken}`); // Regular user

      expect(res).to.have.status(400);
      expect(res.body.message).to.equal(
        "Cannot cancel a flight that has already departed.",
      );
    });

    it("Should successfully allow an admin to cancel a flight that has already departed", async () => {
      const res = await chai
        .request(app)
        .patch(`/api/bookings/${departedBookingId}/cancel`) // Booking on a departed flight
        .set("Authorization", `Bearer ${adminAuthToken}`); // Admin user bypasses departure lockout

      expect(res).to.have.status(200);
      expect(res.body.data.booking.bookingStatus).to.equal("cancelled");
    });
  });
});
