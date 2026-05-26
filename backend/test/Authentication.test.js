const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const chai = require("chai");
const chaiHttp = require("chai-http");
const sinon = require("sinon");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const app = require("../server");
const User = require("../models/User");
const AviationData = require("../models/AviationDatas");
const connectDB = require("../config/db");
const expect = chai.expect;

chai.use(chaiHttp);

describe("Authentication and Flight API Tests", function () {
  this.timeout(20000); // 20 sec

  let testUser;
  let testAdmin;
  let testFlight;
  let testAuthToken;
  let adminAuthToken;

  before(async () => {
    // Connect to mongodb
    await connectDB.connect();

    // Clean up database
    await User.deleteMany({
      email: {
        $in: [
          "auth_test_user@testing.com",
          "auth_admin_user@testing.com",
          "auth_new_user@testing.com",
          "auth_duplicate_user@testing.com",
          "profile_deleted_user@testing.com",
        ],
      },
    });
    await AviationData.deleteMany({ airline: "Auth Testing Airline" });

    // Seed test flight
    testFlight = await AviationData.create({
      airline: "Auth Testing Airline",
      flightNumber: "AT-100",
      departureAirport: "SYD",
      arrivalAirport: "MEL",
      departureTime: new Date(Date.now() + 48 * 60 * 60 * 1000),
      arrivalTime: new Date(Date.now() + 54 * 60 * 60 * 1000),
      price: 150,
      availableSeats: 100,
      bookedSeats: [],
      status: "scheduled",
    });

    // Create normal user
    testUser = await User.create({
      name: "Auth Test User",
      email: "auth_test_user@testing.com",
      password: "testingpassword",
      role: "user",
    });

    // Login user to get token
    const loginRes = await chai.request(app).post("/api/auth/login").send({
      email: "auth_test_user@testing.com",
      password: "testingpassword",
    });
    testAuthToken = loginRes.body.data.token;

    // Create admin user
    testAdmin = await User.create({
      name: "Auth Admin User",
      email: "auth_admin_user@testing.com",
      password: "testingpassword",
      role: "admin",
    });

    // Login admin to get token
    const adminLoginRes = await chai.request(app).post("/api/auth/login").send({
      email: "auth_admin_user@testing.com",
      password: "testingpassword",
    });
    adminAuthToken = adminLoginRes.body.data.token;
  });

  after(async () => {
    // Clean up database
    await User.deleteMany({
      email: {
        $in: [
          "auth_test_user@testing.com",
          "auth_admin_user@testing.com",
          "auth_new_user@testing.com",
          "auth_duplicate_user@testing.com",
          "profile_deleted_user@testing.com",
        ],
      },
    });
    await AviationData.deleteMany({ airline: "Auth Testing Airline" });

    // Close connection
    await mongoose.connection.close();
    connectDB.isConnected = false; // Reset connection state
  });

  // ==========================================
  // REGISTER TESTS
  // ==========================================
  describe("POST /api/auth/register", () => {
    it("should register a new user successfully", async () => {
      const payload = {
        name: "New Registered User",
        email: "auth_new_user@testing.com",
        password: "newpassword123",
        role: "user",
      };

      const res = await chai
        .request(app)
        .post("/api/auth/register")
        .send(payload);

      expect(res).to.have.status(201);
      expect(res.body).to.have.property("success", true);
      expect(res.body.data).to.have.property("id");
      expect(res.body.data.name).to.equal("New Registered User");
      expect(res.body.data.email).to.equal("auth_new_user@testing.com");
      expect(res.body.data.role).to.equal("user");
      expect(res.body.data).to.have.property("token");
      expect(res.headers).to.have.property("set-cookie");
      expect(res.headers["set-cookie"][0]).to.include("token=");
    });

    it("should return 400 if user already exists", async () => {
      const payload = {
        name: "Duplicate User",
        email: "auth_test_user@testing.com",
        password: "password123",
      };

      const res = await chai
        .request(app)
        .post("/api/auth/register")
        .send(payload);

      expect(res).to.have.status(400);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal("User already exists");
    });

    it("should default role to user if no role is provided", async () => {
      const payload = {
        name: "Default Role User",
        email: "auth_duplicate_user@testing.com",
        password: "password123",
      };

      const res = await chai
        .request(app)
        .post("/api/auth/register")
        .send(payload);

      expect(res).to.have.status(201);
      expect(res.body.data.role).to.equal("user");
    });

    it("should allow admin role to be registered", async () => {
      const payload = {
        name: "New Admin User",
        email: "auth_new_admin_user@testing.com",
        password: "password123",
        role: "admin",
      };

      const res = await chai
        .request(app)
        .post("/api/auth/register")
        .send(payload);

      expect(res).to.have.status(201);
      expect(res.body.data.role).to.equal("admin");

      // Clean up this newly registered admin user
      await User.deleteOne({ email: "auth_new_admin_user@testing.com" });
    });
  });

  // ==========================================
  // LOGIN TESTS
  // ==========================================
  describe("POST /api/auth/login", () => {
    it("should login a user successfully with correct credentials", async () => {
      const payload = {
        email: "auth_test_user@testing.com",
        password: "testingpassword",
      };

      const res = await chai.request(app).post("/api/auth/login").send(payload);

      expect(res).to.have.status(200);
      expect(res.body).to.have.property("success", true);
      expect(res.body.data).to.have.property("token");
      expect(res.headers).to.have.property("set-cookie");
      expect(res.headers["set-cookie"][0]).to.include("token=");
    });

    it("should return 401 if password is incorrect", async () => {
      const payload = {
        email: "auth_test_user@testing.com",
        password: "wrongpassword",
      };

      const res = await chai.request(app).post("/api/auth/login").send(payload);

      expect(res).to.have.status(401);
      expect(res.body.message).to.equal("Invalid email or password");
    });

    it("should return 401 if user does not exist", async () => {
      const payload = {
        email: "nobody@example.com",
        password: "password123",
      };

      const res = await chai.request(app).post("/api/auth/login").send(payload);

      expect(res).to.have.status(401);
      expect(res.body.message).to.equal("Invalid email or password");
    });

    it("should return 400 if email is missing", async () => {
      const payload = {
        password: "password123",
      };

      const res = await chai.request(app).post("/api/auth/login").send(payload);

      expect(res).to.have.status(400);
      expect(res.body.message).to.equal("Email and password are required");
    });

    it("should return 400 if password is missing", async () => {
      const payload = {
        email: "auth_test_user@testing.com",
      };

      const res = await chai.request(app).post("/api/auth/login").send(payload);

      expect(res).to.have.status(400);
      expect(res.body.message).to.equal("Email and password are required");
    });
  });

  // ==========================================
  // LOGOUT TESTS
  // ==========================================
  describe("POST /api/auth/logout", () => {
    it("should logout user successfully and clear cookie", async () => {
      const res = await chai.request(app).post("/api/auth/logout");

      expect(res).to.have.status(200);
      expect(res.body).to.have.property("success", true);
      expect(res.body.message).to.equal("Logged out successfully");
      expect(res.headers).to.have.property("set-cookie");
      // Cookie should be cleared (expires at past date)
      expect(res.headers["set-cookie"][0]).to.include("Expires=");
    });
  });

  // ==========================================
  // PROFILE & PROTECT TESTS
  // ==========================================
  describe("GET /api/auth/profile & AuthMiddleware - protect", () => {
    it("should return user profile successfully when valid Bearer token is in Authorization header", async () => {
      const res = await chai
        .request(app)
        .get("/api/auth/profile")
        .set("Authorization", `Bearer ${testAuthToken}`);

      expect(res).to.have.status(200);
      expect(res.body).to.have.property("success", true);
      expect(res.body.data.email).to.equal("auth_test_user@testing.com");
      expect(res.body.data.name).to.equal("Auth Test User");
      expect(res.body.data.role).to.equal("user");
    });

    it("should return user profile successfully when valid token is in cookie", async () => {
      const res = await chai
        .request(app)
        .get("/api/auth/profile")
        .set("Cookie", `token=${testAuthToken}`);

      expect(res).to.have.status(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data.email).to.equal("auth_test_user@testing.com");
    });

    it("should prefer the Authorization header over the cookie when both are present", async () => {
      // Use testUser token in cookie (regular user) and adminToken in header (admin user)
      // Verify profile returns admin user details (header overrides cookie)
      const res = await chai
        .request(app)
        .get("/api/auth/profile")
        .set("Authorization", `Bearer ${adminAuthToken}`)
        .set("Cookie", `token=${testAuthToken}`);

      expect(res).to.have.status(200);
      expect(res.body.data.email).to.equal("auth_admin_user@testing.com");
      expect(res.body.data.role).to.equal("admin");
    });

    it("should return 401 when no token is provided at all", async () => {
      const res = await chai.request(app).get("/api/auth/profile");

      expect(res).to.have.status(401);
      expect(res.body.message).to.equal("Not authorized, no token provided");
    });

    it("should return 401 when a forged/invalid token is provided", async () => {
      const res = await chai
        .request(app)
        .get("/api/auth/profile")
        .set("Authorization", "Bearer this.is.a.forged.token");

      expect(res).to.have.status(401);
      expect(res.body.message).to.equal("Not authorized, session token failed");
    });

    it("should return 401 when an expired token is provided", async () => {
      const expiredToken = jwt.sign(
        { id: testUser._id },
        process.env.JWT_SECRET,
        { expiresIn: "-1s" },
      );

      const res = await chai
        .request(app)
        .get("/api/auth/profile")
        .set("Authorization", `Bearer ${expiredToken}`);

      expect(res).to.have.status(401);
      expect(res.body.message).to.equal("Not authorized, session token failed");
    });

    it("should return 500 (server error) if token is valid but user no longer exists in DB", async () => {
      const tempUser = await User.create({
        name: "Profile Deleted User",
        email: "profile_deleted_user@testing.com",
        password: "testingpassword",
      });

      const tempToken = jwt.sign({ id: tempUser._id }, process.env.JWT_SECRET, {
        expiresIn: "1d",
      });

      await User.deleteOne({ _id: tempUser._id });

      const res = await chai
        .request(app)
        .get("/api/auth/profile")
        .set("Authorization", `Bearer ${tempToken}`);

      expect(res).to.have.status(500);
      expect(res.body.message).to.equal("Server error");
    });
  });

  // ==========================================
  // ADMIN MIDDLEWARE TESTS (UNIT)
  // ==========================================
  describe("AuthMiddleware - admin", () => {
    const mockRes = () => {
      const res = {};
      res.status = sinon.stub().returns(res);
      res.json = sinon.spy();
      return res;
    };

    const AuthMiddleware = require("../middleware/authMiddleware");

    afterEach(() => sinon.restore());

    it("should call next() when the user has admin role", () => {
      const req = { user: { role: "admin" } };
      const res = mockRes();
      const next = sinon.spy();

      AuthMiddleware.admin(req, res, next);

      expect(next.calledOnce).to.be.true;
    });

    it("should return 403 when the user has a normal user role", () => {
      const req = { user: { role: "user" } };
      const res = mockRes();
      const next = sinon.spy();

      AuthMiddleware.admin(req, res, next);

      expect(res.status.calledWith(403)).to.be.true;
      expect(next.called).to.be.false;
    });

    it("should return 403 when there is no user attached to the request", () => {
      const req = {};
      const res = mockRes();
      const next = sinon.spy();

      AuthMiddleware.admin(req, res, next);

      expect(res.status.calledWith(403)).to.be.true;
      expect(next.called).to.be.false;
    });
  });

  // ==========================================
  // FLIGHT CONTROLLER INTEGRATION TESTS
  // ==========================================
  describe("Flight API Integration Tests", () => {
    it("should return all flights successfully", async () => {
      const res = await chai.request(app).get("/api/flights");

      expect(res).to.have.status(200);
      expect(res.body).to.have.property("success", true);
      expect(res.body.data).to.be.an("array");

      const seeded = res.body.data.find((f) => f.flightNumber === "AT-100");
      expect(seeded).to.not.be.undefined;
      expect(seeded.airline).to.equal("Auth Testing Airline");
    });

    it("should return empty array when no flights exist", async () => {
      // Temporarily delete all flights
      await AviationData.deleteMany({});

      const res = await chai.request(app).get("/api/flights");

      // Restore flights
      testFlight = await AviationData.create({
        airline: "Auth Testing Airline",
        flightNumber: "AT-100",
        departureAirport: "SYD",
        arrivalAirport: "MEL",
        departureTime: new Date(Date.now() + 48 * 60 * 60 * 1000),
        arrivalTime: new Date(Date.now() + 54 * 60 * 60 * 1000),
        price: 150,
        availableSeats: 100,
        bookedSeats: [],
        status: "scheduled",
      });

      expect(res).to.have.status(200);
      expect(res.body.data).to.be.an("array").that.is.empty;
    });

    it("should return a single flight by ID", async () => {
      const res = await chai.request(app).get(`/api/flights/${testFlight._id}`);

      expect(res).to.have.status(200);
      expect(res.body).to.have.property("success", true);
      expect(res.body.data.flightNumber).to.equal("AT-100");
    });

    it("should return 404 if flight does not exist", async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const res = await chai.request(app).get(`/api/flights/${nonExistentId}`);

      expect(res).to.have.status(404);
      expect(res.body.message).to.equal("Flight not found");
    });

    it("should return 500 if an invalid ID format is provided", async () => {
      const res = await chai.request(app).get("/api/flights/invalid-id-format");

      expect(res).to.have.status(500);
      expect(res.body.message).to.equal("Failed to retrieve flight details");
    });
  });
});
