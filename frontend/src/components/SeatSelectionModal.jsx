import React, { useState, useEffect } from "react";
import axiosInstance from "../axiosConfig";

const SeatSelectionModal = ({
  isOpen,
  onClose,
  flightId,
  passengers,
  initialSeats = [],
  onConfirm,
}) => {
  const [flight, setFlight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedSeats, setSelectedSeats] = useState([]);

  useEffect(() => {
    if (!isOpen || !flightId) return;

    const fetchSeatingMap = async () => {
      try {
        setLoading(true);
        const { data } = await axiosInstance.get(`/flights/${flightId}`);
        setFlight(data.data || data);
        setSelectedSeats(initialSeats);
      } catch (err) {
        console.error("Failed to fetch fresh seats:", err);
        setErrorMsg("Failed to synchronize flight seating configuration.");
      } finally {
        setLoading(false);
      }
    };

    fetchSeatingMap();
  }, [isOpen, flightId, initialSeats]);

  if (!isOpen) return null;

  const handleSeatClick = (seatNumber, isAvailable) => {
    if (!isAvailable) return;

    if (selectedSeats.includes(seatNumber)) {
      setSelectedSeats(selectedSeats.filter((s) => s !== seatNumber));
    } else {
      if (selectedSeats.length >= passengers) {
        // If max seats reached, cycle selection
        setSelectedSeats([...selectedSeats.slice(1), seatNumber]);
      } else {
        setSelectedSeats([...selectedSeats, seatNumber]);
      }
    }
  };

  const handleSave = () => {
    if (selectedSeats.length !== passengers) {
      alert(`Please select exactly ${passengers} seat(s).`);
      return;
    }
    onConfirm(selectedSeats);
    onClose();
  };

  // Seating layout: 25 Rows, columns A-F
  const rows = Array.from({ length: 25 }, (_, i) => i + 1);
  const leftCols = ["A", "B", "C"];
  const rightCols = ["D", "E", "F"];

  const getSeatStatus = (seatNumber) => {
    // If the seat is part of THIS booking's initial selection, it is considered available for editing!
    const isInitiallyOurs = initialSeats.includes(seatNumber);
    const isBooked = flight?.bookedSeats?.includes(seatNumber) || false;
    const isAvailable = !isBooked || isInitiallyOurs;
    const isSelected = selectedSeats.includes(seatNumber);

    return {
      isAvailable,
      isSelected,
    };
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div
        className="bg-[#f7f9fc] rounded-3xl w-full max-w-4xl shadow-xl border border-gray-200 overflow-hidden flex flex-col my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-white px-6 py-5 border-b border-gray-150 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-black text-slate-900">
              Modify Seating Allocation
            </h3>
            <p className="text-xs text-gray-500 font-bold uppercase mt-1">
              Selecting <span className="text-blue-600 font-extrabold">{passengers} seat(s)</span> for flight {flight?.flightNumber || ""}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-gray-400 hover:text-slate-700 flex items-center justify-center transition-all duration-200 outline-none"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 md:p-8 flex-1 overflow-y-auto max-h-[60vh] grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {loading ? (
            <div className="col-span-3 py-20 text-center text-blue-600 font-bold">
              Loading fresh cabin configuration...
            </div>
          ) : errorMsg ? (
            <div className="col-span-3 py-12 text-center text-red-600 font-bold bg-red-50 border border-red-200 rounded-2xl">
              {errorMsg}
            </div>
          ) : (
            <>
              {/* Seat Map */}
              <div className="md:col-span-2 flex flex-col items-center">
                {/* Visual Cockpit */}
                <div className="w-full max-w-sm bg-gray-50 border border-gray-200 rounded-t-[80px] border-b-0 py-6 flex flex-col items-center justify-center relative overflow-hidden">
                  <div className="w-14 h-6 border border-gray-300 rounded-full flex items-center justify-center font-bold text-[9px] text-gray-400 select-none bg-white mb-1">
                    COCKPIT
                  </div>
                  <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
                </div>

                {/* Main Cabin Map */}
                <div className="w-full max-w-sm border-x border-gray-200 px-4 py-8 bg-white flex flex-col items-center space-y-2 relative">
                  {rows.map((rowNum) => {
                    const isExitRow = rowNum === 12 || rowNum === 13;

                    return (
                      <div key={rowNum} className="w-full flex items-center justify-between">
                        {/* Left Group */}
                        <div className="flex gap-2">
                          {leftCols.map((col) => {
                            const seatNum = `${rowNum}${col}`;
                            const { isAvailable, isSelected } = getSeatStatus(seatNum);

                            return (
                              <button
                                key={seatNum}
                                onClick={() => handleSeatClick(seatNum, isAvailable)}
                                disabled={!isAvailable}
                                className={`w-8 h-8 rounded-md border text-[11px] font-bold transition-all duration-150 flex items-center justify-center select-none ${
                                  isSelected
                                    ? "bg-gradient-to-br from-blue-600 to-indigo-700 border-indigo-700 text-white shadow-sm scale-105"
                                    : isAvailable
                                      ? "border-blue-200 text-blue-800 bg-white hover:bg-blue-50/50 hover:border-blue-400"
                                      : "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed line-through opacity-40"
                                }`}
                              >
                                {col}
                              </button>
                            );
                          })}
                        </div>

                        {/* Aisle */}
                        <div className="flex flex-col items-center justify-center w-8 relative">
                          <span className="text-[10px] font-black text-slate-400 select-none">
                            {rowNum}
                          </span>
                          {isExitRow && (
                            <div className="absolute -left-12 -right-12 h-[1px] border-t border-dashed border-amber-200 pointer-events-none -z-10 flex items-center justify-between">
                              <span className="text-[6px] font-bold text-amber-500 bg-amber-50 px-0.5 rounded uppercase">EXIT</span>
                              <span className="text-[6px] font-bold text-amber-500 bg-amber-50 px-0.5 rounded uppercase">EXIT</span>
                            </div>
                          )}
                        </div>

                        {/* Right Group */}
                        <div className="flex gap-2">
                          {rightCols.map((col) => {
                            const seatNum = `${rowNum}${col}`;
                            const { isAvailable, isSelected } = getSeatStatus(seatNum);

                            return (
                              <button
                                key={seatNum}
                                onClick={() => handleSeatClick(seatNum, isAvailable)}
                                disabled={!isAvailable}
                                className={`w-8 h-8 rounded-md border text-[11px] font-bold transition-all duration-150 flex items-center justify-center select-none ${
                                  isSelected
                                    ? "bg-gradient-to-br from-blue-600 to-indigo-700 border-indigo-700 text-white shadow-sm scale-105"
                                    : isAvailable
                                      ? "border-blue-200 text-blue-800 bg-white hover:bg-blue-50/50 hover:border-blue-400"
                                      : "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed line-through opacity-40"
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

                {/* Visual Rear */}
                <div className="w-full max-w-sm bg-gray-50 border border-gray-200 rounded-b-[20px] border-t-0 py-4 flex flex-col items-center justify-center relative overflow-hidden">
                  <div className="text-[8px] font-bold text-gray-400 uppercase tracking-widest select-none">
                    REAR / GALLEY
                  </div>
                </div>
              </div>

              {/* Sidebar Info */}
              <div className="space-y-6">
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
                  <h4 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider border-b border-gray-100 pb-2">
                    Current Selections
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400 font-bold uppercase">Required:</span>
                      <span className="font-extrabold text-slate-800">{passengers} Pax</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400 font-bold uppercase">Assigned:</span>
                      <span className="font-mono font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                        {selectedSeats.length > 0 ? selectedSeats.join(", ") : "None"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3">
                  <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider mb-2">
                    Map Key
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded border border-blue-200 bg-white"></div>
                      <span className="text-gray-500 font-bold uppercase text-[10px]">Available</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded border border-indigo-700 bg-gradient-to-br from-blue-600 to-indigo-700"></div>
                      <span className="text-gray-500 font-bold uppercase text-[10px]">Selected</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded border border-slate-200 bg-slate-100 opacity-60 line-through"></div>
                      <span className="text-gray-500 font-bold uppercase text-[10px]">Occupied</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-white px-6 py-4 border-t border-gray-150 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 border border-gray-200 rounded-xl bg-white font-bold text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={selectedSeats.length !== passengers || loading}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            Save Selection
          </button>
        </div>
      </div>
    </div>
  );
};

export default SeatSelectionModal;
