import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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

function WakingBanner() {
  const [waking, setWaking] = useState(false);

  useEffect(() => {
    const handler = (e) => setWaking(e.detail.waking);
    window.addEventListener('server-waking', handler);
    return () => window.removeEventListener('server-waking', handler);
  }, []);

  if (!waking) return null;
  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-gray-900 dark:bg-gray-800 text-white text-sm font-medium px-5 py-3 rounded-full shadow-xl border border-gray-700 animate-pulse pointer-events-none">
      <span className="inline-block h-2.5 w-2.5 rounded-full bg-yellow-400 animate-ping" />
      Server is waking up — this takes ~30 s on the free tier…
    </div>
  );
}

function App() {
  // Kick off a health check immediately so cold-start happens ASAP
  useEffect(() => { wakeUpServer(); }, []);

  return (
    <BrowserRouter>
      <WakingBanner />
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
    </BrowserRouter>
  );
}

export default App;
