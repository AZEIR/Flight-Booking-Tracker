import { useState, useEffect } from "react";
import axiosInstance from "../axiosConfig";
import FlightForm from "../components/FlightForm";
import FlightList from "../components/FlightList";
import { useAuth } from "../context/AuthContext";

const Flights = () => {
  const { user } = useAuth();
  const [flights, setFlights] = useState([]);
  const [editingFlight, setEditingFlight] = useState(null);

  useEffect(() => {
    const fetchFlights = async () => {
      try {
        const response = await axiosInstance.get("/api/flights");
        setFlights(response.data);
      } catch (error) {
        alert("Failed to fetch flights.");
      }
    };
    if (user) {
      fetchFlights();
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-slate-900 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        {/* ADDED: White text for the dark background */}
        <h1 className="text-3xl font-bold mb-8 text-white text-center">
          My Flight Bookings
        </h1>

        <FlightForm
          flights={flights}
          setFlights={setFlights}
          editingFlight={editingFlight}
          setEditingFlight={setEditingFlight}
        />

        <FlightList
          flights={flights}
          setFlights={setFlights}
          setEditingFlight={setEditingFlight}
        />
      </div>
    </div>
  );
};

export default Flights;
