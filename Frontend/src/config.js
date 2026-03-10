// Replace the hardcoded localhost string with this:
export const API_BASE = import.meta.env.VITE_REACT_APP_BACKEND_BASEURL 
    ? `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/bot/v1` 
    : "http://localhost:4002/bot/v1"; 

console.log("Current API Base:", API_BASE); // This helps you debug in the F12 console