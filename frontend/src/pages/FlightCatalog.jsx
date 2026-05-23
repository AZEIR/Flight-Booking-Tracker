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
    targetUserEmail: "", // CHANGED: Changed from targetUserId to targetUserEmail
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchAvailableFlights = async () => {
      try {
        setIsLoading(true);
        const response = await axiosInstance.get("/flights");
        setFlights(response.data);
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

      // CHANGED: If admin populated the input, forward the text as targetUserEmail
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
      <main className="max-w-5xl mx-auto px-4 py-10 space-y-8">
        <div className="border-b border-gray-200 pb-6 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
            Available Scheduled Flights
          </h1>
          <p className="text-gray-500 mt-2 font-medium text-base">
            Select an active departure schedule below to configure your ledger
            allocations.
          </p>
          {errorMsg && (
            <p className="mt-4 text-red-600 font-semibold bg-red-50 p-3 rounded-xl border border-red-200 inline-block">
              {errorMsg}
            </p>
          )}
        </div>

        <div className="space-y-6">
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
                  className="bg-white rounded-2xl border border-gray-200 overflow-hidden transition-all duration-200 shadow-sm hover:shadow-md hover:border-blue-200 flex flex-col"
                >
                  <div className="p-6 grid grid-cols-1 md:grid-cols-4 items-center gap-6 bg-white">
                    <div className="flex flex-col space-y-1 text-center md:text-left">
                      <span className="text-xs uppercase font-black tracking-widest text-slate-400 block">
                        {flight.airline || "Commercial Carrier"}
                      </span>
                      <span className="text-lg font-black text-slate-800">
                        Flight {flight.flightNumber}
                      </span>
                      <span className="inline-block mt-1 mx-auto md:mx-0 px-2.5 py-0.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-green-50 text-green-700 border border-green-200 w-max">
                        {flight.status || "scheduled"}
                      </span>
                    </div>

                    <div className="flex flex-col items-center justify-center px-2">
                      <div className="flex items-center w-full gap-3 justify-center">
                        <span className="text-2xl font-extrabold tracking-tight text-gray-900">
                          {flight.departureAirport}
                        </span>
                        <div className="h-[2px] flex-1 min-w-[40px] rounded-full bg-blue-200 relative">
                          <span className="material-symbols-outlined text-base text-blue-600 absolute -top-[7px] left-1/2 -translate-x-1/2 bg-white px-1">
                            flight_takeoff
                          </span>
                        </div>
                        <span className="text-2xl font-extrabold tracking-tight text-gray-900">
                          {flight.arrivalAirport}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-2 block">
                        Direct Route
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-center md:text-left border-t md:border-t-0 md:border-x border-gray-100 pt-4 md:pt-0 px-0 md:px-6">
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                          Ticket Price
                        </span>
                        <span className="text-xl font-black text-emerald-600">
                          ${flight.price?.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                          Available
                        </span>
                        <span
                          className={`text-xl font-black ${flight.availableSeats > 0 ? "text-blue-600" : "text-red-500"}`}
                        >
                          {flight.availableSeats}{" "}
                          <span className="text-xs font-normal text-gray-400">
                            Seats
                          </span>
                        </span>
                      </div>
                      <div className="flex flex-col col-span-2 mt-2">
                        <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block md:inline">
                          Departure Time
                        </span>
                        <span className="text-xs font-semibold text-gray-600 mt-0.5">
                          {flight.departureTime
                            ? new Date(flight.departureTime).toLocaleString(
                                undefined,
                                {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )
                            : "N/A"}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-center md:justify-end w-full pt-2 md:pt-0">
                      <button
                        onClick={() =>
                          setSelectedFlightId(isBookingThis ? null : flight._id)
                        }
                        disabled={flight.availableSeats < 1}
                        className={`w-full md:w-auto px-6 py-3 rounded-xl text-sm font-bold tracking-wide transition-all shadow-sm ${
                          flight.availableSeats < 1
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
                            : isBookingThis
                              ? "bg-slate-200 text-slate-700 hover:bg-slate-300"
                              : "bg-blue-600 hover:bg-blue-700 text-white"
                        }`}
                      >
                        {flight.availableSeats < 1
                          ? "Sold Out"
                          : isBookingThis
                            ? "Close Panel"
                            : "Book Seats"}
                      </button>
                    </div>
                  </div>

                  {isBookingThis && (
                    <div className="border-t border-gray-100 bg-gray-50/70 px-6 py-5 space-y-4">
                      <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider">
                        Configure Booking Allocation
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col">
                          <label className="text-xs text-gray-500 font-bold uppercase mb-2">
                            Number of Passenger Tickets
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
                            className="p-3 border border-gray-300 bg-white rounded-xl text-base font-semibold text-gray-900 outline-none focus:border-blue-500 shadow-sm"
                          />
                        </div>

                        {/* CHANGED: Text input altered to accept user email text instead of alphanumeric IDs */}
                        {user?.role === "admin" && (
                          <div className="flex flex-col">
                            <label className="text-xs text-amber-700 font-bold uppercase mb-2">
                              Admin Action: Target User Email Address (Optional)
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
                              className="p-3 border border-amber-300 bg-white rounded-xl text-base text-gray-900 outline-none focus:border-amber-500 shadow-sm"
                            />
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm gap-4">
                        <div>
                          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                            Estimated Ledger Total
                          </p>
                          <p className="text-2xl font-black text-blue-600">
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
                          className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold py-3 px-8 rounded-xl shadow-sm transition-all text-sm uppercase tracking-wider"
                        >
                          {isSubmitting
                            ? "Processing..."
                            : "Confirm Booking Entry"}
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
