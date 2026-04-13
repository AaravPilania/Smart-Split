import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FiHome,
  FiUsers,
  FiHeart,
  FiUser,
  FiX,
  FiCamera,
} from "react-icons/fi";

import { motion, AnimatePresence } from "framer-motion";
import ScanReceipt from "./ScanReceipt";
import { apiFetch, API_URL, getUserId } from "../utils/api";
import { useTheme, getGradientStyle } from "../utils/theme";

const TABS = [
  { path: "/dashboard", icon: FiHome, label: "Home", guide: "home" },
  { path: "/groups", icon: FiUsers, label: "Groups", guide: "groups" },
  null, // ← split FAB slot
  { path: "/friends", icon: FiHeart, label: "Friends", guide: "friends" },
  { path: "/profile", icon: FiUser, label: "Profile", guide: "profile" },
];

export default function BottomNav() {
  const location = useLocation();
  const { theme, isDark } = useTheme();
  const userId = getUserId();

  const [showSheet, setShowSheet] = useState(false);
  const [showScan, setShowScan] = useState(false);
  const [groups, setGroups] = useState([]);

  const fetchGroups = async () => {
    try {
      const res = await apiFetch(`${API_URL}/groups?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setGroups(data.groups || []);
      }
    } catch {}
  };

  const handleCameraPress = () => {
    fetchGroups();
    setShowSheet(true);
  };

  const handleScanReceipt = () => {
    setShowSheet(false);
    setTimeout(() => setShowScan(true), 200);
  };

  const handleAskAaru = () => {
    setShowSheet(false);
    setTimeout(() => window.dispatchEvent(new CustomEvent("aaru-open")), 200);
  };

  return (
    <>
      {/* ── Bottom Nav Bar ───────────────────────────────────── */}
      <div
        className="fixed bottom-0 inset-x-0 z-[9990] md:hidden"
        style={{
          background: isDark
            ? "rgba(8,8,18,0.92)"
            : `linear-gradient(180deg, rgba(255,255,255,0.90), rgba(255,255,255,0.95))`,
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          borderTop: isDark
            ? "1px solid rgba(255,255,255,0.07)"
            : `1px solid ${theme.gradFrom}18`,
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <div
          className="flex items-center justify-around max-w-lg mx-auto px-2"
          style={{ height: "64px" }}
        >
          {TABS.map((tab, i) => {
            // ── Center camera FAB ────────────────────────────
            if (!tab) {
              return (
                <button
                  key="camera-fab"
                  onClick={handleCameraPress}
                  data-guide="fab"
                  className="relative w-14 h-14 rounded-[18px] text-white shadow-2xl transition-all active:scale-95 flex items-center justify-center fab-lightning"
                  style={{
                    ...getGradientStyle(theme),
                    marginTop: "-24px",
                    boxShadow: `0 10px 36px ${theme.gradFrom}70, 0 4px 16px rgba(0,0,0,0.4)`,
                  }}
                  aria-label="Quick actions"
                >
                  {/* Custom bolt with edge-tracing electric sparks */}
                  <svg width="28" height="28" viewBox="0 0 24 24" className="relative z-10" style={{ overflow: 'visible', filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.5))' }}>
                    <defs>
                      <filter id="spark-glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="1" result="blur"/>
                        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                      </filter>
                    </defs>
                    {/* Main bolt shape */}
                    <path d="M13 2 L5.5 13 L11 13 L8 22 L18.5 11 L13 11 L16 2 Z" fill="white" />
                    {/* Traveling spark 1 — races around bolt outline */}
                    <path d="M13 2 L5.5 13 L11 13 L8 22 L18.5 11 L13 11 L16 2 Z"
                      fill="none" stroke="#60a5fa" strokeWidth="1.4" strokeLinecap="round"
                      strokeDasharray="6 53" filter="url(#spark-glow)" className="bolt-trace" />
                    {/* Traveling spark 2 — opposite phase */}
                    <path d="M13 2 L5.5 13 L11 13 L8 22 L18.5 11 L13 11 L16 2 Z"
                      fill="none" stroke="#93c5fd" strokeWidth="1" strokeLinecap="round"
                      strokeDasharray="4 55" filter="url(#spark-glow)" className="bolt-trace bolt-trace-2" />
                    {/* Corner zap sparks — branch out at jag points */}
                    <polyline points="5.5,13 3.5,11.5 4.8,10.6 3,9.5" stroke="#60a5fa" strokeWidth="0.9" fill="none" strokeLinecap="round" filter="url(#spark-glow)" className="bolt-zag bolt-zag-1" />
                    <polyline points="18.5,11 20.5,12.5 19.2,13.3 21,14.5" stroke="#60a5fa" strokeWidth="0.9" fill="none" strokeLinecap="round" filter="url(#spark-glow)" className="bolt-zag bolt-zag-2" />
                    <polyline points="8,22 6.5,23 7.5,23.8 6,24.5" stroke="#93c5fd" strokeWidth="0.8" fill="none" strokeLinecap="round" filter="url(#spark-glow)" className="bolt-zag bolt-zag-3" />
                  </svg>
                </button>
              );
            }

            // ── Regular tab ──────────────────────────────────
            const Icon = tab.icon;
            const active = location.pathname === tab.path;
            return (
              <Link
                key={tab.path}
                to={tab.path}
                data-guide={tab.guide}
                className="flex flex-col items-center justify-center gap-1 px-4 h-full transition-all active:scale-90"
              >
                <Icon
                  size={21}
                  style={{
                    color: active
                      ? theme.gradFrom
                      : isDark
                      ? "rgba(255,255,255,0.35)"
                      : "rgba(0,0,0,0.35)",
                    transition: "color 0.2s ease",
                  }}
                />
                <span
                  className="text-[10px] font-semibold tracking-wide"
                  style={{
                    color: active
                      ? theme.gradFrom
                      : isDark
                      ? "rgba(255,255,255,0.35)"
                      : "rgba(0,0,0,0.35)",
                    transition: "color 0.2s ease",
                  }}
                >
                  {tab.label}
                </span>
                {/* Active dot */}
                {active && (
                  <span
                    className="absolute bottom-1.5 w-1 h-1 rounded-full"
                    style={{ background: theme.gradFrom }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Quick Actions Sheet ──────────────────────────────── */}
      <AnimatePresence>
        {showSheet && (
          <>
            <motion.div
              key="sheet-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm md:hidden"
              onClick={() => setShowSheet(false)}
            />
            <motion.div
              key="sheet-panel"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed bottom-0 inset-x-0 z-50 rounded-t-3xl md:hidden"
              style={{
                background: isDark ? "rgba(11,11,21,0.97)" : "#ffffff",
                backdropFilter: "blur(32px)",
                borderTop: isDark
                  ? "1px solid rgba(255,255,255,0.09)"
                  : "1px solid rgba(0,0,0,0.08)",
                paddingBottom: "env(safe-area-inset-bottom)",
              }}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-9 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
              </div>

              {/* Title row */}
              <div className="flex items-center justify-between px-5 py-3">
                <p className="font-bold text-gray-800 dark:text-white text-base">
                  Quick Actions
                </p>
                <button
                  onClick={() => setShowSheet(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500"
                >
                  <FiX size={15} />
                </button>
              </div>

              {/* Action cards */}
              <div className="grid grid-cols-2 gap-3 px-5 pb-6 pt-2">
                {/* Scan Receipt */}
                <button
                  onClick={handleScanReceipt}
                  className="flex flex-col items-center gap-3 p-5 rounded-2xl transition-all active:scale-95"
                  style={{
                    background: isDark
                      ? "rgba(255,255,255,0.05)"
                      : "rgba(0,0,0,0.03)",
                    border: isDark
                      ? "1px solid rgba(255,255,255,0.08)"
                      : "1px solid rgba(0,0,0,0.07)",
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white"
                    style={getGradientStyle(theme)}
                  >
                    <FiCamera size={22} />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-gray-800 dark:text-white text-sm">
                      Scan Receipt
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      OCR · UPI QR
                    </p>
                  </div>
                </button>

                {/* Ask Aaru */}
                <button
                  onClick={handleAskAaru}
                  className="flex flex-col items-center gap-3 p-5 rounded-2xl transition-all active:scale-95"
                  style={{
                    background: isDark
                      ? "rgba(255,255,255,0.05)"
                      : "rgba(0,0,0,0.03)",
                    border: isDark
                      ? "1px solid rgba(255,255,255,0.08)"
                      : "1px solid rgba(0,0,0,0.07)",
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden"
                    style={{
                      background: `linear-gradient(135deg, ${theme.gradFrom}22, ${theme.gradTo}22)`,
                      border: `1.5px solid ${theme.gradFrom}44`,
                    }}
                  >
                    <img
                      src="/aaru-robot.svg"
                      alt="Aaru"
                      className="w-8 h-8"
                      style={{ objectFit: "contain" }}
                    />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-gray-800 dark:text-white text-sm">
                      Ask Aaru
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      AI expense chat
                    </p>
                  </div>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Scan Receipt Modal ───────────────────────────────── */}
      {showScan && (
        <ScanReceipt
          groups={groups}
          userId={userId}
          onExpenseCreated={() => setShowScan(false)}
          onClose={() => setShowScan(false)}
        />
      )}
    </>
  );
}
