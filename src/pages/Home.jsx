import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL, setAuthData } from "../utils/api";
import { FiMail, FiLock, FiUser, FiArrowRight } from "react-icons/fi";

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
    <div className="min-h-screen flex">
      {/* ── LEFT HERO PANEL (desktop only) ── */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-pink-600 via-rose-500 to-orange-400 relative overflow-hidden flex-col justify-between p-12">
        {/* decorative blobs */}
        <span className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
        <span className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-orange-300/20 blur-2xl" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
            <span className="text-white font-extrabold text-lg">S</span>
          </div>
          <span className="text-white font-bold text-xl tracking-tight">Smart Split</span>
        </div>

        {/* Headline */}
        <div className="relative z-10">
          <h1 className="text-5xl xl:text-6xl font-extrabold text-white leading-tight">
            Split bills,<br />stay friends.
          </h1>
          <p className="mt-4 text-white/80 text-lg max-w-sm">
            Track shared expenses, settle balances, and keep group finances effortless.
          </p>

          {/* Feature rows */}
          <div className="mt-10 flex flex-col gap-4">
            {[
              { icon: "🧾", title: "Track Expenses", sub: "Log and categorize shared costs instantly" },
              { icon: "👥", title: "Group Splits", sub: "Fair splits for any group size" },
              { icon: "📊", title: "Live Balances", sub: "See exactly who owes what" },
              { icon: "⚡", title: "Quick Settle", sub: "Mark debts paid in one tap" },
            ].map(({ icon, title, sub }) => (
              <div key={title} className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 text-lg">
                  {icon}
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{title}</p>
                  <p className="text-white/65 text-xs">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom tagline */}
        <p className="relative z-10 text-white/50 text-xs">
          © {new Date().getFullYear()} Smart Split · Made with ♥
        </p>
      </div>

      {/* ── RIGHT AUTH PANEL ── */}
      <div className="flex-1 lg:flex-none lg:w-[480px] flex items-center justify-center bg-gray-50 lg:bg-white min-h-screen p-6">
        {/* Mobile logo */}
        <div className="absolute top-6 left-0 right-0 flex justify-center lg:hidden">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-pink-500 to-orange-400 flex items-center justify-center">
              <span className="text-white font-extrabold text-sm">S</span>
            </div>
            <span className="font-bold text-gray-800">Smart Split</span>
          </div>
        </div>

        <div className="w-full max-w-sm">
          {/* Card */}
          <div className="bg-white rounded-3xl shadow-2xl shadow-gray-200/80 border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-gray-900">
              {isLogin ? "Welcome back" : "Create account"}
            </h2>
            <p className="text-sm text-gray-500 mt-1 mb-6">
              {isLogin
                ? "Sign in to manage your shared expenses"
                : "Join Smart Split and simplify group bills"}
            </p>

            {/* Tab switcher */}
            <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
              <button
                onClick={() => { setIsLogin(true); setError(""); }}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                  isLogin
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setIsLogin(false); setError(""); }}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                  !isLogin
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Register
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-start gap-2">
                <span className="mt-0.5">⚠</span>
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              {!isLogin && (
                <div className="relative">
                  <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent transition"
                    required
                  />
                </div>
              )}
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent transition"
                  required
                />
              </div>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent transition"
                  required
                  minLength={6}
                />
              </div>

              {isLogin && (
                <label className="flex items-center gap-2 cursor-pointer select-none mt-1">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 accent-pink-500 rounded"
                  />
                  <span className="text-sm text-gray-500">Remember me</span>
                </label>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full py-3 bg-gradient-to-r from-pink-500 to-orange-400 text-white rounded-xl font-semibold text-sm shadow-lg shadow-pink-200 hover:shadow-pink-300 hover:from-pink-600 hover:to-orange-500 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
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
                    <FiArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            By continuing you agree to our Terms & Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
