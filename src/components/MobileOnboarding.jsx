import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiArrowRight, FiCheck } from "react-icons/fi";
import PhoneMockup from "./PhoneMockup";

const GRADIENT_TEXT = {
  background: "linear-gradient(90deg, #f472b6 0%, #c084fc 45%, #fb923c 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
};

/* ── Slide content components ── */

const WelcomeSlide = ({ onGetStarted }) => (
  <div className="flex flex-col items-center justify-center text-center px-8 h-full gap-6 relative">
    <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(168,85,247,0.1) 0%, transparent 65%)", filter: "blur(60px)" }} />

    <div className="relative">
      <img src="/icon.png" alt="Smart Split" className="h-24 w-24 rounded-3xl shadow-2xl relative z-10" />
      <div className="ai-orb" style={{ width: 120, height: 120, top: -12, left: -12 }} />
    </div>
    <h1 className="text-[2.1rem] font-black text-white leading-tight mt-2">
      Stop doing math
      <br />
      <span style={GRADIENT_TEXT}>at dinner.</span>
    </h1>
    <p className="text-base text-white/45 max-w-[280px] leading-relaxed">
      AI-powered bill splitting for the real world.
    </p>
    <button
      onClick={onGetStarted}
      className="mt-2 text-sm text-white/35 hover:text-white/60 transition-colors flex items-center gap-1.5"
    >
      Already a member? <span className="text-white/55 font-semibold">Log in <FiArrowRight className="inline" size={12} /></span>
    </button>
  </div>
);

const ScanSlide = () => {
  const items = [
    { label: "Margherita Pizza", price: "$14.99" },
    { label: "Pad Thai", price: "$12.50" },
    { label: "Tiramisu", price: "$8.99" },
    { label: "Tax + Tip", price: "$9.22" },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center gap-6 relative">
      <h2 className="text-xl font-bold text-white">Scan any receipt</h2>

      <PhoneMockup className="w-[160px] md:w-[300px] shadow-[0_40px_90px_rgba(0,0,0,0.6)]">
        <div className="relative p-5 space-y-3 overflow-hidden" style={{ height: 230 }}>
          <div className="text-center text-[11px] text-white/60 font-semibold mb-2">The Italian Place</div>
          {items.map((item, i) => (
            <div key={i} className="scan-receipt-line flex justify-between text-[11px] font-mono" style={{ animationDelay: `${i * 0.4}s` }}>
              <span className="text-white/90">{item.label}</span>
              <span className="text-white/70">{item.price}</span>
            </div>
          ))}
          <div className="scan-bar" />
        </div>
      </PhoneMockup>

      <p className="text-sm text-white/50 max-w-[260px]">Point, snap, done. AI reads every line instantly.</p>
    </div>
  );
};

const GroupSlide = () => {
  const people = [
    { name: "Alex", color: "#ec4899", amount: "$12.50" },
    { name: "Sam", color: "#a855f7", amount: "$18.75" },
    { name: "Jo", color: "#f97316", amount: "$9.25" },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center gap-6 relative">
      <h2 className="text-xl font-bold text-white">Split with your crew</h2>

      <PhoneMockup className="w-[160px] md:w-[300px] shadow-[0_40px_90px_rgba(0,0,0,0.6)]">
        <div className="p-5 space-y-4" style={{ height: 230 }}>
          <div className="text-[12px] text-white/70 font-semibold text-center mb-2">Friday Dinner</div>
          {people.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.08, type: "spring", stiffness: 350, damping: 22 }}
              className="flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0" style={{ background: p.color }}>
                {p.name[0]}
              </div>
              <div className="flex-1">
                <div className="text-[12px] text-white/90 font-medium">{p.name}</div>
                <div className="h-[4px] rounded-full mt-1" style={{ width: `${50 + i * 18}%`, background: p.color, opacity: 0.5 }} />
              </div>
              <span className="text-[12px] text-white/80 font-mono font-semibold">{p.amount}</span>
            </motion.div>
          ))}
        </div>
      </PhoneMockup>

      <p className="text-sm text-white/50 max-w-[260px]">Groups, percentages, or equal — however you want.</p>
    </div>
  );
};

// ── Slide 4 (SettleSlide) — no CTA inside, it's in the bottom bar ──
const SettleSlide = () => (
  <div className="flex flex-col items-center justify-center h-full px-6 text-center gap-6 relative">
    <h2 className="text-xl font-bold text-white">Settle up instantly</h2>

    <PhoneMockup className="w-[160px] md:w-[300px] shadow-[0_40px_90px_rgba(0,0,0,0.6)]">
      <div className="p-5 flex flex-col items-center justify-center gap-4" style={{ height: 230 }}>
        <div className="text-[12px] text-white/60">Payment to Alex</div>
        <div className="text-2xl font-black text-white font-mono">$12.50</div>

        <div className="settle-check-circle">
          <svg width="48" height="48" viewBox="0 0 48 48">
            <circle cx="24" cy="24" r="20" fill="none" stroke="url(#mCheckGrad)" strokeWidth="2.5" className="settle-circle-draw" />
            <path d="M15 24 L21 30 L33 18" fill="none" stroke="url(#mCheckGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="settle-check-draw" />
            <defs>
              <linearGradient id="mCheckGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ec4899" />
                <stop offset="100%" stopColor="#f97316" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="text-[13px] font-bold text-white/90">Settled!</div>
      </div>
    </PhoneMockup>

    <p className="text-sm text-white/50 max-w-[260px]">One tap. Zero awkwardness.</p>
  </div>
);

/* ── Slide variants ── */
const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? "80%" : "-80%", opacity: 0, scale: 0.95 }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit: (dir) => ({ x: dir > 0 ? "-80%" : "80%", opacity: 0, scale: 0.95 }),
};

/* ═══════════════════════════════════════════
   MobileOnboarding — 4 swipeable slides
   Slide 4 (index 3) shows "Get Started" in
   the bottom bar with a portal burst animation
   ═══════════════════════════════════════════ */
const MobileOnboarding = ({ onGetStarted }) => {
  const [[current, direction], setCurrent] = useState([0, 0]);
  const [portalAnimating, setPortalAnimating] = useState(false);
  const [portalOrigin, setPortalOrigin] = useState("50% 88%");
  const TOTAL = 4;

  const paginate = (dir) => {
    const next = current + dir;
    if (next < 0 || next >= TOTAL) return;
    setCurrent([next, dir]);
  };

  const handleGetStarted = (e) => {
    // Compute origin from wherever the button is on screen
    if (e?.currentTarget) {
      const rect = e.currentTarget.getBoundingClientRect();
      const cx = ((rect.left + rect.width / 2) / window.innerWidth * 100).toFixed(1);
      const cy = ((rect.top + rect.height / 2) / window.innerHeight * 100).toFixed(1);
      setPortalOrigin(`${cx}% ${cy}%`);
    }
    setPortalAnimating(true);
  };

  const handleDragEnd = (_, info) => {
    const threshold = 50;
    if (info.offset.x < -threshold && current < TOTAL - 1) paginate(1);
    else if (info.offset.x > threshold && current > 0) paginate(-1);
  };

  const slides = [
    <WelcomeSlide key="welcome" onGetStarted={handleGetStarted} />,
    <ScanSlide key="scan" />,
    <GroupSlide key="group" />,
    <SettleSlide key="settle" />,
  ];

  const showNextBtn = current < 3;   // slides 0–2
  const showGetStarted = current === 3; // slide 4

  return (
    <div
      className="flex flex-col h-full w-full relative"
      style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* Grain */}
      <div className="intro-grain" />

      {/* Slide area */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={current}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "tween", duration: 0.3, ease: [0.25, 0.1, 0.25, 1] },
              opacity: { duration: 0.2 },
              scale: { duration: 0.3, ease: "easeOut" },
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.12}
            onDragEnd={handleDragEnd}
            className="absolute inset-0 flex items-center justify-center"
          >
            {slides[current]}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom: dots + conditional button */}
      <div className="flex flex-col items-center gap-5 pb-8 px-6 relative z-20">
        {/* Dot indicators */}
        <div className="flex items-center gap-2">
          {Array.from({ length: TOTAL }).map((_, i) => (
            <motion.div
              key={i}
              className="rounded-full"
              animate={{
                width: i === current ? 24 : 6,
                background: i === current
                  ? "linear-gradient(90deg, #ec4899, #f97316)"
                  : "rgba(255,255,255,0.2)",
              }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              style={{ height: 6, background: "rgba(255,255,255,0.2)" }}
            />
          ))}
        </div>

        {/* Next — slides 0, 1, 2 */}
        {showNextBtn && (
          <motion.button
            onClick={() => paginate(1)}
            whileTap={{ scale: 0.95 }}
            className="w-full max-w-xs py-3 rounded-2xl text-white text-sm font-bold flex items-center justify-center gap-2"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.06) 100%)",
              border: "1px solid rgba(255,255,255,0.18)",
              backdropFilter: "blur(12px)",
            }}
          >
            Next <FiArrowRight size={14} />
          </motion.button>
        )}

        {/* Get Started — slide 4, same position as Next */}
        {showGetStarted && (
          <motion.button
            onClick={handleGetStarted}
            whileTap={{ scale: 0.95 }}
            className="w-full max-w-xs py-3.5 rounded-2xl text-white text-sm font-bold flex items-center justify-center gap-2 shadow-xl"
            style={{ background: "linear-gradient(135deg, #ec4899 0%, #a855f7 50%, #f97316 100%)" }}
          >
            Get Started <FiArrowRight size={14} />
          </motion.button>
        )}
      </div>

      {/* Portal burst overlay — expands from button position to fill screen */}
      <AnimatePresence>
        {portalAnimating && (
          <motion.div
            key="portal"
            initial={{ clipPath: `circle(0% at ${portalOrigin})` }}
            animate={{ clipPath: `circle(170% at ${portalOrigin})` }}
            transition={{ duration: 0.72, ease: [0.4, 0, 0.2, 1] }}
            onAnimationComplete={() => {
              // Call navigation first — the whole component (and overlay) unmounts
              // as the parent switches to the login page, preventing the flash
              onGetStarted();
            }}
            className="fixed inset-0 z-[100]"
            style={{
              background:
                "linear-gradient(160deg, rgba(80,20,180,1) 0%, rgba(30,10,55,1) 55%, rgba(12,6,28,1) 100%)",
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default MobileOnboarding;