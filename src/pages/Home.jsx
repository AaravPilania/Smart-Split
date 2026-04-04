import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FiMail, FiLock, FiUser, FiEye, FiEyeOff, FiArrowRight, FiZap, FiCheck } from "react-icons/fi";
import PhoneMockup from "../components/PhoneMockup";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring, animate, useInView, useScroll } from "framer-motion";
import { useGoogleLogin } from "@react-oauth/google";
import { setAuthData, authAPI, wakeUpServer, API_URL } from "../utils/api";
import MobileOnboarding from "../components/MobileOnboarding";
import OnboardingGuide from "../components/OnboardingGuide";
import CardSwap, { Card } from "../components/CardSwap";
import DecryptedText from "../components/DecryptedText";

/* ─── Topographic canvas background ─────────────────────────── */
const TopoBackground = () => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const hills = [
      { cx:0.15,cy:0.20,r:0.32,amp:1.0,phase:0,speed:0.08 },
      { cx:0.75,cy:0.18,r:0.28,amp:0.9,phase:1.8,speed:0.06 },
      { cx:0.50,cy:0.55,r:0.35,amp:1.1,phase:3.2,speed:0.07 },
      { cx:0.25,cy:0.80,r:0.30,amp:0.8,phase:4.5,speed:0.09 },
      { cx:0.80,cy:0.70,r:0.26,amp:0.95,phase:2.4,speed:0.065},
      { cx:0.10,cy:0.50,r:0.24,amp:0.7,phase:5.1,speed:0.075},
      { cx:0.60,cy:0.30,r:0.20,amp:0.6,phase:0.7,speed:0.085},
      { cx:0.40,cy:0.85,r:0.22,amp:0.75,phase:3.8,speed:0.07 },
      { cx:0.90,cy:0.40,r:0.25,amp:0.85,phase:1.2,speed:0.06 },
      { cx:0.35,cy:0.10,r:0.20,amp:0.65,phase:4.0,speed:0.08 },
    ];
    const LEVELS=12,STEP=28;
    const segs=[
      [],[[ 0,.5],[.5,1]],[[.5,1],[1,.5]],[[ 0,.5],[1,.5]],
      [[1,.5],[.5,0]],[[0,.5],[.5,0],[1,.5],[.5,1]],[[.5,1],[.5,0]],[[0,.5],[.5,0]],
      [[0,.5],[.5,0]],[[.5,1],[.5,0]],[[0,.5],[.5,1],[1,.5],[.5,0]],[[1,.5],[.5,0]],
      [[0,.5],[1,.5]],[[.5,1],[1,.5]],[[0,.5],[.5,1]],[],
    ];
    const resize=()=>{
      canvas.width=window.innerWidth*dpr;canvas.height=window.innerHeight*dpr;
      canvas.style.width=window.innerWidth+"px";canvas.style.height=window.innerHeight+"px";
      ctx.setTransform(dpr,0,0,dpr,0,0);
    };
    resize();window.addEventListener("resize",resize);
    const field=(x,y,t)=>{
      const w=window.innerWidth,h=window.innerHeight;let v=0;
      for(const h2 of hills){
        const hx=(h2.cx+0.06*Math.sin(t*h2.speed+h2.phase))*w;
        const hy=(h2.cy+0.06*Math.cos(t*h2.speed*0.8+h2.phase))*h;
        const r=h2.r*Math.max(w,h)*(1+0.08*Math.sin(t*h2.speed*0.5+h2.phase));
        v+=h2.amp*Math.exp(-((x-hx)**2+(y-hy)**2)/(2*r*r));
      }return v;
    };
    const draw=(t)=>{
      const w=window.innerWidth,h=window.innerHeight;
      const cols=Math.ceil(w/STEP)+1,rows=Math.ceil(h/STEP)+1;
      const grid=new Float32Array(cols*rows);
      for(let j=0;j<rows;j++)for(let i=0;i<cols;i++)grid[j*cols+i]=field(i*STEP,j*STEP,t);
      ctx.clearRect(0,0,w,h);ctx.strokeStyle="rgba(255,255,255,0.07)";ctx.lineWidth=1;
      for(let lv=1;lv<=LEVELS;lv++){
        const th=lv/(LEVELS+1);ctx.beginPath();
        for(let j=0;j<rows-1;j++){for(let i=0;i<cols-1;i++){
          const tl=grid[j*cols+i],tr=grid[j*cols+i+1],br=grid[(j+1)*cols+i+1],bl=grid[(j+1)*cols+i];
          const code=(tl>=th?8:0)|(tr>=th?4:0)|(br>=th?2:0)|(bl>=th?1:0);
          const sg=segs[code];if(!sg||!sg.length)continue;
          const ox=i*STEP,oy=j*STEP;
          for(let s=0;s<sg.length;s+=2){ctx.moveTo(ox+sg[s][0]*STEP,oy+sg[s][1]*STEP);ctx.lineTo(ox+sg[s+1][0]*STEP,oy+sg[s+1][1]*STEP);}
        }}ctx.stroke();
      }
      raf=requestAnimationFrame(()=>draw(t+0.35));
    };
    raf=requestAnimationFrame(()=>draw(0));
    return()=>{cancelAnimationFrame(raf);window.removeEventListener("resize",resize);};
  },[]);
  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />;
};

const GRAD_STYLE = {
  background:"linear-gradient(90deg,#f472b6 0%,#fb923c 100%)",
  WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text",
};

/* ─── Auth input (light mode) ────────────────────────────────── */
const AuthInputLight = ({ icon, suffix, ...props }) => (
  <div className="relative flex items-center">
    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none flex-shrink-0" style={{ color:"rgba(0,0,0,0.35)" }}>{icon}</span>
    <input {...props}
      className="w-full pl-10 pr-10 py-3.5 text-sm rounded-2xl outline-none transition-all"
      style={{ background:"#f5f5f7", border:"1.5px solid transparent", color:"#111", fontFamily:"inherit" }}
      onFocus={e=>{e.target.style.borderColor="#ec4899";e.target.style.background="#fff";e.target.style.boxShadow="0 0 0 4px rgba(236,72,153,0.1)";}}
      onBlur={e=>{e.target.style.borderColor="transparent";e.target.style.background="#f5f5f7";e.target.style.boxShadow="none";}}
    />
    {suffix && <span className="absolute right-3.5 top-1/2 -translate-y-1/2">{suffix}</span>}
  </div>
);

/* ─── Auth input (dark mode) ──────────────────────────────────── */
const AuthInputDark = ({ icon, suffix, ...props }) => (
  <div className="relative flex items-center">
    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none flex-shrink-0">{icon}</span>
    <input {...props}
      className="w-full pl-10 pr-10 py-3 text-sm text-white placeholder-white/45 rounded-xl outline-none transition-all"
      style={{ background:"rgba(255,255,255,0.09)", border:"1px solid rgba(255,255,255,0.22)" }}
    />
    {suffix && <span className="absolute right-3.5 top-1/2 -translate-y-1/2">{suffix}</span>}
  </div>
);

/* ══════════════════════════════════════════════════════════════
   BLOB TRANSITION  — pure silent visual, no text
   variant="in"  → gradient blob blooms from origin
   variant="out" → same + white screen wipe
═══════════════════════════════════════════════════════════════ */
function BlobTransition({ origin = null, variant = "in" }) {
  const [phase2, setPhase2] = React.useState(false);

  const W = typeof window !== "undefined" ? window.innerWidth : 390;
  const H = typeof window !== "undefined" ? window.innerHeight : 844;
  const DIAM = Math.ceil(Math.sqrt(W * W + H * H)) * 2.3;
  const ox = origin?.x ?? W * 0.5;
  const oy = origin?.y ?? H * 0.82;

  React.useEffect(() => {
    if (variant === "out") {
      const t = setTimeout(() => setPhase2(true), 2000);
      return () => clearTimeout(t);
    }
  }, [variant]);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" style={{ background: "#0c0e1a" }}>
      {/* Expanding gradient blob */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
          duration: variant === "out" ? 2.2 : 0.55,
          ease: [0.16, 1, 0.3, 1],
        }}
        style={{
          position: "absolute",
          width: DIAM,
          height: DIAM,
          left: ox - DIAM / 2,
          top: oy - DIAM / 2,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #ec4899, #f97316)",
          transformOrigin: "center center",
          pointerEvents: "none",
        }}
      />

      {/* Phase 2: white screen wipe (blob_out only) */}
      {variant === "out" && (
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: phase2 ? 1 : 0 }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
          style={{ background: "#ffffff", zIndex: 5, pointerEvents: "none" }}
        />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MOBILE LOGIN  — fully dark-themed, glass card
═══════════════════════════════════════════════════════════════ */
function MobileLogin({ onSuccess, onGuest }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSuccess = async (tokenResponse) => {
    setGoogleLoading(true); setError("");
    try {
      const data = await authAPI.googleAuth(tokenResponse.access_token);
      setAuthData(data.token, data.user, data.user.id, true);
      if (data.user.pfp) localStorage.setItem("selectedAvatar", data.user.pfp);
      onSuccess();
    } catch (err) {
      setError(err.message || "Google sign-in failed.");
    } finally { setGoogleLoading(false); }
  };

  const loginWithGoogle = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => setError("Google sign-in was cancelled or failed."),
  });

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      if (!isLogin && !name.trim()) throw new Error("Name is required");
      const data = isLogin
        ? await authAPI.login(email, password)
        : await authAPI.signup(email, password, name);
      setAuthData(data.token, data.user, data.user.id, rememberMe);
      if (data.user.pfp) localStorage.setItem("selectedAvatar", data.user.pfp);
      onSuccess();
    } catch (err) {
      const msg = err.message || "";
      if (msg === "Failed to fetch" || msg === "Load failed") {
        if (API_URL.includes("localhost")) {
          setError("Backend server is not running. Start it with: cd backend && npm start");
        } else {
          setError("Server is waking up, please wait...");
          const up = await wakeUpServer();
          if (up) {
            try {
              const data = isLogin
                ? await authAPI.login(email, password)
                : await authAPI.signup(email, password, name);
              setAuthData(data.token, data.user, data.user.id, rememberMe);
              if (data.user.pfp) localStorage.setItem("selectedAvatar", data.user.pfp);
              onSuccess(); return;
            } catch (retryErr) {
              setError(retryErr.message || "Something went wrong.");
            }
          } else {
            setError("Server unavailable, please try again later.");
          }
        }
      } else setError(msg || "Something went wrong.");
    } finally { setLoading(false); }
  };

  return (
    <motion.div
      className="h-full w-full overflow-y-auto flex flex-col login-anim-bg"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
    >
      {/* Floating ambient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
        <motion.div
          className="absolute w-64 h-64 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(236,72,153,0.22) 0%, transparent 70%)", filter: "blur(44px)", top: "5%", left: "-15%" }}
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute w-56 h-56 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(249,115,22,0.20) 0%, transparent 70%)", filter: "blur(40px)", bottom: "12%", right: "-10%" }}
          animate={{ x: [0, -25, 0], y: [0, 20, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute w-44 h-44 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(236,72,153,0.16) 0%, transparent 70%)", filter: "blur(34px)", top: "42%", right: "8%" }}
          animate={{ x: [0, 15, 0], y: [0, -15, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
      </div>

      <div className="flex flex-col items-center px-8 pt-16 pb-10 w-full max-w-sm mx-auto relative" style={{ zIndex: 1 }}>

        {/* Logo */}
        <motion.img
          src="/icon.png"
          alt="Smart Split"
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 280, damping: 22 }}
          className="w-16 h-16 rounded-[20px] mb-6 shadow-lg"
          style={{ boxShadow: "0 8px 32px rgba(236,72,153,0.30)" }}
        />

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="text-2xl font-black text-white text-center tracking-tight mb-8"
        >
          {isLogin ? "Log in to Smart Split" : "Create your account"}
        </motion.h1>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="w-full mb-4 px-4 py-3 rounded-xl text-xs flex items-start gap-2"
              style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.28)", color: "#fca5a5" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-0.5 flex-shrink-0" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <AnimatePresence mode="wait">
          <motion.form
            key={isLogin ? "login" : "signup"}
            initial={{ opacity: 0, x: isLogin ? -16 : 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleSubmit}
            className="w-full flex flex-col gap-4"
          >
            {/* Name field (signup only) */}
            {!isLogin && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-white/60 tracking-wide uppercase">
                  What's your name?
                </label>
                <input
                  type="text" placeholder="Full name" value={name}
                  onChange={e => setName(e.target.value)} required
                  className="w-full px-4 py-3.5 rounded-xl text-sm text-white outline-none transition-all"
                  style={{ background: "#1e1e24", border: "2px solid #2e2e38" }}
                  onFocus={e => { e.target.style.borderColor = "#ec4899"; }}
                  onBlur={e => { e.target.style.borderColor = "#2e2e38"; }}
                />
              </div>
            )}

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-white/60 tracking-wide uppercase">
                Email address
              </label>
              <input
                type="email" placeholder="name@example.com" value={email}
                onChange={e => setEmail(e.target.value)} required
                className="w-full px-4 py-3.5 rounded-xl text-sm text-white outline-none transition-all"
                style={{ background: "#1e1e24", border: "2px solid #2e2e38" }}
                onFocus={e => { e.target.style.borderColor = "#ec4899"; }}
                onBlur={e => { e.target.style.borderColor = "#2e2e38"; }}
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-white/60 tracking-wide uppercase">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password" value={password}
                  onChange={e => setPassword(e.target.value)} required minLength={6}
                  className="w-full px-4 py-3.5 pr-12 rounded-xl text-sm text-white outline-none transition-all"
                  style={{ background: "#1e1e24", border: "2px solid #2e2e38" }}
                  onFocus={e => { e.target.style.borderColor = "#ec4899"; }}
                  onBlur={e => { e.target.style.borderColor = "#2e2e38"; }}
                />
                <button
                  type="button" tabIndex={-1}
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: "rgba(255,255,255,0.35)" }}
                >
                  {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            {isLogin && (
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox" checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded accent-pink-500"
                />
                <span className="text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
                  Remember me
                </span>
              </label>
            )}

            {/* Submit */}
            <motion.button
              type="submit" disabled={loading} whileTap={{ scale: 0.97 }}
              className="w-full py-4 rounded-full text-white text-sm font-black mt-2 relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #ec4899 0%, #f97316 100%)",
                opacity: loading ? 0.75 : 1,
              }}
            >
              <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)" }}
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "linear", repeatDelay: 2.4 }}
              />
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading
                  ? <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>{isLogin ? "Logging in…" : "Creating account…"}</>
                  : isLogin ? "Log In" : "Sign Up"
                }
              </span>
            </motion.button>
          </motion.form>
        </AnimatePresence>

        {/* Divider */}
        <div className="flex items-center gap-3 w-full my-6">
          <div className="flex-1 h-px" style={{ background: "#2a2a30" }} />
          <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.28)" }}>or</span>
          <div className="flex-1 h-px" style={{ background: "#2a2a30" }} />
        </div>

        {/* Google sign-in */}
        <motion.button
          onClick={() => loginWithGoogle()} whileTap={{ scale: 0.97 }}
          disabled={googleLoading}
          className="w-full py-3.5 rounded-full text-sm font-semibold flex items-center justify-center gap-3 transition-all"
          style={{
            background: "#1e1e24",
            border: "2px solid #2e2e38",
            color: googleLoading ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.85)",
          }}
        >
          {googleLoading ? (
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
              <path fill="#FBBC05" d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
            </svg>
          )}
          {googleLoading ? "Signing in…" : `Continue with Google`}
        </motion.button>

        {/* Guest — signup only */}
        {!isLogin && (
          <motion.button
            onClick={onGuest} whileTap={{ scale: 0.97 }}
            className="w-full mt-3 py-3.5 rounded-full text-sm font-bold border transition-colors"
            style={{ borderColor: "#3a3a42", color: "rgba(255,255,255,0.65)", background: "transparent" }}
          >
            Continue as Guest
          </motion.button>
        )}

        {/* Toggle login ↔ signup */}
        <p className="mt-8 text-sm text-center" style={{ color: "rgba(255,255,255,0.40)" }}>
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            onClick={() => { setIsLogin(v => !v); setError(""); }}
            className="font-bold underline underline-offset-2"
            style={{ color: "white" }}
          >
            {isLogin ? "Sign up for Smart Split" : "Log in"}
          </button>
        </p>

      </div>
    </motion.div>
  );
}


/* ══════════════════════════════════════════════════════════════
   DESKTOP VARIANTS (preserved from original)
═══════════════════════════════════════════════════════════════ */
const FEATURES = [
  "Track every shared bill across groups",
  "AI-powered receipt scanning with OCR",
  "Simplified debt with one-tap settlement",
  "Add friends via QR code in seconds",
];

const CARD_STYLE = {
  background:"linear-gradient(160deg,rgba(100,40,200,0.28) 0%,rgba(30,18,60,0.82) 55%,rgba(18,10,40,0.90) 100%)",
  backdropFilter:"blur(64px) saturate(160%)",WebkitBackdropFilter:"blur(64px) saturate(160%)",
  border:"1px solid rgba(255,255,255,0.22)",
  boxShadow:"0 8px 48px rgba(120,50,220,0.30),0 2px 12px rgba(0,0,0,0.55),inset 0 1px 0 rgba(255,255,255,0.18)",
};

/* ══════════════════════════════════════════════════════════════
   DESKTOP INTRO — 4-section STAR scroll-snap landing page
══════════════════════════════════════════════════════════════ */

/* ── Count-up number animation (starts from 0, triggers on view, once only) ── */
const CountUp = ({ to, prefix="", suffix="", duration=1.6, delay=0.2, className="" }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once:true, margin:"-40px" });
  const count = useMotionValue(0);
  const display = useTransform(count, v => prefix + Math.round(v).toLocaleString("en-IN") + suffix);
  useEffect(() => {
    if (!inView) return;
    count.set(0);
    const ctrl = animate(count, to, { duration, delay, ease:[0.16,1,0.3,1] });
    return ctrl.stop;
  }, [inView, to]);
  return <motion.span ref={ref} className={className}>{display}</motion.span>;
};

/* ── Magnetic CTA ── */
const DesktopMagneticBtn = ({ children, onClick, className="", style: s }) => {
  const ref = useRef(null);
  const x = useMotionValue(0); const y = useMotionValue(0);
  const sx = useSpring(x,{stiffness:420,damping:26}); const sy = useSpring(y,{stiffness:420,damping:26});
  const onMove = (e) => { const r=ref.current?.getBoundingClientRect(); if(!r)return; x.set((e.clientX-(r.left+r.width/2))*0.25); y.set((e.clientY-(r.top+r.height/2))*0.25); };
  const onLeave = () => { x.set(0); y.set(0); };
  return <motion.button ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} onClick={onClick} style={{x:sx,y:sy,...s}} whileHover={{scale:1.04}} whileTap={{scale:0.97}} className={className}>{children}</motion.button>;
};

/* ── Google button shared ── */
const GoogleBtn = ({ onClick, className="", style: s={} }) => (
  <button onClick={onClick}
    className={`flex items-center gap-2 px-5 py-3.5 rounded-2xl text-sm font-semibold transition-all hover:scale-105 active:scale-95 ${className}`}
    style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",color:"rgba(255,255,255,0.65)",...s}}>
    <svg width="14" height="14" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09a7.12 7.12 0 010-4.17V7.07H2.18A11.97 11.97 0 001 12c0 1.94.46 3.77 1.18 5.43l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.09 14.97 0 12 0 7.7 0 3.99 2.47 2.18 6.07l3.66 2.85c.87-2.6 3.3-4.17 6.16-4.17z" fill="#EA4335"/>
    </svg>
    Continue with Google
  </button>
);

/* ── Floating info card ── */
const DeskFloatCard = ({ children, style, delay=0, tilt=0, onClick, accentColor }) => {
  const [hov, setHov] = React.useState(false);
  const ready = React.useRef(false);
  const baseBox = `0 8px 32px rgba(0,0,0,0.35),inset 0 1px 0 rgba(255,255,255,0.10)${accentColor?",0 0 24px "+accentColor+"12":""}`;
  const hovBox = `0 12px 40px rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.14)${accentColor?",0 0 50px "+accentColor+"40":""}`;
  const active = hov && !!onClick;
  return (
    <motion.div
      initial={{opacity:0,scale:0.9,y:16}}
      animate={{opacity:1,scale:active?1.05:1,y:0,boxShadow:active?hovBox:baseBox}}
      transition={ready.current
        ? {boxShadow:{duration:0},scale:{type:"spring",stiffness:600,damping:35},opacity:{duration:0},y:{duration:0}}
        : {type:"spring",stiffness:400,damping:28,delay}}
      onAnimationComplete={()=>{ready.current=true;}}
      onHoverStart={()=>onClick&&setHov(true)}
      onHoverEnd={()=>setHov(false)}
      onClick={onClick}
      whileTap={onClick?{scale:0.96,transition:{duration:0}}:{}}
      style={{position:"absolute",borderRadius:18,padding:"12px 16px",
        background:"rgba(255,255,255,0.06)",
        border:`1px solid ${accentColor ? accentColor+"30" : "rgba(255,255,255,0.12)"}`,
        backdropFilter:"blur(20px) saturate(130%)",WebkitBackdropFilter:"blur(20px) saturate(130%)",
        rotate:`${tilt}deg`,cursor:onClick?"pointer":"default",...style}}
    >
      {children}
    </motion.div>
  );
};

/* ── Hero float card expand data ── */
const HERO_CARD_DATA = [
  {
    id:"balance", corner:"tl", accent:"#22c55e", icon:"💰", label:"Outstanding Balance",
    title:"You're owed \u20b92,360",
    desc:"See who owes you across every group, updated in real time. No mental math.",
    stats:[{val:"₹2,360",label:"total owed"},{val:"3",label:"pending"},{val:"2 days",label:"avg wait"}],
  },
  {
    id:"insight", corner:"tr", accent:"#a855f7", icon:"📊", label:"Monthly Insight",
    title:"12% under last month",
    desc:"Aaru AI tracks your spending, spots creep, and flags which categories cost you most.",
    stats:[{val:"12%",label:"saved vs last month"},{val:"₹1,840",label:"group spend"},{val:"4",label:"categories tracked"}],
  },
  {
    id:"scan", corner:"bl", accent:"#ec4899", icon:"⚡", label:"AI Receipt Scan",
    title:"Scanned in 2 seconds",
    desc:"Point your camera at any bill. Gemini reads every item and splits across your group instantly.",
    stats:[{val:"2s",label:"avg scan time"},{val:"99%",label:"accuracy"},{val:"₹840",label:"last scanned"}],
  },
  {
    id:"trip", corner:"br", accent:"#06b6d4", icon:"👥", label:"Group Split",
    title:"Weekend Trip \u20b912,400",
    desc:"Track every group expense in one place. Equal or custom splits, live balances, settle via UPI.",
    stats:[{val:"4",label:"members"},{val:"₹3,100",label:"per person"},{val:"6",label:"expenses"}],
  },
];

/* ── Phone dashboard mockup ── */
const DeskDashMockup = () => {
  const exps = [
    {label:"Dinner 🍕",group:"Weekend Trip",amount:"₹840",who:"A",color:"#ec4899"},
    {label:"Cab Ride 🚗",group:"College Gang",amount:"₹320",who:"S",color:"#a855f7"},
    {label:"Groceries 🛒",group:"Flatmates",amount:"₹1,200",who:"J",color:"#f97316"},
  ];
  return (
    <PhoneMockup style={{width:220}}>
      <div className="p-3 space-y-2.5" style={{minHeight:380}}>
        <div className="flex items-center justify-between mb-1">
          <div><div className="text-[9px] text-white/40 font-medium">Good evening</div><div className="text-[11px] text-white font-bold">Hey, Aarav 👋</div></div>
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold text-white" style={{background:"linear-gradient(135deg,#ec4899,#f97316)"}}>A</div>
        </div>
        <div className="rounded-xl p-2.5" style={{background:"linear-gradient(135deg,#ec4899,#a855f7 50%,#f97316)",boxShadow:"0 4px 16px rgba(236,72,153,0.35)"}}>
          <div className="text-[8px] text-white/70 font-medium">You're owed</div>
          <div className="text-lg font-black text-white font-mono">₹2,360</div>
          <div className="flex gap-1.5 mt-1">
            {["A","S","J"].map((l,i)=>(<div key={i} className="w-4 h-4 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-[7px] font-bold text-white">{l}</div>))}
            <div className="text-[7px] text-white/60 ml-0.5 self-center">+3 groups</div>
          </div>
        </div>
        <div className="text-[8px] text-white/40 font-semibold uppercase tracking-wide px-0.5">Recent</div>
        {exps.map((e,i)=>(
          <motion.div key={i} initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} transition={{delay:0.3+i*0.1}} className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[8px] font-bold text-white flex-shrink-0" style={{background:e.color+"33",border:`1px solid ${e.color}44`}}>{e.who}</div>
            <div className="flex-1 min-w-0"><div className="text-[9px] text-white/80 font-semibold truncate">{e.label}</div><div className="text-[7px] text-white/35 truncate">{e.group}</div></div>
            <div className="text-[9px] font-bold" style={{color:e.color}}>{e.amount}</div>
          </motion.div>
        ))}
      </div>
    </PhoneMockup>
  );
};

/* ── Section label pill ── */
const StarLabel = ({ letter, word, color="#ec4899" }) => (
  <div className="inline-flex items-center gap-2 mb-4">
    <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white"
      style={{background:`linear-gradient(135deg,${color},${color}88)`}}>{letter}</span>
    <span className="text-xs font-bold uppercase tracking-widest" style={{color:color+"cc"}}>{word}</span>
  </div>
);

/* ── Pain-point card for Section 2 ── */
const PainCard = ({ icon, title, desc, accent="#ec4899", delay=0, gif=null }) => (
  <motion.div
    initial={{opacity:0,y:40}} whileInView={{opacity:1,y:0}}
    viewport={{once:true,margin:"-60px"}} transition={{duration:0.5,delay,ease:[0.16,1,0.3,1]}}
    className="flex-1 rounded-3xl p-7 flex flex-col gap-4 min-w-0 transition-shadow duration-150"
    style={{background:"rgba(255,255,255,0.04)",
      backdropFilter:"blur(16px) saturate(120%)",WebkitBackdropFilter:"blur(16px) saturate(120%)",
      border:`1px solid ${accent}22`,boxShadow:`0 0 30px ${accent}0a,inset 0 1px 0 rgba(255,255,255,0.06)`,
      minHeight:220}}
    whileHover={{boxShadow:`0 0 50px ${accent}28,0 12px 40px rgba(0,0,0,0.3),inset 0 1px 0 rgba(255,255,255,0.10)`,border:`1px solid ${accent}40`,transition:{duration:0.12}}}>
    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
      style={{background:`${accent}18`,border:`1px solid ${accent}30`}}>{icon}</div>
    <div className="text-base font-bold text-white leading-snug">{title}</div>
    <div className="text-xs text-white/40 leading-relaxed">{desc}</div>
    {gif && (
      <div className="mt-auto overflow-hidden rounded-2xl">
        <img src={gif} alt="" className="w-full rounded-2xl" style={{height:180,objectFit:"cover",display:"block"}} />
      </div>
    )}
  </motion.div>
);

/* ── Scroll-deck feature cards for Section 3 ── */
const FEATURE_CARDS = [
  { icon:"📷", accent:"#ec4899", title:"Scan Any Receipt",
    desc:"Point your camera — AI reads every line item, tax, and tip in seconds. No manual entry, ever." },
  { icon:"👥", accent:"#a855f7", title:"Smart Group Splits",
    desc:"Equal, percentage, or custom per-person splits. Works with any combination of people and amounts." },
  { icon:"💸", accent:"#f97316", title:"One-Tap UPI Settlement",
    desc:"Pay what you owe directly via GPay, PhonePe, or Paytm. The balance zeroes out instantly." },
  { icon:"✨", accent:"#06b6d4", title:"Aaru AI Insights",
    desc:"Your personal AI assistant breaks down spending patterns, flags overspend, and suggests how to split recurring bills." },
];

const ScrollDeckCard = ({ card, index }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once:false, margin:"-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{opacity:0, y:50, scale:0.94, rotateX:14}}
      animate={inView
        ? {opacity:1, y:0, scale:1, rotateX:0}
        : {opacity:0, y:50, scale:0.94, rotateX:14}}
      transition={{duration:0.55, delay:index*0.1, ease:[0.16,1,0.3,1]}}
      style={{transformOrigin:"center bottom",
        background:"rgba(255,255,255,0.05)",backdropFilter:"blur(16px) saturate(120%)",WebkitBackdropFilter:"blur(16px) saturate(120%)",
        border:`1px solid ${card.accent}28`,boxShadow:`0 0 30px ${card.accent}0c,inset 0 1px 0 rgba(255,255,255,0.08)`}}
      className="w-full max-w-xl rounded-3xl p-6 flex gap-5"
      whileHover={{boxShadow:`0 0 50px ${card.accent}28,0 12px 40px rgba(0,0,0,0.3)`,transition:{duration:0.12}}}>
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
        style={{background:`${card.accent}18`,border:`1px solid ${card.accent}30`}}>{card.icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-base font-bold text-white mb-1">{card.title}</div>
        <div className="text-sm text-white/40 leading-relaxed">{card.desc}</div>
      </div>
    </motion.div>
  );
};

const ScrollDeck = () => (
  <div className="relative flex flex-col items-center gap-5" style={{perspective:1200}}>
    {FEATURE_CARDS.map((card, i) => (
      <ScrollDeckCard key={card.title} card={card} index={i} />
    ))}
  </div>
);

/* ── Interactive demo screen rendered inside enlarged phone ── */
const DEMO_TABS = [
  { id:"dashboard", icon:"🏠", label:"Dashboard",    color:"#ec4899", title:"Your money at a glance",       desc:"See who owes you, what you owe, and every split — sorted and grouped." },
  { id:"scan",      icon:"📷", label:"Scan Receipt",  color:"#f97316", title:"Point. Snap. Done.",          desc:"AI reads your entire bill in 2 seconds, even the sneaky service charge." },
  { id:"group",     icon:"👥", label:"Group Split",   color:"#a855f7", title:"Split your way",             desc:"Equal, by percentage, or a custom amount per person. Just works." },
  { id:"aaru",      icon:"✨", label:"Aaru AI",       color:"#06b6d4", title:"Your AI money buddy",        desc:"Ask anything. Aaru spots patterns, flags overspend, suggests splits." },
  { id:"settle",    icon:"💸", label:"Settle Up",     color:"#22c55e", title:"Pay in one tap",             desc:"GPay · PhonePe · Paytm. Debt zeroed. Friendship saved." },
];

/* ── Guided interactive phone for overlay ── */
const GUIDE_STEPS = [
  { id:"owe",     target:"owe",     label:"Outstanding Balance", icon:"💰", color:"#22c55e",
    title:"Your balance at a glance",
    desc:"See exactly who owes you and how much — updated in real-time across every group. No mental math needed." },
  { id:"insight", target:"insight", label:"Spending Insights",  icon:"✦",  color:"#a855f7",
    title:"AI-powered spending insights",
    desc:"Aaru tracks your spending patterns across groups, flags overspend, and gives you weekly summaries." },
  { id:"recent",  target:"recent",  label:"Recent Activity",    icon:"🧾", color:"#f97316",
    title:"Everything you split, in one feed",
    desc:"Every expense across every group — who paid, who owes, what category. Tap to see full details." },
  { id:"settle",  target:"settle",  label:"Settle Up",          icon:"💸", color:"#ec4899",
    title:"One-tap settlements",
    desc:"Pick GPay, PhonePe, or Paytm. Amount pre-filled. Debt auto-clears once paid." },
  { id:"scan",    target:"scan",    label:"Scan Receipt",       icon:"📷", color:"#06b6d4",
    title:"Point your camera. Done.",
    desc:"Gemini AI reads every line item, tax, and tip. Splits it across your whole group in 2 seconds." },
];

const GuidedDashPhone = ({ step, onTap }) => {
  const hl = (id) => step === id ? "ring-2 ring-offset-1 ring-offset-transparent cursor-pointer" : "";
  const arrow = (id) => step === id;
  return (
    <div className="p-3 space-y-2 relative" style={{height:380,overflow:"hidden"}}>
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div>
          <div className="text-[8px] text-white/40 font-medium uppercase tracking-wider">Good Evening</div>
          <div className="text-[11px] text-white font-bold">Hey, Aarav 👋</div>
        </div>
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
          style={{background:"linear-gradient(135deg,#ec4899,#f97316)"}}>A</div>
      </div>

      {/* ── Financial Overview card ── */}
      <div className={`rounded-xl p-2.5 relative ${hl("owe")}`}
        onClick={()=>onTap("owe")}
        style={{background:"linear-gradient(135deg,#ec4899,#a855f7 50%,#f97316)",boxShadow:"0 4px 16px rgba(236,72,153,0.35)",
          ...(step==="owe"?{ringColor:"#22c55e"}:{})}}>
        {arrow("owe") && <BounceArrow color="#22c55e"/>}
        <div className="flex gap-3">
          <div className="flex-1">
            <div className="text-[7px] text-white/60 font-medium uppercase tracking-wider">Total Spend</div>
            <div className="text-base font-black text-white font-mono leading-tight">₹18,240</div>
            <div className="text-[7px] text-white/50 mt-0.5">4 groups</div>
          </div>
          <div className="w-px bg-white/20 self-stretch"/>
          <div className="flex-1">
            <div className="text-[7px] text-white/60 font-medium uppercase tracking-wider">You're Owed</div>
            <div className="text-base font-black font-mono leading-tight" style={{color:"#bbf7d0"}}>₹2,360</div>
            <div className="text-[7px] font-medium" style={{color:"#fca5a5"}}>You owe ₹650</div>
          </div>
        </div>
        <div className="mt-2 rounded-lg py-1.5 text-center text-[8px] font-bold text-white" style={{background:"rgba(255,255,255,0.18)"}}>
          Settle Now →
        </div>
      </div>

      {/* ── Spending Insights ── */}
      <div className={`rounded-xl p-2.5 relative ${hl("insight")}`}
        onClick={()=>onTap("insight")}
        style={{background:"rgba(168,85,247,0.10)",border:"1px solid rgba(168,85,247,0.22)"}}>
        {arrow("insight") && <BounceArrow color="#a855f7"/>}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-xs">✦</span>
            <span className="text-[9px] text-white/70 font-semibold">Spending Insights</span>
          </div>
          <span className="text-[8px] font-bold" style={{color:"#a855f7"}}>View →</span>
        </div>
      </div>

      {/* ── Recent Activity ── */}
      <div className={`rounded-xl p-2.5 relative ${hl("recent")}`}
        onClick={()=>onTap("recent")}
        style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)"}}>
        {arrow("recent") && <BounceArrow color="#f97316"/>}
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[9px] text-white/60 font-semibold">Recent Activity</span>
          <span className="text-[8px] font-bold" style={{color:"#f97316"}}>All →</span>
        </div>
        {[
          {icon:"🍕",label:"Dinner",group:"Weekend Trip",amount:"₹840",color:"#ec4899",badge:"YOU PAID"},
        ].map((e,i)=>(
          <div key={i} className="flex items-center gap-2 mb-1 last:mb-0">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[9px]" style={{background:e.color+"22"}}>{e.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="text-[8px] text-white/80 font-semibold">{e.label}</div>
              <div className="text-[7px] text-white/30">{e.group}</div>
            </div>
            <div className="text-right">
              <div className="text-[8px] font-bold" style={{color:e.color}}>{e.amount}</div>
              <div className="text-[6px] font-bold" style={{color:e.badge==="TO RECEIVE"?"#4ade80":"#fca5a5"}}>{e.badge}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Settle Up quick card ── */}
      <div className={`rounded-xl p-2.5 relative ${hl("settle")}`}
        onClick={()=>onTap("settle")}
        style={{background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.18)"}}>
        {arrow("settle") && <BounceArrow color="#ec4899"/>}
        <div className="text-[8px] text-white/50 mb-1">Outstanding · Sara</div>
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-black font-mono" style={{color:"#4ade80"}}>₹650</div>
          <div className="flex gap-1">
            {["GPay","PhonePe","Paytm"].map(n=>(
              <div key={n} className="px-1.5 py-0.5 rounded text-[6px] font-bold text-white/60" style={{background:"rgba(255,255,255,0.06)"}}>
                {n}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Scan Receipt CTA ── */}
      <div className={`rounded-xl p-2 text-center relative ${hl("scan")}`}
        onClick={()=>onTap("scan")}
        style={{background:"linear-gradient(135deg,rgba(6,182,212,0.15),rgba(168,85,247,0.10))",border:"1px solid rgba(6,182,212,0.22)"}}>
        {arrow("scan") && <BounceArrow color="#06b6d4"/>}
        <div className="text-[9px] font-bold text-white/70">📷 Scan a Receipt</div>
        <div className="text-[7px] text-white/30">AI splits in 2 seconds</div>
      </div>

      {/* ── Aaru AI assistant strip ── */}
      <div className="rounded-xl px-2.5 py-2 flex items-center gap-2"
        style={{background:"linear-gradient(135deg,rgba(168,85,247,0.18),rgba(236,72,153,0.12))",border:"1px solid rgba(168,85,247,0.28)"}}>
        <img src="/aaru-robot.svg" alt="Aaru" style={{width:18,height:18,objectFit:"contain",flexShrink:0}} />
        <div className="flex-1 min-w-0">
          <div className="text-[8px] font-bold text-white/80">Ask Aaru</div>
          <div className="text-[7px] text-white/35 truncate">AI expense assistant</div>
        </div>
        <div className="px-1.5 py-0.5 rounded-full text-[7px] font-bold text-white" style={{background:"linear-gradient(135deg,#a855f7,#ec4899)"}}>Chat →</div>
      </div>

      {/* ── Bottom nav ── */}
      <div className="flex justify-around pt-1 border-t border-white/6">
        {[{i:"🏠",l:"Home",a:true},{i:"💰",l:"Expenses"},{i:"👥",l:"Friends"},{i:"📊",l:"Groups"},{i:"👤",l:"Profile"}].map(n=>(
          <div key={n.l} className="flex flex-col items-center gap-0.5 py-1">
            <span className={`text-[10px] ${n.a?"":"opacity-40"}`}>{n.i}</span>
            <span className={`text-[6px] font-semibold ${n.a?"text-white":"text-white/30"}`}>{n.l}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Bouncing arrow indicator ── */
const BounceArrow = ({ color="#ec4899" }) => (
  <motion.div
    className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none flex flex-col items-center"
    animate={{y:[0,5,0]}} transition={{duration:1.2,repeat:Infinity,ease:"easeInOut"}}>
    <div className="text-[10px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap"
      style={{background:color,color:"#fff",boxShadow:`0 2px 12px ${color}66`}}>
      Tap here ↓
    </div>
  </motion.div>
);

/* ── Scroll section dot indicator ── */
function DesktopIntro({ onGetStarted, onGoogleSignIn }) {
  const [visible, setVisible] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const [phoneExpanded, setPhoneExpanded] = useState(false);
  const [demoFeature, setDemoFeature] = useState("dashboard");
  const [guideStep, setGuideStep] = useState(0); // index into GUIDE_STEPS
  const [expandedCard, setExpandedCard] = useState(null);
  const [slide3Unlocked, setSlide3Unlocked] = useState(false);
  const slide3UnlockedRef = useRef(false);
  const slide3LockedRef = useRef(false);
  const activeSectionRef = useRef(0);
  const cardSwapRef = useRef(null);
  const pendingSwapRef = useRef(false);
  const scrollRef = useRef(null);
  const sectionRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  useEffect(() => { const id = requestAnimationFrame(() => setVisible(true)); return () => cancelAnimationFrame(id); }, []);

  /* Track active section via IntersectionObserver */
  useEffect(() => {
    const observers = sectionRefs.map((ref, i) => {
      if (!ref.current) return null;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) { setActiveSection(i); activeSectionRef.current = i; } },
        { root: scrollRef.current, threshold: 0.5 }
      );
      obs.observe(ref.current);
      return obs;
    });
    return () => observers.forEach(o => o?.disconnect());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Card swap callback — unlock scroll after full cycle + auto-advance to result */
  const handleCardSwap = (count) => {
    if (!slide3UnlockedRef.current && count >= FEATURE_CARDS.length) {
      slide3UnlockedRef.current = true;
      setSlide3Unlocked(true);
      /* Re-enable scroll */
      if (scrollRef.current) {
        scrollRef.current.style.overflowY = 'auto';
        scrollRef.current.style.scrollSnapType = 'y mandatory';
        slide3LockedRef.current = false;
      }
      /* Auto-advance to the result section */
      setTimeout(() => {
        sectionRefs[3].current?.scrollIntoView({ behavior: 'smooth' });
      }, 700);
    }
  };

  /* Lock on section 3 when it comes into view */
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const lockObs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !slide3UnlockedRef.current) {
          setTimeout(() => {
            if (activeSectionRef.current === 2 && !slide3UnlockedRef.current) {
              slide3LockedRef.current = true;
              container.style.overflowY = 'hidden';
              container.style.scrollSnapType = 'none';
            }
          }, 450);
        }
      },
      { root: container, threshold: 0.85 }
    );
    if (sectionRefs[2].current) lockObs.observe(sectionRefs[2].current);
    return () => lockObs.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Auto-play card swaps while locked on section 3 */
  useEffect(() => {
    if (slide3Unlocked) return;
    if (activeSection !== 2) return;
    const timer = setInterval(() => {
      if (!slide3UnlockedRef.current && cardSwapRef.current && !cardSwapRef.current.isAnimating()) {
        cardSwapRef.current.swapNext();
      }
    }, 1500);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection, slide3Unlocked]);

  return (
    <div className="h-full w-full relative">
      {/* ── Fixed navbar ── */}
      <nav className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between px-12 pt-7 pb-4"
        style={{background:"linear-gradient(to bottom,rgba(12,14,26,0.9) 0%,transparent 100%)",backdropFilter:"blur(0px)"}}>
        <div className="flex items-center gap-3">
          <img src="/icon.png" alt="Smart Split" className="h-8 w-8 rounded-xl shadow-lg" />
          <span className="text-sm font-bold text-white/80 tracking-tight">Smart Split</span>
        </div>

        <motion.div initial={{opacity:0,y:-6}} animate={visible?{opacity:1,y:0}:{}} transition={{type:"spring",stiffness:380,damping:26}}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
          style={{background:"rgba(236,72,153,0.12)",border:"1px solid rgba(236,72,153,0.25)",color:"#f472b6"}}>
          <FiZap size={11}/> AI-powered bill splitting
        </motion.div>

        <AnimatePresence>
          {activeSection !== 3 && (
            <motion.button onClick={onGetStarted}
              initial={{opacity:1,scale:1}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.9}}
              transition={{duration:0.2}}
              className="px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:scale-105 active:scale-95"
              style={{background:"linear-gradient(135deg,#ec4899,#a855f7)",border:"1px solid rgba(255,255,255,0.12)"}}>
              Get Started →
            </motion.button>
          )}
        </AnimatePresence>
      </nav>

      {/* ── Scroll container ── */}
      <div ref={scrollRef} className="intro-scroll h-full w-full">

        {/* ══════════════════════════════════
            S — SITUATION / Hero
        ══════════════════════════════════ */}
        <section ref={sectionRefs[0]} className="intro-section flex flex-col items-center px-8" style={{paddingTop:"14vh",paddingBottom:"2vh"}}>
          {/* Glow orbs */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div style={{position:"absolute",top:"15%",left:"20%",width:400,height:400,borderRadius:"50%",background:"radial-gradient(circle,rgba(236,72,153,0.10) 0%,transparent 70%)",filter:"blur(60px)"}}/>
            <div style={{position:"absolute",bottom:"20%",right:"15%",width:360,height:360,borderRadius:"50%",background:"radial-gradient(circle,rgba(168,85,247,0.10) 0%,transparent 70%)",filter:"blur(60px)"}}/>
          </div>

          {/* Text + CTA */}
          <div className="flex flex-col items-center text-center max-w-2xl relative z-10" style={{paddingBottom:"3vh"}}>
            <motion.h1 className="text-[2.8rem] xl:text-[3.6rem] font-black leading-[1.08] tracking-tight text-white"
              initial={{opacity:0,y:28}} animate={visible?{opacity:1,y:0}:{}} transition={{type:"spring",stiffness:320,damping:22,delay:0.06}}>
              Split bills,{" "}<span style={GRAD_STYLE}>not friendships.</span>
            </motion.h1>
          </div>

          {/* Phone + float cards */}
          <motion.div className="relative flex-shrink-0 w-full" style={{maxWidth:700,height:500,margin:"0 auto"}}
            initial={{opacity:0,y:40}} animate={visible?{opacity:1,y:0}:{}} transition={{type:"spring",stiffness:260,damping:24,delay:0.08}}>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div style={{width:220,height:220,borderRadius:"50%",background:"radial-gradient(circle,rgba(168,85,247,0.18) 0%,transparent 70%)",filter:"blur(55px)"}} />
            </div>
            <div className="absolute z-[2] cursor-pointer" title="Click to explore" style={{left:"50%",top:"50%",transform:"translate(-50%,-50%)"}} onClick={()=>setPhoneExpanded(true)}>
              <motion.div animate={{y:[0,-10,0]}} transition={{duration:4.5,repeat:Infinity,ease:[0.45,0,0.55,1],delay:1.0,repeatType:"mirror"}}>
                <DeskDashMockup/>
                <div className="flex items-center justify-center gap-1.5 mt-2 pointer-events-none">
                  <span className="text-[10px] font-bold text-white">→</span>
                  <span className="text-[10px] font-semibold text-white">tap to explore</span>
                </div>
              </motion.div>
            </div>
            <DeskFloatCard style={{top:16,left:"2%",width:165}} delay={0.5} tilt={-5} driftY={6} accentColor="#22c55e" onClick={()=>setExpandedCard("balance")}>
              <div className="text-[11px] text-white/40 font-medium mb-1">You're owed</div>
              <div className="text-[1.3rem] font-black text-white font-mono leading-none"><CountUp to={2360} prefix="₹"/></div>
              <div className="flex items-center gap-1 mt-1.5"><div className="w-1.5 h-1.5 rounded-full bg-green-400"/><span className="text-[11px] text-green-400 font-semibold">3 pending</span></div>
              <div className="mt-2 flex items-center gap-1"><span className="text-[10px] font-bold text-white">→</span><span className="text-[10px] font-semibold text-white">tap to explore</span></div>
            </DeskFloatCard>
            <DeskFloatCard style={{top:10,right:"2%",width:168}} delay={0.65} tilt={5} driftY={7} accentColor="#a855f7" onClick={()=>setExpandedCard("insight")}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className="w-4 h-4 rounded flex items-center justify-center text-[11px]" style={{background:"rgba(168,85,247,0.25)"}}>📊</div>
                <span className="text-[11px] text-white/50 font-semibold">Monthly Insight</span>
              </div>
              <div className="text-[12px] text-white font-bold leading-snug"><CountUp to={12} suffix="%"/> under last month's spending</div>
              <div className="mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold inline-block" style={{background:"rgba(34,197,94,0.15)",color:"#4ade80"}}>↓ Saving more ✓</div>
              <div className="mt-2 flex items-center gap-1"><span className="text-[10px] font-bold text-white">→</span><span className="text-[10px] font-semibold text-white">tap to explore</span></div>
            </DeskFloatCard>
            <DeskFloatCard style={{bottom:38,left:"2%",width:162}} delay={0.8} tilt={-4} driftY={9} accentColor="#ec4899" onClick={()=>setExpandedCard("scan")}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className="w-4 h-4 rounded flex items-center justify-center" style={{background:"rgba(236,72,153,0.2)",fontSize:11}}>⚡</div>
                <span className="text-[11px] text-white/50 font-semibold">AI Scanned</span>
              </div>
              <div className="text-[12px] text-white font-bold">Domino's Pizza</div>
              <div className="text-[11px] text-white/40"><CountUp to={840} prefix="₹"/> · 4 people split</div>
              <div className="mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold inline-block" style={{background:"rgba(34,197,94,0.15)",color:"#4ade80"}}>Auto-split ✓</div>
              <div className="mt-2 flex items-center gap-1"><span className="text-[10px] font-bold text-white">→</span><span className="text-[10px] font-semibold text-white">tap to explore</span></div>
            </DeskFloatCard>
            <DeskFloatCard style={{bottom:32,right:"2%",width:158}} delay={0.95} tilt={4} driftY={8} accentColor="#06b6d4" onClick={()=>setExpandedCard("trip")}>
              <div className="text-[11px] text-white/40 font-medium mb-1">Weekend Trip</div>
              <div className="flex items-center gap-1 mb-1.5">
                {["#ec4899","#a855f7","#f97316","#06b6d4"].map((c,i)=>(
                  <div key={i} className="w-5 h-5 rounded-full border-2 flex items-center justify-center text-[8px] font-bold text-white"
                    style={{background:c,borderColor:"rgba(14,14,26,0.9)"}}>{["A","S","J","K"][i]}</div>
                ))}
              </div>
              <div className="text-[14px] font-black text-white font-mono"><CountUp to={12400} prefix="₹"/></div>
              <div className="text-[10px] text-white/35">total · 4 members</div>
              <div className="mt-2 flex items-center gap-1"><span className="text-[10px] font-bold text-white">→</span><span className="text-[10px] font-semibold text-white">tap to explore</span></div>
            </DeskFloatCard>
          </motion.div>

          {/* Scroll nudge */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 z-10 cursor-pointer"
            onClick={()=>sectionRefs[1].current?.scrollIntoView({behavior:"smooth"})}>
            <span className="text-[9px] uppercase tracking-widest font-medium text-white/20">Scroll</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
        </section>

        {/* ══════════════════════════════════
            T — TASK / The Problem
        ══════════════════════════════════ */}
        <section ref={sectionRefs[1]} className="intro-section flex flex-col px-12 relative overflow-hidden" style={{paddingTop:"13vh"}}>
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div style={{position:"absolute",top:"30%",left:"-5%",width:500,height:500,borderRadius:"50%",background:"radial-gradient(circle,rgba(239,68,68,0.05) 0%,transparent 70%)",filter:"blur(70px)"}}/>
          </div>

          <motion.div className="max-w-5xl w-full relative z-10 mx-auto flex-1 flex flex-col"
            initial={{opacity:0,y:32}} whileInView={{opacity:1,y:0}} viewport={{once:true,margin:"-80px"}} transition={{type:"spring",stiffness:280,damping:26}}>
            <motion.div className="text-center mb-10"
              initial={{opacity:0,y:16}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{type:"spring",stiffness:300,damping:26}}>
              <h2 className="text-[2.8rem] xl:text-[3.4rem] font-black text-white leading-tight">
                <DecryptedText text="Sound familiar?" animateOn="view" speed={80} maxIterations={20} sequential revealDirection="center" className="" encryptedClassName="text-white/20" />
              </h2>
              <p className="mt-3 text-white/35 text-sm max-w-md mx-auto leading-relaxed">
                Every group has this problem. Nobody fixes it. We did.
              </p>
            </motion.div>

            <div className="flex gap-5 flex-1">
              <PainCard delay={0} accent="#ef4444" icon="💬"
                title="The endless IOU spiral"
                desc="3 hours of WhatsApp archaeology just to figure out who owes whom. Every single time."
                gif="/videos/Lizard GIF.gif"/>
              <PainCard delay={0.1} accent="#f97316" icon="🧮"
                title="Mental math after every meal"
                desc="Bill arrives, awkward silence follows. Calculator out, 'service charge included?' debate begins."
                gif="/videos/loop GIF.gif"/>
              <PainCard delay={0.2} accent="#a855f7" icon="😬"
                title="The awkward ask"
                desc="Reminding your friend for the third time they owe you ₹340. It shouldn't be this hard."
                gif="/videos/Breaking Bad GIF.gif"/>
            </div>
          </motion.div>

          {/* Bottom text — pinned near bottom */}
          <motion.div className="relative z-10 text-center pb-8 pt-6"
            initial={{opacity:0,y:10}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{type:"spring",stiffness:300,damping:28,delay:0.2}}>
            <p className="text-white/50 text-sm italic">We built Smart Split to end all of this.</p>
            <div className="mt-4 inline-block cursor-pointer"
              onClick={()=>sectionRefs[2].current?.scrollIntoView({behavior:"smooth"})}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
          </motion.div>
        </section>

        {/* ══════════════════════════════════
            A — ACTION / The Solution
        ══════════════════════════════════ */}
        <section ref={sectionRefs[2]} className="intro-section flex items-center px-12 relative overflow-hidden">
          {/* Glow orbs */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div style={{position:"absolute",top:"20%",right:"-5%",width:480,height:480,borderRadius:"50%",background:"radial-gradient(circle,rgba(168,85,247,0.07) 0%,transparent 70%)",filter:"blur(70px)"}}/>
            <div style={{position:"absolute",bottom:"15%",left:"5%",width:380,height:380,borderRadius:"50%",background:"radial-gradient(circle,rgba(236,72,153,0.06) 0%,transparent 70%)",filter:"blur(70px)"}}/>
          </div>

          <div className="max-w-6xl w-full mx-auto relative z-10 flex items-center gap-16">

            {/* ── Left: heading + feature list ── */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <motion.div
                initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{duration:0.5}}>
                <h2 className="text-[2.8rem] xl:text-[3.4rem] font-black text-white leading-tight">
                  Smart Split handles<br/><span style={GRAD_STYLE}>everything.</span>
                </h2>
                <p className="mt-4 text-white/35 text-sm leading-relaxed max-w-sm">
                  Four features that replace your group chat math thread forever.
                </p>
              </motion.div>

              <div className="mt-10 flex flex-col gap-3">
                {FEATURE_CARDS.map((card, i) => (
                  <motion.div key={card.title}
                    initial={{opacity:0,x:-20}} whileInView={{opacity:1,x:0}} viewport={{once:true}}
                    transition={{duration:0.4,delay:0.1+i*0.08,ease:[0.16,1,0.3,1]}}
                    className="flex items-center gap-4 rounded-2xl px-5 py-4"
                    style={{background:`${card.accent}18`,border:`1px solid ${card.accent}40`}}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                      style={{background:`${card.accent}22`,border:`1px solid ${card.accent}40`}}>
                      {card.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-white">{card.title}</div>
                      <div className="text-xs text-white/45 leading-snug mt-0.5 truncate">{card.desc.slice(0,62)}…</div>
                    </div>
                  </motion.div>
                ))}
              </div>

            </div>

            {/* ── Right: CardSwap ── */}
            <motion.div className="flex-shrink-0 flex items-center justify-center"
              initial={{opacity:0,x:40}} whileInView={{opacity:1,x:0}} viewport={{once:true}}
              transition={{duration:0.6,delay:0.15,ease:[0.16,1,0.3,1]}}>
              <CardSwap
                ref={cardSwapRef}
                width={400} height={290}
                cardDistance={58} verticalDistance={65}
                skewAmount={4}
                onSwap={handleCardSwap}
              >
                {FEATURE_CARDS.map((card) => (
                  <Card key={card.title} style={{
                    background:"rgba(10,8,22,0.82)",
                    border:`1px solid ${card.accent}30`,
                    backdropFilter:"blur(40px) saturate(140%)",
                    WebkitBackdropFilter:"blur(40px) saturate(140%)",
                    boxShadow:`0 24px 60px rgba(0,0,0,0.55),0 0 40px ${card.accent}18,inset 0 1px 0 rgba(255,255,255,0.08)`,
                  }}>
                    {/* Glow layer */}
                    <div style={{position:"absolute",inset:0,pointerEvents:"none",overflow:"hidden",borderRadius:20}}>
                      <div style={{position:"absolute",top:"-30%",left:"-20%",width:280,height:280,borderRadius:"50%",
                        background:`radial-gradient(circle,${card.accent}22 0%,transparent 70%)`,filter:"blur(50px)"}}/>
                    </div>
                    <div style={{position:"relative",zIndex:1,padding:"2rem",height:"100%",display:"flex",flexDirection:"column",justifyContent:"space-between"}}>
                      {/* Top */}
                      <div>
                        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
                          <div style={{width:48,height:48,borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",
                            fontSize:22,background:`${card.accent}1a`,border:`1px solid ${card.accent}35`,flexShrink:0}}>
                            {card.icon}
                          </div>
                          <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.18em",color:card.accent}}>
                            Feature
                          </div>
                        </div>
                        <div style={{fontSize:"1.3rem",fontWeight:900,color:"#fff",lineHeight:1.2,letterSpacing:"-0.01em",marginBottom:10}}>
                          {card.title}
                        </div>
                        <div style={{fontSize:"0.8rem",color:"rgba(255,255,255,0.42)",lineHeight:1.55}}>
                          {card.desc}
                        </div>
                      </div>
                      {/* Bottom tag */}
                      <div style={{marginTop:16,display:"inline-flex",alignItems:"center",gap:6,width:"fit-content",
                        padding:"6px 12px",borderRadius:999,background:`${card.accent}14`,border:`1px solid ${card.accent}30`}}>
                        <div style={{width:6,height:6,borderRadius:"50%",background:card.accent}}/>
                        <span style={{fontSize:10,fontWeight:700,color:card.accent}}>Smart Split</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </CardSwap>
            </motion.div>

          </div>
        </section>

        {/* ══════════════════════════════════
            R — RESULT / CTA
        ══════════════════════════════════ */}
        <section ref={sectionRefs[3]} className="intro-section flex flex-col items-center justify-center text-center px-8 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:600,height:600,borderRadius:"50%",background:"radial-gradient(circle,rgba(168,85,247,0.09) 0%,transparent 65%)",filter:"blur(80px)"}}/>
          </div>

          <div className="relative z-10 max-w-2xl">
            {/* Big animated number */}
            <motion.div
              initial={{opacity:0,scale:0.8}} whileInView={{opacity:1,scale:1}}
              viewport={{once:true}} transition={{duration:0.6,ease:[0.16,1,0.3,1]}}
              className="text-[5rem] xl:text-[6.5rem] font-black font-mono leading-none tracking-tight"
              style={{background:"linear-gradient(135deg,#22c55e,#06b6d4)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}}>
              <CountUp to={2360} prefix="₹" duration={2} delay={0.3}/>
            </motion.div>

            <motion.p className="mt-2 text-white/30 text-sm"
              initial={{opacity:0}} whileInView={{opacity:1}} viewport={{once:true}} transition={{duration:0.4,delay:0.1}}>
              The average amount our users recover in their first week.
            </motion.p>

            <motion.h2 className="mt-8 text-[2.2rem] xl:text-[2.8rem] font-black text-white leading-tight"
              initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{duration:0.5,delay:0.12}}>
              Join <CountUp to={1200} suffix="+"/> people who never do<br/><span style={GRAD_STYLE}>split math again.</span>
            </motion.h2>

            {/* Quote */}
            <motion.blockquote className="mt-6 text-white/35 text-sm italic max-w-sm mx-auto leading-relaxed"
              initial={{opacity:0}} whileInView={{opacity:1}} viewport={{once:true}} transition={{duration:0.4,delay:0.2}}>
              "Finally I don't have to be the group's unpaid accountant."
              <span className="block mt-1 not-italic text-white/20">— Every friend group, ever</span>
            </motion.blockquote>

            {/* CTA buttons */}
            <motion.div className="mt-10 flex items-center gap-3 justify-center flex-wrap"
              initial={{opacity:0,y:14}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{duration:0.45,delay:0.26}}>
              <DesktopMagneticBtn onClick={onGetStarted}
                className="px-10 py-4 rounded-2xl text-white text-base font-bold shadow-2xl flex items-center gap-2"
                style={{background:"linear-gradient(135deg,#ec4899 0%,#a855f7 50%,#f97316 100%)"}}>
                Get Started Free <FiArrowRight size={18}/>
              </DesktopMagneticBtn>
              {onGoogleSignIn && <GoogleBtn onClick={()=>onGoogleSignIn()} style={{paddingTop:"1rem",paddingBottom:"1rem"}}/>}
            </motion.div>

            <motion.p className="mt-5 text-white/20 text-xs"
              initial={{opacity:0}} whileInView={{opacity:1}} viewport={{once:true}} transition={{duration:0.4,delay:0.34}}>
              Free forever · No credit card · Works on any device
            </motion.p>
          </div>
        </section>

      </div>{/* end intro-scroll */}

      {/* ── Float card expand overlay ── */}
      <AnimatePresence>
        {expandedCard && (() => {
          const card = HERO_CARD_DATA.find(c => c.id === expandedCard);
          if (!card) return null;
          const corners = {
            tl:{flex:"items-start justify-start",pad:"pt-[16vh] pl-[6vw]",origin:"top left",    iy:-28,ix:-18},
            tr:{flex:"items-start justify-end",  pad:"pt-[16vh] pr-[6vw]",origin:"top right",   iy:-28,ix:18},
            bl:{flex:"items-end justify-start",  pad:"pb-[16vh] pl-[6vw]",origin:"bottom left", iy:28, ix:-18},
            br:{flex:"items-end justify-end",    pad:"pb-[16vh] pr-[6vw]",origin:"bottom right",iy:28, ix:18},
          };
          const cfg = corners[card.corner] || corners.tl;
          return (
            <motion.div
              key="card-overlay"
              initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              transition={{duration:0}}
              className={`fixed inset-0 z-[200] flex ${cfg.flex} ${cfg.pad}`}
              style={{background:"rgba(4,6,18,0.55)",backdropFilter:"blur(6px)",WebkitBackdropFilter:"blur(6px)"}}
              onClick={()=>setExpandedCard(null)}>
              {/* Card */}
              <motion.div
                initial={{opacity:0,y:cfg.iy,x:cfg.ix,scale:0.86}}
                animate={{opacity:1,y:0,x:0,scale:1}}
                exit={{opacity:0,scale:0.92,transition:{duration:0}}}
                transition={{type:"spring",stiffness:460,damping:32}}
                className="relative cursor-default overflow-hidden"
                style={{
                  maxWidth:420,width:"82vw",borderRadius:"1.75rem",
                  background:"rgba(10,8,22,0.82)",
                  border:`1px solid ${card.accent}22`,
                  backdropFilter:"blur(40px)",WebkitBackdropFilter:"blur(40px)",
                  boxShadow:`0 32px 80px rgba(0,0,0,0.7),0 0 56px ${card.accent}14,inset 0 1px 0 rgba(255,255,255,0.06)`,
                  transformOrigin:cfg.origin,
                }}
                onClick={e=>e.stopPropagation()}>
                {/* Glow */}
                <div className="absolute inset-0 pointer-events-none" style={{borderRadius:"2rem",overflow:"hidden"}}>
                  <div style={{position:"absolute",top:"-20%",left:"-10%",width:360,height:360,borderRadius:"50%",
                    background:`radial-gradient(circle,${card.accent}18 0%,transparent 70%)`,filter:"blur(70px)"}}/>
                </div>
                <div className="relative z-10 p-7">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
                      style={{width:44,height:44,background:`${card.accent}18`,border:`1px solid ${card.accent}30`}}>
                      {card.icon}
                    </div>
                    <div>
                      <div className="text-[9px] font-bold uppercase tracking-[0.2em]" style={{color:card.accent}}>{card.label}</div>
                      <h3 className="text-[1.35rem] font-black text-white leading-tight tracking-tight mt-0.5">{card.title}</h3>
                    </div>
                  </div>
                  {/* Description */}
                  <p className="text-white/50 text-[0.82rem] leading-relaxed mb-5">{card.desc}</p>
                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-2.5">
                    {card.stats.map(({val,label})=>(
                      <div key={label} className="rounded-xl p-3 text-center"
                        style={{background:`${card.accent}0d`,border:`1px solid ${card.accent}22`}}>
                        <div className="text-base font-black font-mono" style={{color:card.accent}}>{val}</div>
                        <div className="text-[9px] text-white/35 mt-0.5">{label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
              {/* ✕ outside card so overflow:hidden never clips it */}
              <motion.button
                initial={{opacity:0,scale:0.7}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.7,transition:{duration:0}}}
                transition={{type:"spring",stiffness:420,damping:26,delay:0.08}}
                onClick={(e)=>{e.stopPropagation();setExpandedCard(null);}}
                className="fixed top-5 right-5 w-9 h-9 rounded-full flex items-center justify-center text-white/50 hover:text-white/90 transition-colors"
                style={{zIndex:201,background:"rgba(255,255,255,0.09)",border:"1px solid rgba(255,255,255,0.14)"}}>
                ✕
              </motion.button>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* ── Phone expanded overlay ── */}
      <AnimatePresence>
        {phoneExpanded && (
          <motion.div
            key="phone-overlay"
            initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            transition={{duration:0.18}}
            className="fixed inset-0 z-[200] flex items-center justify-center p-6"
            style={{background:"rgba(4,6,18,0.55)",backdropFilter:"blur(12px) saturate(120%)",WebkitBackdropFilter:"blur(12px) saturate(120%)"}}
            onClick={()=>{setPhoneExpanded(false);setGuideStep(0);}}>

            {/* ── Frosted glass card ── */}
            <motion.div
              initial={{opacity:0,y:44,scale:0.88}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:28,scale:0.91}}
              transition={{type:"spring",stiffness:320,damping:28}}
              className="relative flex gap-0 items-stretch cursor-default overflow-hidden"
              style={{
                maxWidth:960,width:"92vw",borderRadius:"2rem",
                background:"rgba(10,8,22,0.80)",
                border:"1px solid rgba(255,255,255,0.13)",
                backdropFilter:"blur(52px) saturate(140%)",WebkitBackdropFilter:"blur(52px) saturate(140%)",
                boxShadow:"0 40px 100px rgba(0,0,0,0.75),0 0 0 1px rgba(255,255,255,0.04),inset 0 1px 0 rgba(255,255,255,0.10)"
              }}
              onClick={e=>e.stopPropagation()}>

              {/* Dynamic glow */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{borderRadius:"2rem"}}>
                <motion.div
                  key={GUIDE_STEPS[guideStep]?.id}
                  initial={{opacity:0}} animate={{opacity:1}} transition={{duration:0.5}}
                  style={{position:"absolute",top:"20%",left:"10%",width:360,height:360,borderRadius:"50%",
                    background:`radial-gradient(circle,${GUIDE_STEPS[guideStep]?.color||"#ec4899"}14 0%,transparent 70%)`,
                    filter:"blur(70px)",pointerEvents:"none"}}/>
              </div>

              {/* Left — guided phone */}
              <div className="flex-shrink-0 flex items-center justify-center p-8 pr-6">
                <PhoneMockup style={{width:220}}>
                  <GuidedDashPhone
                    step={GUIDE_STEPS[guideStep]?.id || "owe"}
                    onTap={(id) => {
                      const idx = GUIDE_STEPS.findIndex(s => s.id === id);
                      if (idx >= 0) setGuideStep(idx);
                    }}
                  />
                </PhoneMockup>
              </div>

              {/* Hairline divider */}
              <div className="w-px self-stretch flex-shrink-0" style={{background:"rgba(255,255,255,0.06)",margin:"32px 0"}}/>

              {/* Right — guided feature panel */}
              <div className="flex-1 min-w-0 flex flex-col justify-center p-8 pl-8 gap-0">
                {/* Step progress */}
                <div className="flex items-center gap-1.5 mb-5">
                  {GUIDE_STEPS.map((s,i)=>(
                    <motion.div key={s.id}
                      onClick={()=>setGuideStep(i)}
                      className="cursor-pointer rounded-full"
                      animate={{
                        width: i===guideStep ? 24 : 8,
                        background: i===guideStep ? s.color : "rgba(255,255,255,0.15)",
                      }}
                      transition={{type:"spring",stiffness:400,damping:28}}
                      style={{height:8,borderRadius:999}}/>
                  ))}
                  <span className="text-[10px] text-white/25 ml-2 font-medium">{guideStep+1}/{GUIDE_STEPS.length}</span>
                </div>

                {/* Active feature content */}
                <AnimatePresence mode="wait">
                  {(() => {
                    const gs = GUIDE_STEPS[guideStep];
                    if (!gs) return null;
                    return (
                      <motion.div key={gs.id}
                        initial={{opacity:0,x:10}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-8}}
                        transition={{duration:0.08}}>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-lg">{gs.icon}</span>
                          <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{color:gs.color}}>{gs.label}</span>
                        </div>
                        <h3 className="text-[1.75rem] xl:text-[2.1rem] font-black text-white leading-tight mb-2 tracking-tight">{gs.title}</h3>
                        <p className="text-white/40 text-[0.85rem] leading-relaxed mb-6 max-w-sm">{gs.desc}</p>
                      </motion.div>
                    );
                  })()}
                </AnimatePresence>

                {/* Feature step buttons */}
                <div className="flex flex-col gap-1.5">
                  {GUIDE_STEPS.map((tab,i)=>(
                    <motion.button
                      key={tab.id}
                      initial={{opacity:0,x:18}} animate={{opacity:1,x:0}}
                      transition={{type:"spring",stiffness:380,damping:28,delay:0.05+i*0.05}}
                      onClick={()=>setGuideStep(i)}
                      className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-left w-full"
                      style={{
                        transition:"background 0.2s,box-shadow 0.2s,border-color 0.2s",
                        ...(guideStep===i
                          ?{background:`linear-gradient(135deg,${tab.color}1e,${tab.color}08)`,border:`1px solid ${tab.color}40`,boxShadow:`0 4px 20px ${tab.color}14`}
                          :{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)"}
                        )
                      }}>
                      <span className="text-base w-7 text-center flex-shrink-0 leading-none">{tab.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-bold leading-none transition-colors" style={{color:guideStep===i?tab.color:"rgba(255,255,255,0.65)"}}>{tab.label}</div>
                        <div className="text-[10px] text-white/30 mt-0.5 leading-snug truncate">{tab.desc.slice(0,52)}…</div>
                      </div>
                      {guideStep===i && (
                        <motion.div layoutId="guide-dot" className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{background:tab.color,boxShadow:`0 0 8px ${tab.color}`}}/>
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Close button */}
            <motion.button
              initial={{opacity:0,scale:0.8}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.8}}
              transition={{type:"spring",stiffness:400,damping:24,delay:0.15}}
              onClick={()=>{setPhoneExpanded(false);setGuideStep(0);}}
              className="absolute top-5 right-5 w-9 h-9 rounded-full flex items-center justify-center text-white/40 hover:text-white/80 transition-colors"
              style={{background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.10)"}}>
              ✕
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DesktopLogin({ onSuccess, onGuest }) {
  const [isLogin,setIsLogin]=useState(true);
  const [email,setEmail]=useState("");const [password,setPassword]=useState("");const [name,setName]=useState("");
  const [loading,setLoading]=useState(false);const [error,setError]=useState("");
  const [rememberMe,setRememberMe]=useState(false);const [showPassword,setShowPassword]=useState(false);

  const handleSubmit=async(e)=>{
    e.preventDefault();setError("");setLoading(true);
    try{
      if(!isLogin&&!name.trim())throw new Error("Name is required");
      const data=isLogin?await authAPI.login(email,password):await authAPI.signup(email,password,name);
      setAuthData(data.token,data.user,data.user.id,rememberMe);
      if(data.user.pfp)localStorage.setItem("selectedAvatar",data.user.pfp);
      onSuccess();
    }catch(err){
      const msg=err.message||"";
      if(msg==="Failed to fetch"||msg==="Load failed"){
        if(API_URL.includes("localhost")){
          setError("Backend server is not running. Start it with: cd backend && npm start");
        }else{
          setError("Server is waking up, please wait...");
          const up=await wakeUpServer();
          if(up){
            try{
              const data=isLogin?await authAPI.login(email,password):await authAPI.signup(email,password,name);
              setAuthData(data.token,data.user,data.user.id,rememberMe);
              if(data.user.pfp)localStorage.setItem("selectedAvatar",data.user.pfp);
              onSuccess();return;
            }catch(retryErr){setError(retryErr.message||"Something went wrong.");}
          }else{setError("Server unavailable, please try again later.");}
        }
      }else setError(msg||"Something went wrong.");
    }finally{setLoading(false);}
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-12 py-12 flex items-center gap-16 rounded-3xl"
      style={{ background:"linear-gradient(135deg,rgba(255,255,255,0.09) 0%,rgba(255,255,255,0.04) 100%)",border:"1px solid rgba(255,255,255,0.20)",backdropFilter:"blur(18px) saturate(160%)",WebkitBackdropFilter:"blur(18px) saturate(160%)",boxShadow:"0 4px 72px rgba(0,0,0,0.55),inset 0 1px 0 rgba(255,255,255,0.16)" }}>
      <div className="flex flex-1 flex-col gap-8 text-white">
        <div className="flex items-center gap-3">
          <img src="/icon.png" alt="Smart Split" className="h-11 w-11 rounded-2xl shadow-lg"/>
          <span className="text-base font-semibold tracking-tight text-white/60">Smart Split</span>
        </div>
        <div>
          <h1 className="text-[3.8rem] font-black leading-[1.05] tracking-tight">Split bills,<br/><span style={GRAD_STYLE}>not friendships.</span></h1>
          <p className="mt-4 text-white/45 text-[1.05rem] leading-relaxed max-w-[420px]">The smartest way to track shared expenses — automated splits, instant settlement, zero drama.</p>
        </div>
        <div className="space-y-3">
          {FEATURES.map(txt=>(
            <div key={txt} className="flex items-center gap-3">
              <div className="h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background:"linear-gradient(135deg,#ec4899,#f97316)" }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
              </div>
              <span className="text-white/55 text-sm">{txt}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="w-px self-stretch opacity-20" style={{ background:"linear-gradient(to bottom,transparent,rgba(255,255,255,0.6),transparent)" }}/>
      <div className="w-[400px] flex-shrink-0">
        <div className="rounded-3xl overflow-hidden shadow-2xl shadow-black/70" style={CARD_STYLE}>
          <div className="h-[3px]" style={{ background:"linear-gradient(90deg,#ec4899,#f97316)" }}/>
          <div className="p-7">
            <h2 className="text-xl font-bold text-white">{isLogin?"Welcome back":"Create account"}</h2>
            <p className="text-xs text-white/55 mt-1 mb-4">{isLogin?"Sign in to your Smart Split account":"Join Smart Split — it's free forever"}</p>
            <div className="flex p-1 mb-4 gap-1 rounded-2xl" style={{ background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.12)" }}>
              {[["Sign In",true],["Register",false]].map(([label,val])=>(
                <button key={label} onClick={()=>{setIsLogin(val);setError("");}} className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${isLogin===val?"bg-white text-gray-900 shadow-sm":"text-white/55 hover:text-white/80"}`}>{label}</button>
              ))}
            </div>
            {error&&<div className="mb-3 px-3 py-2.5 rounded-xl text-xs text-red-300 flex items-start gap-2" style={{ background:"rgba(239,68,68,0.12)",border:"1px solid rgba(239,68,68,0.22)" }}><span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1 flex-shrink-0"/>{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-3">
              {!isLogin&&<AuthInputDark icon={<FiUser size={15}/>} type="text" placeholder="Full name" value={name} onChange={e=>setName(e.target.value)} required/>}
              <AuthInputDark icon={<FiMail size={15}/>} type="email" placeholder="Email address" value={email} onChange={e=>setEmail(e.target.value)} required/>
              <AuthInputDark icon={<FiLock size={15}/>} type={showPassword?"text":"password"} placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={6}
                suffix={<button type="button" onMouseDown={e=>e.preventDefault()} onClick={()=>setShowPassword(p=>!p)} className="text-white/50 hover:text-white/80 transition" tabIndex={-1}>{showPassword?<FiEyeOff size={15}/>:<FiEye size={15}/>}</button>}
              />
              {isLogin&&<label className="flex items-center gap-2 cursor-pointer select-none"><input type="checkbox" checked={rememberMe} onChange={e=>setRememberMe(e.target.checked)} className="w-3.5 h-3.5 rounded accent-pink-500"/><span className="text-xs text-white/55">Keep me signed in</span></label>}
              <button type="submit" disabled={loading} className="w-full py-3 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50" style={{ background:"linear-gradient(135deg,#ec4899 0%,#f97316 100%)" }}>
                {loading?"Please wait…":<>{isLogin?"Sign In":"Create Account"}<FiArrowRight size={16}/></>}
              </button>
            </form>
            <div className="flex items-center gap-3 my-3"><div className="flex-1 h-px opacity-20 bg-white"/><span className="text-xs text-white/30">or</span><div className="flex-1 h-px opacity-20 bg-white"/></div>
            <button onClick={onGuest} className="w-full py-2.5 rounded-xl text-xs font-semibold text-white/50 hover:text-white/80 transition" style={{ background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)" }}>Continue as Guest 👀</button>
            <p className="mt-4 text-center text-xs text-white/50">{isLogin?"New to Smart Split?":"Already have an account?"}{" "}<button onClick={()=>{setIsLogin(v=>!v);setError("");}} className="text-white font-semibold hover:text-pink-300 transition-colors">{isLogin?"Create an account":"Sign in instead"}</button></p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   HOME — main orchestrator
═══════════════════════════════════════════════════════════════ */
export default function Home() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const hasSeenIntro = useRef(sessionStorage.getItem("smartsplit_intro_seen")==="1");
  const [phase,setPhase] = useState(hasSeenIntro.current?"splash":"intro");
  const [showGuide,setShowGuide] = useState(false);
  const isGuestRef = useRef(false);
  const [blobOrigin, setBlobOrigin] = useState(null);

  // Google sign-in directly from intro (skip onboarding)
  const handleIntroGoogleSuccess = async (tokenResponse) => {
    try {
      const data = await authAPI.googleAuth(tokenResponse.access_token);
      setAuthData(data.token, data.user, data.user.id, true);
      if (data.user.pfp) localStorage.setItem("selectedAvatar", data.user.pfp);
      sessionStorage.setItem("smartsplit_intro_seen","1");
      setPhase("blob_out");
      setTimeout(()=>{
        navigate(searchParams.get("redirect")||"/dashboard",{replace:true});
      },3800);
    } catch { /* fall through — user can still use normal login */ }
  };
  const googleSignIn = useGoogleLogin({
    onSuccess: handleIntroGoogleSuccess,
    onError: () => {},
  });

  // Splash → login after 1s
  useEffect(()=>{
    if(phase!=="splash")return;
    const t=setTimeout(()=>setPhase("login"),1000);
    return()=>clearTimeout(t);
  },[phase]);

  // Login/GetStarted button → blob_in → login
  // rect: DOMRect of the trigger button (for blob origin)
  const handleGetStarted=(guest=false, rect=null)=>{
    sessionStorage.setItem("smartsplit_intro_seen","1");
    isGuestRef.current=guest;
    if(rect) setBlobOrigin({ x: rect.left + rect.width/2, y: rect.top + rect.height/2 });
    setPhase("login");
  };

  // Auth success → blob_out → white phase → dashboard
  const handleAuthSuccess=()=>{
    setPhase("blob_out");
    setTimeout(()=>{
      if(isGuestRef.current){
        navigate("/dashboard",{replace:true});
        sessionStorage.setItem("smartsplit_show_guide","1");
      } else {
        navigate(searchParams.get("redirect")||"/dashboard",{replace:true});
      }
    },3800);
  };

  // Guest login from the login page — goes straight to dashboard (no loop)
  const handleGuestLogin=()=>{
    isGuestRef.current=true;
    handleAuthSuccess();
  };

  return (
    <div className="home-bg fixed inset-0 overflow-hidden" style={{ touchAction:phase==="intro"?"auto":"none" }}>
      {/* Background layers */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden>
        <TopoBackground/>
        <div className="home-dots absolute inset-0" style={{ zIndex:1 }}/>
        <div className="glow-1" style={{ position:"relative",zIndex:2 }}/>
        <div className="glow-2" style={{ position:"relative",zIndex:2 }}/>
        <div className="glow-3" style={{ position:"relative",zIndex:2 }}/>
      </div>

      <AnimatePresence mode="wait">
        {phase==="splash" && (
          <motion.div key="splash" className="relative z-10 h-full w-full flex flex-col items-center justify-center"
            initial={{ opacity:0,scale:0.85 }} animate={{ opacity:1,scale:1 }} exit={{ opacity:0,scale:1.1 }} transition={{ duration:0.5 }}>
            <div className="relative">
              <img src="/icon.png" alt="Smart Split" className="h-20 w-20 rounded-3xl shadow-2xl splash-logo relative z-10"/>
              <div className="ai-orb" style={{ width:100,height:100,top:-10,left:-10 }}/>
            </div>
            <h1 className="mt-5 text-2xl font-black text-white">Smart <span style={GRAD_STYLE}>Split</span></h1>
          </motion.div>
        )}

        {phase==="intro" && (
          <motion.div key="intro" className="relative z-10 h-full w-full"
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.12 }}>
            <div className="hidden lg:block h-full w-full">
              <DesktopIntro onGetStarted={()=>handleGetStarted(false)} onGoogleSignIn={googleSignIn}/>
            </div>
            <div className="lg:hidden h-full">
              <MobileOnboarding onGetStarted={(rect)=>handleGetStarted(false, rect)} onGoogleSignIn={googleSignIn}/>
            </div>
          </motion.div>
        )}

        {phase==="blob_in" && (
          <motion.div key="blob_in" className="fixed inset-0 z-50" initial={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.2 }}>
            <BlobTransition origin={blobOrigin} variant="in"/>
          </motion.div>
        )}

        {phase==="login" && (
          <motion.div key="login" className="relative z-10 h-full w-full overflow-hidden"
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.3 }}>
            <div className="hidden lg:flex h-full items-center justify-center">
              <DesktopLogin onSuccess={handleAuthSuccess} onGuest={handleGuestLogin}/>
            </div>
            <div className="lg:hidden h-full">
              <MobileLogin onSuccess={handleAuthSuccess} onGuest={handleGuestLogin}/>
            </div>
          </motion.div>
        )}

        {phase==="blob_out" && (
          <motion.div key="blob_out" className="fixed inset-0 z-50" initial={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.3 }}>
            <BlobTransition variant="out"/>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
