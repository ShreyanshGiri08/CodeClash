import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";   // yeh line add karo
import FindRace from "./pages/FindRace";
import Race from "./pages/Race";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />   {/* naya wala use hoga */}
        <Route path="/" element={<Navigate to="/signup" />} />
        <Route path="/race/find" element={<FindRace />} />
        <Route path="/race/:raceId" element={<Race />} />
      </Routes>
    </BrowserRouter>
  );
}