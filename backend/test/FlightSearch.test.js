const chai = require("chai");
const chaiHttp = require("chai-http");
const sinon = require("sinon");
const mongoose = require("mongoose");
const Joi = require("joi");
const { expect } = chai;

chai.use(chaiHttp);

const app = require("../server");
const AviationData = require("../models/AviationDatas");


// ═════════════════════════════════════════════════════════════════════════════
// Mock Data
// ═════════════════════════════════════════════════════════════════════════════

const mockFlightScheduled = {
  _id: new mongoose.Types.ObjectId(),
  airline: "Qantas Airways",
  flightNumber: "QF401",
  departureAirport: "SYD",
  arrivalAirport: "MEL",
  departureTime: new Date("2026-06-01T08:00:00.000Z"),   // Morning
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
  departureTime: new Date("2026-06-01T14:30:00.000Z"),   // Afternoon
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
  departureTime: new Date("2026-06-02T21:00:00.000Z"),   // Evening
  arrivalTime:   new Date("2026-06-03T04:15:00.000Z"),   // Overnight — crosses midnight
  price: 720,
  availableSeats: 0,                                      // Fully booked
  bookedSeats: [],
  status: "cancelled",
};

const mockFlightCompleted = {
  _id: new mongoose.Types.ObjectId(),
  airline: "Virgin Australia",
  flightNumber: "VA101",
  departureAirport: "SYD",
  arrivalAirport: "BNE",
  departureTime: new Date("2025-01-01T03:00:00.000Z"),   // Red-eye
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
  price: 0,                                               // Boundary: zero price
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

const allMockFlights = [
  mockFlightScheduled,
  mockFlightDelayed,
  mockFlightCancelled,
  mockFlightCompleted,
  mockFlightMinPrice,
];


// ═════════════════════════════════════════════════════════════════════════════
// Joi Schema — defines the shape every flight response must match
// Instead of one test per field, Joi validates the entire object at once.
// ═════════════════════════════════════════════════════════════════════════════

const flightSchema = Joi.object({
  _id:               Joi.string().required(),
  airline:           Joi.string().required(),
  flightNumber:      Joi.string().required(),
  departureAirport:  Joi.string().max(3).required(),
  arrivalAirport:    Joi.string().max(3).required(),
  departureTime:     Joi.string().isoDate().required(),
  arrivalTime:       Joi.string().isoDate().required(),
  price:             Joi.number().min(0).required(),
  availableSeats:    Joi.number().min(0).required(),
  bookedSeats:       Joi.array().required(),
  status:            Joi.string().valid("scheduled", "delayed", "cancelled", "completed").required(),
}).unknown(true);  // allow __v and other Mongoose fields through without failing


// ═════════════════════════════════════════════════════════════════════════════
// GET /api/flights
// ═════════════════════════════════════════════════════════════════════════════
describe("GET /api/flights", () => {
  let sandbox;
  beforeEach(() => { sandbox = sinon.createSandbox(); });
  afterEach(() => { sandbox.restore(); });

  // ── Schema Test (replaces all individual field tests) ──────────────────────
  // One test that validates the entire response shape at once using Joi

  it("should return flights that match the full flight schema", async () => {
    sandbox.stub(AviationData, "find").resolves(mockFlights);
    const res = await chai.request(app).get("/api/flights");

    // Every flight in the response must pass the Joi schema
    res.body.data.forEach((flight) => {
      const { error } = flightSchema.validate(flight);
      expect(error, `Schema failed for flight ${flight.flightNumber}: ${error?.message}`).to.be.undefined;
    });
  });

  // ── Business State — all statuses must be fetchable ────────────────────────

  it("should return all 4 status types without excluding any", async () => {
    sandbox.stub(AviationData, "find").resolves(mockFlights);
    const res = await chai.request(app).get("/api/flights");
    const statuses = res.body.data.map((f) => f.status);
    ["scheduled", "delayed", "cancelled", "completed"].forEach((s) => {
      expect(statuses).to.include(s);
    });
  });

  it("should return overnight flight with arrivalTime after departureTime", async () => {
    sandbox.stub(AviationData, "find").resolves([mockFlightCancelled]);
    const res = await chai.request(app).get("/api/flights");
    const flight = res.body.data[0];
    expect(new Date(flight.arrivalTime).getTime()).to.be.greaterThan(
      new Date(flight.departureTime).getTime()
    );
  });

  // ── DB State Variations ────────────────────────────────────────────────────

  it("should return empty data array when DB has no flights", async () => {
    sandbox.stub(AviationData, "find").resolves([]);
    const res = await chai.request(app).get("/api/flights");
    expect(res.body.data).to.be.an("array").that.is.empty;
  });

  it("should return all 100 flights without dropping any", async () => {
    const manyFlights = Array.from({ length: 100 }, (_, i) => ({
      ...mockFlightScheduled,
      _id: new mongoose.Types.ObjectId(),
      flightNumber: `QF${100 + i}`,
    }));
    sandbox.stub(AviationData, "find").resolves(manyFlights);
    const res = await chai.request(app).get("/api/flights");
    expect(res.body.data).to.have.lengthOf(100);
  });

  it("should preserve the DB order of flights", async () => {
    sandbox.stub(AviationData, "find").resolves(mockFlights);
    const res = await chai.request(app).get("/api/flights");
    const numbers = res.body.data.map((f) => f.flightNumber);
    expect(numbers).to.deep.equal(["QF401", "JQ201", "SQ212", "VA101"]);
  });

});


// ═════════════════════════════════════════════════════════════════════════════
// GET /api/flights/:id
// ═════════════════════════════════════════════════════════════════════════════
describe("GET /api/flights/:id", () => {
  let sandbox;
  beforeEach(() => { sandbox = sinon.createSandbox(); });
  afterEach(() => { sandbox.restore(); });

  // ── Schema Test ────────────────────────────────────────────────────────────

  it("should return a flight that matches the full flight schema", async () => {
    sandbox.stub(AviationData, "findById").resolves(mockFlightScheduled);
    const res = await chai.request(app).get(`/api/flights/${mockFlightScheduled._id}`);

    const { error } = flightSchema.validate(res.body.data);
    expect(error, `Schema failed: ${error?.message}`).to.be.undefined;
  });

  // ── Business State — all statuses reachable by ID ─────────────────────────
  // Data-driven: one loop covers all 4 status cases instead of 4 separate tests

  const statusCases = [
    { label: "scheduled", mock: mockFlightScheduled },
    { label: "delayed",   mock: mockFlightDelayed   },
    { label: "cancelled", mock: mockFlightCancelled },
    { label: "completed", mock: mockFlightCompleted },
  ];

  statusCases.forEach(({ label, mock }) => {
    it(`should return a ${label} flight by ID`, async () => {
      sandbox.stub(AviationData, "findById").resolves(mock);
      const res = await chai.request(app).get(`/api/flights/${mock._id}`);
      expect(res.body.data.status).to.equal(label);
    });
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

  it("should return overnight flight with arrivalTime after departureTime", async () => {
    sandbox.stub(AviationData, "findById").resolves(mockFlightCancelled);
    const res = await chai.request(app).get(`/api/flights/${mockFlightCancelled._id}`);
    expect(new Date(res.body.data.arrivalTime).getTime()).to.be.greaterThan(
      new Date(res.body.data.departureTime).getTime()
    );
  });

  // ── Invalid ID Formats — data-driven ──────────────────────────────────────
  // One loop replaces 5 separate identical tests — DRY principle

  const invalidIds = [
    { label: "random string",     id: "not-a-valid-id"    },
    { label: "numeric",           id: "12345"             },
    { label: "special characters",id: "!!!invalid!!!"     },
    { label: "too short",         id: "abc"               },
    { label: "too long",          id: "a".repeat(100)     },
  ];

  invalidIds.forEach(({ label, id }) => {
    it(`should fail gracefully for a ${label} ID`, async () => {
      const res = await chai.request(app).get(`/api/flights/${id}`);
      expect(res.body).to.have.property("success", false);
    });
  });

});


// ═════════════════════════════════════════════════════════════════════════════
// Search Filter — filter by departure airport
// ═════════════════════════════════════════════════════════════════════════════
describe("Search Filter — filter by departure airport", () => {
  let sandbox;
  beforeEach(() => { sandbox = sinon.createSandbox(); });
  afterEach(() => { sandbox.restore(); });

  it("should return only SYD departure flights", async () => {
    sandbox.stub(AviationData, "find").resolves([mockFlightScheduled, mockFlightCompleted, mockFlightMinPrice]);
    const res = await chai.request(app).get("/api/flights?departureAirport=SYD");
    res.body.data.forEach((f) => expect(f.departureAirport).to.equal("SYD"));
  });

  it("should return empty array when no flights match departure airport", async () => {
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
    sandbox.stub(AviationData, "find").resolves([mockFlightScheduled, mockFlightMinPrice]);
    const res = await chai.request(app).get("/api/flights?arrivalAirport=MEL");
    res.body.data.forEach((f) => expect(f.arrivalAirport).to.equal("MEL"));
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
    sandbox.stub(AviationData, "find").resolves([mockFlightScheduled, mockFlightMinPrice]);
    const res = await chai.request(app).get("/api/flights?departureAirport=SYD&arrivalAirport=MEL");
    expect(res.body.data).to.have.lengthOf(2);
    res.body.data.forEach((f) => {
      expect(f.departureAirport).to.equal("SYD");
      expect(f.arrivalAirport).to.equal("MEL");
    });
  });

  it("should return empty array when no flights match both airports", async () => {
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
    sandbox.stub(AviationData, "find").resolves([mockFlightDelayed]);
    const res = await chai.request(app).get("/api/flights?airline=Jetstar");
    res.body.data.forEach((f) => expect(f.airline).to.equal("Jetstar"));
    expect(res.body.data).to.have.lengthOf(1);
  });

  it("should return all flights when airline is All Airlines", async () => {
    sandbox.stub(AviationData, "find").resolves(allMockFlights);
    const res = await chai.request(app).get("/api/flights?airline=All Airlines");
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
    sandbox.stub(AviationData, "find").resolves([mockFlightDelayed]);
    const res = await chai.request(app).get("/api/flights?search=JQ201");
    expect(res.body.data[0].flightNumber).to.equal("JQ201");
  });

  it("should find flight by lowercase flight number (case-insensitive)", async () => {
    sandbox.stub(AviationData, "find").resolves([mockFlightDelayed]);
    const res = await chai.request(app).get("/api/flights?search=jq201");
    expect(res.body.data[0].flightNumber).to.equal("JQ201");
  });

  it("should find flights by airline name", async () => {
    sandbox.stub(AviationData, "find").resolves([mockFlightScheduled, mockFlightMinPrice]);
    const res = await chai.request(app).get("/api/flights?search=Qantas");
    expect(res.body.data).to.have.lengthOf(2);
    res.body.data.forEach((f) => expect(f.airline).to.include("Qantas"));
  });

  it("should return empty array for unknown search term", async () => {
    sandbox.stub(AviationData, "find").resolves([]);
    const res = await chai.request(app).get("/api/flights?search=XYZNOTEXIST");
    expect(res.body.data).to.be.an("array").that.is.empty;
  });

});


// ═════════════════════════════════════════════════════════════════════════════
// Search Filter — time of day
// ═════════════════════════════════════════════════════════════════════════════
describe("Search Filter — time of day filter", () => {
  let sandbox;
  beforeEach(() => { sandbox = sinon.createSandbox(); });
  afterEach(() => { sandbox.restore(); });

  // Data-driven: each time slot, the expected mock, and its valid hour range
  // Time windows: morning 6-11, afternoon 12-17, evening 18-23, redeye 0-5
  const timeCases = [
    { slot: "morning",   mocks: [mockFlightScheduled, mockFlightMinPrice], minHour: 6,  maxHour: 11 },
    { slot: "afternoon", mocks: [mockFlightDelayed],                       minHour: 12, maxHour: 17 },
    { slot: "evening",   mocks: [mockFlightCancelled],                     minHour: 18, maxHour: 23 },
    { slot: "redeye",    mocks: [mockFlightCompleted],                     minHour: 0,  maxHour: 5  },
  ];

  timeCases.forEach(({ slot, mocks, minHour, maxHour }) => {
    it(`should return only ${slot} flights`, async () => {
      sandbox.stub(AviationData, "find").resolves(mocks);
      const res = await chai.request(app).get(`/api/flights?timeOfDay=${slot}`);
      res.body.data.forEach((f) => {
        const hour = new Date(f.departureTime).getUTCHours();
        expect(hour).to.be.at.least(minHour);
        expect(hour).to.be.at.most(maxHour);
      });
    });
  });

  it("should return all flights when time is Any Time", async () => {
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

  it("should sort cheapest first", async () => {
    sandbox.stub(AviationData, "find").resolves([mockFlightMinPrice, mockFlightDelayed, mockFlightCompleted, mockFlightScheduled, mockFlightCancelled]);
    const res = await chai.request(app).get("/api/flights?sortBy=cheapest");
    const prices = res.body.data.map((f) => f.price);
    for (let i = 0; i < prices.length - 1; i++) {
      expect(prices[i]).to.be.at.most(prices[i + 1]);
    }
  });

  it("should sort most expensive first", async () => {
    sandbox.stub(AviationData, "find").resolves([mockFlightCancelled, mockFlightScheduled, mockFlightCompleted, mockFlightDelayed, mockFlightMinPrice]);
    const res = await chai.request(app).get("/api/flights?sortBy=expensive");
    const prices = res.body.data.map((f) => f.price);
    for (let i = 0; i < prices.length - 1; i++) {
      expect(prices[i]).to.be.at.least(prices[i + 1]);
    }
  });

  it("should sort by earliest departure first", async () => {
    sandbox.stub(AviationData, "find").resolves([mockFlightCompleted, mockFlightScheduled, mockFlightDelayed, mockFlightCancelled, mockFlightMinPrice]);
    const res = await chai.request(app).get("/api/flights?sortBy=earliest");
    const times = res.body.data.map((f) => new Date(f.departureTime).getTime());
    for (let i = 0; i < times.length - 1; i++) {
      expect(times[i]).to.be.at.most(times[i + 1]);
    }
  });

  it("should sort by most seats available first", async () => {
    sandbox.stub(AviationData, "find").resolves([mockFlightDelayed, mockFlightCompleted, mockFlightScheduled, mockFlightMinPrice, mockFlightCancelled]);
    const res = await chai.request(app).get("/api/flights?sortBy=mostSeats");
    const seats = res.body.data.map((f) => f.availableSeats);
    for (let i = 0; i < seats.length - 1; i++) {
      expect(seats[i]).to.be.at.least(seats[i + 1]);
    }
  });

  it("should sort by shortest flight first", async () => {
    sandbox.stub(AviationData, "find").resolves([mockFlightScheduled, mockFlightMinPrice, mockFlightDelayed, mockFlightCompleted, mockFlightCancelled]);
    const res = await chai.request(app).get("/api/flights?sortBy=shortest");
    const durations = res.body.data.map((f) =>
      new Date(f.arrivalTime).getTime() - new Date(f.departureTime).getTime()
    );
    for (let i = 0; i < durations.length - 1; i++) {
      expect(durations[i]).to.be.at.most(durations[i + 1]);
    }
  });

  it("should return all flights in original DB order when sortBy is default", async () => {
    sandbox.stub(AviationData, "find").resolves(allMockFlights);
    const res = await chai.request(app).get("/api/flights?sortBy=default");
    const numbers = res.body.data.map((f) => f.flightNumber);
    expect(numbers).to.deep.equal(["QF401", "JQ201", "SQ212", "VA101", "QF999"]);
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
    sandbox.stub(AviationData, "find").resolves(allMockFlights);
    const res = await chai.request(app).get("/api/flights");
    expect(res.body.data).to.have.lengthOf(5);
    const airlines = res.body.data.map((f) => f.airline);
    expect(airlines).to.include("Qantas Airways");
    expect(airlines).to.include("Jetstar");
    expect(airlines).to.include("Singapore Airlines");
    expect(airlines).to.include("Virgin Australia");
  });

});