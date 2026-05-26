import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../axiosConfig";

// search & filter Bar component
const SearchFilterBar = ({ filters, onChange, onReset, flights }) => {
  // fetch airlines from loaded flights dynamically
  const airlines = useMemo(() => {
    const set = new Set(flights.map((f) => f.airline).filter(Boolean));
    return ["All Airlines", ...Array.from(set).sort()];
  }, [flights]);

  // fetch airports for dropdowns dynamically
  const airports = useMemo(() => {
    const set = new Set([
      ...flights.map((f) => f.departureAirport),
      ...flights.map((f) => f.arrivalAirport),
    ]);
    return ["Any", ...Array.from(set).sort()];
  }, [flights]);

  const hasActiveFilters =
    filters.search ||
    filters.from !== "Any" ||
    filters.to !== "Any" ||
    filters.airline !== "All Airlines" ||
    filters.timeOfDay !== "Any Time" ||
    filters.sortBy !== "Default";

  return (
    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 space-y-4">
      {/* filter title + clear search row */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-black uppercase tracking-widest text-gray-400">
          Filter
        </h2>
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="text-xs text-red-500 font-bold hover:text-red-700 transition flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">close</span>
            Clear filters
          </button>
        )}
      </div>

      {/* search bar row */}
      <div className="relative">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl pointer-events-none">
          search
        </span>
        <input
          type="text"
          placeholder="Search by flight number or airline…"
          value={filters.search}
          onChange={(e) => onChange("search", e.target.value)}
          className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-800 placeholder:text-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition"
        />
      </div>

      {/* From and To filter section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* From filter */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 pl-1">
            From
          </label>
          <select
            value={filters.from}
            onChange={(e) => onChange("from", e.target.value)}
            className="p-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 outline-none focus:border-blue-500 bg-white cursor-pointer"
          >
            {airports.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        {/* To filter */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 pl-1">
            To
          </label>
          <select
            value={filters.to}
            onChange={(e) => onChange("to", e.target.value)}
            className="p-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 outline-none focus:border-blue-500 bg-white cursor-pointer"
          >
            {airports.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Third filter row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Airline filter */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 pl-1">
            Airline
          </label>
          <select
            value={filters.airline}
            onChange={(e) => onChange("airline", e.target.value)}
            className="p-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 outline-none focus:border-blue-500 bg-white cursor-pointer"
          >
            {airlines.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        {/* Departure Time filter */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 pl-1">
            Departure Time
          </label>
          <select
            value={filters.timeOfDay}
            onChange={(e) => onChange("timeOfDay", e.target.value)}
            className="p-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 outline-none focus:border-blue-500 bg-white cursor-pointer"
          >
            <option value="Any Time">Any Time</option>
            <option value="Morning">Morning (6am – 12pm)</option>
            <option value="Afternoon">Afternoon (12pm – 6pm)</option>
            <option value="Evening">Evening (6pm – 12am)</option>
            <option value="Red-eye">Red-eye (12am – 6am)</option>
          </select>
        </div>

        {/* Sort by filter */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 pl-1">
            Sort By
          </label>
          <select
            value={filters.sortBy}
            onChange={(e) => onChange("sortBy", e.target.value)}
            className="p-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 outline-none focus:border-blue-500 bg-white cursor-pointer"
          >
            <option value="Default">Default</option>
            <option value="Cheapest">Cheapest</option>
            <option value="Expensive">Most Expensive</option>
            <option value="Shortest">Quickest Flight</option>
            <option value="Seats">Most Seats Available</option>
          </select>
        </div>
      </div>

      {/* Flight results count */}
      <div className="pt-1">
        <p className="text-xs text-gray-400 font-semibold">
          Showing{" "}
          <span className="text-blue-600 font-bold">{filters.resultCount}</span>{" "}
          flight{filters.resultCount !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
};

// default filters
const DEFAULT_FILTERS = {
  search: "",
  from: "Any",
  to: "Any",
  airline: "All Airlines",
  timeOfDay: "Any Time",
  sortBy: "Default",
  resultCount: 0,
};

const FlightCatalog = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [flights, setFlights] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [selectedFlightId, setSelectedFlightId] = useState(null);
  const [bookingPayload, setBookingPayload] = useState({
    passengers: 1,
    targetUserEmail: "",
  });

  // filter state
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  useEffect(() => {
    const fetchAvailableFlights = async () => {
      try {
        setIsLoading(true);
        const response = await axiosInstance.get("/flights");

        const fetchedData = response.data.data || response.data;
        const allFlights = Array.isArray(fetchedData) ? fetchedData : [];

        // Only display active, future scheduled flights
        const now = new Date();
        const futureFlights = allFlights.filter(
          (flight) =>
            flight.departureTime && new Date(flight.departureTime) > now,
        );

        setFlights(futureFlights);
      } catch (err) {
        console.error("Failed to load flights:", err);
        setErrorMsg(
          "Could not retrieve available flight listings. Please try again later.",
        );
      } finally {
        setIsLoading(false);
      }
    };
    fetchAvailableFlights();
  }, []);

  // apply filters client-side
  const filteredFlights = useMemo(() => {
    let results = [...flights];

    // searchbar: flight number or airline
    if (filters.search.trim()) {
      const term = filters.search.trim().toLowerCase();
      results = results.filter(
        (f) =>
          f.flightNumber?.toLowerCase().includes(term) ||
          f.airline?.toLowerCase().includes(term),
      );
    }

    // From which airport filter
    if (filters.from !== "Any") {
      results = results.filter((f) => f.departureAirport === filters.from);
    }

    // To which airport filter
    if (filters.to !== "Any") {
      results = results.filter((f) => f.arrivalAirport === filters.to);
    }

    // Specific Airline filter
    if (filters.airline !== "All Airlines") {
      results = results.filter((f) => f.airline === filters.airline);
    }

    // Time of day of flight
    if (filters.timeOfDay !== "Any Time") {
      results = results.filter((f) => {
        if (!f.departureTime) return false;
        const hour = new Date(f.departureTime).getHours();
        switch (filters.timeOfDay) {
          case "Morning":
            return hour >= 6 && hour < 12;
          case "Afternoon":
            return hour >= 12 && hour < 18;
          case "Evening":
            return hour >= 18 && hour < 24;
          case "Red-eye":
            return hour >= 0 && hour < 6;
          default:
            return true;
        }
      });
    }

    // Sort-by
    if (filters.sortBy !== "Default") {
      results = [...results].sort((a, b) => {
        switch (filters.sortBy) {
          case "Cheapest":
            return (a.price || 0) - (b.price || 0);
          case "Expensive":
            return (b.price || 0) - (a.price || 0);
          case "Shortest": {
            const durA = new Date(a.arrivalTime) - new Date(a.departureTime);
            const durB = new Date(b.arrivalTime) - new Date(b.departureTime);
            return durA - durB;
          }
          case "Seats":
            return (b.availableSeats || 0) - (a.availableSeats || 0);
          default:
            return 0;
        }
      });
    }
    return results;
  }, [flights, filters]);

  // Keep result count in sync
  useEffect(() => {
    setFilters((prev) => ({ ...prev, resultCount: filteredFlights.length }));
  }, [filteredFlights.length]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setSelectedFlightId(null);
  };

  const handleResetFilters = () => {
    setFilters({ ...DEFAULT_FILTERS, resultCount: flights.length });
    setSelectedFlightId(null);
  };

  const handleConfirmBooking = (flightId) => {
    if (!user) {
      alert("Please login or register an account to book a flight.");
      navigate("/login");
      return;
    }

    if (bookingPayload.passengers < 1) {
      alert("Passenger count must be at least 1.");
      return;
    }

    navigate("/select-seats", {
      state: {
        flightId,
        passengers: parseInt(bookingPayload.passengers, 10),
        targetUserEmail:
          user.role === "admin" ? bookingPayload.targetUserEmail : "",
      },
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f7f9fc] flex items-center justify-center">
        <p className="text-blue-600 font-bold text-lg tracking-wide">
          Loading available flights...
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#f7f9fc] text-gray-900 min-h-screen pb-20 font-sans selection:bg-blue-200">
      <main className="max-w-6xl mx-auto px-6 py-12 space-y-10">
        {/* Header Section */}
        <div className="border-b border-gray-200 pb-8 text-center">
          <h1 className="text-5xl font-extrabold tracking-tight text-slate-900">
            Available Scheduled Flights
          </h1>
          <p className="text-gray-500 mt-4 font-medium text-lg">
            Select an active departure schedule below to manage or confirm
            allocations.
          </p>
          {errorMsg && (
            <p className="mt-4 text-red-600 font-semibold bg-red-50 p-4 rounded-xl border border-red-200 inline-block">
              {errorMsg}
            </p>
          )}
        </div>

        {/* ── Search & Filter Bar ── */}
        <SearchFilterBar
          filters={filters}
          onChange={handleFilterChange}
          onReset={handleResetFilters}
          flights={flights}
        />

        {/* Flight List Container */}
        <div className="space-y-8">
          {filteredFlights.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-3xl border shadow-sm space-y-3">
              <p className="text-gray-500 font-medium">
                {flights.length === 0
                  ? "No flights are currently configured in the scheduling database."
                  : "No flights match your search criteria."}
              </p>
              {flights.length > 0 && (
                <button
                  onClick={handleResetFilters}
                  className="text-sm text-blue-600 font-bold hover:underline"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            filteredFlights.map((flight) => {
              const isBookingThis = selectedFlightId === flight._id;

              return (
                <div
                  key={flight._id}
                  onClick={() => {
                    if (flight.availableSeats >= 1) {
                      setSelectedFlightId(isBookingThis ? null : flight._id);
                    }
                  }}
                  className={`bg-white rounded-3xl border p-8 shadow-sm transition-all duration-300 select-none ${
                    flight.availableSeats < 1
                      ? "opacity-70 border-gray-200 cursor-not-allowed"
                      : isBookingThis
                        ? "border-blue-500 ring-2 ring-blue-500/10 shadow-md cursor-pointer"
                        : "border-gray-200 hover:border-blue-400 hover:shadow-xl cursor-pointer"
                  }`}
                >
                  {/* Main Row Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-5 items-start gap-8">
                    {/* Flight Number */}
                    <div className="flex flex-col items-start justify-center gap-1">
                      <span className="text-[15px] text-gray-400 font-bold uppercase tracking-wider">
                        Flight Number
                      </span>
                      <span className="text-3xl font-black text-slate-900 tracking-tighter mt-1">
                        {flight.flightNumber}
                      </span>
                      {/* Status badge */}
                      {flight.status && flight.status !== "scheduled" && (
                        <span
                          className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full mt-1 ${
                            flight.status === "delayed"
                              ? "bg-amber-100 text-amber-700"
                              : flight.status === "cancelled"
                                ? "bg-red-100 text-red-600"
                                : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {flight.status}
                        </span>
                      )}
                    </div>

                    {/* Departure Time */}
                    <div className="flex flex-col items-center md:items-start border-l border-gray-100 pl-0 md:pl-6">
                      <span className="text-[15px] text-gray-400 font-bold uppercase tracking-wider">
                        Departure
                      </span>
                      <span className="text-3xl font-black text-slate-900 tracking-tight">
                        {flight.departureTime
                          ? new Date(flight.departureTime).toLocaleTimeString(
                              [],
                              { hour: "2-digit", minute: "2-digit" },
                            )
                          : "--:--"}
                      </span>
                      <span className="text-sm font-semibold text-gray-500">
                        {flight.departureAirport} •{" "}
                        {flight.departureTime
                          ? new Date(flight.departureTime).toLocaleDateString(
                              [],
                              { month: "short", day: "numeric" },
                            )
                          : ""}
                      </span>
                    </div>

                    {/* Route Graphic */}
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-[12px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-0.5 rounded mb-2">
                        {flight.airline || "Commercial"}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[20px]">
                          {flight.departureAirport}
                        </span>
                        <span className="material-symbols-outlined text-blue-500">
                          arrow_right_alt
                        </span>
                        <span className="font-bold text-[20px]">
                          {flight.arrivalAirport}
                        </span>
                      </div>
                      <span className="text-[15px] text-gray-400 font-bold uppercase tracking-wider mt-1">
                        Direct Route
                      </span>
                    </div>

                    {/* Arrival Time */}
                    <div className="flex flex-col items-center md:items-end">
                      <span className="text-[15px] text-gray-400 font-bold uppercase tracking-wider">
                        Arrival
                      </span>
                      <span className="text-3xl font-black text-slate-900 tracking-tight">
                        {flight.arrivalTime
                          ? new Date(flight.arrivalTime).toLocaleTimeString(
                              [],
                              { hour: "2-digit", minute: "2-digit" },
                            )
                          : "--:--"}
                      </span>
                      <span className="text-sm font-semibold text-gray-500">
                        {flight.arrivalAirport} •{" "}
                        {flight.arrivalTime
                          ? new Date(flight.arrivalTime).toLocaleDateString(
                              [],
                              { month: "short", day: "numeric" },
                            )
                          : ""}
                      </span>
                    </div>

                    {/* Price & Seats */}
                    <div className="flex flex-col items-center md:items-end border-l border-gray-100 pl-0 md:pl-6 w-full">
                      <span className="text-[15px] text-gray-400 font-bold uppercase tracking-wider">
                        Fare & Seats
                      </span>
                      <div className="flex flex-col items-center md:items-end mt-1 w-full">
                        <span className="text-3xl font-black text-emerald-600 tracking-tight">
                          ${flight.price?.toFixed(2)}
                        </span>
                        <span
                          className={`text-xs font-semibold mt-1 ${
                            flight.availableSeats > 0
                              ? "text-blue-600"
                              : "text-red-500"
                          }`}
                        >
                          {flight.availableSeats > 0
                            ? `${flight.availableSeats} Seats Left`
                            : "Sold Out"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Expandable Booking Drawer */}
                  {isBookingThis && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="mt-8 pt-8 border-t border-gray-100 bg-gray-50/70 p-6 rounded-2xl space-y-6"
                    >
                      <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider">
                        Configure Booking Allocation
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col">
                          <label className="text-xs text-gray-500 font-bold uppercase mb-2">
                            Number of Passengers
                          </label>
                          <select
                            value={bookingPayload.passengers}
                            onChange={(e) =>
                              setBookingPayload({
                                ...bookingPayload,
                                passengers: parseInt(e.target.value, 10),
                              })
                            }
                            className="p-3 border border-gray-300 bg-white rounded-xl text-base font-semibold text-gray-900 outline-none focus:border-blue-500 w-full"
                          >
                            {Array.from(
                              { length: Math.min(6, flight.availableSeats) },
                              (_, i) => i + 1,
                            ).map((num) => (
                              <option key={num} value={num}>
                                {num} Passenger{num > 1 ? "s" : ""}
                              </option>
                            ))}
                          </select>
                        </div>

                        {user?.role === "admin" && (
                          <div className="flex flex-col">
                            <label className="text-xs text-amber-700 font-bold uppercase mb-2">
                              Admin: Target User Email
                            </label>
                            <input
                              type="email"
                              placeholder="passenger@example.com"
                              value={bookingPayload.targetUserEmail}
                              onChange={(e) =>
                                setBookingPayload({
                                  ...bookingPayload,
                                  targetUserEmail: e.target.value,
                                })
                              }
                              className="p-3 border border-amber-300 bg-white rounded-xl text-base text-gray-900 outline-none focus:border-amber-500"
                            />
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-2xl border border-gray-200 shadow-sm gap-4">
                        <div>
                          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                            Estimated Total
                          </p>
                          <p className="text-3xl font-black text-blue-600">
                            $
                            {(
                              (flight.price || 0) * bookingPayload.passengers
                            ).toFixed(2)}
                          </p>
                        </div>
                        <button
                          onClick={() => handleConfirmBooking(flight._id)}
                          disabled={
                            flight.availableSeats < bookingPayload.passengers
                          }
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-10 rounded-2xl shadow-sm transition-all text-sm uppercase tracking-wider"
                        >
                          Confirm Booking
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
};

export default FlightCatalog;
