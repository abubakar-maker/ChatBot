import React from "react";
import Bot from "./component/Bot";
import Signup from "./component/Signup";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import Login from "./component/Login";

const App = () => {
  return (
      <Routes>
        <Route path="/" element={<Bot />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Routes>
  );
};

export default App;
