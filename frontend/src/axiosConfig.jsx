import axios from "axios";

const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_DOMAIN_NAME || "http://localhost:5001",
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

export default axiosInstance;
