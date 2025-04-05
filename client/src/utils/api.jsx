import axios from "axios";

// Create an Axios instance
const api = axios.create({
  baseURL: "https://deatils-deploy-2.vercel.app", // Change to your API URL
});

// Request Interceptor: Attach token to headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Unauthorized (401) errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      // Don't redirect here to prevent the infinite loop.
    }
    return Promise.reject(error);
  }
);

export default api;
