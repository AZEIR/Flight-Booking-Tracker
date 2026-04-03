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
    <div>
      {flights.map((flight) => (
        <div key={flight._id} className="bg-gray-100 p-4 mb-4 rounded shadow">
          <h2 className="font-bold">{flight.flightNumber}</h2>
          <p>Destination: {flight.destination}</p>
          <p className="text-sm text-gray-500">
            Departure Date:{" "}
            {new Date(flight.departureDate).toLocaleDateString()}
          </p>
          <p className="text-sm text-gray-500">
            Flight Status: {flight.status}
          </p>
          <div className="mt-2">
            <button
              onClick={() => setEditingFlight(flight)}
              className="mr-2 bg-yellow-500 text-white px-4 py-2 rounded"
            >
              Edit
            </button>
            <button
              onClick={() => handleDelete(flight._id)}
              className="bg-red-500 text-white px-4 py-2 rounded"
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
