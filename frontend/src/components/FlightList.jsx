import { useAuth } from "../context/AuthContext";
import axiosInstance from "../axiosConfig";

const FlightList = ({ flights, setFlights, setEditingFlight }) => {
  const { user } = useAuth();

  const handleDelete = async (flightId) => {
    try {
      await axiosInstance.delete(`/api/flights/${flightId}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setFlights(flights.filter((flight) => flight._id !== flightId));
    } catch (error) {
      alert("Failed to delete flight.");
    }
  };

  return (
    <div className="space-y-4">
      {flights.map((flight) => (
        <div
          key={flight._id}
          className="bg-white p-6 rounded-3xl shadow-lg flex flex-col md:flex-row justify-between items-center border border-slate-100"
        >
          <div className="mb-4 md:mb-0 w-full md:w-auto">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-xl font-bold text-slate-800">
                {flight.destination}
              </h3>
              <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full">
                {flight.flightNumber}
              </span>
            </div>
            <p className="text-slate-500 font-medium">
              {new Date(flight.departureDate).toLocaleDateString()} •{" "}
              {flight.status}
            </p>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <button
              onClick={() => setEditingFlight(flight)}
              className="flex-1 md:flex-none bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 px-6 rounded-2xl transition-all"
            >
              Edit
            </button>
            <button
              onClick={() => handleDelete(flight._id)}
              className="flex-1 md:flex-none bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-3 px-6 rounded-2xl transition-all"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FlightList;
