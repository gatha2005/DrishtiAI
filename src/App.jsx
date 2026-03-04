import { useState } from "react";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Cameras from "./pages/Cameras";
import Alerts from "./pages/Alerts";
import Database from "./pages/Database";
import Reports from "./pages/Reports";
import Navbar from "./components/Navbar";
import SketchBuilder from "./pages/SketchBuilder";

export default function App() {
  const [user, setUser] = useState(null);
  const [activePage, setActivePage] = useState("dashboard");

  const handleLogin = (userData) => setUser(userData);

  const handleLogout = () => {
    setUser(null);
    setActivePage("dashboard");
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":
        return <Dashboard user={user} />;
      case "cameras":
        return <Cameras />;
      case "alerts":
        return <Alerts />;
      case "database":
        return <Database />;
      case "reports":
        return <Reports />;
      default:
        return <Dashboard user={user} />;
    }
  };

  return (
    <div>
      <Navbar onNavigate={setActivePage} />
      {activePage === "dashboard" && (<Dashboard user={user} onLogout={handleLogout} />)}
      {activePage === "cameras" && <Cameras />}
      {activePage === "alerts" && <Alerts />}
      {activePage === "reports" && <Reports />}
      {activePage === "sketch" && <SketchBuilder />}  

    </div>
  );
}