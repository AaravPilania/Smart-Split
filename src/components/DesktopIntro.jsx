import React, { useRef, useEffect, useState } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
} from "framer-motion";
import { FiArrowRight, FiChevronDown, FiCheck } from "react-icons/fi";
import PhoneMockup from "./PhoneMockup";

const GRADIENT_TEXT = {
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
const DesktopIntro = ({ onGetStarted }) => {
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
        </motion.div>
      </section>
    </div>
  );
};

export default DesktopIntro;
