// src/pages/BookingRecords.jsx
import React, { useState, useEffect } from "react";
import axiosInstance from "../axiosConfig";

const BookingRecords = () => {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Inline Admin Editing States for Existing Bookings
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    paxCount: "1",
    priceOverride: "",
  });

  const [showToast, setShowToast] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      const { data } = await axiosInstance.get("/bookings");
      setBookings(data);
    } catch (error) {
      console.error("Failed to fetch records:", error);
      setErrorMsg(
        "Failed to synchronize with the database. Please ensure you are logged in.",
      );
    } finally {
      setIsLoading(false);
    }
  };

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

  const getFlightStatusDetails = (departureTime) => {
    if (!departureTime)
      return {
        state: "unknown",
        label: "Status Unknown",
        color: "text-gray-600 bg-gray-100 border border-gray-200",
      };
    const now = new Date();
    const dep = new Date(departureTime);
    const diffHours = (dep - now) / (1000 * 60 * 60);

    if (diffHours <= 0)
      return {
        state: "departed",
        label: "Flight Departed",
        color: "text-indigo-700 bg-indigo-50 border border-indigo-200",
      };
    if (diffHours < 24) {
      const h = Math.floor(diffHours);
      const m = Math.floor((diffHours - h) * 60);
      return {
        state: "locked",
        label: `User Locked (${h}h ${m}m to departure)`,
        color: "text-amber-700 bg-amber-50 border border-amber-200",
      };
    }
    return {
      state: "active",
      label: "Scheduled",
      color: "text-blue-700 bg-blue-50 border border-blue-200",
    };
  };

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
      await axiosInstance.put(`/bookings/${bookingId}`, {
        newPassengers: parseInt(editForm.paxCount, 10),
        adminPriceOverride: parseFloat(editForm.priceOverride),
      });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
      await fetchBookings();
      setEditingId(null);
    } catch (error) {
      setErrorMsg(
        error.response?.data?.message ||
          "An error occurred during transaction.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this reservation?"))
      return;
    try {
      await axiosInstance.patch(`/bookings/${bookingId}/cancel`);
      await fetchBookings();
    } catch (error) {
      alert(error.response?.data?.message || "Cancellation failed.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f7f9fc] flex items-center justify-center">
        <div className="text-blue-600 font-bold text-lg tracking-wide">
          Fetching Booking info...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f7f9fc] text-gray-900 min-h-screen pb-20 font-sans selection:bg-blue-200">
      <main className="max-w-5xl mx-auto px-4 md:px-8 py-10 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-gray-200 pb-6">
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
            Booking Management System Dashboard
          </h2>
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-semibold px-4 py-3 rounded-xl flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">
                error
              </span>
              {errorMsg}
            </div>
          )}
        </div>

        <section className="space-y-6">
          {bookings.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-500 font-medium shadow-sm">
              <p className="text-lg">No records found in the database.</p>
            </div>
          ) : (
            bookings.map((booking) => {
              const isCancelled = booking.bookingStatus === "cancelled";
              const isEditingThis = editingId === booking._id;
              const flightNumber = booking.flight?.flightNumber || "UNKNOWN";
              const departureTime = booking.flight?.departureTime;
              const arrivalTime = booking.flight?.arrivalTime;
              const flightStatus = getFlightStatusDetails(departureTime);
              const isDeparted = flightStatus.state === "departed";

              return (
                <div
                  key={booking._id}
                  className={`flex flex-col bg-white border rounded-xl overflow-hidden transition-all duration-200 shadow-sm ${isCancelled ? "opacity-80 border-red-100" : "border-gray-200 hover:shadow-md"}`}
                >
                  {/* Card Header */}
                  <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-white">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${isCancelled ? "bg-red-100 text-red-700" : isDeparted ? "bg-indigo-100 text-indigo-700" : "bg-blue-100 text-blue-700"}`}
                      >
                        {booking.user?.name
                          ? booking.user.name.charAt(0).toUpperCase()
                          : "U"}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">
                          {booking.user?.name || "Standard User"}
                        </p>
                        <p className="text-sm text-gray-500">
                          {booking.user?.email || "N/A"}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${isCancelled ? "bg-red-50 text-red-700 border border-red-200" : "bg-green-50 text-green-700 border border-green-200"}`}
                    >
                      {isCancelled ? "Cancelled" : "Active"}
                    </span>
                  </div>

                  {/* Card Body */}
                  <div className="px-6 py-8 bg-white flex justify-between items-center">
                    {/* Departure Node */}
                    <div className="flex flex-col w-1/4">
                      <span className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-1">
                        Departure
                      </span>
                      <p className="text-2xl font-extrabold tracking-tight">
                        {formatTime(departureTime)}
                      </p>
                      <p className="text-sm font-medium text-gray-500 mt-1">
                        {formatDate(departureTime)}
                      </p>
                    </div>

                    {/* RESTORED VISUAL MIDDLE RIBBON PATHWAY & ICONS */}
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

                        {/* Google Material Symbols Tag */}
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

                      {/* Flight Number Bubble Badge */}
                      <span
                        className={`text-sm font-bold tracking-wider mt-3 px-4 py-1 rounded-full border transition-colors ${
                          isCancelled
                            ? "text-red-700 bg-red-50 border-red-200"
                            : isDeparted
                              ? "text-indigo-700 bg-indigo-50 border-indigo-200"
                              : "text-blue-700 bg-blue-50 border-blue-200"
                        }`}
                      >
                        {flightNumber}
                      </span>

                      {/* Dynamic status timing banner */}
                      {!isCancelled && (
                        <p
                          className={`text-xs font-bold mt-2 px-3 py-1 rounded-full border tracking-wide ${flightStatus.color}`}
                        >
                          {flightStatus.label}
                        </p>
                      )}
                    </div>

                    {/* Arrival Node */}
                    <div className="flex flex-col w-1/4 text-right">
                      <span className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">
                        Arrival
                      </span>
                      <p className="text-2xl font-extrabold tracking-tight">
                        {formatTime(arrivalTime)}
                      </p>
                      <p className="text-sm font-medium text-gray-500 mt-1">
                        {formatDate(arrivalTime)}
                      </p>
                    </div>
                  </div>

                  {/* Card Footer: Financials and Actions */}
                  <div className="border-t border-gray-100 px-6 py-5 bg-gray-50/50">
                    {isEditingThis ? (
                      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex flex-1 gap-6 w-full">
                          <div className="w-1/2">
                            <label className="text-xs text-gray-500 font-bold uppercase">
                              Passengers
                            </label>
                            <select
                              value={editForm.paxCount}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  paxCount: e.target.value,
                                })
                              }
                              className="bg-white border rounded-xl px-3 py-2 w-full"
                            >
                              {[1, 2, 3, 4, 5, 6].map((num) => (
                                <option key={num} value={num}>
                                  {num} Pax
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="w-1/2">
                            <label className="text-xs text-gray-500 font-bold uppercase">
                              Total Price ($)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={editForm.priceOverride}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  priceOverride: e.target.value,
                                })
                              }
                              className="bg-white border rounded-xl px-3 py-2 w-full"
                            />
                          </div>
                        </div>
                        <div className="flex gap-3 w-full md:w-auto">
                          <button
                            onClick={cancelEdit}
                            className="px-4 py-2 border rounded-xl bg-white"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveRecord(booking._id)}
                            disabled={isSubmitting}
                            className="px-4 py-2 bg-blue-600 text-white rounded-xl"
                          >
                            {isSubmitting ? "Saving..." : "Save"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col md:flex-row justify-between items-center w-full">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
                          <div>
                            <span className="text-xs text-gray-400 block font-bold uppercase">
                              Ref Code
                            </span>
                            <span className="font-mono font-bold">
                              #{booking.bookingReference}
                            </span>
                          </div>
                          <div>
                            <span className="text-xs text-gray-400 block font-bold uppercase">
                              Booked On
                            </span>
                            <span className="text-sm">
                              {formatTimestamp(booking.createdAt)}
                            </span>
                          </div>
                          <div>
                            <span className="text-xs text-gray-400 block font-bold uppercase">
                              Passengers
                            </span>
                            <span className="font-bold">
                              {booking.passengers} Pax
                            </span>
                          </div>
                          <div>
                            <span className="text-xs text-gray-400 block font-bold uppercase">
                              Ledger Amount
                            </span>
                            <span className="font-extrabold text-blue-600">
                              ${booking.totalPrice?.toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-4 md:mt-0">
                          {isCancelled ? (
                            <span className="text-xs text-red-500 font-bold uppercase bg-red-50 px-4 py-2 rounded-xl">
                              Cancelled Status
                            </span>
                          ) : (
                            <>
                              <button
                                onClick={() => handleEditClick(booking)}
                                className="px-4 py-2 border rounded-xl bg-white font-bold text-sm text-blue-600"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleCancelBooking(booking._id)}
                                className="px-4 py-2 border rounded-xl bg-white font-bold text-sm text-red-600"
                              >
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
