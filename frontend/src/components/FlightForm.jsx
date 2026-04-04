import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../axiosConfig";

const FlightForm = ({
  flights,
  setFlights,
  editingFlight,
  setEditingFlight,
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    flightNumber: "",
    destination: "",
    departureDate: "",
    status: "Scheduled",
  });

  useEffect(() => {
    if (editingFlight) {
      let formattedDate = "";
      if (editingFlight.departureDate) {
        formattedDate = editingFlight.departureDate.substring(0, 10);
      }

      setFormData({
        flightNumber: editingFlight.flightNumber,
        destination: editingFlight.destination,
        departureDate: formattedDate,
        status: editingFlight.status,
      });
    } else {
      setFormData({
        flightNumber: "",
        destination: "",
        departureDate: "",
        status: "Scheduled",
      });
    }
  }, [editingFlight]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const flightNumberRegex = /^[A-Z]{2}\d{3}$/;
    const flightDestinationRegex = /^[A-Z]{3}$/;
    if (!flightNumberRegex.test(formData.flightNumber)) {
      alert("Flight number must be 2 uppercase letters and 3 numbers!");
      return;
    } else if (!flightDestinationRegex.test(formData.destination)) {
      alert("Flight Number must be 3 uppercase letters");
      return;
    }

    try {
      if (editingFlight) {
        const response = await axiosInstance.put(
          `/api/flights/${editingFlight._id}`,
          formData,
          {
            headers: { Authorization: `Bearer ${user.token}` },
          },
        );

        const updatedRecord = response.data.updatedFlight
          ? response.data.updatedFlight
          : response.data;

        setFlights(
          flights.map((flight) =>
            flight._id === updatedRecord._id ? updatedRecord : flight,
          ),
        );
      } else {
        const response = await axiosInstance.post("/api/flights", formData, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setFlights([...flights, response.data]);
      }
      setEditingFlight(null);
      setFormData({
        flightNumber: "",
        destination: "",
        departureDate: "",
        status: "Scheduled",
      });
    } catch (error) {
      alert("Failed to save flight.");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-8 shadow-xl rounded-3xl mb-8"
    >
      <h2 className="text-2xl font-bold mb-6 text-slate-800 text-center">
        {editingFlight ? "Update Flight" : "Book a New Flight"}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        <input
          type="text"
          placeholder="Flight Number (e.g., QF123)"
          maxLength="5"
          value={formData.flightNumber}
          onChange={(e) =>
            setFormData({
              ...formData,
              flightNumber: e.target.value.toUpperCase(),
            })
          }
          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          required
        />

        <input
          type="text"
          placeholder="Destination"
          maxLength="3"
          value={formData.destination}
          onChange={(e) =>
            setFormData({
              ...formData,
              destination: e.target.value.toUpperCase(),
            })
          }
          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          required
        />

        <input
          type="date"
          value={formData.departureDate}
          onChange={(e) =>
            setFormData({ ...formData, departureDate: e.target.value })
          }
          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          required
        />

        <select
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
        >
          <option value="Scheduled">Scheduled</option>
          <option value="Delayed">Delayed</option>
          <option value="Departed">Departed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg transition-all"
        >
          {editingFlight ? "Update Flight" : "Confirm Booking"}
        </button>

        {editingFlight && (
          <button
            type="button"
            onClick={() => setEditingFlight(null)}
            className="w-1/3 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-4 rounded-2xl transition-all"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export default FlightForm;
