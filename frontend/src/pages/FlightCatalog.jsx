import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../axiosConfig";

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

        {/* Flight List Container */}
        <div className="space-y-8">
          {flights.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-3xl border shadow-sm text-gray-500 font-medium">
              No flights are currently configured in the scheduling database.
            </div>
          ) : (
            flights.map((flight) => {
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
                  {/* Main Row Grid: 5 Columns for balanced spacing aligned to the top */}
                  <div className="grid grid-cols-1 md:grid-cols-5 items-start gap-8">
                    {/* Flight Number */}
                    <div className="flex flex-col items-start justify-center gap-1">
                      <span className="text-[15px] text-gray-400 font-bold uppercase tracking-wider">
                        Flight Number
                      </span>
                      <span className="text-3xl font-black text-slate-900 tracking-tighter mt-1">
                        {flight.flightNumber}
                      </span>
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

                    {/* Price & Action Info */}
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
                                {num} Passenger {num > 1 ? "s" : ""}
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
