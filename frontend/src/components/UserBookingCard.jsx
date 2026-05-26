import React from "react";
import {
  formatTime,
  formatDate,
  formatTimestamp,
  getFlightStatusDetails,
} from "../utils/bookingHelpers";

const UserBookingCard = ({
  booking,
  isEditing,
  editForm,
  setEditForm,
  onEditClick,
  onCancelEdit,
  onSave,
  onCancelBooking,
  onOpenSeatModal,
  isSubmitting,
}) => {
  const isCancelled = booking.bookingStatus === "cancelled";
  const flightNumber = booking.flight?.flightNumber || "UNKNOWN";
  const departureTime = booking.flight?.departureTime;
  const arrivalTime = booking.flight?.arrivalTime;
  const flightStatus = getFlightStatusDetails(departureTime);
  const isDeparted = flightStatus.state === "departed";
  const isLockedUnder24h = flightStatus.state === "locked";
  const isLocked = isLockedUnder24h || isDeparted;

  // Helper to get visual pathway theme based on booking state
  const getPathwayTheme = () => {
    if (isCancelled) {
      return {
        line: "bg-red-200",
        icon: "text-red-500",
        badge: "text-red-700 bg-red-50 border-red-200",
      };
    }
    if (isDeparted) {
      return {
        line: "bg-slate-200",
        icon: "text-slate-500",
        badge: "text-slate-600 bg-slate-50 border-slate-200",
      };
    }
    if (isLockedUnder24h) {
      return {
        line: "bg-amber-200",
        icon: "text-amber-600",
        badge: "text-amber-700 bg-amber-50 border-amber-200",
      };
    }
    return {
      line: "bg-blue-200",
      icon: "text-blue-600",
      badge: "text-blue-700 bg-blue-50 border-blue-200",
    };
  };

  const theme = getPathwayTheme();

  return (
    <div
      className={`flex flex-col bg-white border rounded-xl overflow-hidden transition-all duration-200 shadow-sm ${
        isCancelled
          ? "opacity-80 border-red-100"
          : "border-gray-200 hover:shadow-md"
      }`}
    >
      {/* Card Header - Tailored for Standard User */}
      <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">
            Ref Code:
          </span>
          <span className="font-mono font-extrabold text-lg text-slate-900 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">
            #{booking.bookingReference}
          </span>
        </div>
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

        {/* Visual Pathway Ribbon */}
        <div className="flex flex-col flex-1 px-4 items-center justify-center">
          <div className="flex items-center w-full max-w-sm gap-3">
            <div className={`h-[2px] flex-1 rounded-full ${theme.line}`}></div>

            <span
              className={`material-symbols-outlined text-3xl ${theme.icon}`}
            >
              {isCancelled
                ? "airplanemode_inactive"
                : isDeparted
                  ? "flight_land"
                  : "flight_takeoff"}
            </span>

            <div className={`h-[2px] flex-1 rounded-full ${theme.line}`}></div>
          </div>

          <span
            className={`text-sm font-bold tracking-wider mt-3 px-4 py-1 rounded-full border transition-colors ${theme.badge}`}
          >
            {flightNumber}
          </span>

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

      {/* Card Footer */}
      <div className="border-t border-gray-100 px-6 py-5 bg-gray-50/50">
        {isEditing ? (
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex flex-1 gap-6 w-full">
              <div className="w-1/3">
                <label className="text-xs text-gray-500 font-bold uppercase">
                  Passengers
                </label>
                <select
                  value={editForm.paxCount}
                  onChange={(e) => {
                    const newPaxCount = parseInt(e.target.value, 10);
                    // Clear seats if passenger count changed, forcing them to re-select
                    setEditForm({
                      ...editForm,
                      paxCount: e.target.value,
                      seats: editForm.seats.slice(0, newPaxCount),
                    });
                  }}
                  className="bg-white border rounded-xl px-3 py-2 w-full text-base font-medium outline-none focus:border-blue-500"
                >
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <option key={num} value={num}>
                      {num} Pax
                    </option>
                  ))}
                </select>
              </div>

              {/* Change Seat Selection */}
              <div className="w-1/3 flex flex-col justify-center">
                <span className="text-xs text-gray-500 font-bold uppercase mb-1">
                  Seats:{" "}
                  {editForm.seats && editForm.seats.length > 0
                    ? editForm.seats.join(", ")
                    : "None"}
                </span>
                <button
                  onClick={() =>
                    onOpenSeatModal(
                      booking.flight?._id,
                      parseInt(editForm.paxCount, 10),
                      editForm.seats,
                    )
                  }
                  className="px-3 py-2 border border-blue-200 text-blue-600 rounded-xl bg-white hover:bg-blue-50 font-bold text-xs transition-colors w-full"
                >
                  Select / Change Seats
                </button>
              </div>

              {/* Read-Only Price Preview for Standard User */}
              <div className="w-1/3 flex flex-col justify-center">
                <span className="text-xs text-gray-500 font-bold uppercase mb-1">
                  Estimated Price
                </span>
                <span className="text-xl font-extrabold text-blue-600">
                  $
                  {(
                    (booking.flight?.price || 0) *
                    parseInt(editForm.paxCount, 10)
                  ).toFixed(2)}
                </span>
              </div>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <button
                onClick={onCancelEdit}
                className="px-4 py-2 border rounded-xl bg-white font-bold text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onSave}
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row justify-between items-center w-full">
            {/* 4 Columns: Assigned Seats Added */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
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
                <span className="font-bold">{booking.passengers} Pax</span>
              </div>
              <div>
                <span className="text-xs text-gray-400 block font-bold uppercase">
                  Assigned Seats
                </span>
                <span className="font-mono font-bold text-blue-600">
                  {booking.seats && booking.seats.length > 0
                    ? booking.seats.join(", ")
                    : "None"}
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
                <span className="text-xs text-red-500 font-bold uppercase bg-red-50 px-4 py-2 rounded-xl border border-red-100">
                  Cancelled
                </span>
              ) : isLocked ? (
                <span
                  className={`text-xs font-bold uppercase px-4 py-2 rounded-xl border ${
                    isDeparted
                      ? "text-slate-600 bg-slate-50 border-slate-200"
                      : "text-amber-600 bg-amber-50 border-amber-200"
                  }`}
                >
                  {isDeparted ? "Departed" : "Locked (<24h)"}
                </span>
              ) : (
                <>
                  <button
                    onClick={onEditClick}
                    className="px-4 py-2 border rounded-xl bg-white font-bold text-sm text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={onCancelBooking}
                    className="px-4 py-2 border rounded-xl bg-white font-bold text-sm text-red-600 hover:bg-red-50 transition-colors"
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
};

export default UserBookingCard;
