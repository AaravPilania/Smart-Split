import { useState, useEffect, useRef, useCallback } from "react";
import Navbar from "./Navbar";
import BottomNav from "./BottomNav";
import DashboardSidebar from "./DashboardSidebar";
import { useTheme, getPageBgStyle } from "../utils/theme";

/**
 * Shared layout wrapper: desktop shows sidebar + content, mobile shows Navbar + BottomNav.
 * Desktop gets ambient background glows + cursor glow effect.
 * Usage: <DesktopLayout> ...page content... </DesktopLayout>
 */
export default function DesktopLayout({ children, hideBottomNav = false }) {
  const { theme, isDark } = useTheme();
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== "undefined" && window.innerWidth >= 768
  );
  const glowRef = useRef(null);

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Cursor glow: update CSS vars --gx / --gy on mousemove
  const onMouseMove = useCallback((e) => {
    const el = glowRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--gx", `${((e.clientX - rect.left) / rect.width)  * 100}%`);
    el.style.setProperty("--gy", `${((e.clientY - rect.top)  / rect.height) * 100}%`);
  }, []);

  if (isDesktop) {
    return (
      <div
        ref={glowRef}
        onMouseMove={onMouseMove}
        className="min-h-screen desktop-cursor-glow relative"
        style={getPageBgStyle(theme, isDark)}
      >
        {/* Ambient background layer — very subtle, never distracts from content */}
        <div className="desktop-ambient-dots" aria-hidden />
        <div className="desktop-glow-a"        aria-hidden />
        <div className="desktop-glow-b"        aria-hidden />

        {/* 3-column grid sits on top (z-index: 1) */}
        <div className="relative z-[1]" style={{ display: "grid", gridTemplateColumns: "260px 1fr", minHeight: "100vh" }}>
          <DashboardSidebar goals={[]} />
          <main className="overflow-y-auto page-enter-desktop">{children}</main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={getPageBgStyle(theme, isDark)}>
      <Navbar />
      {children}
      {!hideBottomNav && <BottomNav />}
    </div>
  );
}
