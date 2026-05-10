import React, { createContext, useState, useContext, useEffect } from "react";
import axiosInstance from "../axiosConfig";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkLoggedInUser = async () => {
      try {
        const response = await axiosInstance.get("/api/auth/profile");
        setUser(response.data);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkLoggedInUser();
  });

  const login = (userData) => {
    setUser(userData);
  };

  const logout = async () => {
    try {
      await axiosInstance.post("/api/auth/logout");
      setUser(null);
    } catch (error) {
      console.error("Logout failed");
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
