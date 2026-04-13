import { useState, useEffect, useRef, useCallback } from "react";
import Navbar from "./Navbar";
import DashboardSidebar from "./DashboardSidebar";
import { useTheme, getPageBgStyle } from "../utils/theme";

/**
 * Shared layout wrapper: desktop shows sidebar + content, mobile shows Navbar + BottomNav.
 * Desktop gets ambient background glows + cursor glow effect.
 * Usage: <DesktopLayout> ...page content... </DesktopLayout>
 */
export default function DesktopLayout({ children, hideBottomNav = false }) {
  const { theme, isDark } = useTheme();
  const isRealDesktop = () =>
    typeof window !== "undefined" &&
    window.innerWidth >= 768 &&
    !window.matchMedia("(pointer: coarse)").matches;
  const [isDesktop, setIsDesktop] = useState(isRealDesktop);
  const glowRef = useRef(null);

  useEffect(() => {
    const onResize = () => setIsDesktop(isRealDesktop());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Cursor glow: update CSS vars --gx / --gy on mousemove (throttled to rAF)
  const rafRef = useRef(0);
  const onMouseMove = useCallback((e) => {
    const el = glowRef.current;
    if (!el) return;
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect();
      el.style.setProperty("--gx", `${((e.clientX - rect.left) / rect.width)  * 100}%`);
      el.style.setProperty("--gy", `${((e.clientY - rect.top)  / rect.height) * 100}%`);
    });
  }, []);

  if (isDesktop) {
    return (
      <div
        ref={glowRef}
        onMouseMove={onMouseMove}
        className="desktop-cursor-glow relative"
        style={{ ...getPageBgStyle(theme, isDark), height: "100vh", overflow: "hidden" }}
      >
        {/* Ambient background layer — very subtle, never distracts from content */}
        <div className="desktop-ambient-dots" aria-hidden />
        <div className="desktop-glow-a"        aria-hidden />
        <div className="desktop-glow-b"        aria-hidden />

        {/* 3-column grid sits on top (z-index: 1) */}
        <div className="relative z-[1]" style={{ display: "grid", gridTemplateColumns: "68px 1fr", height: "100vh" }}>
          <DashboardSidebar goals={[]} />
          <main className="overflow-y-auto page-enter-desktop">{children}</main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={getPageBgStyle(theme, isDark)}>
      <Navbar />
      <div className="h-16" />
      {children}
    </div>
  );
}
