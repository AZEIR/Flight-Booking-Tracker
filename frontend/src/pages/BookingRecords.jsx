import React, { useState, useEffect } from "react";
import axiosInstance from "../axiosConfig";
import { useAuth } from "../context/AuthContext";
import AdminBookingCard from "../components/AdminBookingCard";
import UserBookingCard from "../components/UserBookingCard";

const BookingRecords = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

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
      const fetchedBookings = data?.data || data;
      setBookings(Array.isArray(fetchedBookings) ? fetchedBookings : []);
    } catch (error) {
      console.error("Failed to fetch records:", error);
      setErrorMsg(
        "Failed to synchronize with the database. Please ensure you are logged in.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = (booking) => {
    setEditingId(booking._id);
    setEditForm({
      paxCount: booking.passengers?.toString() || "1",
      priceOverride: booking.totalPrice?.toString() || "0",
    });
    setErrorMsg("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ paxCount: "1", priceOverride: "" });
    setErrorMsg("");
  };

  const handleSaveRecord = async (bookingId) => {
    const isAdmin = user?.role === "admin";
    if (
      isAdmin &&
      (!editForm.priceOverride || parseFloat(editForm.priceOverride) <= 0)
    ) {
      setErrorMsg("Please enter a valid price amount.");
      return;
    }
    setIsSubmitting(true);
    setErrorMsg("");
    try {
      const payload = {
        newPassengers: parseInt(editForm.paxCount, 10),
      };
      if (isAdmin) {
        payload.adminPriceOverride = parseFloat(editForm.priceOverride);
      }
      await axiosInstance.put(`/bookings/${bookingId}`, payload);
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
              const isEditingThis = editingId === booking._id;

              if (user?.role === "admin") {
                return (
                  <AdminBookingCard
                    key={booking._id}
                    booking={booking}
                    isEditing={isEditingThis}
                    editForm={editForm}
                    setEditForm={setEditForm}
                    onEditClick={() => handleEditClick(booking)}
                    onCancelEdit={cancelEdit}
                    onSave={() => handleSaveRecord(booking._id)}
                    onCancelBooking={() => handleCancelBooking(booking._id)}
                    isSubmitting={isSubmitting}
                  />
                );
              } else {
                return (
                  <UserBookingCard
                    key={booking._id}
                    booking={booking}
                    isEditing={isEditingThis}
                    editForm={editForm}
                    setEditForm={setEditForm}
                    onEditClick={() => handleEditClick(booking)}
                    onCancelEdit={cancelEdit}
                    onSave={() => handleSaveRecord(booking._id)}
                    onCancelBooking={() => handleCancelBooking(booking._id)}
                    isSubmitting={isSubmitting}
                  />
                );
              }
            })
          )}
        </section>
      </main>
    </div>
  );
};

export default BookingRecords;
