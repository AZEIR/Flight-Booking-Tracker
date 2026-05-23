// src/axiosConfig.jsx
import axios from "axios";

const axiosInstance = axios.create({
  // Appending /api here streamlines all down-stream page operations
  baseURL: process.env.REACT_APP_DOMAIN_NAME
    ? `${process.env.REACT_APP_DOMAIN_NAME}/api`
    : "http://localhost:5001/api",
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

export default axiosInstance;
