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
  const [visible, setVisible] = useState(false);
  const [shown, setShown] = useState(false); // show at most once per session

  useEffect(() => {
    const handler = (e) => {
      if (e.detail.waking) {
        if (!shown) { setVisible(true); setShown(true); }
      } else {
        // Delay hiding so user can read it
        setTimeout(() => setVisible(false), 3500);
      }
    };
    window.addEventListener('server-waking', handler);
    return () => window.removeEventListener('server-waking', handler);
  }, [shown]);

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 bg-gray-900 text-white text-sm font-medium px-5 py-3 rounded-full shadow-2xl border border-white/10 pointer-events-none transition-all duration-500"
      style={{ opacity: visible ? 1 : 0, transform: `translateX(-50%) translateY(${visible ? 0 : 24}px)` }}
    >
      <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-yellow-400" />
      </span>
      Server is waking up — may take ~30 s on the free tier
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
