import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.REACT_APP_DOMAIN_NAME || "http://localhost:5001",
  headers: { "Content-Type": "application/json" },
});

export default axiosInstance;
