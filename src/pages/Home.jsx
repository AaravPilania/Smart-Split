import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../utils/api";

const Home = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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

        if (!response.ok) {
          let errorMessage = "Login failed";
          try {
            const data = await response.json();
            errorMessage = data.message || errorMessage;
          } catch {
            errorMessage = `Server error: ${response.status} ${response.statusText}`;
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();

        // Store user data
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("userId", data.user.id);

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

        if (!response.ok) {
          let errorMessage = "Registration failed";
          try {
            const data = await response.json();
            errorMessage = data.message || errorMessage;
          } catch {
            errorMessage = `Server error: ${response.status} ${response.statusText}`;
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();

        // Store user data
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("userId", data.user.id);

        // Navigate to dashboard
        navigate("/dashboard");
      }
    } catch (err) {
      // Handle network errors (CORS, connection failures, etc.)
      if (err.name === "TypeError" && err.message.includes("fetch")) {
        setError("Unable to connect to server. Please check your connection or try again later.");
      } else {
        setError(err.message || "Something went wrong. Please try again.");
      }
      console.error("Login/Register error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center px-6 overflow-hidden">
      {/* 🔥 Background Video */}
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

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/20 -z-5"></div>

      {/* Center Content */}
      <div className="w-full max-w-5xl mx-auto bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-10 shadow-2xl flex gap-12 items-start">
        {/* LEFT HERO */}
        <div className="flex-1 text-white">
          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-orange-400">
            Split bills,
            <br />
            stay friends
          </h1>

          <p className="text-lg mt-4 text-white/80 max-w-xl">
            Keep track of shared expenses and settle up with ease.
            <br />
            Perfect for roommates, trips, and group activities.
          </p>

          {/* FEATURES */}
          <div className="grid grid-cols-2 gap-6 mt-8">
            <Feature icon="🧾" title="Track Expenses" sub="Keep it organized" />
            <Feature icon="👥" title="Split Easy" sub="Fair & automated" />
            <Feature icon="📊" title="View Balances" sub="See who owes what" />
            <Feature icon="⚡" title="Quick Settle" sub="Mark as paid" />
          </div>
        </div>

        {/* RIGHT LOGIN CARD */}
        <div className="w-80 bg-white/20 backdrop-blur-lg border border-white/25 p-6 rounded-2xl shadow-xl flex-shrink-0">
          <h2 className="text-2xl font-semibold text-pink-600 mb-1">
            Welcome to Smart Split
          </h2>
          <p className="text-sm text-white/85 mb-4">
            {isLogin
              ? "Sign in to your account"
              : "Create a new account to get started"}
          </p>

          {/* Tabs */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              onClick={() => {
                setIsLogin(true);
                setError("");
              }}
              className={`py-2 rounded-lg font-semibold transition-all ${
                isLogin
                  ? "bg-white text-pink-600 shadow-md"
                  : "bg-white/50 text-gray-700 hover:bg-white/70"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => {
                setIsLogin(false);
                setError("");
              }}
              className={`py-2 rounded-lg font-semibold transition-all ${
                !isLogin
                  ? "bg-white text-pink-600 shadow-md"
                  : "bg-white/50 text-gray-700 hover:bg-white/70"
              }`}
            >
              Register
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <input
                type="text"
                placeholder="Your Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 mb-3 rounded-lg bg-white/90 text-black focus:outline-none focus:ring-2 focus:ring-pink-400 placeholder-gray-500"
                required
              />
            )}
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 mb-3 rounded-lg bg-white/90 text-black focus:outline-none focus:ring-2 focus:ring-pink-400 placeholder-gray-500"
              required
            />
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 mb-4 rounded-lg bg-white/90 text-black focus:outline-none focus:ring-2 focus:ring-pink-400 placeholder-gray-500"
              required
              minLength={6}
            />

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2.5 bg-gradient-to-r from-pink-500 to-orange-400 text-white rounded-lg font-semibold shadow-lg transition-all hover:from-pink-600 hover:to-orange-500 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed ${
                loading ? "cursor-wait" : ""
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {isLogin ? "Logging in..." : "Creating account..."}
                </span>
              ) : isLogin ? (
                "Login"
              ) : (
                "Register"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const Feature = ({ icon, title, sub }) => (
  <div className="flex items-center gap-3 text-white/90">
    <span className="text-2xl">{icon}</span>
    <p>
      <strong>{title}</strong>
      <br />
      <span className="text-sm">{sub}</span>
    </p>
  </div>
);

export default Home;
