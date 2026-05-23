import React, { useState, useEffect } from "react";
import axios from "axios";

// Configuration for Axios to ensure cookies/tokens are sent to the backend
const api = axios.create({
  baseURL: "http://localhost:5001/api",
  withCredentials: true,
});

const BookingRecords = () => {
  // --- STATE MANAGEMENT ---
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Inline Editing State
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    paxCount: "1",
    priceOverride: "",
  });

  // UI & Error States
  const [showToast, setShowToast] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // --- FETCH REAL DATA FROM BACKEND ---
  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get("/bookings");
      setBookings(data);
    } catch (error) {
      console.error("Failed to fetch ledger:", error);
      setErrorMsg(
        "Failed to synchronize with the database. Please ensure you are logged in.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // --- FORMATTING & LOGIC UTILITIES ---

  const formatTime = (dateString) => {
    if (!dateString) return "--:--";
    return new Date(dateString).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown Date";
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTimestamp = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Calculates exact flight status and handles the 24-hour lock logic
  const getFlightStatusDetails = (departureTime) => {
    if (!departureTime)
      return {
        state: "unknown",
        label: "Status Unknown",
        color: "text-gray-600 bg-gray-100 border border-gray-200",
      };

    const now = new Date();
    const dep = new Date(departureTime);
    const diffMs = dep - now;
    const diffHours = diffMs / (1000 * 60 * 60);

    // Flight has already left (Changed to Indigo to distinguish from Cancelled)
    if (diffHours <= 0) {
      return {
        state: "departed",
        label: "Flight Departed",
        color: "text-indigo-700 bg-indigo-50 border border-indigo-200",
      };
    }

    // Within 24 hours (User Locked, Admin can modify)
    if (diffHours < 24) {
      const h = Math.floor(diffHours);
      const m = Math.floor((diffHours - h) * 60);
      return {
        state: "locked",
        label: `User Locked (${h}h ${m}m to departure)`,
        color: "text-amber-700 bg-amber-50 border border-amber-200",
      };
    }

    // More than 24 hours away
    return {
      state: "active",
      label: "Scheduled",
      color: "text-blue-700 bg-blue-50 border border-blue-200",
    };
  };

  // --- 4. EVENT HANDLERS ---
  const handleEditClick = (booking) => {
    setEditingId(booking._id);
    setEditForm({
      paxCount: booking.passengers.toString(),
      priceOverride: booking.totalPrice.toString(),
    });
    setErrorMsg("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ paxCount: "1", priceOverride: "" });
    setErrorMsg("");
  };

  const handleSaveRecord = async (bookingId) => {
    if (!editForm.priceOverride || parseFloat(editForm.priceOverride) <= 0) {
      setErrorMsg("Please enter a valid price amount.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      await api.put(`/bookings/${bookingId}`, {
        newPassengers: parseInt(editForm.paxCount, 10),
        adminPriceOverride: parseFloat(editForm.priceOverride),
      });

      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);

      await fetchBookings();
      setEditingId(null);
    } catch (error) {
      console.error("Failed to update booking:", error);
      setErrorMsg(
        error.response?.data?.message ||
          "An error occurred during transaction.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (
      !window.confirm(
        "Admin Action: Are you sure you want to permanently cancel this reservation?",
      )
    )
      return;

    try {
      await api.patch(`/bookings/${bookingId}/cancel`);
      await fetchBookings();
    } catch (error) {
      console.error("Failed to cancel booking:", error);
      alert(
        error.response?.data?.message ||
          "Cancellation failed. Ensure flight hasn't departed.",
      );
    }
  };

  // --- RENDER UI ---
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f7f9fc] flex items-center justify-center">
        <div className="text-blue-600 font-bold text-lg tracking-wide">
          <h2>Fetching Booking info...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f7f9fc] text-gray-900 min-h-screen pb-20 font-sans selection:bg-blue-200">
      <main className="max-w-5xl mx-auto px-4 md:px-8 py-10 space-y-8">
        {/* HEADER AREA */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-gray-200 pb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
              Booking Management System
            </h2>
          </div>

          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-semibold px-4 py-3 rounded-xl flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">
                error
              </span>
              {errorMsg}
            </div>
          )}
        </div>

        {/* RECORDS LIST */}
        <section className="space-y-6">
          {bookings.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-500 font-medium shadow-sm">
              <span className="material-symbols-outlined block text-5xl mb-4 text-gray-400">
                database
              </span>
              <p className="text-lg">No records found in the database.</p>
            </div>
          ) : (
            bookings.map((booking) => {
              const isCancelled = booking.bookingStatus === "cancelled";
              const isEditingThis = editingId === booking._id;

              const flightNumber =
                booking.flight?.flightNumber ||
                (booking.flight?._id || booking.flight)
                  .toString()
                  .slice(-6)
                  .toUpperCase();
              const departureTime = booking.flight?.departureTime;
              const arrivalTime = booking.flight?.arrivalTime;

              const flightStatus = getFlightStatusDetails(departureTime);
              const isDeparted = flightStatus.state === "departed";

              return (
                <div
                  key={booking._id}
                  className={`flex flex-col bg-white border rounded-xl overflow-hidden transition-all duration-200 shadow-sm
                    ${
                      isCancelled
                        ? "opacity-80 border-red-100" // Grayscale removed so red shines through
                        : "border-gray-200 hover:shadow-md hover:border-blue-200"
                    } `}
                >
                  {/* --- TOP: Identity & Core Status --- */}
                  <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-white">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-base 
                          ${
                            isCancelled
                              ? "bg-red-100 text-red-700"
                              : isDeparted
                                ? "bg-indigo-100 text-indigo-700"
                                : "bg-blue-100 text-blue-700"
                          }`}
                      >
                        {booking.user?.name
                          ? booking.user.name.charAt(0).toUpperCase()
                          : "U"}
                      </div>
                      <div>
                        <p className="font-bold text-base text-gray-900">
                          {booking.user?.name || "Standard User"}
                        </p>
                        <p className="text-sm text-gray-500">
                          {booking.user?.email || "ID: " + booking.user}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <span
                        className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider 
                          ${
                            isCancelled
                              ? "bg-red-50 text-red-700 border border-red-200"
                              : "bg-green-50 text-green-700 border border-green-200"
                          }`}
                      >
                        {isCancelled ? "Cancelled" : "Active Booking"}
                      </span>
                    </div>
                  </div>

                  {/* --- MIDDLE: Flight Ribbon --- */}
                  <div className="px-6 py-8 relative bg-white">
                    <div className="flex items-center justify-between">
                      {/* Departure */}
                      <div className="flex flex-col w-1/4 text-center md:text-left">
                        <span className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-1">
                          Departure
                        </span>
                        <span className="text-3xl font-extrabold text-gray-900 tracking-tight">
                          {formatTime(departureTime)}
                        </span>
                        <span className="text-sm font-medium text-gray-500 mt-1">
                          {formatDate(departureTime)}
                        </span>
                      </div>

                      {/* Visual Flight Path */}
                      <div className="flex flex-col flex-1 px-4 items-center justify-center">
                        <div className="flex items-center w-full max-w-sm gap-3">
                          <div
                            className={`h-[2px] flex-1 rounded-full ${
                              isCancelled
                                ? "bg-red-200"
                                : isDeparted
                                  ? "bg-indigo-200"
                                  : "bg-blue-200"
                            }`}
                          ></div>

                          {/* DYNAMIC ICON LOGIC */}
                          <span
                            className={`material-symbols-outlined text-3xl ${
                              isCancelled
                                ? "text-red-500"
                                : isDeparted
                                  ? "text-indigo-600"
                                  : "text-blue-600"
                            }`}
                          >
                            {isCancelled
                              ? "airplanemode_inactive"
                              : isDeparted
                                ? "flight_land"
                                : "flight_takeoff"}
                          </span>

                          <div
                            className={`h-[2px] flex-1 rounded-full ${
                              isCancelled
                                ? "bg-red-200"
                                : isDeparted
                                  ? "bg-indigo-200"
                                  : "bg-blue-200"
                            }`}
                          ></div>
                        </div>

                        {/* FLIGHT NUMBER BUBBLE */}
                        <span
                          className={`text-sm font-bold tracking-wider mt-3 px-4 py-1 rounded-full border transition-colors 
                            ${
                              isCancelled
                                ? "text-red-700 bg-red-50 border-red-200"
                                : isDeparted
                                  ? "text-indigo-700 bg-indigo-50 border-indigo-200"
                                  : "text-blue-700 bg-blue-50 border-blue-200"
                            }`}
                        >
                          {flightNumber}
                        </span>

                        {/* 24-HOUR WARNING / DEPARTED BADGE */}
                        {!isCancelled && (
                          <span
                            className={`mt-3 px-3 py-1 rounded-full text-xs font-bold tracking-wide ${flightStatus.color}`}
                          >
                            {flightStatus.label}
                          </span>
                        )}
                      </div>

                      {/* Arrival */}
                      <div className="flex flex-col w-1/4 text-center md:text-right">
                        <span className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">
                          Arrival
                        </span>
                        <span className="text-3xl font-extrabold text-gray-900 tracking-tight">
                          {formatTime(arrivalTime)}
                        </span>
                        <span className="text-sm font-medium text-gray-500 mt-1">
                          {formatDate(arrivalTime)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* --- BOTTOM: Financials & Actions --- */}
                  <div className="border-t border-gray-100 px-6 py-5 bg-gray-50/50">
                    {isEditingThis ? (
                      /* EDIT MODE FORM */
                      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex flex-1 gap-6 w-full">
                          <div className="flex flex-col w-1/2">
                            <label className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">
                              Modify Passengers
                            </label>
                            <select
                              value={editForm.paxCount}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  paxCount: e.target.value,
                                })
                              }
                              className="bg-white border border-gray-300 rounded-xl px-3 py-2 text-base text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-full shadow-sm"
                            >
                              {[1, 2, 3, 4, 5, 6].map((num) => (
                                <option
                                  key={num}
                                  value={num}
                                  className="text-gray-900"
                                >
                                  {num} Pax
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="flex flex-col w-1/2">
                            <label className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">
                              Modify Total Price
                            </label>
                            <div className="relative">
                              <span className="absolute left-3 top-2.5 text-gray-500 text-base font-medium">
                                $
                              </span>
                              <input
                                type="number"
                                value={editForm.priceOverride}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    priceOverride: e.target.value,
                                  })
                                }
                                className="bg-white border border-gray-300 rounded-xl pl-8 pr-3 py-2 text-base text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-full shadow-sm"
                                step="0.01"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Edit Mode Actions */}
                        <div className="flex gap-3 w-full md:w-auto">
                          <button
                            onClick={cancelEdit}
                            disabled={isSubmitting}
                            className="flex-1 md:flex-none px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-sm font-bold bg-white hover:bg-gray-50 transition-colors shadow-sm"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveRecord(booking._id)}
                            disabled={isSubmitting}
                            className="flex-1 md:flex-none px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-sm disabled:opacity-50"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              save
                            </span>
                            {isSubmitting ? "Saving..." : "Save Changes"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* READ-ONLY DATA GRID */
                      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        {/* Meta Data Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full flex-1">
                          <div className="flex flex-col">
                            <span className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">
                              Ref Code
                            </span>
                            <span className="text-base font-mono font-bold text-gray-900 tracking-wide">
                              #{booking.bookingReference}
                            </span>
                          </div>

                          <div className="flex flex-col">
                            <span className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">
                              Booked On
                            </span>
                            <span className="text-sm font-medium text-gray-900 mt-0.5">
                              {formatTimestamp(booking.createdAt)}
                            </span>
                          </div>

                          <div className="flex flex-col">
                            <span className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">
                              Passengers
                            </span>
                            <span className="text-base font-bold text-gray-900">
                              {booking.passengers}{" "}
                              <span className="text-xs font-normal text-gray-500">
                                Pax
                              </span>
                            </span>
                          </div>

                          <div className="flex flex-col">
                            <span className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">
                              Ledger Amount
                            </span>
                            <span className="text-base font-extrabold text-blue-600 tracking-wide">
                              ${booking.totalPrice.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* Standard Actions */}
                        <div className="flex gap-3 w-full md:w-auto shrink-0 mt-4 md:mt-0">
                          {isCancelled ? (
                            <div className="w-full text-center px-6 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-500 text-xs font-bold uppercase tracking-widest cursor-not-allowed">
                              Terminal State
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => handleEditClick(booking)}
                                className="flex-1 md:flex-none px-5 py-2.5 rounded-xl bg-white text-blue-600 border border-gray-300 hover:bg-blue-50 hover:border-blue-200 transition-all text-sm font-bold flex items-center justify-center gap-2 shadow-sm"
                              >
                                <span className="material-symbols-outlined text-[18px]">
                                  edit
                                </span>{" "}
                                Edit
                              </button>
                              <button
                                onClick={() => handleCancelBooking(booking._id)}
                                className="flex-1 md:flex-none px-5 py-2.5 rounded-xl bg-white text-red-600 border border-gray-300 hover:bg-red-50 hover:border-red-200 transition-all text-sm font-bold flex items-center justify-center gap-2 shadow-sm"
                              >
                                <span className="material-symbols-outlined text-[18px]">
                                  cancel
                                </span>{" "}
                                Cancel
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </section>
      </main>
    </div>
  );
};

export default BookingRecords;
