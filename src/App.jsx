import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import SketchPage from "./pages/SketchPage";

export default function App() {
  const [user, setUser] = useState(null);

  const handleLogin = (userData) => setUser(userData);
  const handleLogout = () => setUser(null);

  return (
    <BrowserRouter>
      <Routes>
        {/* If not logged in, always go to login */}
        <Route
          path="/"
          element={
            user
              ? <Navigate to="/dashboard" replace />
              : <Login onLogin={handleLogin} />
          }
        />

        {/* Dashboard — protected */}
        <Route
          path="/dashboard"
          element={
            user
              ? <Dashboard user={user} onLogout={handleLogout} />
              : <Navigate to="/" replace />
          }
        />

        {/* Sketch Tool — protected */}
        <Route
          path="/sketch"
          element={
            user
              ? <SketchPage user={user} onLogout={handleLogout} />
              : <Navigate to="/" replace />
          }
        />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}