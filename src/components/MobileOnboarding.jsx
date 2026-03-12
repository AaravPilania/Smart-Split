import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiArrowRight, FiCheck } from "react-icons/fi";
import PhoneMockup from "./PhoneMockup";

const GRADIENT_TEXT = {
  background: "linear-gradient(90deg, #f472b6 0%, #c084fc 45%, #fb923c 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
};

/* ── Floating decorative orbs ── */
const ORB_COLORS = {
  pink: "radial-gradient(circle, rgba(236,72,153,0.3) 0%, transparent 70%)",
  purple: "radial-gradient(circle, rgba(168,85,247,0.25) 0%, transparent 70%)",
  amber: "radial-gradient(circle, rgba(249,115,22,0.25) 0%, transparent 70%)",
};

const FloatingOrb = ({ size = 12, color = "pink", ring = false, className = "", style = {} }) => (
  <div
    className={`absolute rounded-full pointer-events-none select-none ${className}`}
    style={{
      width: size,
      height: size,
      background: ring ? "none" : (ORB_COLORS[color] || ORB_COLORS.pink),
      ...(ring ? { border: "1px solid rgba(255,255,255,0.07)" } : {}),
      ...style,
    }}
  />
);

/* ── Slide content components ── */

const WelcomeSlide = ({ onGetStarted }) => (
  <div className="flex flex-col items-center justify-center text-center px-8 h-full gap-6 relative">
    {/* Floating decorative orbs */}
    <FloatingOrb size={44} color="pink" className="float-slow" style={{ top: "8%", left: "8%" }} />
    <FloatingOrb size={28} color="purple" className="float-med float-delay-1" style={{ top: "14%", right: "10%" }} />
    <FloatingOrb size={36} color="amber" className="float-slow float-delay-2" style={{ bottom: "18%", left: "6%" }} />
    <FloatingOrb size={20} color="pink" className="float-med float-delay-3" style={{ bottom: "12%", right: "8%" }} />
    <FloatingOrb size={52} ring className="float-med" style={{ top: "30%", right: "4%" }} />
    <FloatingOrb size={32} color="purple" className="float-slow float-delay-1" style={{ bottom: "30%", left: "4%" }} />

    {/* Ambient glow */}
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
    <div className="flex flex-col items-center justify-center h-full gap-5 px-6 relative">
      {/* Floating decorative orbs */}
      <FloatingOrb size={36} color="pink" className="float-slow" style={{ top: "6%", left: "6%" }} />
      <FloatingOrb size={48} ring className="float-med float-delay-2" style={{ top: "10%", right: "8%" }} />
      <FloatingOrb size={24} color="amber" className="float-slow float-delay-1" style={{ bottom: "16%", right: "6%" }} />
      <FloatingOrb size={32} color="purple" className="float-med float-delay-3" style={{ bottom: "20%", left: "8%" }} />

      {/* Ambient glow */}
      <div className="absolute top-1/3 left-0 w-64 h-64 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(236,72,153,0.08) 0%, transparent 65%)", filter: "blur(60px)" }} />

      <PhoneMockup className="w-48">
        <div className="relative p-4 space-y-2 overflow-hidden" style={{ height: 170 }}>
          <div className="text-center text-[9px] text-white/50 font-mono mb-2">
          <div className="text-white/70 font-bold text-[10px]">The Italian Place</div>
          </div>
          {items.map((item, i) => (
            <div key={i} className="scan-receipt-line flex justify-between text-[8px] font-mono" style={{ animationDelay: `${i * 0.4}s` }}>
              <span className="text-white/80">{item.label}</span>
              <span className="text-white/60">{item.price}</span>
            </div>
          ))}
          <div className="scan-bar" />
        </div>
      </PhoneMockup>
      <h2 className="text-lg font-bold text-white">Scan any receipt</h2>
      <p className="text-xs text-white/45 text-center max-w-[240px]">
        Point, snap, done. AI reads every line.
      </p>
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
    <div className="flex flex-col items-center justify-center h-full gap-5 px-6 relative">
      {/* Floating decorative orbs */}
      <FloatingOrb size={40} color="purple" className="float-slow" style={{ top: "6%", right: "8%" }} />
      <FloatingOrb size={28} color="pink" className="float-med float-delay-1" style={{ top: "12%", left: "6%" }} />
      <FloatingOrb size={56} ring className="float-slow float-delay-2" style={{ bottom: "18%", left: "4%" }} />
      <FloatingOrb size={24} color="amber" className="float-med float-delay-3" style={{ bottom: "14%", right: "6%" }} />

      {/* Ambient glow */}
      <div className="absolute bottom-1/4 right-0 w-56 h-56 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(168,85,247,0.08) 0%, transparent 65%)", filter: "blur(50px)" }} />

      <PhoneMockup className="w-48">
        <div className="p-4 space-y-3" style={{ height: 170 }}>
          <div className="text-[10px] text-white/60 font-semibold text-center mb-1">Friday Dinner</div>
          {people.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.08, type: "spring", stiffness: 350, damping: 22 }}
              className="flex items-center gap-2"
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                style={{ background: p.color }}
              >
                {p.name[0]}
              </div>
              <div className="flex-1">
                <div className="text-[9px] text-white/80 font-medium">{p.name}</div>
                <div className="h-[3px] rounded-full mt-0.5" style={{ width: `${50 + i * 18}%`, background: p.color, opacity: 0.5 }} />
              </div>
              <span className="text-[10px] text-white/70 font-mono font-semibold">{p.amount}</span>
            </motion.div>
          ))}
        </div>
      </PhoneMockup>
      <h2 className="text-lg font-bold text-white">Split with your crew</h2>
      <p className="text-xs text-white/45 text-center max-w-[240px]">
        Groups, percentages, or equal — however you want.
      </p>
    </div>
  );
};

const SettleSlide = () => (
  <div className="flex flex-col items-center justify-center h-full gap-5 px-6 relative">
    {/* Floating decorative orbs */}
    <FloatingOrb size={32} color="amber" className="float-slow" style={{ top: "6%", left: "8%" }} />
    <FloatingOrb size={48} ring className="float-med float-delay-1" style={{ top: "10%", right: "6%" }} />
    <FloatingOrb size={20} color="pink" className="float-slow float-delay-2" style={{ bottom: "18%", right: "5%" }} />
    <FloatingOrb size={40} color="purple" className="float-med float-delay-3" style={{ bottom: "16%", left: "6%" }} />

    {/* Ambient glow */}
    <div className="absolute top-1/3 right-0 w-56 h-56 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 65%)", filter: "blur(50px)" }} />

    <PhoneMockup className="w-48">
      <div className="p-4 flex flex-col items-center justify-center gap-3" style={{ height: 170 }}>
        <div className="text-[10px] text-white/50">Payment to Alex</div>
        <div className="text-xl font-black text-white font-mono">$12.50</div>
        <div className="settle-check-circle">
          <svg width="44" height="44" viewBox="0 0 48 48">
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
        <div className="text-[11px] font-bold text-white/80">Settled!</div>
      </div>
    </PhoneMockup>
    <h2 className="text-lg font-bold text-white">Settle up instantly</h2>
    <p className="text-xs text-white/45 text-center max-w-[240px]">
      One tap. Zero awkwardness.
    </p>
  </div>
);

const CTASlide = ({ onGetStarted }) => (
  <div className="flex flex-col items-center justify-center text-center h-full gap-5 px-8 relative">
    {/* Floating decorative orbs */}
    <FloatingOrb size={48} color="pink" className="float-slow" style={{ top: "10%", left: "8%" }} />
    <FloatingOrb size={32} color="purple" className="float-med float-delay-1" style={{ top: "8%", right: "10%" }} />
    <FloatingOrb size={56} ring className="float-slow float-delay-2" style={{ bottom: "22%", left: "6%" }} />
    <FloatingOrb size={24} color="amber" className="float-med float-delay-3" style={{ bottom: "18%", right: "8%" }} />
    <FloatingOrb size={16} color="pink" className="float-slow" style={{ top: "30%", left: "4%" }} />
    <FloatingOrb size={40} color="amber" className="float-med float-delay-2" style={{ bottom: "35%", right: "4%" }} />

    {/* Dual ambient glows */}
    <div className="absolute top-1/4 -left-10 w-60 h-60 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(236,72,153,0.08) 0%, transparent 65%)", filter: "blur(50px)" }} />
    <div className="absolute bottom-1/4 -right-10 w-60 h-60 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 65%)", filter: "blur(50px)" }} />

    <h2 className="text-2xl font-black text-white leading-tight">
      Ready to <span style={GRADIENT_TEXT}>go?</span>
    </h2>
    <p className="text-xs text-white/40 flex items-center gap-1.5">
      <FiCheck size={13} className="text-green-400" /> Free forever. No credit card needed.
    </p>
    <motion.button
      onClick={onGetStarted}
      whileTap={{ scale: 0.95 }}
      className="mt-4 px-8 py-3.5 rounded-2xl text-white text-sm font-bold shadow-lg flex items-center gap-2"
      style={{ background: "linear-gradient(135deg, #ec4899 0%, #a855f7 50%, #f97316 100%)" }}
    >
      Get Started <FiArrowRight size={16} />
    </motion.button>
  </div>
);

/* ── Slide variants with spring physics ── */
const slideVariants = {
  enter: (dir) => ({
    x: dir > 0 ? "80%" : "-80%",
    opacity: 0,
    scale: 0.95,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (dir) => ({
    x: dir > 0 ? "-80%" : "80%",
    opacity: 0,
    scale: 0.95,
  }),
};

/* ═══════════════════════════════════════════
   MobileOnboarding — 5 swipeable slides
   ═══════════════════════════════════════════ */
const MobileOnboarding = ({ onGetStarted }) => {
  const [[current, direction], setCurrent] = useState([0, 0]);
  const TOTAL = 5;

  const paginate = (dir) => {
    const next = current + dir;
    if (next < 0 || next >= TOTAL) return;
    setCurrent([next, dir]);
  };

  const handleDragEnd = (_, info) => {
    const threshold = 50;
    if (info.offset.x < -threshold && current < TOTAL - 1) {
      paginate(1);
    } else if (info.offset.x > threshold && current > 0) {
      paginate(-1);
    }
  };

  const slides = [
    <WelcomeSlide key="welcome" onGetStarted={onGetStarted} />,
    <ScanSlide key="scan" />,
    <GroupSlide key="group" />,
    <SettleSlide key="settle" />,
    <CTASlide key="cta" onGetStarted={onGetStarted} />,
  ];

  return (
    <div className="flex flex-col h-full w-full relative" style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}>
      {/* Grain overlay */}
      <div className="intro-grain" />
      {/* Ghost login — only on slide 0 */}
      {current === 0 && (
        <div className="flex justify-end px-5 pt-4 relative z-20">
          <button
            onClick={onGetStarted}
            className="text-xs text-white/35 hover:text-white/60 transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}
          >
            Log in <FiArrowRight size={12} />
          </button>
        </div>
      )}

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

      {/* Bottom: dots + next button */}
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

        {/* Next button — hidden on last slide (CTA slide has its own) */}
        {current < TOTAL - 1 && (
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
      </div>
    </div>
  );
};

export default MobileOnboarding;
