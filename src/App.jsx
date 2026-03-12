import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import Groups from "./pages/Groups";
import Expenses from "./pages/Expenses";
import Profile from "./pages/Profile";
import Balances from "./pages/Balances";
import Friends from "./pages/Friends";
import AddFriend from "./pages/AddFriend";
import { getToken, wakeUpServer } from "./utils/api";

// Redirects to / if not logged in
function ProtectedRoute({ element }) {
  return getToken() ? element : <Navigate to="/" replace />;
}

// Redirects to /dashboard if already logged in
function PublicRoute({ element }) {
  return getToken() ? <Navigate to="/dashboard" replace /> : element;
}

// Smooth fade-in on route change
function PageTransition({ children }) {
  const location = useLocation();
  const [displayed, setDisplayed] = useState(false);

  useEffect(() => {
    setDisplayed(false);
    const frame = requestAnimationFrame(() => setDisplayed(true));
    return () => cancelAnimationFrame(frame);
  }, [location.pathname]);

  return (
    <div
      className="transition-opacity duration-300 ease-out"
      style={{ opacity: displayed ? 1 : 0 }}
    >
      {children}
    </div>
  );
}

function App() {
  // Kick off a health check immediately so cold-start happens ASAP
  useEffect(() => { wakeUpServer(); }, []);

  return (
    <BrowserRouter>
      <PageTransition>
        <Routes>
          <Route path="/" element={<PublicRoute element={<Home />} />} />
          <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
          <Route path="/groups" element={<ProtectedRoute element={<Groups />} />} />
          <Route path="/expenses" element={<ProtectedRoute element={<Expenses />} />} />
          <Route path="/profile" element={<ProtectedRoute element={<Profile />} />} />
          <Route path="/balances" element={<ProtectedRoute element={<Balances />} />} />
          <Route path="/friends" element={<ProtectedRoute element={<Friends />} />} />
          {/* Public — anyone with the link/QR can land here */}
          <Route path="/add-friend/:userId" element={<AddFriend />} />
        </Routes>
      </PageTransition>
    </BrowserRouter>
  );
}

export default App;
