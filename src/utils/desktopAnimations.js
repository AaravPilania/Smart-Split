/**
 * Shared desktop animation utilities — reused across all logged-in pages.
 * Mirrors the energy of the hero/intro landing in Home.jsx.
 */
import { useRef, useEffect, useCallback } from "react";
import { useMotionValue, useSpring, useTransform, animate, useInView } from "framer-motion";

// ─── Spring configs ───────────────────────────────────────────────────────────
export const SPRING_FAST   = { type: "spring", stiffness: 460, damping: 30 };
export const SPRING_MEDIUM = { type: "spring", stiffness: 320, damping: 28 };
export const SPRING_SLOW   = { type: "spring", stiffness: 220, damping: 26 };

// ─── Shared gradient text style (pink → purple → orange) ─────────────────────
export const GRAD_TEXT = {
  background: "linear-gradient(90deg,#f472b6 0%,#c084fc 45%,#fb923c 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
};

// ─── Framer Motion variants ───────────────────────────────────────────────────

/** Stagger container — children animate in sequence */
export const staggerContainer = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.05,
    },
  },
};

/** Individual stagger item */
export const staggerItem = {
  hidden: { opacity: 0, y: 22, scale: 0.97, willChange: "transform, opacity" },
  show:   {
    opacity: 1, y: 0, scale: 1,
    transition: { type: "spring", stiffness: 340, damping: 26 },
  },
};

/** Slide in from left */
export const slideInLeft = {
  hidden: { opacity: 0, x: -24 },
  show:   { opacity: 1, x: 0, transition: { type: "spring", stiffness: 340, damping: 28 } },
};

/** Slide in from right */
export const slideInRight = {
  hidden: { opacity: 0, x: 24 },
  show:   { opacity: 1, x: 0, transition: { type: "spring", stiffness: 340, damping: 28 } },
};

/** Fade + scale up */
export const popIn = {
  hidden: { opacity: 0, scale: 0.88 },
  show:   { opacity: 1, scale: 1, transformOrigin: "center center", transition: { type: "spring", stiffness: 380, damping: 28 } },
};

// ─── 3D Tilt hook ─────────────────────────────────────────────────────────────
/**
 * Returns { ref, motionStyle } to apply 3D tilt on hover.
 * magnitude: max rotation in degrees (default 8).
 */
export function use3DTilt(magnitude = 8) {
  const ref = useRef(null);
  const rotX = useMotionValue(0);
  const rotY = useMotionValue(0);
  const sRotX = useSpring(rotX, { stiffness: 280, damping: 22 });
  const sRotY = useSpring(rotY, { stiffness: 280, damping: 22 });
  const rafId = useRef(0);

  const onMouseMove = useCallback((e) => {
    const el = ref.current;
    if (!el) return;
    cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width  - 0.5;
      const py = (e.clientY - rect.top)  / rect.height - 0.5;
      rotX.set(-py * magnitude * 2);
      rotY.set( px * magnitude * 2);
    });
  }, [rotX, rotY, magnitude]);

  const onMouseLeave = useCallback(() => {
    rotX.set(0);
    rotY.set(0);
  }, [rotX, rotY]);

  return {
    ref,
    onMouseMove,
    onMouseLeave,
    motionStyle: {
      rotateX: sRotX,
      rotateY: sRotY,
      transformPerspective: 900,
      transformStyle: "preserve-3d",
    },
  };
}

// ─── Magnetic button hook ─────────────────────────────────────────────────────
/**
 * Returns { ref, motionStyle, handlers } for a magnetic button effect.
 */
export function useMagnetic(strength = 0.25) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 280, damping: 22 });
  const sy = useSpring(y, { stiffness: 280, damping: 22 });

  const onMouseMove = useCallback((e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    x.set((e.clientX - (rect.left + rect.width  / 2)) * strength);
    y.set((e.clientY - (rect.top  + rect.height / 2)) * strength);
  }, [x, y, strength]);

  const onMouseLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  return { ref, motionStyle: { x: sx, y: sy }, handlers: { onMouseMove, onMouseLeave } };
}

// ─── CountUp hook ─────────────────────────────────────────────────────────────
/**
 * Animates a number from 0 to `to` when the element enters the viewport.
 * Returns { ref, display } — ref goes on a DOM element, display is the animated value.
 */
export function useCountUp({ to, prefix = "", suffix = "", duration = 1.6, delay = 0.1 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: false, margin: "-40px" });
  const count = useMotionValue(0);
  const display = useTransform(count, (v) => prefix + Math.round(v).toLocaleString("en-IN") + suffix);

  useEffect(() => {
    if (!inView) return;
    count.set(0);
    const ctrl = animate(count, to, { duration, delay, ease: [0.16, 1, 0.3, 1] });
    return ctrl.stop;
  }, [inView, to, count, duration, delay]);

  return { ref, display };
}

// ─── Cursor glow hook ─────────────────────────────────────────────────────────
/**
 * Attaches a radial-gradient cursor glow to a container element.
 */
export function useCursorGlow(containerRef) {
  useEffect(() => {
    const el = containerRef?.current;
    if (!el) return;
    let rafId = 0;
    const onMove = (e) => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width)  * 100;
        const y = ((e.clientY - rect.top)  / rect.height) * 100;
        el.style.setProperty("--gx", `${x}%`);
        el.style.setProperty("--gy", `${y}%`);
      });
    };
    el.addEventListener("mousemove", onMove);
    return () => {
      cancelAnimationFrame(rafId);
      el.removeEventListener("mousemove", onMove);
    };
  }, [containerRef]);
}
