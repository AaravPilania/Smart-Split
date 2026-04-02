import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FiMail, FiLock, FiUser, FiEye, FiEyeOff, FiArrowRight } from "react-icons/fi";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "framer-motion";
import { useGoogleLogin } from "@react-oauth/google";
import { setAuthData, authAPI, wakeUpServer } from "../utils/api";
import MobileOnboarding from "../components/MobileOnboarding";
import OnboardingGuide from "../components/OnboardingGuide";

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
          duration: variant === "out" ? 2.2 : 0.3,
          ease: [0.22, 1, 0.36, 1],
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
        wakeUpServer(); setError("Server is starting up, please try again.");
      } else setError(msg || "Something went wrong.");
    } finally { setLoading(false); }
  };

  return (
    <motion.div
      className="h-full w-full overflow-y-auto flex flex-col login-anim-bg"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
    >
      <div className="flex flex-col items-center px-8 pt-16 pb-10 w-full max-w-sm mx-auto">

        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
          className="w-14 h-14 rounded-[18px] flex items-center justify-center text-2xl font-black text-white mb-6"
          style={{ background: "linear-gradient(145deg, #ec4899, #f97316)" }}
        >
          ₹
        </motion.div>

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

function DesktopIntro({ onGetStarted, onGoogleSignIn }) {
  return (
    <div className="flex flex-col items-center justify-center gap-8 text-white text-center max-w-2xl px-8">
      <img src="/icon.png" alt="Smart Split" className="h-20 w-20 rounded-3xl shadow-2xl" />
      <h1 className="text-6xl font-black leading-[1.05] tracking-tight">
        Split bills,<br/><span style={GRAD_STYLE}>not friendships.</span>
      </h1>
      <p className="text-white/45 text-lg max-w-lg">The smartest way to track shared expenses — automated splits, instant settlement, zero drama.</p>
      <div className="flex flex-wrap justify-center gap-3">
        {FEATURES.map(f=>(
          <span key={f} className="px-4 py-2 rounded-xl text-sm text-white/65" style={{ background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.12)" }}>{f}</span>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <motion.button onClick={onGetStarted} whileTap={{ scale:0.97 }}
          className="px-10 py-4 rounded-2xl text-white font-black text-base"
          style={{ background:"linear-gradient(135deg,#ec4899,#f97316)",boxShadow:"0 8px 32px rgba(236,72,153,0.45)" }}>
          Get Started →
        </motion.button>
        {onGoogleSignIn && (
          <motion.button onClick={()=>onGoogleSignIn()} whileTap={{ scale:0.95 }}
            className="flex items-center gap-2 px-5 py-3.5 rounded-2xl text-sm font-semibold"
            style={{ background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",color:"rgba(255,255,255,0.75)",backdropFilter:"blur(12px)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09a7.12 7.12 0 010-4.17V7.07H2.18A11.97 11.97 0 001 12c0 1.94.46 3.77 1.18 5.43l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.09 14.97 0 12 0 7.7 0 3.99 2.47 2.18 6.07l3.66 2.85c.87-2.6 3.3-4.17 6.16-4.17z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </motion.button>
        )}
      </div>
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
      if(msg==="Failed to fetch"||msg==="Load failed"){wakeUpServer();setError("Server is starting up, please try again.");}
      else setError(msg||"Something went wrong.");
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
    setPhase("blob_in");
    setTimeout(()=>setPhase("login"),350);
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
            <div className="hidden lg:flex h-full items-center justify-center">
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