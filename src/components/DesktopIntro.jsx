import React, { useRef, useEffect, useState } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
} from "framer-motion";
import { FiArrowRight, FiChevronDown, FiCheck, FiZap, FiUsers, FiCamera, FiShield } from "react-icons/fi";
import PhoneMockup from "./PhoneMockup";

const GRADIENT_TEXT = {
  background: "linear-gradient(90deg, #f472b6 0%, #c084fc 45%, #fb923c 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
};

const GLASS_DARK = {
  background: "linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)",
  border: "1px solid rgba(255,255,255,0.10)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)",
};

/* ── Magnetic CTA button ── */
const MagneticButton = ({ children, onClick, className = "", style: passedStyle }) => {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 250, damping: 20 });
  const sy = useSpring(y, { stiffness: 250, damping: 20 });
  const handleMouse = (e) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set((e.clientX - (rect.left + rect.width / 2)) * 0.25);
    y.set((e.clientY - (rect.top + rect.height / 2)) * 0.25);
  };
  const reset = () => { x.set(0); y.set(0); };
  return (
    <motion.button
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      onClick={onClick}
      style={{ x: sx, y: sy, ...passedStyle }}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      className={className}
    >
      {children}
    </motion.button>
  );
};

/* ── Floating card that drifts gently ── */
const FloatCard = ({ children, style, delay = 0, tilt = 0, driftY = 8 }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.85, y: 16 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
    style={{
      position: "absolute",
      borderRadius: 16,
      padding: "12px 16px",
      background: "rgba(14, 14, 26, 0.88)",
      border: "1px solid rgba(255,255,255,0.12)",
      backdropFilter: "blur(24px)",
      WebkitBackdropFilter: "blur(24px)",
      boxShadow: "0 16px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)",
      rotate: `${tilt}deg`,
      ...style,
    }}
  >
    <motion.div
      animate={{ y: [0, -driftY, 0] }}
      transition={{ duration: 3.5 + delay * 0.4, repeat: Infinity, ease: "easeInOut" }}
    >
      {children}
    </motion.div>
  </motion.div>
);

/* ── Phone dashboard mockup ── */
const DashboardMockup = () => {
  const expenses = [
    { label: "Dinner 🍕", group: "Weekend Trip", amount: "₹840", who: "A", color: "#ec4899" },
    { label: "Cab Ride 🚗", group: "College Gang", amount: "₹320", who: "S", color: "#a855f7" },
    { label: "Groceries 🛒", group: "Flatmates", amount: "₹1,200", who: "J", color: "#f97316" },
  ];
  return (
    <PhoneMockup className="w-52">
      <div className="p-3 space-y-2.5" style={{ minHeight: 280 }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <div>
            <div className="text-[9px] text-white/40 font-medium">Good evening</div>
            <div className="text-[11px] text-white font-bold">Hey, Aarav 👋</div>
          </div>
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
            style={{ background: "linear-gradient(135deg,#ec4899,#f97316)" }}>A</div>
        </div>
        {/* Balance card */}
        <div className="rounded-xl p-2.5" style={{ background: "linear-gradient(135deg,#ec4899,#a855f7 50%,#f97316)", boxShadow: "0 4px 16px rgba(236,72,153,0.35)" }}>
          <div className="text-[8px] text-white/70 font-medium">You're owed</div>
          <div className="text-lg font-black text-white font-mono">₹2,360</div>
          <div className="flex gap-1.5 mt-1">
            {["A","S","J"].map((l, i) => (
              <div key={i} className="w-4 h-4 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-[7px] font-bold text-white">{l}</div>
            ))}
            <div className="text-[7px] text-white/60 ml-0.5 self-center">+3 groups</div>
          </div>
        </div>
        {/* Recent expenses */}
        <div className="text-[8px] text-white/40 font-semibold uppercase tracking-wide px-0.5">Recent</div>
        {expenses.map((e, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
            className="flex items-center gap-2"
          >
            <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[8px] font-bold text-white flex-shrink-0"
              style={{ background: e.color + "33", border: `1px solid ${e.color}44` }}>
              {e.who}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[9px] text-white/80 font-semibold truncate">{e.label}</div>
              <div className="text-[7px] text-white/35 truncate">{e.group}</div>
            </div>
            <div className="text-[9px] font-bold" style={{ color: e.color }}>{e.amount}</div>
          </motion.div>
        ))}
      </div>
    </PhoneMockup>
  );
};

/* ── Feature pill badge ── */
const FeaturePill = ({ icon, text }) => (
  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.55)" }}>
    {icon}<span>{text}</span>
  </div>
);

/* ── Stat card (Ponster-inspired) ── */
const StatCard = ({ label, value, delta, color = "#ec4899", icon, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay, ease: "easeOut" }}
    viewport={{ once: true, margin: "-30px" }}
    className="flex flex-col gap-2 p-5 rounded-2xl"
    style={GLASS_DARK}
  >
    <div className="flex items-center justify-between">
      <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">{label}</span>
      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base" style={{ background: color + "22", color }}>{icon}</div>
    </div>
    <div className="text-2xl font-black text-white font-mono">{value}</div>
    {delta && <div className="text-[11px] font-semibold" style={{ color: delta.startsWith("+") ? "#22c55e" : "#ef4444" }}>{delta} this month</div>}
  </motion.div>
);

/* ── Feature row card ── */
const FeatureRow = ({ icon, title, desc, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    whileInView={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.4, delay, ease: "easeOut" }}
    viewport={{ once: true, margin: "-30px" }}
    className="flex items-start gap-4 p-5 rounded-2xl"
    style={GLASS_DARK}
  >
    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
      style={{ background: "linear-gradient(135deg,rgba(236,72,153,0.18),rgba(168,85,247,0.18))", border: "1px solid rgba(255,255,255,0.08)" }}>
      {icon}
    </div>
    <div>
      <div className="text-sm font-bold text-white">{title}</div>
      <div className="text-xs text-white/40 mt-0.5 leading-relaxed">{desc}</div>
    </div>
  </motion.div>
);

/* ═══════════════════════════════════════════
   DesktopIntro — redesigned SaaS landing
   ═══════════════════════════════════════════ */
const DesktopIntro = ({ onGetStarted, onGoogleSignIn }) => {
  const scrollRef = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setInView(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const scrollToFeatures = () => {
    scrollRef.current?.querySelector("#intro-features")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div ref={scrollRef} className="intro-scroll h-full w-full">
      <div className="intro-grain" style={{ position: "fixed" }} />

      {/* ══ SECTION 1: Hero ══ */}
      <section className="intro-section flex flex-col relative overflow-hidden">

        {/* Navbar */}
        <nav className="flex items-center justify-between px-12 pt-8 relative z-10">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img src="/icon.png" alt="Smart Split" className="h-9 w-9 rounded-xl shadow-lg relative z-10" />
              <div className="ai-orb" />
            </div>
            <span className="text-base font-bold text-white/80 tracking-tight">Smart Split</span>
          </div>
          <div className="hidden xl:flex items-center gap-8 text-sm text-white/45 font-medium">
            <button className="hover:text-white/80 transition-colors" onClick={scrollToFeatures}>Features</button>
            <span className="text-white/20">·</span>
            <button className="hover:text-white/80 transition-colors" onClick={() => scrollRef.current?.querySelector("#intro-cta")?.scrollIntoView({ behavior: "smooth" })}>Pricing</button>
          </div>
          <button
            onClick={onGetStarted}
            className="px-5 py-2 rounded-xl text-sm font-bold text-white transition-all hover:scale-105 active:scale-95"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
          >
            Sign in →
          </button>
        </nav>

        {/* Hero content — Pathio-style: centered headline above large centered phone */}
        <div className="flex-1 flex flex-col items-center justify-start pt-4 pb-2 px-8 w-full overflow-hidden">

          {/* ── Centered text + CTA ── */}
          <div className="flex flex-col items-center text-center max-w-2xl">

            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4 }}
              className="mb-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ background: "rgba(236,72,153,0.12)", border: "1px solid rgba(236,72,153,0.25)", color: "#f472b6" }}
            >
              <FiZap size={11} /> AI-powered bill splitting
            </motion.div>

            <motion.h1
              className="text-[3.6rem] xl:text-[4.6rem] font-black leading-[1.05] tracking-tight text-white"
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.06, ease: "easeOut" }}
            >
              Split bills,{" "}
              <span style={GRADIENT_TEXT}>not friendships.</span>
            </motion.h1>

            <motion.p
              className="mt-4 text-white/40 text-[0.95rem] leading-relaxed max-w-md"
              initial={{ opacity: 0, y: 12 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.16, ease: "easeOut" }}
            >
              Scan receipts instantly. Split with groups. Settle debts in one tap —
              no more awkward money conversations.
            </motion.p>

            {/* CTA row */}
            <motion.div
              className="mt-7 flex items-center gap-3 justify-center flex-wrap"
              initial={{ opacity: 0, y: 12 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.24, ease: "easeOut" }}
            >
              <MagneticButton
                onClick={onGetStarted}
                className="px-7 py-3.5 rounded-2xl text-white text-sm font-bold shadow-xl flex items-center gap-2"
                style={{ background: "linear-gradient(135deg, #ec4899 0%, #a855f7 50%, #f97316 100%)" }}
              >
                Get Started Free <FiArrowRight size={15} />
              </MagneticButton>

              {onGoogleSignIn && (
                <button
                  onClick={() => onGoogleSignIn()}
                  className="flex items-center gap-2 px-5 py-3.5 rounded-2xl text-sm font-semibold transition-all hover:scale-105 active:scale-95"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.65)" }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09a7.12 7.12 0 010-4.17V7.07H2.18A11.97 11.97 0 001 12c0 1.94.46 3.77 1.18 5.43l3.66-2.84z" fill="#FBBC05"/>
                    <path d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.09 14.97 0 12 0 7.7 0 3.99 2.47 2.18 6.07l3.66 2.85c.87-2.6 3.3-4.17 6.16-4.17z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
                </button>
              )}
            </motion.div>

            {/* Social proof */}
            <motion.div
              className="mt-5 flex items-center gap-3 text-white/30 text-xs justify-center"
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.4, delay: 0.34 }}
            >
              <div className="flex">
                {["#ec4899","#a855f7","#f97316","#06b6d4","#22c55e"].map((c, i) => (
                  <div key={i} className="w-6 h-6 rounded-full border-2 border-[#0c0e1a] -ml-1.5 first:ml-0"
                    style={{ background: c, boxShadow: "0 2px 8px rgba(0,0,0,0.4)" }} />
                ))}
              </div>
              <span><strong className="text-white/50">1,200+</strong> splits tracked this month</span>
              <span className="text-white/15">·</span>
              <FiCheck size={11} className="text-green-400" />
              <span>Free forever</span>
            </motion.div>
          </div>

          {/* ── Large centered phone + floating cards ── */}
          <motion.div
            className="relative flex-shrink-0 mt-8"
            style={{ width: "100%", maxWidth: 900, height: 460 }}
            initial={{ opacity: 0, y: 32 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Glow behind phone */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div style={{ width: 340, height: 340, borderRadius: "50%", background: "radial-gradient(circle, rgba(168,85,247,0.20) 0%, transparent 70%)", filter: "blur(60px)" }} />
            </div>

            {/* Large phone centered — scaled up 1.32× for prominence */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ zIndex: 2 }}>
              <motion.div
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
                style={{ transformOrigin: "center bottom", scale: 1.32 }}
              >
                <DashboardMockup />
              </motion.div>
            </div>

            {/* Float card: You're owed (top-left) */}
            <FloatCard style={{ top: 18, left: "4%", width: 168 }} delay={0.5} tilt={-5} driftY={6}>
              <div className="text-[9px] text-white/40 font-medium mb-1">You're owed</div>
              <div className="text-[1.3rem] font-black text-white font-mono leading-none">₹2,360</div>
              <div className="flex items-center gap-1 mt-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                <span className="text-[9px] text-green-400 font-semibold">3 pending</span>
              </div>
            </FloatCard>

            {/* Float card: Monthly Insight (top-right) */}
            <FloatCard style={{ top: 10, right: "4%", width: 172 }} delay={0.65} tilt={5} driftY={7}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className="w-4 h-4 rounded flex items-center justify-center text-[9px]" style={{ background: "rgba(168,85,247,0.25)" }}>📊</div>
                <span className="text-[9px] text-white/50 font-semibold">Monthly Insight</span>
              </div>
              <div className="text-[10px] text-white font-bold leading-snug">You're 12% under<br/>last month's spending</div>
              <div className="mt-1.5 px-2 py-0.5 rounded-full text-[8px] font-bold inline-block" style={{ background: "rgba(34,197,94,0.15)", color: "#4ade80" }}>↓ Saving more ✓</div>
            </FloatCard>

            {/* Float card: AI Scanned (bottom-left) */}
            <FloatCard style={{ bottom: 38, left: "5%", width: 165 }} delay={0.8} tilt={-4} driftY={9}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className="w-4 h-4 rounded flex items-center justify-center text-[9px]" style={{ background: "rgba(236,72,153,0.2)" }}>⚡</div>
                <span className="text-[9px] text-white/50 font-semibold">AI Scanned</span>
              </div>
              <div className="text-[10px] text-white font-bold">Domino's Pizza</div>
              <div className="text-[9px] text-white/40">₹840 · 4 people split</div>
              <div className="mt-1.5 px-2 py-0.5 rounded-full text-[8px] font-bold inline-block" style={{ background: "rgba(34,197,94,0.15)", color: "#4ade80" }}>Auto-split ✓</div>
            </FloatCard>

            {/* Float card: Weekend Trip group (bottom-right) */}
            <FloatCard style={{ bottom: 30, right: "4%", width: 160 }} delay={0.95} tilt={4} driftY={8}>
              <div className="text-[9px] text-white/40 font-medium mb-1">Weekend Trip</div>
              <div className="flex items-center gap-1 mb-1.5">
                {["#ec4899","#a855f7","#f97316","#06b6d4"].map((c, i) => (
                  <div key={i} className="w-5 h-5 rounded-full border-2 flex items-center justify-center text-[7px] font-bold text-white"
                    style={{ background: c, borderColor: "rgba(14,14,26,0.9)" }}>
                    {["A","S","J","K"][i]}
                  </div>
                ))}
              </div>
              <div className="text-[12px] font-black text-white font-mono">₹12,400</div>
              <div className="text-[8px] text-white/35">total · 4 members</div>
            </FloatCard>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/25 z-10"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          onClick={scrollToFeatures}
          style={{ cursor: "pointer" }}
        >
          <span className="text-[9px] uppercase tracking-widest font-medium">Scroll</span>
          <FiChevronDown size={16} />
        </motion.div>
      </section>

      {/* ══ SECTION 2: Features ══ */}
      <section id="intro-features" className="intro-section flex flex-col items-center justify-center relative overflow-hidden px-12">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full" style={{ background: "radial-gradient(circle, rgba(236,72,153,0.06) 0%, transparent 65%)", filter: "blur(80px)" }} />
          <div className="absolute bottom-1/4 -right-20 w-96 h-96 rounded-full" style={{ background: "radial-gradient(circle, rgba(249,115,22,0.05) 0%, transparent 65%)", filter: "blur(80px)" }} />
        </div>

        <div className="max-w-6xl w-full relative z-10">
          {/* Section header */}
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4"
              style={{ background: "rgba(168,85,247,0.12)", border: "1px solid rgba(168,85,247,0.25)", color: "#c084fc" }}>
              <FiZap size={10} /> Everything you need
            </div>
            <h2 className="text-4xl font-black text-white">Built for real friend groups.</h2>
            <p className="mt-3 text-white/35 text-sm max-w-md mx-auto leading-relaxed">
              From late-night takeout to month-long trips — Smart Split handles every situation.
            </p>
          </motion.div>

          {/* Stats row (Ponster-inspired) */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <StatCard label="Total Splits" value="₹1,28,400" delta="+24%" color="#ec4899" icon="💸" delay={0} />
            <StatCard label="Groups Active" value="12" delta="+3" color="#a855f7" icon="👥" delay={0.1} />
            <StatCard label="Time Saved" value="8.4 hrs" delta="+2.1h" color="#f97316" icon="⚡" delay={0.2} />
          </div>

          {/* Feature rows (2 col) */}
          <div className="grid grid-cols-2 gap-4">
            <FeatureRow icon={<FiCamera size={18} className="text-pink-400" />} title="Scan Any Receipt" desc="Point your camera and AI extracts every line item instantly. No typing, no mistakes." delay={0} />
            <FeatureRow icon={<FiUsers size={18} className="text-purple-400" />} title="Smart Group Splits" desc="Equal, percentage, or custom amounts per person. Works for any group size." delay={0.1} />
            <FeatureRow icon="💳" title="One-Tap UPI Settle" desc="Send money directly via GPay, PhonePe, or Paytm. The debt disappears instantly." delay={0.2} />
            <FeatureRow icon={<FiShield size={18} className="text-orange-400" />} title="AI-Powered Insights" desc="Category breakdowns, monthly trends, and smart suggestions from your spend history." delay={0.3} />
          </div>
        </div>
      </section>

      {/* ══ SECTION 3: CTA ══ */}
      <section id="intro-cta" className="intro-section flex flex-col items-center justify-center text-center px-8 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full" style={{ background: "radial-gradient(circle, rgba(168,85,247,0.08) 0%, transparent 65%)", filter: "blur(80px)" }} />
        </div>
        <div className="ai-orb-large" />

        <motion.div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6"
          style={{ background: "rgba(34,197,94,0.10)", border: "1px solid rgba(34,197,94,0.2)", color: "#4ade80" }}
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          viewport={{ once: true }}
        >
          <FiCheck size={10} /> Free forever — no credit card
        </motion.div>

        <motion.h2
          className="text-[3.8rem] font-black text-white leading-tight"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          viewport={{ once: true }}
        >
          Ready to split
          <br />
          <span style={GRADIENT_TEXT}>smarter?</span>
        </motion.h2>

        <motion.p
          className="mt-5 text-white/30 text-sm italic max-w-sm leading-relaxed"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          viewport={{ once: true }}
        >
          "Finally I don't have to be the group's calculator."
          <span className="not-italic block mt-1 text-white/20">— Every friend group, ever</span>
        </motion.p>

        <motion.div
          className="mt-10 flex items-center gap-3"
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.18 }}
          viewport={{ once: true }}
        >
          <MagneticButton
            onClick={onGetStarted}
            className="px-10 py-4 rounded-2xl text-white text-base font-bold shadow-2xl flex items-center gap-2"
            style={{ background: "linear-gradient(135deg, #ec4899 0%, #a855f7 50%, #f97316 100%)" }}
          >
            Get Started Free <FiArrowRight size={18} />
          </MagneticButton>
          {onGoogleSignIn && (
            <button
              onClick={() => onGoogleSignIn()}
              className="flex items-center gap-2 px-6 py-4 rounded-2xl text-sm font-semibold transition-all hover:scale-105 active:scale-95"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.65)" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09a7.12 7.12 0 010-4.17V7.07H2.18A11.97 11.97 0 001 12c0 1.94.46 3.77 1.18 5.43l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.09 14.97 0 12 0 7.7 0 3.99 2.47 2.18 6.07l3.66 2.85c.87-2.6 3.3-4.17 6.16-4.17z" fill="#EA4335"/>
              </svg>
              Sign in with Google
            </button>
          )}
        </motion.div>
      </section>
    </div>
  );
};

export default DesktopIntro;

  background: "linear-gradient(90deg, #f472b6 0%, #c084fc 45%, #fb923c 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
};

const GLASS = {
  background:
    "linear-gradient(135deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.04) 100%)",
  border: "1px solid rgba(255,255,255,0.18)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  boxShadow:
    "0 8px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.14)",
};

/* ── Magnetic CTA button ── */
const MagneticButton = ({ children, onClick, className = "", style: passedStyle }) => {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 250, damping: 20 });
  const sy = useSpring(y, { stiffness: 250, damping: 20 });

  const handleMouse = (e) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    x.set((e.clientX - cx) * 0.25);
    y.set((e.clientY - cy) * 0.25);
  };
  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.button
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      onClick={onClick}
      style={{ x: sx, y: sy, ...passedStyle }}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      className={className}
    >
      {children}
    </motion.button>
  );
};

/* ── Interactive scan receipt mockup ── */
const ScanMockup = () => {
  const lines = [
    { label: "Margherita Pizza", price: "$14.99" },
    { label: "Pad Thai", price: "$12.50" },
    { label: "Tiramisu", price: "$8.99" },
    { label: "Tax + Tip", price: "$9.22" },
  ];

  return (
    <PhoneMockup className="w-36">
      <div className="relative p-3 space-y-2 overflow-hidden" style={{ height: 170 }}>
        <div className="text-center text-[9px] text-white/50 font-mono mb-2">
          <div className="text-white/70 font-bold text-[10px]">
            The Italian Place
          </div>
          <div>Order #4821</div>
        </div>
        {lines.map((line, i) => (
          <div key={i} className="scan-receipt-line flex justify-between text-[8px] font-mono" style={{ animationDelay: `${(i * 0.35)}s` }}>
            <span className="text-white/80">{line.label}</span>
            <span className="text-white/50">{line.price}</span>
          </div>
        ))}
        <div className="scan-bar" />
      </div>
    </PhoneMockup>
  );
};

/* ── Group splits mockup ── */
const GroupMockup = () => {
  const people = [
    { name: "Alex", color: "#ec4899", amount: "$12.50" },
    { name: "Sam", color: "#a855f7", amount: "$18.75" },
    { name: "Jo", color: "#f97316", amount: "$9.25" },
  ];

  return (
    <PhoneMockup className="w-36">
      <div className="p-3 space-y-2.5" style={{ height: 170 }}>
        <div className="text-[10px] text-white/60 font-semibold text-center mb-2">
          Friday Dinner
        </div>
        {people.map((p, i) => (
          <motion.div
            key={p.name}
            initial={{ opacity: 0, x: -14 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.08 + i * 0.1, type: "spring", stiffness: 350, damping: 22 }}
            viewport={{ once: true, margin: "-20px" }}
            className="flex items-center gap-2.5"
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
              style={{ background: p.color }}
            >
              {p.name[0]}
            </div>
            <div className="flex-1">
              <div className="text-[9px] text-white/80 font-medium">{p.name}</div>
              <div className="h-[3px] rounded-full mt-0.5" style={{ width: `${50 + i * 20}%`, background: p.color, opacity: 0.5 }} />
            </div>
            <span className="text-[10px] text-white/70 font-mono font-semibold">{p.amount}</span>
          </motion.div>
        ))}
        <div className="border-t border-white/10 pt-2 mt-2 flex justify-between text-[9px] text-white/50">
          <span>Total</span>
          <span className="text-white/80 font-bold">$40.50</span>
        </div>
      </div>
    </PhoneMockup>
  );
};

/* ── Settle up mockup with animated checkmark ── */
const SettleMockup = () => (
  <PhoneMockup className="w-36">
    <div className="p-3 flex flex-col items-center justify-center gap-2.5" style={{ height: 170 }}>
      <div className="text-[10px] text-white/50 font-medium">Payment to Alex</div>
      <div className="text-2xl font-black text-white font-mono">$12.50</div>
      {/* Animated checkmark circle */}
      <div className="settle-check-circle">
        <svg width="48" height="48" viewBox="0 0 48 48">
          <circle
            cx="24" cy="24" r="20"
            fill="none"
            stroke="url(#checkGrad)"
            strokeWidth="2.5"
            className="settle-circle-draw"
          />
          <path
            d="M15 24 L21 30 L33 18"
            fill="none"
            stroke="url(#checkGrad)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="settle-check-draw"
          />
          <defs>
            <linearGradient id="checkGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#f97316" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div className="text-[11px] font-bold text-white/80">Settled!</div>
      {/* Mini confetti dots */}
      <div className="settle-confetti">
        {Array.from({ length: 6 }).map((_, i) => (
          <span key={i} className="settle-dot" />
        ))}
      </div>
    </div>
  </PhoneMockup>
);

/* ── Feature card ── */
const FeatureCard = ({ title, desc, children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 30, scale: 0.97 }}
    whileInView={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.4, delay, ease: "easeOut" }}
    viewport={{ once: true, margin: "-40px" }}
    className="flex flex-col items-center gap-4 p-6 rounded-3xl text-center"
    style={GLASS}
  >
    <h3 className="text-lg font-bold text-white">{title}</h3>
    <p className="text-sm text-white/50 leading-relaxed max-w-[260px]">{desc}</p>
    <div className="mt-1">{children}</div>
  </motion.div>
);

/* ═══════════════════════════════════════════
   DesktopIntro — 3 scroll-snap sections
   ═══════════════════════════════════════════ */
const DesktopIntro = ({ onGetStarted, onGoogleSignIn }) => {
  const scrollRef = useRef(null);
  const [inView, setInView] = useState(false);

  // Entrance trigger
  useEffect(() => {
    const id = requestAnimationFrame(() => setInView(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const scrollToFeatures = () => {
    const el = scrollRef.current?.querySelector("#intro-features");
    el?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div ref={scrollRef} className="intro-scroll h-full w-full">
      {/* Grain overlay covering all sections */}
      <div className="intro-grain" style={{ position: "fixed" }} />

      {/* ── SECTION 1: Hero ── */}
      <section className="intro-section flex flex-col relative">
        {/* Ambient gradient glows */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full" style={{ background: "radial-gradient(circle, rgba(236,72,153,0.07) 0%, transparent 65%)", filter: "blur(80px)" }} />
          <div className="absolute -bottom-32 -right-32 w-[400px] h-[400px] rounded-full" style={{ background: "radial-gradient(circle, rgba(249,115,22,0.05) 0%, transparent 65%)", filter: "blur(80px)" }} />
        </div>
        {/* Top bar */}
        <div className="flex items-center px-12 pt-8">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img src="/icon.png" alt="Smart Split" className="h-10 w-10 rounded-xl shadow-lg relative z-10" />
              <div className="ai-orb" />
            </div>
            <span className="text-sm font-semibold text-white/60 tracking-tight">Smart Split</span>
          </div>
        </div>

        {/* Hero center */}
        <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
          <motion.h1
            className="text-[4.5rem] font-black leading-[1.05] tracking-tight text-white"
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.45, ease: "easeOut" }}
          >
            Stop doing math
            <br />
            <span style={GRADIENT_TEXT}>at dinner.</span>
          </motion.h1>

          <motion.p
            className="mt-5 text-white/45 text-lg max-w-[520px] leading-relaxed"
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.45, delay: 0.1, ease: "easeOut" }}
          >
            AI-powered bill splitting that keeps your friendships intact. 
            Scan receipts, split with groups, settle in one tap.
          </motion.p>

          <motion.div
            className="mt-8 flex items-center gap-4"
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.45, delay: 0.2, ease: "easeOut" }}
          >
            <MagneticButton
              onClick={scrollToFeatures}
              className="px-8 py-3.5 rounded-2xl text-white text-sm font-bold shadow-lg flex items-center gap-2"
              style={{
                background: "linear-gradient(135deg, #ec4899 0%, #a855f7 50%, #f97316 100%)",
              }}
            >
              Try Smart Split <FiArrowRight size={16} />
            </MagneticButton>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/30"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <span className="text-[10px] uppercase tracking-widest font-medium">Scroll</span>
          <FiChevronDown size={18} />
        </motion.div>
      </section>

      {/* ── SECTION 2: Features ── */}
      <section id="intro-features" className="intro-section flex flex-col items-center justify-center relative overflow-hidden">
        {/* Ambient gradient glows — pink → purple → amber */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full" style={{ background: "radial-gradient(circle, rgba(236,72,153,0.08) 0%, transparent 65%)", filter: "blur(80px)" }} />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full" style={{ background: "radial-gradient(circle, rgba(168,85,247,0.06) 0%, transparent 65%)", filter: "blur(70px)" }} />
          <div className="absolute bottom-1/4 -right-20 w-96 h-96 rounded-full" style={{ background: "radial-gradient(circle, rgba(249,115,22,0.07) 0%, transparent 65%)", filter: "blur(80px)" }} />
        </div>

        <motion.h2
          className="text-3xl font-black text-white mb-10 relative z-10"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          viewport={{ once: true }}
        >
          Everything you need.
        </motion.h2>

        <div className="grid grid-cols-3 gap-6 max-w-5xl px-12 relative z-10">
          <FeatureCard

            title="Scan Receipts"
            desc="Point your camera, snap, done. AI reads every line item automatically."
            delay={0}
          >
            <ScanMockup />
          </FeatureCard>

          <FeatureCard
            title="Group Splits"
            desc="Equal, percentage, or item-by-item — split it however makes sense."
            delay={0.12}
          >
            <GroupMockup />
          </FeatureCard>

          <FeatureCard
            title="Settle Instantly"
            desc="One tap sends the money. No more 'I'll get you next time' excuses."
            delay={0.24}
          >
            <SettleMockup />
          </FeatureCard>
        </div>
      </section>

      {/* ── SECTION 3: CTA ── */}
      <section className="intro-section flex flex-col items-center justify-center text-center px-8 relative overflow-hidden">
        {/* Ambient gradient glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 -left-20 w-80 h-80 rounded-full" style={{ background: "radial-gradient(circle, rgba(249,115,22,0.06) 0%, transparent 65%)", filter: "blur(70px)" }} />
          <div className="absolute bottom-1/3 -right-20 w-80 h-80 rounded-full" style={{ background: "radial-gradient(circle, rgba(236,72,153,0.06) 0%, transparent 65%)", filter: "blur(70px)" }} />
        </div>
        <div className="ai-orb-large" />

        <motion.h2
          className="text-[3.5rem] font-black text-white leading-tight"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          viewport={{ once: true }}
        >
          Ready to split
          <br />
          <span style={GRADIENT_TEXT}>smarter?</span>
        </motion.h2>

        <motion.p
          className="mt-6 text-white/35 text-base italic max-w-md leading-relaxed"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
          viewport={{ once: true }}
        >
          "Finally, I don't have to be the 'math guy' of the group."
          <span className="not-italic block mt-1 text-white/25">— Everyone</span>
        </motion.p>

        <motion.p
          className="mt-5 text-white/40 text-sm flex items-center gap-2"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          viewport={{ once: true }}
        >
          <FiCheck size={14} className="text-green-400" /> Free forever. No credit card needed.
        </motion.p>

        <motion.div
          className="mt-10"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <MagneticButton
            onClick={onGetStarted}
            className="px-10 py-4 rounded-2xl text-white text-base font-bold shadow-xl flex items-center gap-2"
            style={{
              background: "linear-gradient(135deg, #ec4899 0%, #a855f7 50%, #f97316 100%)",
            }}
          >
            Get Started <FiArrowRight size={18} />
          </MagneticButton>
          {onGoogleSignIn && (
            <button
              onClick={() => onGoogleSignIn()}
              className="ml-3 flex items-center gap-2 px-5 py-3.5 rounded-2xl text-sm font-semibold transition-all active:scale-95"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "rgba(255,255,255,0.75)",
                backdropFilter: "blur(12px)",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09a7.12 7.12 0 010-4.17V7.07H2.18A11.97 11.97 0 001 12c0 1.94.46 3.77 1.18 5.43l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.09 14.97 0 12 0 7.7 0 3.99 2.47 2.18 6.07l3.66 2.85c.87-2.6 3.3-4.17 6.16-4.17z" fill="#EA4335"/>
              </svg>
              Sign in with Google
            </button>
          )}
        </motion.div>
      </section>
    </div>
  );
};

export default DesktopIntro;
