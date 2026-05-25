import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axiosInstance from "../axiosConfig";

const MockPayment = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Extract payment details passed from seat selection
  const { payload, flight, passengers, seats, totalPrice } = location.state || {};

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!payload || !flight) {
      // Prevent rendering if accessed directly without booking state
      navigate("/");
    }
  }, [payload, flight, navigate]);

  // Handle Pay Submit
  const handlePayment = async () => {
    try {
      setIsProcessing(true);
      setErrorMsg("");

      // Trigger actual booking creation in DB
      await axiosInstance.post("/bookings", payload);
      
      alert("Payment Simulated Successfully! Your reservation is confirmed.");
      navigate("/dashboard");
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to finalize seat allocations with backend database.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!payload || !flight) return null;

  return (
    <div className="bg-[#f7f9fc] text-slate-900 min-h-screen flex items-center justify-center py-12 px-4 font-sans">
      <div className="bg-white border border-gray-200 rounded-3xl p-8 max-w-md w-full shadow-sm space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2 border-b border-gray-100 pb-5">
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Checkout</h1>
          <p className="text-slate-400 font-semibold text-xs uppercase tracking-wider">
            Third Party Payment Demonstration
          </p>
        </div>

        {/* Decline Notification banner if error */}
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {/* Flight summary info */}
        <div className="space-y-4 text-sm font-medium">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-gray-100 pb-1">
            Order Details
          </h3>
          <div className="flex justify-between">
            <span className="text-slate-500">Flight Number:</span>
            <span className="font-extrabold text-slate-900">{flight.flightNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Route:</span>
            <span className="font-bold text-slate-800">
              {flight.departureAirport} → {flight.arrivalAirport}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Passengers:</span>
            <span className="font-bold text-slate-800">{passengers} Pax</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Assigned Seats:</span>
            <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 text-xs">
              {seats.join(", ")}
            </span>
          </div>
          <div className="border-t border-dashed border-gray-200 pt-4 flex justify-between items-baseline">
            <span className="font-extrabold text-slate-900 uppercase text-xs">Total Price:</span>
            <span className="font-black text-2xl text-emerald-600 tracking-tight">
              ${totalPrice?.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 pt-2">
          <button
            onClick={handlePayment}
            disabled={isProcessing}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold py-4 px-6 rounded-2xl shadow-sm transition-all duration-200 text-sm uppercase tracking-wider text-center"
          >
            {isProcessing ? "Processing Simulated Payment..." : "Simulate Successful Payment"}
          </button>
          
          <button
            onClick={() => navigate(-1)}
            disabled={isProcessing}
            className="w-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-bold py-4 rounded-2xl transition-all duration-200 text-sm uppercase tracking-wider text-center"
          >
            Cancel & Go Back
          </button>
        </div>

        {/* Security Badge Info */}
        <div className="pt-2 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center justify-center gap-1.5">
          <span className="material-symbols-outlined text-xs">lock</span>
          Safe Sandbox Demo Gate
        </div>
      </div>
    </div>
  );
};

export default MockPayment;
