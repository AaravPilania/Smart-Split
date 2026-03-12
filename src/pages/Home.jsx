import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiMail, FiLock, FiUser, FiEye, FiEyeOff, FiArrowRight, FiCheck } from "react-icons/fi";
import { API_URL, setAuthData } from "../utils/api";

const FEATURES = [
  "Track every shared bill across groups",
  "AI-powered receipt scanning with OCR",
  "Simplified debt with one-tap settlement",
  "Add friends via QR code in seconds",
];

// Defined outside Home so AuthInput is never remounted on re-render
const AuthInput = ({ icon, suffix, ...props }) => (
  <div className="relative flex items-center">
    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none flex-shrink-0">
      {icon}
    </span>
    <input
      {...props}
      className="w-full pl-10 pr-10 py-3 text-sm text-white placeholder-white/45 rounded-xl outline-none transition-all"
      style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.18)" }}
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
  background: "rgba(30,18,60,0.88)",
  backdropFilter: "blur(48px)",
  WebkitBackdropFilter: "blur(48px)",
  border: "1px solid rgba(255,255,255,0.14)",
};

const Home = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Nuclear scroll lock — kills ALL touch-based scrolling / rubber-band on mobile
  useEffect(() => {
    const prevent = (e) => {
      // Allow scrolling only inside inputs (keyboard scroll) — block everything else
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      e.preventDefault();
    };
    const html = document.documentElement;
    html.style.overflow = "hidden";
    html.style.position = "fixed";
    html.style.inset = "0";
    html.style.height = "100%";
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.inset = "0";
    document.body.style.height = "100%";
    document.body.style.touchAction = "none";
    document.addEventListener("touchmove", prevent, { passive: false });
    return () => {
      html.style.overflow = "";
      html.style.position = "";
      html.style.inset = "";
      html.style.height = "";
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.inset = "";
      document.body.style.height = "";
      document.body.style.touchAction = "";
      document.removeEventListener("touchmove", prevent);
    };
  }, []);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const switchMode = () => { setIsLogin((v) => !v); setError(""); setPassword(""); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const endpoint = isLogin ? "/auth/login" : "/auth/signup";
      const body = isLogin ? { email, password } : { email, password, name };
      if (!isLogin && !name.trim()) throw new Error("Name is required");
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || (isLogin ? "Login failed" : "Registration failed"));
      setAuthData(data.token, data.user, data.user.id, rememberMe);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Plain render function — NOT a React component — so React never unmounts the inputs on re-render
  const renderForm = (compact) => (
    <div className="rounded-3xl overflow-hidden shadow-2xl shadow-black/70" style={CARD_STYLE}>
      <div className="h-[3px]" style={{ background: "linear-gradient(90deg, #ec4899, #a855f7, #f97316)" }} />
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
              <button type="button" onClick={() => setShowPassword((p) => !p)}
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
    </div>
  );

  return (
    <div className="home-bg fixed inset-0 overflow-hidden" style={{ touchAction: "none" }}>
      {/* Animated blob background — fixed so blobs fill screen regardless of content */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden style={{ width: "100%", maxWidth: "100vw" }}>
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>

      {/* Content layer — fills viewport exactly, no scroll */}
      <div className="relative z-10 h-full w-full overflow-hidden flex items-center justify-center">

        {/* ── DESKTOP: side-by-side ── */}
        <div className="hidden lg:flex w-full max-w-6xl mx-auto px-10 items-center gap-20">

          {/* Left: hero */}
          <div className="flex flex-1 flex-col gap-8 text-white">
            <div className="flex items-center gap-3">
              <img src="/favicon.svg" alt="Smart Split" className="h-11 w-11 rounded-2xl shadow-lg" />
              <span className="text-base font-semibold tracking-tight text-white/60">Smart Split</span>
            </div>

            <div>
              <h1 className="text-[3.8rem] font-black leading-[1.05] tracking-tight">
                Split bills,<br />
                <span style={GRADIENT_TEXT}>not friendships.</span>
              </h1>
              <p className="mt-4 text-white/45 text-[1.05rem] leading-relaxed max-w-[420px]">
                The smartest way to track shared expenses — automated splits, instant settlement, zero drama.
              </p>
            </div>

            <div className="space-y-3">
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

          {/* Right: form */}
          <div className="w-[430px] flex-shrink-0">
            {renderForm(false)}
          </div>

        </div>

        {/* ── MOBILE: stacked, viewport-locked ── */}
        <div className="lg:hidden flex flex-col items-center h-full w-full px-5 pt-12 pb-5">

          {/* Branding — pinned near top */}
          <div className="text-center w-full">
            <img src="/favicon.svg" alt="Smart Split" className="h-10 w-10 rounded-2xl shadow-2xl mx-auto mb-2" />
            <h1 className="text-[1.5rem] font-black text-white leading-tight">
              Split bills,{" "}
              <span style={GRADIENT_TEXT}>not friendships.</span>
            </h1>
            <p className="text-[11px] text-white/50 mt-1.5 max-w-[260px] mx-auto">
              The smartest way to track shared expenses
            </p>
          </div>

          {/* Form card — centered in remaining space */}
          <div className="flex-1 flex items-center w-full max-w-sm">
            <div className="w-full">{renderForm(true)}</div>
          </div>

          {/* Bottom: feature pills */}
          <div className="flex flex-wrap justify-center gap-1.5 pt-3">
            {[["🧾","Receipt Scan"],["👥","Group Splits"],["📊","Balances"],["⚡","Quick Settle"]].map(([icon, label]) => (
              <span key={label} className="flex items-center gap-1 text-[10px] font-medium text-white/55 px-2.5 py-1 rounded-full"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <span>{icon}</span>{label}
              </span>
            ))}
          </div>

        </div>

      </div>
    </div>
  );
};

export default Home;