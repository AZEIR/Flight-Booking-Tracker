import axios from "axios";

const axiosInstance = axios.create({
  // baseURL: "http://localhost:5001", // local
  baseURL: "http://ec2-15-135-202-54.ap-southeast-2.compute.amazonaws.com:5001", // live
  headers: { "Content-Type": "application/json" },
});

export default axiosInstance;
