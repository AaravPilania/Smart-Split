import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import Groups from "./pages/Groups";
import Expenses from "./pages/Expenses";
import Profile from "./pages/Profile";
import { getToken } from "./utils/api";

// Redirects to / if not logged in
function ProtectedRoute({ element }) {
  return getToken() ? element : <Navigate to="/" replace />;
}

// Redirects to /dashboard if already logged in
function PublicRoute({ element }) {
  return getToken() ? <Navigate to="/dashboard" replace /> : element;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicRoute element={<Home />} />} />
        <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
        <Route path="/groups" element={<ProtectedRoute element={<Groups />} />} />
        <Route path="/expenses" element={<ProtectedRoute element={<Expenses />} />} />
        <Route path="/profile" element={<ProtectedRoute element={<Profile />} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
