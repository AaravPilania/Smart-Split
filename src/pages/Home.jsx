import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FiMail, FiLock, FiUser, FiEye, FiEyeOff, FiArrowRight, FiCheck } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { API_URL, setAuthData, authAPI, wakeUpServer } from "../utils/api";
import DesktopIntro from "../components/DesktopIntro";
import MobileOnboarding from "../components/MobileOnboarding";

const FEATURES = [
  "Track every shared bill across groups",
  "AI-powered receipt scanning with OCR",
  "Simplified debt with one-tap settlement",
  "Add friends via QR code in seconds",
];

/* ─── Animated topographic contour background ─── */
const TopoBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Gaussian-like hills that slowly orbit / breathe
    const hills = [
      { cx: 0.15, cy: 0.20, r: 0.32, amp: 1.0, phase: 0,    speed: 0.08 },
      { cx: 0.75, cy: 0.18, r: 0.28, amp: 0.9, phase: 1.8,  speed: 0.06 },
      { cx: 0.50, cy: 0.55, r: 0.35, amp: 1.1, phase: 3.2,  speed: 0.07 },
      { cx: 0.25, cy: 0.80, r: 0.30, amp: 0.8, phase: 4.5,  speed: 0.09 },
      { cx: 0.80, cy: 0.70, r: 0.26, amp: 0.95,phase: 2.4,  speed: 0.065},
      { cx: 0.10, cy: 0.50, r: 0.24, amp: 0.7, phase: 5.1,  speed: 0.075},
      { cx: 0.60, cy: 0.30, r: 0.20, amp: 0.6, phase: 0.7,  speed: 0.085},
      { cx: 0.40, cy: 0.85, r: 0.22, amp: 0.75,phase: 3.8,  speed: 0.07 },
      { cx: 0.90, cy: 0.40, r: 0.25, amp: 0.85,phase: 1.2,  speed: 0.06 },
      { cx: 0.35, cy: 0.10, r: 0.20, amp: 0.65,phase: 4.0,  speed: 0.08 },
    ];

    const LEVELS = 12;
    const STEP = 28; // pixel spacing of sample grid

    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const field = (x, y, t) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      let v = 0;
      for (const hill of hills) {
        const hx = (hill.cx + 0.06 * Math.sin(t * hill.speed + hill.phase)) * w;
        const hy = (hill.cy + 0.06 * Math.cos(t * hill.speed * 0.8 + hill.phase)) * h;
        const r = hill.r * Math.max(w, h) * (1 + 0.08 * Math.sin(t * hill.speed * 0.5 + hill.phase));
        const dx = x - hx;
        const dy = y - hy;
        v += hill.amp * Math.exp(-(dx * dx + dy * dy) / (2 * r * r));
      }
      return v;
    };

    // Marching-squares segment lookup (classic 16 cases)
    const segments = [
      [], [[0,0.5],[0.5,1]], [[0.5,1],[1,0.5]], [[0,0.5],[1,0.5]],
      [[1,0.5],[0.5,0]], [[0,0.5],[0.5,0],[1,0.5],[0.5,1]], [[0.5,1],[0.5,0]], [[0,0.5],[0.5,0]],
      [[0,0.5],[0.5,0]], [[0.5,1],[0.5,0]], [[0,0.5],[0.5,1],[1,0.5],[0.5,0]], [[1,0.5],[0.5,0]],
      [[0,0.5],[1,0.5]], [[0.5,1],[1,0.5]], [[0,0.5],[0.5,1]], [],
    ];

    const draw = (t) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const cols = Math.ceil(w / STEP) + 1;
      const rows = Math.ceil(h / STEP) + 1;

      // Sample the field
      const grid = new Float32Array(cols * rows);
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          grid[j * cols + i] = field(i * STEP, j * STEP, t);
        }
      }

      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(255,255,255,0.07)";
      ctx.lineWidth = 1;

      for (let level = 1; level <= LEVELS; level++) {
        const threshold = level / (LEVELS + 1);
        ctx.beginPath();
        for (let j = 0; j < rows - 1; j++) {
          for (let i = 0; i < cols - 1; i++) {
            const tl = grid[j * cols + i];
            const tr = grid[j * cols + i + 1];
            const br = grid[(j + 1) * cols + i + 1];
            const bl = grid[(j + 1) * cols + i];
            const code =
              (tl >= threshold ? 8 : 0) |
              (tr >= threshold ? 4 : 0) |
              (br >= threshold ? 2 : 0) |
              (bl >= threshold ? 1 : 0);
            const segs = segments[code];
            if (!segs || segs.length === 0) continue;
            const ox = i * STEP;
            const oy = j * STEP;
            for (let s = 0; s < segs.length; s += 2) {
              ctx.moveTo(ox + segs[s][0] * STEP, oy + segs[s][1] * STEP);
              ctx.lineTo(ox + segs[s + 1][0] * STEP, oy + segs[s + 1][1] * STEP);
            }
          }
        }
        ctx.stroke();
      }

      raf = requestAnimationFrame(() => draw(t + 0.35));
    };

    raf = requestAnimationFrame(() => draw(0));

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ opacity: 1 }}
    />
  );
};



// Defined outside Home so AuthInput is never remounted on re-render
const AuthInput = ({ icon, suffix, ...props }) => (
  <div className="relative flex items-center">
    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none flex-shrink-0">
      {icon}
    </span>
    <input
      {...props}
      className="w-full pl-10 pr-10 py-3 text-sm text-white placeholder-white/45 rounded-xl outline-none transition-all focus:border-white/40 focus:bg-white/[0.13]"
      style={{ background: "rgba(255,255,255,0.09)", border: "1px solid rgba(255,255,255,0.22)", backdropFilter: "blur(8px)" }}
    />
    {suffix && (
      <span className="absolute right-3.5 top-1/2 -translate-y-1/2">{suffix}</span>
    )}
  </div>
);

const GRADIENT_TEXT = {
  background: "linear-gradient(90deg, #f472b6 0%, #c084fc 45%, #fb923c 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
};

const CARD_STYLE = {
  background: "linear-gradient(160deg, rgba(100,40,200,0.28) 0%, rgba(30,18,60,0.82) 55%, rgba(18,10,40,0.90) 100%)",
  backdropFilter: "blur(64px) saturate(160%)",
  WebkitBackdropFilter: "blur(64px) saturate(160%)",
  border: "1px solid rgba(255,255,255,0.22)",
  boxShadow: "0 8px 48px rgba(120,50,220,0.30), 0 2px 12px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.18)",
};

const Home = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  // ── Intro / Splash logic ──
  const hasSeenIntro = useRef(sessionStorage.getItem("smartsplit_intro_seen") === "1");
  const [showIntro, setShowIntro] = useState(!hasSeenIntro.current);
  const [showSplash, setShowSplash] = useState(hasSeenIntro.current);

  const handleGetStarted = () => {
    sessionStorage.setItem("smartsplit_intro_seen", "1");
    setShowIntro(false);
  };

  // Splash: auto-dismiss after 1s
  useEffect(() => {
    if (!showSplash) return;
    const timer = setTimeout(() => setShowSplash(false), 1000);
    return () => clearTimeout(timer);
  }, [showSplash]);

  // Staggered entrance — trigger one frame after mount
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Prevent page-level scroll only while on login screen (not during intro)
  useEffect(() => {
    if (showIntro || showSplash) return;
    const html = document.documentElement;
    html.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";
    return () => {
      html.style.overflow = "";
      document.body.style.overflow = "";
      document.body.style.overscrollBehavior = "";
    };
  }, [showIntro, showSplash]);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const switchMode = () => { setIsLogin((v) => !v); setError(""); setPassword(""); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (!isLogin && !name.trim()) throw new Error("Name is required");
      // Use authAPI which has built-in retry on network failure (handles Render cold-starts)
      const data = isLogin
        ? await authAPI.login(email, password)
        : await authAPI.signup(email, password, name);
      setAuthData(data.token, data.user, data.user.id, rememberMe);
      // Re-hydrate avatar from DB profile picture
      if (data.user.pfp) {
        localStorage.setItem("selectedAvatar", data.user.pfp);
      }
      const redirectTo = searchParams.get("redirect") || "/dashboard";
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const msg = err.message || "";
      if (msg === "Failed to fetch" || msg === "Load failed" || msg === "Network request failed") {
        // Server is cold-starting on Render — wake it up and ask user to retry
        wakeUpServer();
        setError("Server is starting up, please wait a moment and try again.");
      } else {
        setError(msg || "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Plain render function — NOT a React component — so React never unmounts the inputs on re-render
  // noCard=true → renders only the inner form content without the glass card wrapper
  const renderForm = (compact, noCard = false) => {
    const inner = (
      <div className={compact ? "p-5" : "p-7 sm:p-8"}>
        <h2 className={`${compact ? "text-lg" : "text-2xl"} font-bold text-white`}>
          {isLogin ? "Welcome back" : "Create account"}
        </h2>
        <p className="text-xs text-white/55 mt-1 mb-4">
          {isLogin ? "Sign in to your Smart Split account" : "Join Smart Split — it's free forever"}
        </p>

        <div className="flex p-1 mb-4 gap-1 rounded-2xl"
          style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
          {[["Sign In", true], ["Register", false]].map(([label, val]) => (
            <button key={label} onClick={() => { setIsLogin(val); setError(""); }}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                isLogin === val ? "bg-white text-gray-900 shadow-sm" : "text-white/55 hover:text-white/80"
              }`}>{label}</button>
          ))}
        </div>

        {error && (
          <div className="mb-3 px-3 py-2.5 rounded-xl flex items-start gap-2 text-xs text-red-300"
            style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.22)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {!isLogin && (
            <AuthInput icon={<FiUser size={15} />} type="text" placeholder="Full name"
              value={name} onChange={(e) => setName(e.target.value)} required />
          )}
          <AuthInput icon={<FiMail size={15} />} type="email" placeholder="Email address"
            value={email} onChange={(e) => setEmail(e.target.value)} required />
          <AuthInput
            icon={<FiLock size={15} />}
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            suffix={
              <button type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setShowPassword((p) => !p)}
                className="text-white/50 hover:text-white/80 transition" tabIndex={-1}>
                {showPassword ? <FiEyeOff size={15} /> : <FiEye size={15} />}
              </button>
            }
          />
          {isLogin && (
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)}
                className="w-3.5 h-3.5 rounded accent-pink-500" />
              <span className="text-xs text-white/55">Keep me signed in</span>
            </label>
          )}
          <button type="submit" disabled={loading}
            className="w-full py-3 text-white text-sm font-bold rounded-xl shadow-lg hover:opacity-90 active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg, #ec4899 0%, #a855f7 50%, #f97316 100%)" }}>
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {isLogin ? "Signing in…" : "Creating account…"}
              </>
            ) : (
              <>{isLogin ? "Sign In" : "Create Account"}<FiArrowRight size={16} /></>
            )}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-white/50">
          {isLogin ? "New to Smart Split?" : "Already have an account?"}{" "}
          <button onClick={switchMode} className="text-white font-semibold hover:text-pink-300 transition-colors">
            {isLogin ? "Create an account" : "Sign in instead"}
          </button>
        </p>
      </div>
    );

    if (noCard) return inner;

    return (
      <div className="rounded-3xl overflow-hidden shadow-2xl shadow-black/70" style={CARD_STYLE}>
        <div className="h-[3px]" style={{ background: "linear-gradient(90deg, #ec4899, #a855f7, #f97316)" }} />
        {inner}
      </div>
    );
  };

  return (
    <div className="home-bg fixed inset-0 overflow-hidden"
      style={{ touchAction: showIntro ? "auto" : "none", opacity: mounted ? 1 : 0, transition: "opacity 0.35s ease" }}>
      {/* Animated background layers: topo → dots → blobs — always visible */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden style={{ width: "100%", maxWidth: "100vw" }}>
        <TopoBackground />
        <div className="home-dots" style={{ position: "relative", zIndex: 1 }} />
        <div className="glow-1" style={{ position: "relative", zIndex: 2 }} />
        <div className="glow-2" style={{ position: "relative", zIndex: 2 }} />
        <div className="glow-3" style={{ position: "relative", zIndex: 2 }} />
      </div>

      {/* ── Content layer with AnimatePresence ── */}
      <AnimatePresence mode="wait">
        {/* STATE 1: Splash screen (repeat visit — 1s branded pulse) */}
        {showSplash && (
          <motion.div
            key="splash"
            className="relative z-10 h-full w-full flex flex-col items-center justify-center"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <div className="relative">
              <img src="/icon.png" alt="Smart Split" className="h-20 w-20 rounded-3xl shadow-2xl splash-logo relative z-10" />
              <div className="ai-orb" style={{ width: 100, height: 100, top: -10, left: -10 }} />
            </div>
            <h1 className="mt-5 text-2xl font-black text-white">
              Smart <span style={GRADIENT_TEXT}>Split</span>
            </h1>
          </motion.div>
        )}

        {/* STATE 2: Full intro (first visit) */}
        {!showSplash && showIntro && (
          <motion.div
            key="intro"
            className="relative z-10 h-full w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ scale: 1.06, opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            {/* Desktop intro */}
            <div className="hidden lg:block h-full">
              <DesktopIntro onGetStarted={handleGetStarted} />
            </div>
            {/* Mobile/Tablet intro */}
            <div className="lg:hidden h-full">
              <MobileOnboarding onGetStarted={handleGetStarted} />
            </div>
          </motion.div>
        )}

        {/* STATE 3: Login (after intro dismissed) */}
        {!showSplash && !showIntro && (
          <motion.div
            key="login"
            className="relative z-10 h-full w-full overflow-hidden flex items-center justify-center"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >

        {/* ── DESKTOP: everything inside one glass panel ── */}
        <div className="hidden lg:flex w-full max-w-5xl mx-auto px-12 py-12 items-center gap-16 rounded-3xl"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(24px)",
            transition: "opacity 0.5s ease, transform 0.5s ease",
            background: "linear-gradient(135deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.04) 100%)",
            border: "1px solid rgba(255,255,255,0.20)",
            backdropFilter: "blur(18px) saturate(160%)",
            WebkitBackdropFilter: "blur(18px) saturate(160%)",
            boxShadow: "0 4px 72px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.16), inset 0 -1px 0 rgba(255,255,255,0.06)",
          }}>

          {/* Left: hero */}
          <div className="flex flex-1 flex-col gap-8 text-white">
            <div className="flex items-center gap-3"
              style={{ opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(12px)", transition: "opacity 0.5s ease 0.1s, transform 0.5s ease 0.1s" }}>
              <img src="/icon.png" alt="Smart Split" className="h-11 w-11 rounded-2xl shadow-lg" />
              <span className="text-base font-semibold tracking-tight text-white/60">Smart Split</span>
            </div>

            <div style={{ opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(14px)", transition: "opacity 0.5s ease 0.18s, transform 0.5s ease 0.18s" }}>
              <h1 className="text-[3.8rem] font-black leading-[1.05] tracking-tight">
                Split bills,<br />
                <span style={GRADIENT_TEXT}>not friendships.</span>
              </h1>
              <p className="mt-4 text-white/45 text-[1.05rem] leading-relaxed max-w-[420px]">
                The smartest way to track shared expenses — automated splits, instant settlement, zero drama.
              </p>
            </div>

            <div className="space-y-3"
              style={{ opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(14px)", transition: "opacity 0.5s ease 0.26s, transform 0.5s ease 0.26s" }}>
              {FEATURES.map((txt) => (
                <div key={txt} className="flex items-center gap-3">
                  <div className="h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, #ec4899, #f97316)" }}>
                    <FiCheck size={10} className="text-white" strokeWidth={3} />
                  </div>
                  <span className="text-white/55 text-sm">{txt}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="w-px self-stretch opacity-20" style={{ background: "linear-gradient(to bottom, transparent, rgba(255,255,255,0.6), transparent)" }} />

          {/* Right: form */}
          <div className="w-[400px] flex-shrink-0"
            style={{ opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(14px)", transition: "opacity 0.5s ease 0.32s, transform 0.5s ease 0.32s" }}>
            {renderForm(false)}
          </div>

        </div>

        {/* ── MOBILE: stacked, viewport-locked ── */}
        <div className="lg:hidden flex flex-col h-full w-full px-5 pt-4"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 40px)" }}>

          {/* Small top spacer — push heading away from very top edge */}
          <div style={{ flex: "0 0 0", minHeight: "6vh" }} />

          {/* Branding — lowered */}
          <div className="text-center w-full"
            style={{ opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(18px)", transition: "opacity 0.45s ease, transform 0.45s ease" }}>
            <img src="/icon.png" alt="Smart Split" className="h-11 w-11 rounded-2xl shadow-2xl mx-auto mb-2.5" />
            <h1 className="text-[1.8rem] font-black text-white leading-tight">
              Split bills,{" "}
              <span style={GRADIENT_TEXT}>not friendships.</span>
            </h1>
            <p className="text-[11px] text-white/50 mt-1.5 max-w-[260px] mx-auto">
              The smartest way to track shared expenses
            </p>
          </div>

          {/* Spacer — pushes USP+card group higher */}
          <div style={{ flex: 0.55 }} />

          {/* USP pills — single-line glassy box, just above the login card */}
          <div className="flex items-center gap-1.5 px-3 py-2.5 rounded-2xl mx-2 mb-5"
            style={{ flexWrap: "nowrap",
              opacity: mounted ? 1 : 0,
              transform: mounted ? "translateY(0)" : "translateY(14px)",
              transition: "opacity 0.45s ease 0.08s, transform 0.45s ease 0.08s",
              background: "linear-gradient(135deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.04) 100%)",
              border: "1px solid rgba(255,255,255,0.18)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              boxShadow: "0 4px 24px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.16), inset 0 -1px 0 rgba(255,255,255,0.04)",
            }}>
            {[["🧾", "Scan"], ["👥", "Groups"], ["💸", "Splits"], ["⚡", "Settle"]].map(([icon, label]) => (
              <span key={label} className="flex items-center justify-center gap-1 text-[10px] font-semibold text-white/75 py-1.5 rounded-full"
                style={{ flex: 1, background: "rgba(255,255,255,0.11)", border: "1px solid rgba(255,255,255,0.22)", backdropFilter: "blur(12px)", boxShadow: "0 2px 8px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.14)" }}>
                <span className="text-xs">{icon}</span>{label}
              </span>
            ))}
          </div>

          {/* ── Login card — transparent glass like USP ── */}
          <div className="w-full max-w-sm mx-auto rounded-3xl overflow-hidden"
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? "translateY(0)" : "translateY(22px)",
              transition: "opacity 0.5s ease 0.12s, transform 0.5s ease 0.12s",
              background: "linear-gradient(135deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.04) 100%)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.18)",
              boxShadow: "0 4px 24px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.16), inset 0 -1px 0 rgba(255,255,255,0.04)",
            }}>

            {/* Form content */}
            {renderForm(true, true)}
          </div>

        </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Home;