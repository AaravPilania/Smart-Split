import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

/*
  OnboardingGuide
  ───────────────
  Spotlight cutout overlay that highlights real DOM elements.
  Triggered from Dashboard when sessionStorage flag "smartsplit_show_guide" = "1"
  (set by Home.jsx for guest users, and after first registration).

  Usage:
    import OnboardingGuide from "../components/OnboardingGuide";
    // In Dashboard:
    const [showGuide, setShowGuide] = useState(
      () => sessionStorage.getItem("smartsplit_show_guide") === "1"
    );
    // clear flag on show
    useEffect(() => {
      if (showGuide) sessionStorage.removeItem("smartsplit_show_guide");
    }, [showGuide]);
    // render:
    {showGuide && <OnboardingGuide onFinish={() => setShowGuide(false)} />}
*/

const TIPS = [
  {
    target: "[data-guide='home']",          // BottomNav Home tab
    title: "Your dashboard",
    body: "See total spend, debts owed, and recent activity at a glance.",
    placement: "top",
  },
  {
    target: "[data-guide='groups']",        // BottomNav Groups tab
    title: "Groups",
    body: "Create groups for trips, roommates, anything. Add members by QR.",
    placement: "top",
  },
  {
    target: "[data-guide='fab']",           // Center FAB button
    title: "Quick actions",
    body: "Scan a receipt or ask Aaru to log an expense in plain English.",
    placement: "top",
  },
  {
    target: "[data-guide='friends']",       // BottomNav Friends tab
    title: "Friends",
    body: "Add friends via QR. Once connected, split expenses together.",
    placement: "top",
  },
  {
    target: "[data-guide='settle']",        // Settle Now button on dashboard
    title: "Settle up",
    body: "One tap to pay via UPI — Google Pay, PhonePe, or Paytm.",
    placement: "bottom",
    fallbackY: 0.4,                         // fraction of screen height if element not found
  },
];

const PAD = 12; // spotlight padding

export default function OnboardingGuide({ onFinish }) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState(null);
  const [windowSize, setWindowSize] = useState({ w: window.innerWidth, h: window.innerHeight });

  // Measure target element
  useEffect(() => {
    const measure = () => {
      const tip = TIPS[step];
      const el = document.querySelector(tip.target);
      if (el) {
        const r = el.getBoundingClientRect();
        setRect({ x: r.left, y: r.top, w: r.width, h: r.height });
      } else {
        // fallback center
        setRect({
          x: window.innerWidth / 2 - 40,
          y: (tip.fallbackY || 0.5) * window.innerHeight - 30,
          w: 80,
          h: 60,
        });
      }
    };
    measure();
    const t = setTimeout(measure, 120); // re-measure after layout settles
    return () => clearTimeout(t);
  }, [step]);

  useEffect(() => {
    const handleResize = () => setWindowSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const next = () => {
    if (step < TIPS.length - 1) setStep(s => s + 1);
    else onFinish();
  };

  const tip = TIPS[step];
  const { w: vw, h: vh } = windowSize;

  // Spotlight coords
  const sx = rect ? rect.x - PAD : vw / 2 - 50;
  const sy = rect ? rect.y - PAD : vh / 2 - 50;
  const sw = rect ? rect.w + PAD * 2 : 100;
  const sh = rect ? rect.h + PAD * 2 : 100;
  const sr = 16; // spotlight corner radius

  // Tooltip position
  const tooltipW = 240;
  const belowY = sy + sh + 14;
  const aboveY = sy - 14 - 130; // approx tooltip height
  const isBelow = tip.placement === "bottom" || aboveY < 60;
  const tooltipY = isBelow ? belowY : aboveY;
  const tooltipX = Math.max(16, Math.min(sx + sw / 2 - tooltipW / 2, vw - tooltipW - 16));
  const arrowX = sx + sw / 2 - tooltipX;

  return (
    <motion.div
      className="fixed inset-0 z-[9999]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* SVG overlay with cutout */}
      <AnimatePresence mode="wait">
        <motion.svg
          key={`overlay-${step}`}
          className="absolute inset-0 w-full h-full"
          style={{ pointerEvents: "none" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <defs>
            <mask id={`spot-${step}`}>
              {/* White = visible overlay */}
              <rect width="100%" height="100%" fill="white" />
              {/* Black = hole (spotlight) */}
              <motion.rect
                key={`hole-${step}`}
                initial={{ x: sx + sw / 2 - 4, y: sy + sh / 2 - 4, width: 8, height: 8, rx: sr }}
                animate={{ x: sx, y: sy, width: sw, height: sh, rx: sr }}
                transition={{ type: "spring", stiffness: 280, damping: 26 }}
                fill="black"
              />
            </mask>
          </defs>
          {/* Dark overlay with hole */}
          <rect width="100%" height="100%" fill="rgba(0,0,0,0.72)" mask={`url(#spot-${step})`} />
          {/* Spotlight glow ring */}
          <motion.rect
            key={`ring-${step}`}
            initial={{ x: sx + sw / 2 - 4, y: sy + sh / 2 - 4, width: 8, height: 8, rx: sr }}
            animate={{ x: sx - 2, y: sy - 2, width: sw + 4, height: sh + 4, rx: sr + 2 }}
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
            fill="none"
            stroke="rgba(236,72,153,0.6)"
            strokeWidth="1.5"
          />
        </motion.svg>
      </AnimatePresence>

      {/* Tooltip card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`tip-${step}`}
          initial={{ opacity: 0, y: isBelow ? -10 : 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: isBelow ? -6 : 6, scale: 0.97 }}
          transition={{ type: "spring", stiffness: 320, damping: 28, delay: 0.1 }}
          style={{
            position: "absolute",
            top: tooltipY,
            left: tooltipX,
            width: tooltipW,
            zIndex: 10000,
          }}
        >
          {/* Arrow */}
          {!isBelow && (
            <div style={{
              position: "absolute",
              bottom: -7,
              left: Math.max(12, Math.min(arrowX - 7, tooltipW - 24)),
              width: 14, height: 7,
              overflow: "hidden",
            }}>
              <div style={{
                width: 14, height: 14,
                background: "#fff",
                transform: "rotate(45deg) translateY(-7px)",
                borderRadius: 2,
              }} />
            </div>
          )}
          {isBelow && (
            <div style={{
              position: "absolute",
              top: -7,
              left: Math.max(12, Math.min(arrowX - 7, tooltipW - 24)),
              width: 14, height: 7,
              overflow: "hidden",
            }}>
              <div style={{
                width: 14, height: 14,
                background: "#fff",
                transform: "rotate(45deg) translateY(3px)",
                borderRadius: 2,
              }} />
            </div>
          )}

          {/* Card */}
          <div style={{
            background: "#fff",
            borderRadius: 16,
            padding: "14px 16px 12px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.12)",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: "#111", margin: 0 }}>{tip.title}</h4>
              <span style={{ fontSize: 11, color: "#bbb", fontWeight: 500 }}>{step + 1}/{TIPS.length}</span>
            </div>
            <p style={{ fontSize: 12, color: "#666", lineHeight: 1.55, margin: "0 0 12px" }}>{tip.body}</p>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={onFinish}
                style={{
                  flex: 0, padding: "7px 12px", borderRadius: 10, border: "1px solid #e5e5e5",
                  background: "transparent", color: "#999", fontSize: 12, fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >
                Skip
              </button>
              <button
                onClick={next}
                style={{
                  flex: 1, padding: "7px 0", borderRadius: 10, border: "none",
                  background: "linear-gradient(135deg,#ec4899,#f97316)",
                  color: "#fff", fontSize: 12, fontWeight: 700,
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >
                {step < TIPS.length - 1 ? "Next →" : "Got it! 🎉"}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
