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
        const response = await axiosInstance.get("/api/flights", {
          headers: { Authorization: `Bearer ${user.token}` },
        });
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
    <div className="container mx-auto p-6">
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
  );
};

export default Flights;
