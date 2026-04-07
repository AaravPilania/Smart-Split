import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";

/* ─── Per-slide themes ─────────────────────────────────────── */
const UNIFIED_THEME = {
  bg: "linear-gradient(155deg, #1a0a10 0%, #10060a 100%)",
  accent: "#ec4899",
  glow1: { c: "rgba(236,72,153,0.50)", t: "-18%", l: "-14%", an: "glowDrift1 28s ease-in-out infinite" },
  glow2: { c: "rgba(249,115,22,0.35)", b: "0%",   r: "-10%", an: "glowDrift2 36s ease-in-out infinite" },
};
const SLIDE_THEMES = [UNIFIED_THEME, UNIFIED_THEME, UNIFIED_THEME, UNIFIED_THEME];

/* ─── Slide data ───────────────────────────────────────────── */
const SLIDES = [
  {
    id: "dinner",
    tag: "AI-Powered",
    title: "Stop doing\nmath at dinner.",
    accentWord: "math",
    sub: "AI-powered bill splitting for the real world — fast, fair, zero drama.",
    visual: () => <DinnerVisual />,
  },
  {
    id: "scan",
    tag: "Receipt Scanner",
    title: "Scan any\nreceipt instantly.",
    accentWord: "receipt",
    sub: "Point, snap, done. Gemini AI reads every line in under a second.",
    visual: () => <ScanVisual />,
  },
  {
    id: "crew",
    tag: "Group Splits",
    title: "Split fair\nwith your crew.",
    accentWord: "fair",
    sub: "Groups, percentages, or equal — you decide how to divide.",
    visual: () => <CrewVisual />,
  },
  {
    id: "settle",
    tag: "One Tap Pay",
    title: "Settle up\ninstantly.",
    accentWord: "instantly",
    sub: "One tap to pay via GPay, PhonePe, or Paytm. Zero awkwardness.",
    visual: () => <SettleVisual />,
    isCTA: true,
  },
];

const GRAD = "linear-gradient(135deg, #f472b6 0%, #fb923c 100%)";
const GRAD_STYLE = {
  background: GRAD,
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
};

/* ── Main component ─────────────────────────────────────────── */
export default function MobileOnboarding({ onGetStarted, onGoogleSignIn }) {
  const [slide, setSlide] = useState(0);
  const [dir, setDir] = useState(1);
  const dragX = useMotionValue(0);

  const go = (next) => {
    if (next < 0 || next >= SLIDES.length) return;
    setDir(next > slide ? 1 : -1);
    setSlide(next);
  };

  const handleDragEnd = (_, info) => {
    if (info.offset.x < -60 && slide < SLIDES.length - 1) go(slide + 1);
    else if (info.offset.x > 60 && slide > 0) go(slide - 1);
    dragX.set(0);
  };

  const theme = SLIDE_THEMES[slide];

  return (
    <div
      className="relative w-full h-full overflow-hidden flex flex-col select-none"
      style={{ background: "#080612", touchAction: "pan-y" }}
    >
      {/* Per-slide animated background */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`bg-${slide}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
          className="absolute inset-0 pointer-events-none"
          style={{ background: theme.bg, zIndex: 0 }}
        >
          <div
            style={{
              position: "absolute",
              width: "95vw", height: "95vw",
              maxWidth: 540, maxHeight: 540,
              top: theme.glow1.t, left: theme.glow1.l,
              right: theme.glow1.r,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${theme.glow1.c} 0%, transparent 68%)`,
              filter: "blur(48px)",
              animation: theme.glow1.an,
            }}
          />
          <div
            style={{
              position: "absolute",
              width: "80vw", height: "80vw",
              maxWidth: 440, maxHeight: 440,
              bottom: theme.glow2.b, right: theme.glow2.r,
              left: theme.glow2.l,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${theme.glow2.c} 0%, transparent 68%)`,
              filter: "blur(40px)",
              animation: theme.glow2.an,
            }}
          />
          <div className="home-dots absolute inset-0" style={{ opacity: 0.40 }} />
        </motion.div>
      </AnimatePresence>

      {/* Top bar: logo mark + login pill */}
      <div
        className="relative flex items-center justify-between px-5 pt-14 pb-0"
        style={{ zIndex: 20 }}
      >
        <div className="flex items-center gap-2">
          <img
            src="/icon.png"
            alt="Smart Split"
            className="w-7 h-7 rounded-lg shadow"
          />
          <span className="text-xs font-black tracking-wide" style={{ color: "rgba(255,255,255,0.55)", letterSpacing: "0.06em" }}>
            SMART SPLIT
          </span>
        </div>

        {/* Login pill — visible on non-CTA slides */}
        <AnimatePresence>
          {!SLIDES[slide].isCTA && (
            <motion.div
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.25 }}
              className="flex items-center gap-2"
            >
              {onGoogleSignIn && (
                <button
                  onClick={() => onGoogleSignIn()}
                  className="flex items-center justify-center w-8 h-8 rounded-full active:scale-95 transition-all"
                  style={{
                    background: "rgba(255,255,255,0.09)",
                    border: "1px solid rgba(255,255,255,0.20)",
                    backdropFilter: "blur(12px)",
                  }}
                  aria-label="Sign in with Google"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09a7.12 7.12 0 010-4.17V7.07H2.18A11.97 11.97 0 001 12c0 1.94.46 3.77 1.18 5.43l3.66-2.84z" fill="#FBBC05"/>
                    <path d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.09 14.97 0 12 0 7.7 0 3.99 2.47 2.18 6.07l3.66 2.85c.87-2.6 3.3-4.17 6.16-4.17z" fill="#EA4335"/>
                  </svg>
                </button>
              )}
              <button
                onClick={(e) => onGetStarted(e.currentTarget.getBoundingClientRect())}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all active:scale-95"
                style={{
                  background: "rgba(255,255,255,0.09)",
                  border: "1px solid rgba(255,255,255,0.20)",
                  color: "rgba(255,255,255,0.80)",
                  backdropFilter: "blur(12px)",
                  letterSpacing: "0.02em",
                }}
              >
                Login
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Draggable slide content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.08}
        onDragEnd={handleDragEnd}
        style={{ x: dragX, zIndex: 1, flex: 1 }}
        className="relative flex flex-col"
      >
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={slide}
            custom={dir}
            variants={{
              enter: (d) => ({ opacity: 0, x: d * 36, scale: 0.97 }),
              center: { opacity: 1, x: 0, scale: 1 },
              exit: (d) => ({ opacity: 0, x: d * -36, scale: 0.97 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 380, damping: 36, mass: 0.9 }}
            className="absolute inset-0 flex flex-col"
          >
            <SlideContent
              slide={SLIDES[slide]}
              slideIndex={slide}
              theme={theme}
              onNext={() => go(slide + 1)}
              onGetStarted={onGetStarted}
            />
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Dot indicators */}
      <div
        className="absolute flex gap-2"
        style={{ zIndex: 20, bottom: 28, left: "50%", transform: "translateX(-50%)" }}
      >
        {SLIDES.map((_, i) => (
          <motion.button
            key={i}
            onClick={() => go(i)}
            animate={{ width: i === slide ? 22 : 6, opacity: i === slide ? 1 : 0.30 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            style={{
              height: 6, borderRadius: 3,
              background: i === slide ? theme.accent : "rgba(255,255,255,0.45)",
              border: "none", cursor: "pointer", padding: 0,
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Slide layout ───────────────────────────────────────────── */
function SlideContent({ slide, slideIndex, theme, onNext, onGetStarted }) {
  /* Split title on \n and highlight accentWord */
  const renderTitle = (title, accentWord) => {
    return title.split("\n").map((line, li) => {
      const idx = line.toLowerCase().indexOf(accentWord.toLowerCase());
      if (idx === -1) {
        return (
          <span key={li} className="text-white">
            {line}
            {li < title.split("\n").length - 1 && <br />}
          </span>
        );
      }
      return (
        <span key={li}>
          <span className="text-white">{line.slice(0, idx)}</span>
          <span style={GRAD_STYLE}>{line.slice(idx, idx + accentWord.length)}</span>
          <span className="text-white">{line.slice(idx + accentWord.length)}</span>
          {li < title.split("\n").length - 1 && <br />}
        </span>
      );
    });
  };

  return (
    <div className="flex flex-col h-full w-full px-6" style={{ paddingTop: 8, paddingBottom: 80 }}>
      {/* Visual — fills the space between top bar and text, always centered */}
      <div className="flex-1 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.84, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 26 }}
          style={{ width: "100%", maxWidth: 310 }}
        >
          {slide.visual()}
        </motion.div>
      </div>

      {/* Editorial text block */}
      <div>
        {/* Tag line with colored dash */}
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 28 }}
          className="flex items-center gap-2 mb-3"
        >
          <div className="h-px w-5 rounded-full" style={{ background: theme.accent }} />
          <span
            className="text-xs font-bold tracking-[0.16em] uppercase"
            style={{ color: theme.accent }}
          >
            {slide.tag}
          </span>
        </motion.div>

        {/* Headline with gradient accent word */}
        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 340, damping: 26 }}
          className="font-black leading-[1.07] tracking-tight mb-3"
          style={{ fontSize: "clamp(1.9rem, 8.5vw, 2.6rem)" }}
        >
          {renderTitle(slide.title, slide.accentWord)}
        </motion.h1>

        {/* Sub-text */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 360, damping: 28 }}
          className="text-sm leading-relaxed mb-7"
          style={{ color: "rgba(255,255,255,0.40)", maxWidth: 270 }}
        >
          {slide.sub}
        </motion.p>

        {/* CTA: gradient button on slide 4, frosted Continue elsewhere */}
        {slide.isCTA ? (
          <button
            onClick={(e) => onGetStarted(e.currentTarget.getBoundingClientRect())}
            className="w-full py-[14px] rounded-2xl text-white font-black text-sm flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
            style={{
              background: "linear-gradient(135deg, #ec4899, #f97316)",
              boxShadow: "0 8px 24px rgba(236,72,153,0.40)",
            }}
          >
            Get Started
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        ) : (
          <button
            onClick={onNext}
            className="flex items-center justify-center gap-2 w-full py-[14px] rounded-2xl text-white font-semibold text-sm active:scale-[0.97] transition-transform"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.10), rgba(255,255,255,0.05))",
              border: "1px solid rgba(255,255,255,0.15)",
              backdropFilter: "blur(14px)",
            }}
          >
            Next
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Swipe-to-login slider (slide 4 CTA) ────────────────────── */
function SliderButton({ onComplete }) {
  const TRACK_W = 280;
  const THUMB_W = 56;
  const MAX_DRAG = TRACK_W - THUMB_W - 8;
  const COMPLETE_THRESHOLD = MAX_DRAG * 0.88;

  const x = useMotionValue(0);
  const fillWidth = useTransform(x, [0, MAX_DRAG], [THUMB_W, TRACK_W]);
  const labelOpacity = useTransform(x, [0, MAX_DRAG * 0.4], [1, 0]);
  const [done, setDone] = useState(false);
  const thumbRef = useRef(null);

  const handleDragEnd = useCallback(() => {
    if (x.get() >= COMPLETE_THRESHOLD) {
      animate(x, MAX_DRAG, { duration: 0.18, ease: "easeOut" });
      setDone(true);
      setTimeout(() => {
        const rect = thumbRef.current?.getBoundingClientRect() ?? { x: 0, y: 0, width: 0, height: 0 };
        onComplete(rect);
      }, 380);
    } else {
      animate(x, 0, { type: "spring", stiffness: 600, damping: 42 });
    }
  }, [x, MAX_DRAG, COMPLETE_THRESHOLD, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.26, duration: 0.38 }}
      className="flex flex-col items-center gap-4"
    >
      {/* Track */}
      <div
        className="relative flex items-center"
        style={{
          width: TRACK_W,
          height: 62,
          borderRadius: 31,
          background: "rgba(255,255,255,0.07)",
          border: "1px solid rgba(255,255,255,0.13)",
          overflow: "hidden",
        }}
      >
        {/* Gradient fill that follows thumb */}
        <motion.div
          style={{
            position: "absolute",
            left: 0, top: 0, bottom: 0,
            width: fillWidth,
            background: "linear-gradient(90deg, #ec4899, #a855f7, #f97316)",
            borderRadius: 31,
            opacity: 0.28,
          }}
        />

        {/* "SLIDE TO LOGIN" label */}
        <motion.span
          className="absolute inset-0 flex items-center justify-center text-xs font-bold pointer-events-none"
          style={{ opacity: labelOpacity, color: "rgba(255,255,255,0.45)", letterSpacing: "0.14em", textTransform: "uppercase" }}
        >
          Slide to login
        </motion.span>

        {/* Draggable thumb */}
        <motion.div
          ref={thumbRef}
          drag="x"
          dragConstraints={{ left: 0, right: MAX_DRAG }}
          dragElastic={0}
          dragMomentum={false}
          onDragEnd={handleDragEnd}
          style={{
            x,
            position: "absolute",
            left: 4,
            width: THUMB_W,
            height: 54,
            borderRadius: 27,
            background: done
              ? "linear-gradient(135deg, #34d399, #10b981)"
              : "linear-gradient(135deg, #ec4899, #a855f7)",
            boxShadow: "0 4px 20px rgba(236,72,153,0.50)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: done ? "default" : "grab",
            zIndex: 2,
            touchAction: "none",
          }}
          whileTap={done ? {} : { scale: 0.96 }}
        >
          {done ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          )}
        </motion.div>
      </div>

      {/* Guest link */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-xs text-center"
        style={{ color: "rgba(255,255,255,0.28)" }}
      >
        New here?{" "}
        <button
          onClick={(e) => onComplete(e.currentTarget.getBoundingClientRect())}
          className="font-semibold"
          style={{ color: "rgba(255,255,255,0.52)" }}
        >
          Create account →
        </button>
      </motion.p>
    </motion.div>
  );
}

/* Slide 1 — App logo showcase */
function LogoVisual() {
  return (
    <div className="flex items-center justify-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 18 }}
        className="relative"
      >
        <div
          className="w-32 h-32 rounded-[2.2rem] overflow-hidden shadow-2xl"
          style={{ boxShadow: "0 20px 60px rgba(236,72,153,0.35), 0 8px 24px rgba(0,0,0,0.4)" }}
        >
          <img src="/icon.png" alt="Smart Split" className="w-full h-full object-cover" />
        </div>
        <div
          className="absolute -inset-3 rounded-[2.6rem] pointer-events-none"
          style={{ border: "1.5px solid rgba(236,72,153,0.25)", boxShadow: "0 0 30px rgba(236,72,153,0.15)" }}
        />
      </motion.div>
    </div>
  );
}

/* placeholder to satisfy old reference — no longer rendered */
function GetStartedButton({ onGetStarted }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.28, duration: 0.4 }}
    >
      <motion.button
        onClick={(e) => onGetStarted(e.currentTarget.getBoundingClientRect())}
        whileTap={{ scale: 0.96 }}
        className="relative w-full py-4 rounded-2xl text-white font-black text-base overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #ec4899 0%, #a855f7 50%, #f97316 100%)",
          boxShadow: "0 8px 32px rgba(236,72,153,0.45), 0 4px 16px rgba(0,0,0,0.3)",
        }}
      >
        {/* Shimmer sweep */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.20) 50%, transparent 100%)",
          }}
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "linear", repeatDelay: 1.2 }}
        />
        <span className="relative z-10 flex items-center justify-center gap-2">
          Login
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </span>
      </motion.button>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center text-xs mt-4"
        style={{ color: "rgba(255,255,255,0.30)" }}
      >
        New to Smart Split?{" "}
        <button
          onClick={(e) => onGetStarted(e.currentTarget.getBoundingClientRect())}
          className="font-semibold"
          style={{ color: "rgba(255,255,255,0.60)" }}
        >
          Create account →
        </button>
      </motion.p>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════
   VISUALS — one per slide
   ══════════════════════════════════════════════════════════════ */

/* Slide 1 — Dinner / receipt with people avatars */
function DinnerVisual() {
  const items = [
    { label: "Margherita Pizza", amount: "₹499", color: "#ec4899", delay: 0.2 },
    { label: "Pasta Arrabbiata", amount: "₹349", color: "#a855f7", delay: 0.3 },
    { label: "Tiramisu × 2", amount: "₹298", color: "#f97316", delay: 0.4 },
    { label: "Tax + Service", amount: "₹115", color: "rgba(255,255,255,0.3)", delay: 0.5 },
  ];
  const people = ["A", "P", "V", "R"];
  const colors = ["#ec4899", "#a855f7", "#f97316", "#06b6d4"];

  return (
    <div
      className="rounded-3xl p-5 w-full"
      style={{
        background:
          "linear-gradient(145deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.04) 100%)",
        border: "1px solid rgba(255,255,255,0.14)",
        backdropFilter: "blur(24px)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.12)",
      }}
    >
      {/* Restaurant name */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-center mb-4"
      >
        <div className="text-white font-black text-lg tracking-tight">The Italian Place</div>
        <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
          Friday Night Dinner
        </div>
      </motion.div>

      {/* Scan bar effect */}
      <div className="relative rounded-xl overflow-hidden mb-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="scan-bar" />
        <div className="p-3 space-y-2.5">
          {items.map((item) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: item.delay, duration: 0.35 }}
              className="flex items-center justify-between scan-receipt-line"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: item.color }}
                />
                <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.75)" }}>
                  {item.label}
                </span>
              </div>
              <span className="text-xs font-bold text-white">{item.amount}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* People row */}
      <div className="flex items-center justify-between">
        <div className="flex -space-x-2">
          {people.map((p, i) => (
            <motion.div
              key={p}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.55 + i * 0.08, type: "spring", stiffness: 400, damping: 20 }}
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white border-2"
              style={{ background: colors[i], borderColor: "rgba(0,0,0,0.5)" }}
            >
              {p}
            </motion.div>
          ))}
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, type: "spring" }}
          className="text-right"
        >
          <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Total</div>
          <div className="text-lg font-black text-white">₹1,261</div>
        </motion.div>
      </div>
    </div>
  );
}

/* Slide 2 — Receipt scanner with animated beam */
function ScanVisual() {
  return (
    <div
      className="rounded-3xl overflow-hidden w-full"
      style={{
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.12)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
      }}
    >
      {/* Camera viewfinder header */}
      <div
        className="relative"
        style={{ height: 180, background: "linear-gradient(160deg, #0d1625, #070c18)" }}
      >
        {/* Corner guides */}
        {[
          { top: 12, left: 12, borderT: true, borderL: true },
          { top: 12, right: 12, borderT: true, borderR: true },
          { bottom: 12, left: 12, borderB: true, borderL: true },
          { bottom: 12, right: 12, borderB: true, borderR: true },
        ].map((c, i) => (
          <div
            key={i}
            className="absolute w-5 h-5"
            style={{
              ...c,
              borderTop: c.borderT ? "2.5px solid #ec4899" : undefined,
              borderBottom: c.borderB ? "2.5px solid #ec4899" : undefined,
              borderLeft: c.borderL ? "2.5px solid #ec4899" : undefined,
              borderRight: c.borderR ? "2.5px solid #ec4899" : undefined,
            }}
          />
        ))}
        {/* Scan beam */}
        <div className="scan-bar" style={{ left: 12, right: 12 }} />
        {/* Mock receipt in viewfinder */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="space-y-2 opacity-50">
            {["Swiggy Order", "₹ 450.00", "Delivery + GST", "₹ 67.00"].map((t, i) => (
              <div key={i} className="h-1.5 rounded-full bg-white/40" style={{ width: i % 2 === 0 ? 100 : 60 }} />
            ))}
          </div>
        </div>
        {/* AI badge */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="absolute top-3 right-14 px-2 py-1 rounded-lg text-xs font-bold"
          style={{ background: "rgba(168,85,247,0.25)", border: "1px solid rgba(168,85,247,0.4)", color: "#c084fc" }}
        >
          Gemini AI
        </motion.div>
      </div>

      {/* Parsed result */}
      <div className="p-4">
        <div className="text-xs font-semibold mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>
          DETECTED
        </div>
        {[
          { k: "Merchant", v: "Swiggy", color: "#ec4899" },
          { k: "Total", v: "₹517.00", color: "#a855f7" },
          { k: "Category", v: "Food", color: "#f97316" },
        ].map((row, i) => (
          <motion.div
            key={row.k}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.12 }}
            className="flex justify-between items-center py-1.5"
            style={{ borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.06)" : "none" }}
          >
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>{row.k}</span>
            <span className="text-xs font-bold" style={{ color: row.color }}>{row.v}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* Slide 3 — Group split with person rows */
function CrewVisual() {
  const members = [
    { name: "Alex", amount: "₹420.33", color: "#ec4899", paid: true },
    { name: "Sam", amount: "₹420.33", color: "#a855f7", paid: false },
    { name: "Jo", amount: "₹420.34", color: "#f97316", paid: false },
  ];

  return (
    <div
      className="rounded-3xl p-5 w-full"
      style={{
        background: "linear-gradient(145deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.04) 100%)",
        border: "1px solid rgba(255,255,255,0.13)",
        backdropFilter: "blur(24px)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-4"
      >
        <div className="text-white font-black text-base">Friday Dinner</div>
        <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
          ₹1,261 split equally
        </div>
      </motion.div>

      <div className="space-y-3 mb-4">
        {members.map((m, i) => (
          <motion.div
            key={m.name}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + i * 0.1, type: "spring", stiffness: 300, damping: 24 }}
            className="flex items-center gap-3 p-3 rounded-2xl"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black text-white flex-shrink-0"
              style={{ background: m.color + "33", border: `1.5px solid ${m.color}55` }}
            >
              <span style={{ color: m.color }}>{m.name[0]}</span>
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold text-white">{m.name}</div>
              <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{m.amount}</div>
            </div>
            {m.paid ? (
              <div
                className="px-2.5 py-1 rounded-lg text-xs font-bold"
                style={{ background: "rgba(34,197,94,0.15)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.25)" }}
              >
                Paid
              </div>
            ) : (
              <div
                className="px-2.5 py-1 rounded-lg text-xs font-bold"
                style={{ background: "rgba(236,72,153,0.12)", color: "#f9a8d4", border: "1px solid rgba(236,72,153,0.22)" }}
              >
                Owes
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="rounded-full overflow-hidden" style={{ height: 6, background: "rgba(255,255,255,0.08)" }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "33%" }}
          transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ background: "linear-gradient(90deg, #ec4899, #a855f7)" }}
        />
      </div>
      <div className="flex justify-between mt-1.5">
        <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>1 of 3 paid</span>
        <span className="text-xs font-bold" style={{ color: "#ec4899" }}>₹841.67 pending</span>
      </div>
    </div>
  );
}

/* Slide 4 — Settle up with animated checkmark */
function SettleVisual() {
  return (
    <div className="flex flex-col items-center gap-5 w-full">
      {/* Phone mockup */}
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 260, damping: 22 }}
        className="w-48 rounded-3xl p-5 text-center"
        style={{
          background: "linear-gradient(160deg, rgba(255,255,255,0.1), rgba(255,255,255,0.04))",
          border: "1px solid rgba(255,255,255,0.14)",
          backdropFilter: "blur(24px)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        }}
      >
        <div className="text-xs mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>Payment to Alex</div>
        <div className="text-3xl font-black text-white mb-4">₹472</div>

        {/* Animated check */}
        <div className="settle-check-circle flex items-center justify-center mx-auto mb-2" style={{ width: 52, height: 52 }}>
          <svg width="52" height="52" viewBox="0 0 52 52">
            <circle
              className="settle-circle-draw"
              cx="26" cy="26" r="20"
              fill="none"
              stroke="url(#sg)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              className="settle-check-draw"
              d="M16 26 L23 33 L36 19"
              fill="none"
              stroke="url(#sg)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <defs>
              <linearGradient id="sg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ec4899" />
                <stop offset="100%" stopColor="#f97316" />
              </linearGradient>
            </defs>
          </svg>
          <div className="settle-confetti">
            {[...Array(6)].map((_, i) => (
              <div key={i} className={`settle-dot settle-dot-${i + 1}`} style={{ "--i": i }} />
            ))}
          </div>
        </div>

        <div className="text-sm font-black text-white">Settled!</div>
      </motion.div>

      {/* UPI app pills */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex gap-2"
      >
        {["GPay", "PhonePe", "Paytm"].map((app, i) => (
          <motion.div
            key={app}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 + i * 0.08, type: "spring" }}
            className="px-3 py-1.5 rounded-xl text-xs font-bold"
            style={{
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.65)",
            }}
          >
            {app}
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}