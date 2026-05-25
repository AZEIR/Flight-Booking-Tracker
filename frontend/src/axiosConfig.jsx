import axios from "axios";

const axiosInstance = axios.create({
  // Appending /api here streamlines all down-stream page operations
  baseURL: process.env.REACT_APP_DOMAIN_NAME
    ? `${process.env.REACT_APP_DOMAIN_NAME}/api`
    : "http://localhost:5001/api",
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

// Automatically adds the saved JWT token to the headers of all outgoing API requests.
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token"); // Or retrieve from your global Auth state
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);
export default axiosInstance;
