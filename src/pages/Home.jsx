import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiMail, FiLock, FiUser, FiEye, FiEyeOff, FiArrowRight, FiCheck } from "react-icons/fi";
import { API_URL, setAuthData } from "../utils/api";

const FEATURES = [
  "Track every shared bill across groups",
  "AI-powered receipt scanning with OCR",
  "Simplified debt with one-tap settlement",
  "Add friends via QR code in seconds",
];

const STATS = [
  ["10k+", "Expenses Tracked"],
  ["5k+", "Happy Users"],
  ["99%", "Uptime"],
];

const Home = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden" style={{ background: "#0f0a1e" }}>
      {/* Video background */}
      <video
        className="absolute inset-0 w-full h-full object-cover opacity-25"
        src="/topo.mp4"
        autoPlay loop muted playsInline aria-hidden preload="auto"
      />

      {/* Layered overlays */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(88,28,200,0.55) 0%, rgba(15,10,30,0.75) 50%, rgba(120,40,10,0.4) 100%)" }} />
      {/* Ambient glow orbs */}
      <div className="absolute -top-32 left-1/4 w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute -bottom-32 right-1/4 w-[500px] h-[500px] bg-orange-500/15 rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-pink-600/10 rounded-full blur-[90px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-10 flex flex-col lg:flex-row items-center gap-12 lg:gap-20 min-h-screen lg:min-h-0">

        {/* ── Left: Brand hero (desktop only) ── */}
        <div className="hidden lg:flex flex-1 flex-col gap-10 text-white">
          <div className="flex items-center gap-3">
            <img src="/favicon.svg" alt="Smart Split" className="h-11 w-11 rounded-2xl shadow-lg" />
            <span className="text-base font-semibold tracking-tight text-white/60">Smart Split</span>
          </div>

          <div>
            <h1 className="text-[3.8rem] font-black leading-[1.05] tracking-tight">
              Split bills,
              <br />
              <span style={{
                background: "linear-gradient(90deg, #f472b6 0%, #c084fc 45%, #fb923c 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                not friendships.
              </span>
            </h1>
            <p className="mt-5 text-white/45 text-[1.05rem] leading-relaxed max-w-[420px]">
              The smartest way to track shared expenses — automated splits, instant settlement, zero drama.
            </p>
          </div>

          <div className="space-y-3.5">
            {FEATURES.map((txt) => (
              <div key={txt} className="flex items-center gap-3.5">
                <div
                  className="h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #ec4899, #f97316)" }}
                >
                  <FiCheck size={10} className="text-white" strokeWidth={3} />
                </div>
                <span className="text-white/55 text-sm">{txt}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-10 pt-2 border-t border-white/10">
            {STATS.map(([n, l]) => (
              <div key={l}>
                <p className="text-2xl font-black text-white">{n}</p>
                <p className="text-xs text-white/35 mt-0.5 tracking-wide uppercase">{l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: Auth Form ── */}
        <div className="w-full lg:max-w-[430px] flex-shrink-0">

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8 pt-6">
            <img src="/favicon.svg" alt="Smart Split" className="h-16 w-16 rounded-3xl shadow-2xl mx-auto mb-3" />
            <h1 className="text-2xl font-black text-white">Smart Split</h1>
            <p className="text-sm text-white/55 mt-1.5">Split bills &middot; Stay friends</p>
          </div>

          {/* Card */}
          <div
            className="rounded-3xl overflow-hidden shadow-2xl shadow-black/60"
            style={{
              background: "rgba(30,18,60,0.85)",
              backdropFilter: "blur(48px)",
              WebkitBackdropFilter: "blur(48px)",
              border: "1px solid rgba(255,255,255,0.14)",
            }}
          >
            {/* Gradient accent bar */}
            <div className="h-[3px]" style={{ background: "linear-gradient(90deg, #ec4899, #a855f7, #f97316)" }} />

            <div className="p-7 sm:p-8">
              <h2 className="text-2xl font-bold text-white">
                {isLogin ? "Welcome back" : "Create account"}
              </h2>
              <p className="text-sm text-white/60 mt-1 mb-6">
                {isLogin ? "Sign in to your Smart Split account" : "Join Smart Split — it's free forever"}
              </p>

              {/* Tab toggle */}
              <div
                className="flex p-1 mb-6 gap-1 rounded-2xl"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
              >
                {[["Sign In", true], ["Register", false]].map(([label, val]) => (
                  <button
                    key={label}
                    onClick={() => { setIsLogin(val); setError(""); }}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      isLogin === val
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-white/55 hover:text-white/80"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Error */}
              {error && (
                <div
                  className="mb-5 px-4 py-3 rounded-xl flex items-start gap-2.5 text-sm text-red-300"
                  style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.22)" }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5">
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
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="text-white/50 hover:text-white/80 transition"
                      tabIndex={-1}
                    >
                      {showPassword ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                    </button>
                  }
                />

                {isLogin && (
                  <label className="flex items-center gap-2.5 cursor-pointer pt-0.5 select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-3.5 h-3.5 rounded accent-pink-500"
                    />
                    <span className="text-xs text-white/60">Keep me signed in</span>
                  </label>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 text-white text-sm font-bold rounded-xl shadow-lg hover:opacity-90 active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1"
                  style={{ background: "linear-gradient(135deg, #ec4899 0%, #a855f7 50%, #f97316 100%)" }}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {isLogin ? "Signing in…" : "Creating account…"}
                    </>
                  ) : (
                    <>
                      {isLogin ? "Sign In" : "Create Account"}
                      <FiArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-white/50">
                {isLogin ? "New to Smart Split?" : "Already have an account?"}{" "}
                <button
                  onClick={switchMode}
                  className="text-white font-semibold hover:text-pink-300 transition-colors"
                >
                  {isLogin ? "Create an account" : "Sign in instead"}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AuthInput = ({ icon, suffix, ...props }) => (
  <div className="relative flex items-center">
    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none flex-shrink-0">
      {icon}
    </span>
    <input
      {...props}
      className="w-full pl-10 pr-10 py-3 text-sm text-white placeholder-white/45 rounded-xl outline-none transition-all"
      style={{
        background: "rgba(255,255,255,0.10)",
        border: "1px solid rgba(255,255,255,0.18)",
      }}
    />
    {suffix && (
      <span className="absolute right-3.5 top-1/2 -translate-y-1/2">{suffix}</span>
    )}
  </div>
);

export default Home;
