import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL, setAuthData } from "../utils/api";

const Home = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        // Login
        const response = await fetch(`${API_URL}/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Login failed");
        }

        // Store user data
        setAuthData(data.token, data.user, data.user.id, rememberMe);

        // Navigate to dashboard
        navigate("/dashboard");
      } else {
        // Register
        if (!name.trim()) {
          throw new Error("Name is required");
        }

        const response = await fetch(`${API_URL}/auth/signup`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password, name }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Registration failed");
        }

        // Store user data (after signup)
        setAuthData(data.token, data.user, data.user.id, rememberMe);

        // Navigate to dashboard
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center px-4 sm:px-6 overflow-hidden">
      {/* Background Video */}
      <video
        className="absolute top-0 left-0 w-full h-full object-cover -z-10"
        src="/topo.mp4"
        autoPlay
        loop
        muted
        playsInline
        aria-hidden
        preload="auto"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/35 to-black/55 -z-5" />

      {/* Main layout */}
      <div className="w-full max-w-5xl mx-auto flex flex-col md:flex-row gap-10 md:gap-16 items-center py-10 md:py-0">

        {/* ── Left Hero (desktop only) ── */}
        <div className="hidden md:flex flex-1 text-white flex-col gap-7">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-pink-500 to-orange-400 flex items-center justify-center text-xl font-bold shadow-lg">⚡</div>
            <span className="text-lg font-bold tracking-tight opacity-90">Smart Split</span>
          </div>

          <div>
            <h1 className="text-5xl md:text-6xl font-extrabold leading-[1.1] text-white">
              Split bills,
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-orange-300">stay friends.</span>
            </h1>
            <p className="mt-4 text-lg text-white/65 leading-relaxed max-w-md">
              The smart way to track shared expenses and settle up with your group — no awkward conversations needed.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Feature icon="🧾" title="Track Expenses" sub="Every penny accounted for" />
            <Feature icon="👥" title="Group Splits" sub="Fair & automated" />
            <Feature icon="📊" title="View Balances" sub="See who owes what" />
            <Feature icon="⚡" title="Quick Settle" sub="One-tap mark as paid" />
          </div>
        </div>

        {/* ── Mobile heading ── */}
        <div className="md:hidden w-full text-center text-white pt-2">
          <div className="flex items-center justify-center gap-2.5 mb-2">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-pink-500 to-orange-400 flex items-center justify-center text-xl font-bold shadow-lg">⚡</div>
            <span className="text-2xl font-extrabold">Smart Split</span>
          </div>
          <p className="text-sm text-white/55">Split bills · Stay friends</p>
        </div>

        {/* ── Right Form Card ── */}
        <div className="w-full md:w-[360px] flex-shrink-0">
          <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl">

            <h2 className="text-2xl font-bold text-white mb-1">
              {isLogin ? "Welcome back" : "Get started"}
            </h2>
            <p className="text-sm text-white/55 mb-5">
              {isLogin ? "Sign in to your account" : "Create a free account"}
            </p>

            {/* Tabs */}
            <div className="flex bg-white/10 rounded-2xl p-1 mb-5 gap-1">
              <button
                onClick={() => { setIsLogin(true); setError(""); }}
                className={`flex-1 py-2 rounded-xl font-semibold transition-all text-sm ${
                  isLogin ? "bg-white text-gray-800 shadow" : "text-white/65 hover:text-white"
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setIsLogin(false); setError(""); }}
                className={`flex-1 py-2 rounded-xl font-semibold transition-all text-sm ${
                  !isLogin ? "bg-white text-gray-800 shadow" : "text-white/65 hover:text-white"
                }`}
              >
                Register
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-400/30 rounded-xl text-red-200 text-sm">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {!isLogin && (
                <input
                  type="text"
                  placeholder="Your Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/90 text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-400/70 placeholder-gray-400 shadow-sm transition"
                  required
                />
              )}
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/90 text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-400/70 placeholder-gray-400 shadow-sm transition"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/90 text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-400/70 placeholder-gray-400 shadow-sm transition"
                required
                minLength={6}
              />

              {isLogin && (
                <label className="flex items-center gap-2 cursor-pointer select-none pt-0.5">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 accent-pink-500 rounded"
                  />
                  <span className="text-sm text-white/65">Remember me</span>
                </label>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-pink-500 to-orange-400 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:opacity-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-1"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {isLogin ? "Signing in..." : "Creating account..."}
                  </span>
                ) : (
                  isLogin ? "Sign In" : "Create Account"
                )}
              </button>
            </form>

          </div>
        </div>

      </div>
    </div>
  );
};

const Feature = ({ icon, title, sub }) => (
  <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-3.5">
    <span className="text-2xl">{icon}</span>
    <div>
      <p className="font-semibold text-white text-sm">{title}</p>
      <p className="text-white/55 text-xs">{sub}</p>
    </div>
  </div>
);

export default Home;
