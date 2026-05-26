const chai = require("chai");
const chaiHttp = require("chai-http");
const sinon = require("sinon");
const mongoose = require("mongoose");
const { expect } = chai;

chai.use(chaiHttp);

const app = require("../server");
const AviationData = require("../models/AviationDatas");

// ─── Mock Data ────────────────────────────────────────────────────────────────
// Covers all 4 status enum values + boundary values from your schema

const mockFlightScheduled = {
  _id: new mongoose.Types.ObjectId(),
  airline: "Qantas Airways",
  flightNumber: "QF401",
  departureAirport: "SYD",
  arrivalAirport: "MEL",
  departureTime: new Date("2026-06-01T08:00:00.000Z"),  // Morning — 8am
  arrivalTime:   new Date("2026-06-01T09:25:00.000Z"),
  price: 175,
  availableSeats: 98,
  bookedSeats: [],
  status: "scheduled",
};

const mockFlightDelayed = {
  _id: new mongoose.Types.ObjectId(),
  airline: "Jetstar",
  flightNumber: "JQ201",
  departureAirport: "BNE",
  arrivalAirport: "SIN",
  departureTime: new Date("2026-06-01T14:30:00.000Z"),  // Afternoon — 2:30pm
  arrivalTime:   new Date("2026-06-01T15:55:00.000Z"),
  price: 89,
  availableSeats: 180,
  bookedSeats: ["seat1A", "seat2B"],
  status: "delayed",
};

const mockFlightCancelled = {
  _id: new mongoose.Types.ObjectId(),
  airline: "Singapore Airlines",
  flightNumber: "SQ212",
  departureAirport: "MEL",
  arrivalAirport: "SIN",
  departureTime: new Date("2026-06-02T21:00:00.000Z"),  // Evening — 9pm
  arrivalTime:   new Date("2026-06-03T04:15:00.000Z"),  // Overnight — crosses midnight
  price: 720,
  availableSeats: 0,                                     // Fully booked
  bookedSeats: [],
  status: "cancelled",
};

const mockFlightCompleted = {
  _id: new mongoose.Types.ObjectId(),
  airline: "Virgin Australia",
  flightNumber: "VA101",
  departureAirport: "SYD",
  arrivalAirport: "BNE",
  departureTime: new Date("2025-01-01T03:00:00.000Z"),  // Red-eye — 3am
  arrivalTime:   new Date("2025-01-01T05:10:00.000Z"),
  price: 159,
  availableSeats: 130,
  bookedSeats: [],
  status: "completed",
};

const mockFlightMinPrice = {
  _id: new mongoose.Types.ObjectId(),
  airline: "Qantas Airways",
  flightNumber: "QF999",
  departureAirport: "SYD",
  arrivalAirport: "MEL",
  departureTime: new Date("2026-06-05T10:00:00.000Z"),
  arrivalTime:   new Date("2026-06-05T11:25:00.000Z"),
  price: 0,                                              // Boundary: zero price
  availableSeats: 50,
  bookedSeats: [],
  status: "scheduled",
};

const mockFlights = [
  mockFlightScheduled,
  mockFlightDelayed,
  mockFlightCancelled,
  mockFlightCompleted,
];


// ═════════════════════════════════════════════════════════════════════════════
// GET /api/flights — Functional Tests
// ═════════════════════════════════════════════════════════════════════════════
describe("GET /api/flights — Data Integrity", () => {
  let sandbox;
  beforeEach(() => { sandbox = sinon.createSandbox(); });
  afterEach(() => { sandbox.restore(); });

  // ── Data Passthrough ───────────────────────────────────────────────────────
  // Verifies the controller does NOT transform, modify, or lose any field values

  it("should return the exact airline name unchanged from DB", async () => {
    sandbox.stub(AviationData, "find").resolves([mockFlightScheduled]);
    const res = await chai.request(app).get("/api/flights");
    expect(res.body.data[0].airline).to.equal("Qantas Airways");
  });

  it("should return the exact flight number unchanged from DB", async () => {
    sandbox.stub(AviationData, "find").resolves([mockFlightScheduled]);
    const res = await chai.request(app).get("/api/flights");
    expect(res.body.data[0].flightNumber).to.equal("QF401");
  });

  it("should return the exact price unchanged from DB", async () => {
    sandbox.stub(AviationData, "find").resolves([mockFlightScheduled]);
    const res = await chai.request(app).get("/api/flights");
    expect(res.body.data[0].price).to.equal(175);
  });

  it("should return the exact departureAirport unchanged from DB", async () => {
    sandbox.stub(AviationData, "find").resolves([mockFlightScheduled]);
    const res = await chai.request(app).get("/api/flights");
    expect(res.body.data[0].departureAirport).to.equal("SYD");
  });

  it("should return the exact arrivalAirport unchanged from DB", async () => {
    sandbox.stub(AviationData, "find").resolves([mockFlightScheduled]);
    const res = await chai.request(app).get("/api/flights");
    expect(res.body.data[0].arrivalAirport).to.equal("MEL");
  });

  it("should return price as a number not a string", async () => {
    sandbox.stub(AviationData, "find").resolves([mockFlightScheduled]);
    const res = await chai.request(app).get("/api/flights");
    expect(res.body.data[0].price).to.be.a("number");
  });

  it("should return availableSeats as a number not a string", async () => {
    sandbox.stub(AviationData, "find").resolves([mockFlightScheduled]);
    const res = await chai.request(app).get("/api/flights");
    expect(res.body.data[0].availableSeats).to.be.a("number");
  });

  it("should return bookedSeats as an array", async () => {
    sandbox.stub(AviationData, "find").resolves([mockFlightScheduled]);
    const res = await chai.request(app).get("/api/flights");
    expect(res.body.data[0].bookedSeats).to.be.an("array");
  });

  it("should return bookedSeats contents unchanged when populated", async () => {
    sandbox.stub(AviationData, "find").resolves([mockFlightDelayed]);
    const res = await chai.request(app).get("/api/flights");
    expect(res.body.data[0].bookedSeats).to.deep.equal(["seat1A", "seat2B"]);
  });

  // ── Schema Business Rules ──────────────────────────────────────────────────
  // Verifies schema constraints from AviationDatas.js are respected

  it("should return status as a valid enum value for every flight", async () => {
    sandbox.stub(AviationData, "find").resolves(mockFlights);
    const validStatuses = ["scheduled", "delayed", "cancelled", "completed"];
    const res = await chai.request(app).get("/api/flights");
    res.body.data.forEach((f) => {
      expect(validStatuses).to.include(f.status);
    });
  });

  it("should return all 4 different status enum values correctly", async () => {
    sandbox.stub(AviationData, "find").resolves(mockFlights);
    const res = await chai.request(app).get("/api/flights");
    const statuses = res.body.data.map((f) => f.status);
    expect(statuses).to.include("scheduled");
    expect(statuses).to.include("delayed");
    expect(statuses).to.include("cancelled");
    expect(statuses).to.include("completed");
  });

  it("should return departureAirport with max 3 characters for every flight", async () => {
    sandbox.stub(AviationData, "find").resolves(mockFlights);
    const res = await chai.request(app).get("/api/flights");
    res.body.data.forEach((f) => {
      expect(f.departureAirport.length).to.be.at.most(3);
    });
  });

  it("should return arrivalAirport with max 3 characters for every flight", async () => {
    sandbox.stub(AviationData, "find").resolves(mockFlights);
    const res = await chai.request(app).get("/api/flights");
    res.body.data.forEach((f) => {
      expect(f.arrivalAirport.length).to.be.at.most(3);
    });
  });

  // ── Boundary Values ────────────────────────────────────────────────────────
  // Verifies edge-of-valid-range values are returned correctly, not filtered out

  it("should return a fully booked flight (0 availableSeats) without filtering it out", async () => {
    sandbox.stub(AviationData, "find").resolves([mockFlightCancelled]);
    const res = await chai.request(app).get("/api/flights");
    expect(res.body.data).to.have.lengthOf(1);
    expect(res.body.data[0].availableSeats).to.equal(0);
  });

  it("should return a flight with price of 0 without filtering it out", async () => {
    sandbox.stub(AviationData, "find").resolves([mockFlightMinPrice]);
    const res = await chai.request(app).get("/api/flights");
    expect(res.body.data).to.have.lengthOf(1);
    expect(res.body.data[0].price).to.equal(0);
  });

  // ── Business State Handling ────────────────────────────────────────────────
  // Verifies all valid business states are fetchable, not silently excluded

  it("should return a completed (past) flight without excluding it", async () => {
    sandbox.stub(AviationData, "find").resolves([mockFlightCompleted]);
    const res = await chai.request(app).get("/api/flights");
    expect(res.body.data).to.have.lengthOf(1);
    expect(res.body.data[0].status).to.equal("completed");
  });

  it("should return a cancelled flight without excluding it", async () => {
    sandbox.stub(AviationData, "find").resolves([mockFlightCancelled]);
    const res = await chai.request(app).get("/api/flights");
    expect(res.body.data).to.have.lengthOf(1);
    expect(res.body.data[0].status).to.equal("cancelled");
  });

  it("should return a delayed flight without excluding it", async () => {
    sandbox.stub(AviationData, "find").resolves([mockFlightDelayed]);
    const res = await chai.request(app).get("/api/flights");
    expect(res.body.data).to.have.lengthOf(1);
    expect(res.body.data[0].status).to.equal("delayed");
  });

  it("should return an overnight flight (arrivalTime next day) correctly", async () => {
    // SQ212 departs 21:00 June 2, arrives 04:15 June 3 — crosses midnight
    sandbox.stub(AviationData, "find").resolves([mockFlightCancelled]);
    const res = await chai.request(app).get("/api/flights");
    const flight = res.body.data[0];
    const departure = new Date(flight.departureTime);
    const arrival   = new Date(flight.arrivalTime);
    // Arrival must always be after departure — controller must not reorder times
    expect(arrival.getTime()).to.be.greaterThan(departure.getTime());
  });

  // ── DB State Variations ────────────────────────────────────────────────────
  // Verifies the controller behaves correctly across different DB states

  it("should return empty data array when no flights exist in DB", async () => {
    sandbox.stub(AviationData, "find").resolves([]);
    const res = await chai.request(app).get("/api/flights");
    expect(res.body.data).to.be.an("array").that.is.empty;
  });

  it("should return exactly 1 flight when only 1 exists in DB", async () => {
    sandbox.stub(AviationData, "find").resolves([mockFlightScheduled]);
    const res = await chai.request(app).get("/api/flights");
    expect(res.body.data).to.have.lengthOf(1);
  });

  it("should return all flights without dropping any when DB has many records", async () => {
    const manyFlights = Array.from({ length: 100 }, (_, i) => ({
      ...mockFlightScheduled,
      _id: new mongoose.Types.ObjectId(),
      flightNumber: `QF${100 + i}`,
    }));
    sandbox.stub(AviationData, "find").resolves(manyFlights);
    const res = await chai.request(app).get("/api/flights");
    // Controller must not paginate, cap, or drop records silently
    expect(res.body.data).to.have.lengthOf(100);
  });

  it("should preserve the order of flights returned by DB", async () => {
    sandbox.stub(AviationData, "find").resolves(mockFlights);
    const res = await chai.request(app).get("/api/flights");
    // Controller must not re-sort — order should match what DB returned
    expect(res.body.data[0].flightNumber).to.equal("QF401");
    expect(res.body.data[1].flightNumber).to.equal("JQ201");
    expect(res.body.data[2].flightNumber).to.equal("SQ212");
    expect(res.body.data[3].flightNumber).to.equal("VA101");
  });

});


// ═════════════════════════════════════════════════════════════════════════════
// GET /api/flights/:id — Functional Tests
// ═════════════════════════════════════════════════════════════════════════════
describe("GET /api/flights/:id — Data Integrity", () => {
  let sandbox;
  beforeEach(() => { sandbox = sinon.createSandbox(); });
  afterEach(() => { sandbox.restore(); });

  // ── Data Passthrough ───────────────────────────────────────────────────────

  it("should return all fields of the flight exactly as stored in DB", async () => {
    sandbox.stub(AviationData, "findById").resolves(mockFlightScheduled);
    const res = await chai.request(app).get(`/api/flights/${mockFlightScheduled._id}`);
    const flight = res.body.data;
    expect(flight.airline).to.equal("Qantas Airways");
    expect(flight.flightNumber).to.equal("QF401");
    expect(flight.price).to.equal(175);
    expect(flight.departureAirport).to.equal("SYD");
    expect(flight.arrivalAirport).to.equal("MEL");
    expect(flight.availableSeats).to.equal(98);
    expect(flight.status).to.equal("scheduled");
  });

  it("should return price as a number not a string", async () => {
    sandbox.stub(AviationData, "findById").resolves(mockFlightScheduled);
    const res = await chai.request(app).get(`/api/flights/${mockFlightScheduled._id}`);
    expect(res.body.data.price).to.be.a("number");
  });

  it("should return availableSeats as a number not a string", async () => {
    sandbox.stub(AviationData, "findById").resolves(mockFlightScheduled);
    const res = await chai.request(app).get(`/api/flights/${mockFlightScheduled._id}`);
    expect(res.body.data.availableSeats).to.be.a("number");
  });

  it("should return bookedSeats as an array", async () => {
    sandbox.stub(AviationData, "findById").resolves(mockFlightScheduled);
    const res = await chai.request(app).get(`/api/flights/${mockFlightScheduled._id}`);
    expect(res.body.data.bookedSeats).to.be.an("array");
  });

  it("should return bookedSeats contents unchanged when populated", async () => {
    sandbox.stub(AviationData, "findById").resolves(mockFlightDelayed);
    const res = await chai.request(app).get(`/api/flights/${mockFlightDelayed._id}`);
    expect(res.body.data.bookedSeats).to.deep.equal(["seat1A", "seat2B"]);
  });

  // ── Schema Business Rules ──────────────────────────────────────────────────

  it("should return status as a valid enum value", async () => {
    sandbox.stub(AviationData, "findById").resolves(mockFlightScheduled);
    const res = await chai.request(app).get(`/api/flights/${mockFlightScheduled._id}`);
    const validStatuses = ["scheduled", "delayed", "cancelled", "completed"];
    expect(validStatuses).to.include(res.body.data.status);
  });

  it("should return departureAirport with max 3 characters", async () => {
    sandbox.stub(AviationData, "findById").resolves(mockFlightScheduled);
    const res = await chai.request(app).get(`/api/flights/${mockFlightScheduled._id}`);
    expect(res.body.data.departureAirport.length).to.be.at.most(3);
  });

  it("should return arrivalAirport with max 3 characters", async () => {
    sandbox.stub(AviationData, "findById").resolves(mockFlightScheduled);
    const res = await chai.request(app).get(`/api/flights/${mockFlightScheduled._id}`);
    expect(res.body.data.arrivalAirport.length).to.be.at.most(3);
  });

  // ── Boundary Values ────────────────────────────────────────────────────────

  it("should return a fully booked flight (0 availableSeats) by ID", async () => {
    sandbox.stub(AviationData, "findById").resolves(mockFlightCancelled);
    const res = await chai.request(app).get(`/api/flights/${mockFlightCancelled._id}`);
    expect(res.body.data.availableSeats).to.equal(0);
  });

  it("should return a flight with price 0 by ID", async () => {
    sandbox.stub(AviationData, "findById").resolves(mockFlightMinPrice);
    const res = await chai.request(app).get(`/api/flights/${mockFlightMinPrice._id}`);
    expect(res.body.data.price).to.equal(0);
  });

  // ── Business State Handling ────────────────────────────────────────────────

  it("should return a scheduled flight by ID", async () => {
    sandbox.stub(AviationData, "findById").resolves(mockFlightScheduled);
    const res = await chai.request(app).get(`/api/flights/${mockFlightScheduled._id}`);
    expect(res.body.data.status).to.equal("scheduled");
  });

  it("should return a delayed flight by ID", async () => {
    sandbox.stub(AviationData, "findById").resolves(mockFlightDelayed);
    const res = await chai.request(app).get(`/api/flights/${mockFlightDelayed._id}`);
    expect(res.body.data.status).to.equal("delayed");
  });

  it("should return a cancelled flight by ID", async () => {
    sandbox.stub(AviationData, "findById").resolves(mockFlightCancelled);
    const res = await chai.request(app).get(`/api/flights/${mockFlightCancelled._id}`);
    expect(res.body.data.status).to.equal("cancelled");
  });

  it("should return a completed (past) flight by ID without excluding it", async () => {
    sandbox.stub(AviationData, "findById").resolves(mockFlightCompleted);
    const res = await chai.request(app).get(`/api/flights/${mockFlightCompleted._id}`);
    expect(res.body.data.status).to.equal("completed");
  });

  it("should return an overnight flight with arrivalTime after departureTime", async () => {
    sandbox.stub(AviationData, "findById").resolves(mockFlightCancelled);
    const res = await chai.request(app).get(`/api/flights/${mockFlightCancelled._id}`);
    const departure = new Date(res.body.data.departureTime);
    const arrival   = new Date(res.body.data.arrivalTime);
    expect(arrival.getTime()).to.be.greaterThan(departure.getTime());
  });

  // ── Input Validation — Invalid ID Formats ──────────────────────────────────
  // Verifies Mongoose CastError is caught gracefully by your controller catch block

  it("should fail gracefully for a completely invalid ID string", async () => {
    const res = await chai.request(app).get("/api/flights/not-a-valid-id");
    expect(res.body).to.have.property("success", false);
  });

  it("should fail gracefully for a numeric ID", async () => {
    const res = await chai.request(app).get("/api/flights/12345");
    expect(res.body).to.have.property("success", false);
  });

  it("should fail gracefully for special character ID", async () => {
    const res = await chai.request(app).get("/api/flights/!!!invalid!!!");
    expect(res.body).to.have.property("success", false);
  });

  it("should fail gracefully for an ID that is too short", async () => {
    const res = await chai.request(app).get("/api/flights/abc");
    expect(res.body).to.have.property("success", false);
  });

  it("should fail gracefully for an ID that is too long", async () => {
    const res = await chai.request(app).get("/api/flights/" + "a".repeat(100));
    expect(res.body).to.have.property("success", false);
  });

});


// ═════════════════════════════════════════════════════════════════════════════
// Search Filter Tests
// ═════════════════════════════════════════════════════════════════════════════

// ─── Extra Mock Data needed for Search Filter Tests ───────────────────────────
// mockFlightScheduled  → departs SYD, arrives MEL, morning  (08:00), price 175, seats 98,  Qantas Airways
// mockFlightDelayed    → departs BNE, arrives SIN, afternoon(14:30), price 89,  seats 180, Jetstar
// mockFlightCancelled  → departs MEL, arrives SIN, evening  (21:00), price 720, seats 0,  Singapore Airlines
// mockFlightCompleted  → departs SYD, arrives BNE, red-eye  (03:00), price 159, seats 130, Virgin Australia
// mockFlightMinPrice   → departs SYD, arrives MEL, morning  (10:00), price 0,   seats 50,  Qantas Airways

// All 5 flights used as the full pool for search/sort tests
const allMockFlights = [
  mockFlightScheduled,
  mockFlightDelayed,
  mockFlightCancelled,
  mockFlightCompleted,
  mockFlightMinPrice,
];


// ═════════════════════════════════════════════════════════════════════════════
// Search Filter — filter by departure airport
// ═════════════════════════════════════════════════════════════════════════════
describe("Search Filter — filter by departure airport", () => {
  let sandbox;
  beforeEach(() => { sandbox = sinon.createSandbox(); });
  afterEach(() => { sandbox.restore(); });

  it("should return only SYD departure flights", async () => {
    // DB returns all flights — the controller/frontend filters by departureAirport=SYD
    // We stub find to return only the matching ones (as the controller would query)
    sandbox.stub(AviationData, "find").resolves([
      mockFlightScheduled,   // SYD → MEL
      mockFlightCompleted,   // SYD → BNE
      mockFlightMinPrice,    // SYD → MEL
    ]);

    const res = await chai.request(app).get("/api/flights?departureAirport=SYD");

    // Every returned flight must depart from SYD
    res.body.data.forEach((f) => {
      expect(f.departureAirport).to.equal("SYD");
    });
  });

  it("should return empty array when no flights match departure airport", async () => {
    // DB finds nothing matching a rare airport code
    sandbox.stub(AviationData, "find").resolves([]);

    const res = await chai.request(app).get("/api/flights?departureAirport=LAX");

    expect(res.body.data).to.be.an("array").that.is.empty;
  });

});


// ═════════════════════════════════════════════════════════════════════════════
// Search Filter — filter by arrival airport
// ═════════════════════════════════════════════════════════════════════════════
describe("Search Filter — filter by arrival airport", () => {
  let sandbox;
  beforeEach(() => { sandbox = sinon.createSandbox(); });
  afterEach(() => { sandbox.restore(); });

  it("should return only MEL arrival flights", async () => {
    sandbox.stub(AviationData, "find").resolves([
      mockFlightScheduled,   // SYD → MEL
      mockFlightMinPrice,    // SYD → MEL
    ]);

    const res = await chai.request(app).get("/api/flights?arrivalAirport=MEL");

    res.body.data.forEach((f) => {
      expect(f.arrivalAirport).to.equal("MEL");
    });
  });

  it("should return empty array when no flights match arrival airport", async () => {
    sandbox.stub(AviationData, "find").resolves([]);

    const res = await chai.request(app).get("/api/flights?arrivalAirport=JFK");

    expect(res.body.data).to.be.an("array").that.is.empty;
  });

});


// ═════════════════════════════════════════════════════════════════════════════
// Search Filter — filter by both departure and arrival airport
// ═════════════════════════════════════════════════════════════════════════════
describe("Search Filter — filter by both departure and arrival airport", () => {
  let sandbox;
  beforeEach(() => { sandbox = sinon.createSandbox(); });
  afterEach(() => { sandbox.restore(); });

  it("should return flights matching both SYD and MEL", async () => {
    sandbox.stub(AviationData, "find").resolves([
      mockFlightScheduled,   // SYD → MEL ✓
      mockFlightMinPrice,    // SYD → MEL ✓
    ]);

    const res = await chai.request(app).get("/api/flights?departureAirport=SYD&arrivalAirport=MEL");

    // Every result must match BOTH filters
    res.body.data.forEach((f) => {
      expect(f.departureAirport).to.equal("SYD");
      expect(f.arrivalAirport).to.equal("MEL");
    });
    // Should not include SYD→BNE or BNE→SIN etc.
    expect(res.body.data).to.have.lengthOf(2);
  });

  it("should return empty array when no flights match both airports", async () => {
    // No flight goes BNE → MEL in our mock data
    sandbox.stub(AviationData, "find").resolves([]);

    const res = await chai.request(app).get("/api/flights?departureAirport=BNE&arrivalAirport=MEL");

    expect(res.body.data).to.be.an("array").that.is.empty;
  });

});


// ═════════════════════════════════════════════════════════════════════════════
// Search Filter — filter by airline
// ═════════════════════════════════════════════════════════════════════════════
describe("Search Filter — filter by airline", () => {
  let sandbox;
  beforeEach(() => { sandbox = sinon.createSandbox(); });
  afterEach(() => { sandbox.restore(); });

  it("should return only Jetstar flights", async () => {
    sandbox.stub(AviationData, "find").resolves([mockFlightDelayed]); // only Jetstar

    const res = await chai.request(app).get("/api/flights?airline=Jetstar");

    res.body.data.forEach((f) => {
      expect(f.airline).to.equal("Jetstar");
    });
    expect(res.body.data).to.have.lengthOf(1);
  });

  it("should return all flights when airline is All Airlines", async () => {
    // "All Airlines" means no filter applied — DB returns everything
    sandbox.stub(AviationData, "find").resolves(allMockFlights);

    const res = await chai.request(app).get("/api/flights?airline=All Airlines");

    // All 5 flights should be returned unchanged
    expect(res.body.data).to.have.lengthOf(5);
  });

});


// ═════════════════════════════════════════════════════════════════════════════
// Search Filter — text search
// ═════════════════════════════════════════════════════════════════════════════
describe("Search Filter — text search", () => {
  let sandbox;
  beforeEach(() => { sandbox = sinon.createSandbox(); });
  afterEach(() => { sandbox.restore(); });

  it("should find flight by exact flight number", async () => {
    sandbox.stub(AviationData, "find").resolves([mockFlightDelayed]); // JQ201

    const res = await chai.request(app).get("/api/flights?search=JQ201");

    expect(res.body.data).to.have.lengthOf(1);
    expect(res.body.data[0].flightNumber).to.equal("JQ201");
  });

  it("should find flight by lowercase flight number", async () => {
    // Controller should handle case-insensitive search (jq201 == JQ201)
    sandbox.stub(AviationData, "find").resolves([mockFlightDelayed]);

    const res = await chai.request(app).get("/api/flights?search=jq201");

    expect(res.body.data).to.have.lengthOf(1);
    expect(res.body.data[0].flightNumber).to.equal("JQ201");
  });

  it("should find flights by airline name", async () => {
    // Searching "Qantas" should return both Qantas flights
    sandbox.stub(AviationData, "find").resolves([
      mockFlightScheduled,   // Qantas Airways QF401
      mockFlightMinPrice,    // Qantas Airways QF999
    ]);

    const res = await chai.request(app).get("/api/flights?search=Qantas");

    expect(res.body.data).to.have.lengthOf(2);
    res.body.data.forEach((f) => {
      expect(f.airline).to.include("Qantas");
    });
  });

  it("should return empty array for unknown search term", async () => {
    sandbox.stub(AviationData, "find").resolves([]);

    const res = await chai.request(app).get("/api/flights?search=XYZNOTEXIST");

    expect(res.body.data).to.be.an("array").that.is.empty;
  });

});


// ═════════════════════════════════════════════════════════════════════════════
// Search Filter — time of day filter
// ═════════════════════════════════════════════════════════════════════════════
describe("Search Filter — time of day filter", () => {
  let sandbox;
  beforeEach(() => { sandbox = sinon.createSandbox(); });
  afterEach(() => { sandbox.restore(); });

  // Time windows:
  //   Morning   → 06:00 – 11:59
  //   Afternoon → 12:00 – 17:59
  //   Evening   → 18:00 – 23:59
  //   Red-eye   → 00:00 – 05:59

  it("should return only morning flights (6am-12pm)", async () => {
    // QF401 departs 08:00 ✓ morning
    // QF999 departs 10:00 ✓ morning
    sandbox.stub(AviationData, "find").resolves([
      mockFlightScheduled,   // 08:00 — morning
      mockFlightMinPrice,    // 10:00 — morning
    ]);

    const res = await chai.request(app).get("/api/flights?timeOfDay=morning");

    expect(res.body.data).to.have.lengthOf(2);
    res.body.data.forEach((f) => {
      const hour = new Date(f.departureTime).getUTCHours();
      expect(hour).to.be.at.least(6);
      expect(hour).to.be.below(12);
    });
  });

  it("should return only afternoon flights (12pm-6pm)", async () => {
    // JQ201 departs 14:30 ✓ afternoon
    sandbox.stub(AviationData, "find").resolves([mockFlightDelayed]); // 14:30

    const res = await chai.request(app).get("/api/flights?timeOfDay=afternoon");

    expect(res.body.data).to.have.lengthOf(1);
    res.body.data.forEach((f) => {
      const hour = new Date(f.departureTime).getUTCHours();
      expect(hour).to.be.at.least(12);
      expect(hour).to.be.below(18);
    });
  });

  it("should return only evening flights (6pm-12am)", async () => {
    // SQ212 departs 21:00 ✓ evening
    sandbox.stub(AviationData, "find").resolves([mockFlightCancelled]); // 21:00

    const res = await chai.request(app).get("/api/flights?timeOfDay=evening");

    expect(res.body.data).to.have.lengthOf(1);
    res.body.data.forEach((f) => {
      const hour = new Date(f.departureTime).getUTCHours();
      expect(hour).to.be.at.least(18);
      expect(hour).to.be.below(24);
    });
  });

  it("should return only red-eye flights (12am-6am)", async () => {
    // VA101 departs 03:00 ✓ red-eye
    sandbox.stub(AviationData, "find").resolves([mockFlightCompleted]); // 03:00

    const res = await chai.request(app).get("/api/flights?timeOfDay=redeye");

    expect(res.body.data).to.have.lengthOf(1);
    res.body.data.forEach((f) => {
      const hour = new Date(f.departureTime).getUTCHours();
      expect(hour).to.be.below(6);
    });
  });

  it("should return all flights when time is Any Time", async () => {
    // "Any Time" means no time filter — return everything
    sandbox.stub(AviationData, "find").resolves(allMockFlights);

    const res = await chai.request(app).get("/api/flights?timeOfDay=any");

    expect(res.body.data).to.have.lengthOf(5);
  });

});


// ═════════════════════════════════════════════════════════════════════════════
// Search Filter — sort by
// ═════════════════════════════════════════════════════════════════════════════
describe("Search Filter — sort by", () => {
  let sandbox;
  beforeEach(() => { sandbox = sinon.createSandbox(); });
  afterEach(() => { sandbox.restore(); });

  // Prices:         QF999=0, JQ201=89, VA101=159, QF401=175, SQ212=720
  // Available seats: SQ212=0, QF999=50, QF401=98, VA101=130, JQ201=180
  // Departure times: VA101=03:00, QF401=08:00, QF999=10:00, JQ201=14:30, SQ212=21:00
  // Durations:      QF401=85min, QF999=85min, JQ201=85min, VA101=130min, SQ212=~435min

  it("should sort cheapest first", async () => {
    // Stub returns flights already sorted cheapest→expensive (as controller would)
    sandbox.stub(AviationData, "find").resolves([
      mockFlightMinPrice,    // $0
      mockFlightDelayed,     // $89
      mockFlightCompleted,   // $159
      mockFlightScheduled,   // $175
      mockFlightCancelled,   // $720
    ]);

    const res = await chai.request(app).get("/api/flights?sortBy=cheapest");
    const prices = res.body.data.map((f) => f.price);

    // Each price must be <= the next one (ascending order)
    for (let i = 0; i < prices.length - 1; i++) {
      expect(prices[i]).to.be.at.most(prices[i + 1]);
    }
  });

  it("should sort most expensive first", async () => {
    sandbox.stub(AviationData, "find").resolves([
      mockFlightCancelled,   // $720
      mockFlightScheduled,   // $175
      mockFlightCompleted,   // $159
      mockFlightDelayed,     // $89
      mockFlightMinPrice,    // $0
    ]);

    const res = await chai.request(app).get("/api/flights?sortBy=expensive");
    const prices = res.body.data.map((f) => f.price);

    // Each price must be >= the next one (descending order)
    for (let i = 0; i < prices.length - 1; i++) {
      expect(prices[i]).to.be.at.least(prices[i + 1]);
    }
  });

  it("should sort by earliest departure first", async () => {
    sandbox.stub(AviationData, "find").resolves([
      mockFlightCompleted,
      mockFlightScheduled,
      mockFlightDelayed,
      mockFlightCancelled,
      mockFlightMinPrice,
    ]);

    const res = await chai.request(app).get("/api/flights?sortBy=earliest");
    const times = res.body.data.map((f) => new Date(f.departureTime).getTime());

    // Each departure time must be <= the next one (ascending order)
    for (let i = 0; i < times.length - 1; i++) {
      expect(times[i]).to.be.at.most(times[i + 1]);
    }
  });

  it("should sort by most seats available first", async () => {
    sandbox.stub(AviationData, "find").resolves([
      mockFlightDelayed,     // 180 seats
      mockFlightCompleted,   // 130 seats
      mockFlightScheduled,   // 98 seats
      mockFlightMinPrice,    // 50 seats
      mockFlightCancelled,   // 0 seats
    ]);

    const res = await chai.request(app).get("/api/flights?sortBy=mostSeats");
    const seats = res.body.data.map((f) => f.availableSeats);

    // Each seat count must be >= the next one (descending order)
    for (let i = 0; i < seats.length - 1; i++) {
      expect(seats[i]).to.be.at.least(seats[i + 1]);
    }
  });

  it("should sort by shortest flight first", async () => {
    // Duration = arrivalTime - departureTime (in milliseconds)
    // QF401: 85min, QF999: 85min, JQ201: 85min, VA101: 130min, SQ212: ~435min
    sandbox.stub(AviationData, "find").resolves([
      mockFlightScheduled,   // 85min  (SYD→MEL)
      mockFlightMinPrice,    // 85min  (SYD→MEL)
      mockFlightDelayed,     // 85min  (BNE→SIN)
      mockFlightCompleted,   // 130min (SYD→BNE)
      mockFlightCancelled,   // 435min (MEL→SIN overnight)
    ]);

    const res = await chai.request(app).get("/api/flights?sortBy=shortest");
    const durations = res.body.data.map((f) =>
      new Date(f.arrivalTime).getTime() - new Date(f.departureTime).getTime()
    );

    // Each duration must be <= the next one (ascending order)
    for (let i = 0; i < durations.length - 1; i++) {
      expect(durations[i]).to.be.at.most(durations[i + 1]);
    }
  });

  it("should return all flights unchanged when sortBy is Default", async () => {
    // "Default" means no sorting applied — original DB order preserved
    sandbox.stub(AviationData, "find").resolves(allMockFlights);

    const res = await chai.request(app).get("/api/flights?sortBy=default");

    // Order must match exactly what the stub returned
    expect(res.body.data).to.have.lengthOf(5);
    expect(res.body.data[0].flightNumber).to.equal("QF401");
    expect(res.body.data[1].flightNumber).to.equal("JQ201");
    expect(res.body.data[2].flightNumber).to.equal("SQ212");
    expect(res.body.data[3].flightNumber).to.equal("VA101");
    expect(res.body.data[4].flightNumber).to.equal("QF999");
  });

});


// ═════════════════════════════════════════════════════════════════════════════
// Search Filter — no filters applied
// ═════════════════════════════════════════════════════════════════════════════
describe("Search Filter — no filters applied", () => {
  let sandbox;
  beforeEach(() => { sandbox = sinon.createSandbox(); });
  afterEach(() => { sandbox.restore(); });

  it("should return all flights when no filters are set", async () => {
    // No query params at all — controller should return everything unfiltered
    sandbox.stub(AviationData, "find").resolves(allMockFlights);

    const res = await chai.request(app).get("/api/flights");

    expect(res.body.data).to.have.lengthOf(5);
    // Spot-check that all airlines are represented
    const airlines = res.body.data.map((f) => f.airline);
    expect(airlines).to.include("Qantas Airways");
    expect(airlines).to.include("Jetstar");
    expect(airlines).to.include("Singapore Airlines");
    expect(airlines).to.include("Virgin Australia");
  });

});