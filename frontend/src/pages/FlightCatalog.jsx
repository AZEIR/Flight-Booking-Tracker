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
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchAvailableFlights = async () => {
      try {
        setIsLoading(true);
        const response = await axiosInstance.get("/flights");

        const fetchedData = response.data.data || response.data;
        setFlights(Array.isArray(fetchedData) ? fetchedData : []);
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

  const handleConfirmBooking = async (flightId) => {
    if (!user) {
      alert("Please login or register an account to book a flight.");
      navigate("/login");
      return;
    }

    if (bookingPayload.passengers < 1) {
      alert("Passenger count must be at least 1.");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        flightId,
        passengers: parseInt(bookingPayload.passengers, 10),
      };

      if (
        user.role === "admin" &&
        bookingPayload.targetUserEmail.trim() !== ""
      ) {
        payload.targetUserEmail = bookingPayload.targetUserEmail
          .trim()
          .toLowerCase();
      }

      await axiosInstance.post("/bookings", payload);
      alert("Booking created successfully within ledger system!");

      setSelectedFlightId(null);
      setBookingPayload({ passengers: 1, targetUserEmail: "" });
      navigate("/dashboard");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to issue booking entry.");
    } finally {
      setIsSubmitting(false);
    }
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
                  className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm hover:shadow-xl transition-all duration-300"
                >
                  {/* Main Row Grid: 5 Columns for balanced spacing */}
                  <div className="grid grid-cols-1 md:grid-cols-5 items-center gap-8">
                    {/* Column 1: Airline & Flight Number */}
                    <div className="flex flex-col items-start justify-center gap-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                        {flight.airline || "Commercial"}
                      </span>
                      <span className="text-3xl font-black text-slate-900 tracking-tighter mt-1">
                        {flight.flightNumber}
                      </span>
                      <span className="inline-block mt-2 px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-green-50 text-green-700 border border-green-200">
                        {flight.status || "scheduled"}
                      </span>
                    </div>

                    {/* Column 2: Departure Time */}
                    <div className="flex flex-col items-center md:items-start border-l border-gray-100 pl-0 md:pl-6">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
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

                    {/* Column 3: Route Graphic */}
                    <div className="flex flex-col items-center justify-center">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg">
                          {flight.departureAirport}
                        </span>
                        <span className="material-symbols-outlined text-blue-500">
                          arrow_right_alt
                        </span>
                        <span className="font-bold text-lg">
                          {flight.arrivalAirport}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">
                        Direct Route
                      </span>
                    </div>

                    {/* Column 4: Arrival Time */}
                    <div className="flex flex-col items-center md:items-end">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
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

                    {/* Column 5: Price & Action */}
                    <div className="flex flex-col items-center md:items-end gap-2 border-l border-gray-100 pl-0 md:pl-6">
                      <div className="text-center md:text-right">
                        <p
                          className={`text-[15px] font-bold ${flight.availableSeats > 0 ? "text-blue-600" : "text-red-500"}`}
                        >
                          {flight.availableSeats} Seats Left
                        </p>
                        <p className="text-2xl font-black text-emerald-600">
                          ${flight.price?.toFixed(2)}
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          setSelectedFlightId(isBookingThis ? null : flight._id)
                        }
                        disabled={flight.availableSeats < 1}
                        className={`w-full px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-sm ${
                          flight.availableSeats < 1
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                            : isBookingThis
                              ? "bg-slate-200 text-slate-700"
                              : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                      >
                        {flight.availableSeats < 1
                          ? "Sold Out"
                          : isBookingThis
                            ? "Close"
                            : "Book Seats"}
                      </button>
                    </div>
                  </div>

                  {/* Expandable Booking Drawer */}
                  {isBookingThis && (
                    <div className="mt-8 pt-8 border-t border-gray-100 bg-gray-50/70 p-6 rounded-2xl space-y-6">
                      <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider">
                        Configure Booking Allocation
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col">
                          <label className="text-xs text-gray-500 font-bold uppercase mb-2">
                            Number of Tickets
                          </label>
                          <input
                            type="number"
                            min="1"
                            max={flight.availableSeats}
                            value={bookingPayload.passengers}
                            onChange={(e) =>
                              setBookingPayload({
                                ...bookingPayload,
                                passengers: Math.max(
                                  1,
                                  parseInt(e.target.value, 10) || 1,
                                ),
                              })
                            }
                            className="p-3 border border-gray-300 bg-white rounded-xl text-base font-semibold text-gray-900 outline-none focus:border-blue-500"
                          />
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
                            isSubmitting ||
                            flight.availableSeats < bookingPayload.passengers
                          }
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-10 rounded-2xl shadow-sm transition-all text-sm uppercase tracking-wider"
                        >
                          {isSubmitting ? "Processing..." : "Confirm Booking"}
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
