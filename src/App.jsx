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
import { getToken, setToken, clearAuth, silentRefresh, wakeUpServer, getUserId, API_URL, apiFetch } from "./utils/api";
import Aaru from "./components/Aaru";

// Redirects to / if not logged in (checks in-memory access token)
function ProtectedRoute({ element }) {
  return getToken() ? element : <Navigate to="/" replace />;
}

// Redirects to /dashboard if already logged in
function PublicRoute({ element }) {
  return getToken() ? <Navigate to="/dashboard" replace /> : element;
}

// Smooth page transition — cross-fade + subtle lift
const PAGE_ENTER = { opacity: 1, y: 0, scale: 1 };
const PAGE_EXIT  = { opacity: 0, y: -8, scale: 0.99 };
const PAGE_INIT  = { opacity: 0, y: 8, scale: 0.99 };
const PAGE_TRAN  = { duration: 0.22, ease: [0.16, 1, 0.3, 1] };

function PageTransition({ children }) {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={PAGE_INIT}
        animate={PAGE_ENTER}
        exit={PAGE_EXIT}
        transition={PAGE_TRAN}
        style={{ minHeight: "100dvh" }}
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

// Provides Aaru with live groups + friend names; renders nothing when logged out
function AaruContainer() {
  const { pathname } = useLocation(); // re-render on every navigation (e.g. after login)
  const [groups, setGroups] = useState([]);
  const [friends, setFriends] = useState([]);
  const userId = getUserId();
  const token = getToken();

  useEffect(() => {
    if (!token) return;
    apiFetch(`${API_URL}/groups?userId=${userId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.groups) setGroups(d.groups); })
      .catch(() => {});
    apiFetch(`${API_URL}/friends`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const list = d?.friends || [];
        setFriends(list.map((f) => f.name || f.email || "").filter(Boolean));
      })
      .catch(() => {});
  }, [token, userId, pathname]); // re-fetch when token appears or route changes

  if (!token) return null;
  return <Aaru groups={groups} userId={userId} friends={friends} />;
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
  const [authReady, setAuthReady] = useState(false);

  // Kick off a health check immediately so cold-start happens ASAP.
  // Also attempt a silent refresh to restore the session from the httpOnly cookie.
  useEffect(() => {
    wakeUpServer();
    silentRefresh().finally(() => setAuthReady(true));

    // When apiFetch detects a 401 that can't be refreshed, clear everything and go home
    const handleForceLogout = () => {
      clearAuth();
      window.location.replace('/');
    };
    window.addEventListener('auth:logout', handleForceLogout);
    return () => window.removeEventListener('auth:logout', handleForceLogout);
  }, []);

  usePWAAutoUpdate();

  // Don't render routes until we know whether the session is valid
  if (!authReady) return null;

  return (
    <BrowserRouter>
      <OfflineBanner />
      <AaruContainer />
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
