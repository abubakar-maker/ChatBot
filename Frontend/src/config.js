// config.js
const BASE_URL =import.meta.env.VITE_REACT_APP_BACKEND_BASEURL || "http://localhost:4002";

export const API_BASE = `${BASE_URL}/bot/v1`;

console.log("Connecting to API at:", API_BASE);