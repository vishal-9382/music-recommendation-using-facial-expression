import React from "react";
import ReactDOM from "react-dom/client";
import Garlic from "./App.js";
import About from "./About.js";
import Dashboard from "./Dashboard.js";
import Login from "./Login.js";

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = sessionStorage.getItem('loggedInUser') !== null;
  return isAuthenticated ? children : <Navigate to="/login" />;
};

let root = ReactDOM.createRoot(document.getElementById("root"));

function App() {
  return (
    <div>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/home" element={<ProtectedRoute><Garlic /></ProtectedRoute>} />
          <Route path="/about" element={<ProtectedRoute><About /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        </Routes>
      </Router>
    </div>
  );
}

root.render(<App></App>);
