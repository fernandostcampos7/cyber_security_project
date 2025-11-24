import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

export const api = axios.create({
  baseURL,
  withCredentials: true
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("Unauthenticated request", error.config?.url);
    }
    return Promise.reject(error);
  }
);
