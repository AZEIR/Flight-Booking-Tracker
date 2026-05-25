import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axiosInstance from "../axiosConfig";

const SeatSelection = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Retrieve state from router redirect
  const { flightId, passengers, targetUserEmail } = location.state || {};

  const [flight, setFlight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!flightId || !passengers) {
      alert("No active booking session found. Redirecting to flights catalog.");
      navigate("/");
      return;
    }

    const fetchFlightDetails = async () => {
      try {
        setLoading(true);
        const { data } = await axiosInstance.get(`/flights/${flightId}`);
        const flightData = data.data || data;
        setFlight(flightData);
      } catch (err) {
        console.error("Failed to load flight seats:", err);
        setErrorMsg("Failed to synchronize real-time seat mapping.");
      } finally {
        setLoading(false);
      }
    };

    fetchFlightDetails();
  }, [flightId, passengers, navigate]);

  const handleSeatClick = (seatNumber, isAvailable) => {
    if (!isAvailable) return;

    if (selectedSeats.includes(seatNumber)) {
      setSelectedSeats(selectedSeats.filter((s) => s !== seatNumber));
    } else {
      if (selectedSeats.length >= passengers) {
        // If they already selected the max number of seats, remove the oldest selection and add the new one
        setSelectedSeats([...selectedSeats.slice(1), seatNumber]);
      } else {
        setSelectedSeats([...selectedSeats, seatNumber]);
      }
    }
  };

  const handleConfirmBooking = async () => {
    if (selectedSeats.length !== passengers) {
      alert(`Please select exactly ${passengers} seat(s) before proceeding.`);
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        flightId,
        passengers,
        seats: selectedSeats,
      };

      if (targetUserEmail && targetUserEmail.trim() !== "") {
        payload.targetUserEmail = targetUserEmail.trim().toLowerCase();
      }

      await axiosInstance.post("/bookings", payload);
      alert("Reservation confirmed! Seats assigned successfully.");
      navigate("/dashboard");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to process booking.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f9fc] flex items-center justify-center">
        <div className="text-blue-600 font-bold text-lg tracking-wide animate-pulse">
          Loading seating configuration map...
        </div>
      </div>
    );
  }

  if (errorMsg || !flight) {
    return (
      <div className="min-h-screen bg-[#f7f9fc] flex items-center justify-center p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-3xl max-w-md text-center shadow-sm">
          <p className="font-bold text-lg mb-4">Error loading map</p>
          <p className="text-sm font-medium mb-6">
            {errorMsg || "Flight not found"}
          </p>
          <button
            onClick={() => navigate("/")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-xl transition-all"
          >
            Back to Flight Catalog
          </button>
        </div>
      </div>
    );
  }

  // Seating layout: 25 Rows, columns A-F
  const rows = Array.from({ length: 25 }, (_, i) => i + 1);
  const leftCols = ["A", "B", "C"];
  const rightCols = ["D", "E", "F"];

  const getSeatStatus = (seatNumber) => {
    const isBooked = flight.bookedSeats?.includes(seatNumber) || false;
    const isSelected = selectedSeats.includes(seatNumber);

    return {
      isAvailable: !isBooked,
      isSelected,
    };
  };

  return (
    <div className="bg-[#f7f9fc] text-slate-900 min-h-screen pb-20 font-sans">
      <main className="max-w-6xl mx-auto px-4 md:px-8 py-10">
        {/* Header Breadcrumbs & Info */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">
              <span>{flight.airline || "Commercial Airlines"}</span>
              <span>•</span>
              <span>Flight {flight.flightNumber}</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">
              Choose your seat
            </h1>
            <p className="text-gray-500 font-medium text-sm mt-1">
              Select exactly{" "}
              <strong className="text-blue-600">{passengers}</strong> ticket
              seat allocation(s).
            </p>
          </div>
          <div className="flex gap-4 border-l border-gray-100 pl-0 md:pl-6">
            <div className="text-center md:text-left">
              <span className="text-xs text-gray-400 font-bold block uppercase tracking-wider">
                Route
              </span>
              <span className="font-extrabold text-lg text-slate-800">
                {flight.departureAirport} → {flight.arrivalAirport}
              </span>
            </div>
            <div className="text-center md:text-left border-l border-gray-100 pl-4">
              <span className="text-xs text-gray-400 font-bold block uppercase tracking-wider">
                Departing
              </span>
              <span className="font-extrabold text-sm text-slate-800 block mt-0.5">
                {new Date(flight.departureTime).toLocaleDateString([], {
                  month: "short",
                  day: "numeric",
                })}{" "}
                •{" "}
                {new Date(flight.departureTime).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Seating Map Layout Container */}
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-3xl p-8 shadow-sm flex flex-col items-center">
            {/* Visual Airplane Elements */}
            <div className="w-full max-w-md bg-gray-50 border border-gray-200 rounded-t-[100px] border-b-0 py-8 flex flex-col items-center justify-center relative overflow-hidden">
              <div className="w-16 h-8 border-2 border-gray-300 rounded-full flex items-center justify-center font-bold text-xs text-gray-400 select-none bg-white shadow-inner mb-2 z-10">
                COCKPIT
              </div>
              <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
              {/* Nose detail lines */}
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 border border-gray-200/50 rounded-full pointer-events-none"></div>
            </div>

            {/* Cabin Map Body */}
            <div className="w-full max-w-md border-x-2 border-gray-200 px-6 py-10 bg-white flex flex-col items-center space-y-3 relative">
              {/* Row Layout */}
              {rows.map((rowNum) => {
                const isExitRow = rowNum === 12 || rowNum === 13;

                return (
                  <div
                    key={rowNum}
                    className="w-full flex items-center justify-between"
                  >
                    {/* Left Column Group (A, B, C) */}
                    <div className="flex gap-2.5">
                      {leftCols.map((col) => {
                        const seatNum = `${rowNum}${col}`;
                        const { isAvailable, isSelected } =
                          getSeatStatus(seatNum);

                        return (
                          <button
                            key={seatNum}
                            onClick={() =>
                              handleSeatClick(seatNum, isAvailable)
                            }
                            disabled={!isAvailable}
                            className={`w-9 h-9 rounded-lg border text-xs font-bold transition-all duration-200 flex items-center justify-center select-none ${
                              isSelected
                                ? "bg-gradient-to-br from-blue-600 to-indigo-700 border-indigo-700 text-white shadow-md scale-105"
                                : isAvailable
                                  ? "border-blue-200 text-blue-800 bg-white hover:bg-blue-50/50 hover:border-blue-400"
                                  : "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed line-through opacity-40"
                            }`}
                            title={`Seat ${seatNum} - ${
                              isSelected
                                ? "Selected"
                                : isAvailable
                                  ? "Available"
                                  : "Occupied"
                            }`}
                          >
                            {col}
                          </button>
                        );
                      })}
                    </div>

                    {/* Aisle Spacer with Row Label */}
                    <div className="flex flex-col items-center justify-center w-10 relative">
                      <span className="text-[11px] font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 shadow-sm select-none">
                        {rowNum}
                      </span>
                      {isExitRow && (
                        <div className="absolute -left-16 -right-16 h-[1px] bg-amber-200 border-t border-dashed border-amber-200 pointer-events-none -z-10 flex items-center justify-between px-2.5">
                          <span className="text-[8px] font-bold text-amber-600 bg-amber-50 px-1 py-0.2 rounded uppercase tracking-wider">
                            EXIT
                          </span>
                          <span className="text-[8px] font-bold text-amber-600 bg-amber-50 px-1 py-0.2 rounded uppercase tracking-wider">
                            EXIT
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Right Column Group (D, E, F) */}
                    <div className="flex gap-2.5">
                      {rightCols.map((col) => {
                        const seatNum = `${rowNum}${col}`;
                        const { isAvailable, isSelected } =
                          getSeatStatus(seatNum);

                        return (
                          <button
                            key={seatNum}
                            onClick={() =>
                              handleSeatClick(seatNum, isAvailable)
                            }
                            disabled={!isAvailable}
                            className={`w-9 h-9 rounded-lg border text-xs font-bold transition-all duration-200 flex items-center justify-center select-none ${
                              isSelected
                                ? "bg-gradient-to-br from-blue-600 to-indigo-700 border-indigo-700 text-white shadow-md scale-105"
                                : isAvailable
                                  ? "border-blue-200 text-blue-800 bg-white hover:bg-blue-50/50 hover:border-blue-400"
                                  : "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed line-through opacity-40"
                            }`}
                            title={`Seat ${seatNum} - ${
                              isSelected
                                ? "Selected"
                                : isAvailable
                                  ? "Available"
                                  : "Occupied"
                            }`}
                          >
                            {col}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Airplane Tail Fin End */}
            <div className="w-full max-w-md bg-gray-50 border border-gray-200 rounded-b-[40px] border-t-0 py-8 flex flex-col items-center justify-center relative overflow-hidden">
              <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
              <div className="mt-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest select-none">
                REAR CABIN / GALLEY
              </div>
            </div>
          </div>

          {/* Interactive Legend & Booking Confirmation Sidebar */}
          <div className="space-y-6">
            {/* Seating Map Legend */}
            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
              <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider mb-4 border-b border-gray-100 pb-3">
                Map Legend
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-lg border border-blue-200 bg-white"></div>
                  <span className="text-xs text-gray-500 font-bold uppercase">
                    Available
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-lg border border-indigo-700 bg-gradient-to-br from-blue-600 to-indigo-700"></div>
                  <span className="text-xs text-gray-500 font-bold uppercase">
                    Selected
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-lg border border-slate-200 bg-slate-100 opacity-60 line-through"></div>
                  <span className="text-xs text-gray-500 font-bold uppercase">
                    Occupied
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-lg border border-amber-200 bg-amber-50 flex items-center justify-center text-[8px] font-bold text-amber-600">
                    EXIT
                  </div>
                  <span className="text-xs text-gray-500 font-bold uppercase">
                    Exit Row
                  </span>
                </div>
              </div>
            </div>

            {/* Selection Overview and Action panel */}
            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-6">
              <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider border-b border-gray-100 pb-3">
                Selection Details
              </h3>

              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400 font-bold uppercase">
                    Ticket Count:
                  </span>
                  <span className="font-extrabold text-slate-800">
                    {passengers} Pax
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400 font-bold uppercase">
                    Assigned Seats:
                  </span>
                  <span className="font-mono font-extrabold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100">
                    {selectedSeats.length > 0
                      ? selectedSeats.join(", ")
                      : "None"}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400 font-bold uppercase">
                    Ticket Price:
                  </span>
                  <span className="font-bold text-slate-800">
                    ${flight.price?.toFixed(2)}
                  </span>
                </div>

                <div className="h-[1px] bg-gray-100 my-4"></div>

                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                    Total Fare Summary
                  </p>
                  <p className="text-4xl font-black text-blue-600 mt-1">
                    ${((flight.price || 0) * passengers).toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <button
                  onClick={handleConfirmBooking}
                  disabled={selectedSeats.length !== passengers || isSubmitting}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-4 rounded-2xl shadow-sm transition-all duration-200 text-sm uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting
                    ? "Issuing Ledger Reservation..."
                    : selectedSeats.length === passengers
                      ? "Confirm Booking & Book"
                      : `Select ${passengers - selectedSeats.length} More Seat(s)`}
                </button>
                <button
                  onClick={() => navigate("/")}
                  disabled={isSubmitting}
                  className="w-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-bold py-4 rounded-2xl transition-all duration-200 text-sm uppercase tracking-wider"
                >
                  Abort Seating
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SeatSelection;
