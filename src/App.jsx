import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
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

// Smooth animated page transition — slide-up + fade
const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.24, ease: [0.4, 0, 0.2, 1] } },
  exit:    { opacity: 0, y: -10, transition: { duration: 0.16, ease: [0.4, 0, 1, 1] } },
};

function PageTransition({ children }) {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        style={{ minHeight: "100vh" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// Intercepts the hardware/browser back button for authenticated users
// and lands them on /dashboard instead of reversing navigation history
function BackButtonGuard() {
  const navigate = useNavigate();
  useEffect(() => {
    const handlePopState = () => {
      if (getToken()) {
        navigate("/dashboard", { replace: true });
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [navigate]);
  return null;
}

// Registers a periodic service worker update check so PWA users on mobile
// always get the latest version shortly after it's deployed.
function usePWAAutoUpdate() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    // When the SW controller changes (new SW took over), reload the page
    // so assets match the freshly activated service worker.
    const handleControllerChange = () => {
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    // Trigger an update check every 60 seconds and also when the tab regains focus.
    // Mobile browsers don't always check for SW updates on resume from background.
    let reg = null;
    navigator.serviceWorker.ready.then((r) => { reg = r; });

    const checkUpdate = () => { if (reg) reg.update().catch(() => {}); };
    const interval = setInterval(checkUpdate, 60_000);
    window.addEventListener('focus', checkUpdate);

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      clearInterval(interval);
      window.removeEventListener('focus', checkUpdate);
    };
  }, []);
}

// Offline indicator banner
function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  useEffect(() => {
    const goOnline  = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online',  goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online',  goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);
  if (isOnline) return null;
  return (
    <div className="fixed top-0 inset-x-0 z-[200] bg-amber-500 text-white text-center text-sm font-semibold py-2 px-4 shadow-md">
      ⚠ You&apos;re offline — changes won&apos;t save
    </div>
  );
}

function App() {
  // Kick off a health check immediately so cold-start happens ASAP
  useEffect(() => { wakeUpServer(); }, []);
  usePWAAutoUpdate();

  return (
    <BrowserRouter>
      <OfflineBanner />
      <BackButtonGuard />
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
