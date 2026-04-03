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
    flightNumer: "",
    destination: "",
    departureDate: "",
    status: "Scheduled",
  });

  useEffect(() => {
    if (editingFlight) {
      setFormData({
        flightNumer: editingFlight.flightNumber,
        destination: editingFlight.destination,
        departureDate: editingFlight.departureDate,
        status: editingFlight.status,
      });
    } else {
      setFormData({
        flightNumer: "",
        destination: "",
        departureDate: "",
        status: "Scheduled",
      });
    }
  }, [editingFlight]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingFlight) {
        const response = await axiosInstance.put(
          `/api/flights/${editingFlight._id}`,
          formData,
          {
            headers: { Authorization: `Bearer ${user.token}` },
          },
        );
        setFlights(
          flights.map((flight) =>
            flight._id === response.data._id ? response.data : flight,
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
        flightNumer: "",
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
      className="bg-white p-6 shadow-md rounded-lg mb-6 border border-gray-200"
    >
      <h2 className="text-xl font-bold mb-4 text-gray-800">
        {editingFlight ? "Update Flight Details" : "Schedule a New Flight"}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <input
          type="text"
          placeholder="Flight Number (e.g., QF123)"
          value={formData.flightNumber}
          onChange={(e) =>
            setFormData({ ...formData, flightNumber: e.target.value })
          }
          className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />

        <input
          type="text"
          placeholder="Destination"
          value={formData.destination}
          onChange={(e) =>
            setFormData({ ...formData, destination: e.target.value })
          }
          className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />

        <input
          type="date"
          value={formData.departureDate}
          onChange={(e) =>
            setFormData({ ...formData, departureDate: e.target.value })
          }
          className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />

        <select
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="Scheduled">Scheduled</option>
          <option value="Delayed">Delayed</option>
          <option value="Departed">Departed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold p-3 rounded transition duration-200"
        >
          {editingFlight ? "Update Flight" : "Save Flight"}
        </button>

        {/* If editing, show a cancel button to back out */}
        {editingFlight && (
          <button
            type="button"
            onClick={() => setEditingFlight(null)}
            className="w-1/3 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold p-3 rounded transition duration-200"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export default FlightForm;
