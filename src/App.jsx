import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, lazy, Suspense } from "react";
import { AnimatePresence, motion } from "framer-motion";

// Lazy-loaded pages — each becomes its own JS chunk so the initial bundle is ~40KB lighter
const Dashboard  = lazy(() => import("./pages/Dashboard"));
const Home       = lazy(() => import("./pages/Home"));
const Groups     = lazy(() => import("./pages/Groups"));
const Expenses   = lazy(() => import("./pages/Expenses"));
const Profile    = lazy(() => import("./pages/Profile"));
const Balances   = lazy(() => import("./pages/Balances"));
const Friends    = lazy(() => import("./pages/Friends"));
const AddFriend  = lazy(() => import("./pages/AddFriend"));
const NotFound   = lazy(() => import("./pages/NotFound"));

import { getToken, setToken, clearAuth, silentRefresh, wakeUpServer, getUserId, API_URL, apiFetch } from "./utils/api";
import Aaru from "./components/Aaru";
import PWAUpdatePrompt from "./components/PWAUpdatePrompt";

// Redirects to / if not logged in (checks in-memory access token)
function ProtectedRoute({ element }) {
  return getToken() ? element : <Navigate to="/" replace />;
}

// Full-screen loader shown while silentRefresh is in-flight for returning "keep me logged in" users
function AuthLoadingScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ background: '#0c0e1a' }}>
      <div className="flex flex-col items-center gap-5">
        <img src="/icon.png" alt="Smart Split" className="h-14 w-14 rounded-2xl shadow-xl" style={{ boxShadow: '0 8px 32px rgba(236,72,153,0.30)' }} />
        <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(236,72,153,0.3)', borderTopColor: '#ec4899' }} />
      </div>
    </div>
  );
}

// Redirects to /dashboard if already logged in — but only AFTER auth state is resolved.
// When authReady=false and user has localStorage session, show a loading screen to prevent
// the black-flash of the home page before redirect.
function PublicRoute({ element, authReady = true }) {
  if (!authReady) {
    // If localStorage shows a previous "keep me logged in" session, show loading screen
    // instead of the home page to avoid a jarring flash before the redirect.
    if (localStorage.getItem('userId')) return <AuthLoadingScreen />;
    return element;
  }
  return getToken() ? <Navigate to="/dashboard" replace /> : element;
}

// Smooth page transition — instant exit so there's no blank gap, clean fade-in
const PAGE_ENTER_ANIMATE = { opacity: 1, y: 0 };
const PAGE_EXIT          = { opacity: 0 };
const PAGE_INIT          = { opacity: 0, y: 6 };
const PAGE_ENTER_TRAN    = { duration: 0.2, ease: [0.16, 1, 0.3, 1] };
const PAGE_EXIT_TRAN     = { duration: 0.10, ease: "easeIn" };

function PageTransition({ children }) {
  const location = useLocation();
  return (
    <AnimatePresence initial={false} mode="wait">
      <motion.div
        key={location.pathname}
        initial={PAGE_INIT}
        animate={{ ...PAGE_ENTER_ANIMATE, transition: PAGE_ENTER_TRAN }}
        exit={{ ...PAGE_EXIT, transition: PAGE_EXIT_TRAN }}
        style={{
          minHeight: "100dvh",
          width: "100%",
          overflowX: "hidden",
        }}
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

// Provides Aaru with live groups + friend names; renders nothing when logged out
function AaruContainer() {
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
  }, [token, userId]); // removed pathname — fetching on every navigation caused 4x duplicate group calls

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

  return (
    <BrowserRouter>
      <OfflineBanner />
      <PWAUpdatePrompt />
      <AaruContainer />
      <BackButtonGuard />
      <PageTransition>
        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<PublicRoute authReady={authReady} element={<Home />} />} />
            <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
            <Route path="/groups" element={<ProtectedRoute element={<Groups />} />} />
            <Route path="/expenses" element={<ProtectedRoute element={<Expenses />} />} />
            <Route path="/profile" element={<ProtectedRoute element={<Profile />} />} />
            <Route path="/balances" element={<ProtectedRoute element={<Balances />} />} />
            <Route path="/friends" element={<ProtectedRoute element={<Friends />} />} />
            {/* Public — anyone with the link/QR can land here */}
            <Route path="/add-friend/:userId" element={<AddFriend />} />
            {/* 404 catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </PageTransition>
    </BrowserRouter>
  );
}

export default App;
