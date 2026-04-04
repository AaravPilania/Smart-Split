import { useState } from "react";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { FiArrowRight, FiCopy, FiCheck } from "react-icons/fi";
import { getCategoryInfo } from "../utils/categories";

// Map category keys to emojis — keys match categories.js exactly
const CAT_EMOJI = {
  food:          "🍕",
  travel:        "✈️",
  home:          "🏠",
  entertainment: "🎬",
  shopping:      "🛍️",
  health:        "💊",
  utilities:     "💡",
  love:          "❤️",
  other:         "💸",
};

function formatAmt(n) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(n);
}

function fmtDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function DashboardRightPanel({
  settlements = [],
  userId,
  user,
  theme,
  isDark,
  navigate,
  onScanReceipt,
  recentExpenses = [],
}) {
  const [copied, setCopied] = useState(false);

  // Unique contacts from settlements
  const contacts = [];
  const seen = new Set();
  settlements.forEach((s) => {
    const isOwedToUser = s.to?.id === userId || s.to?._id === userId;
    const other = isOwedToUser ? s.from : s.to;
    const id = other?._id || other?.id;
    if (id && !seen.has(id)) { seen.add(id); contacts.push(other); }
  });

  const upiId = user?.upiId || "";
  const upiString = upiId
    ? `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(user?.name || "Smart Split")}`
    : "";

  const copyUpi = () => {
    if (!upiId) return;
    navigator.clipboard.writeText(upiId).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <aside
      className="h-screen sticky top-0 overflow-y-auto py-8 px-5 sidebar-scroll flex flex-col"
      style={{
        borderLeft: isDark ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(0,0,0,0.07)",
        background: isDark
          ? "linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 100%)"
          : "rgba(255,255,255,0.3)",
        backdropFilter: isDark ? "blur(12px)" : "none",
      }}
    >
      {/* Quick Send */}
      <motion.div
        className="mb-5"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 26 }}
      >
        <p className="text-[15px] font-black mb-0.5" style={{ color: isDark ? "#fff" : "#111" }}>
          Quick send
        </p>
        <p className="text-[11px] mb-3" style={{ color: isDark ? "rgba(255,255,255,0.38)" : "rgba(0,0,0,0.4)" }}>
          Tap a contact to settle up
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          {contacts.length > 0
            ? contacts.slice(0, 5).map((contact, i) => (
                <motion.button
                  key={contact._id || contact.id || i}
                  onClick={() => navigate("/balances")}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-lg"
                  title={contact.name}
                  style={{
                    background: `linear-gradient(135deg, ${theme.gradFrom}, ${theme.gradTo})`,
                    border: isDark ? "2px solid rgba(255,255,255,0.12)" : "2px solid rgba(255,255,255,0.9)",
                  }}
                  whileHover={{ scale: 1.12 }}
                  whileTap={{ scale: 0.92 }}
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.06, type: "spring", stiffness: 400, damping: 20 }}
                >
                  {(contact.name?.[0] || "?").toUpperCase()}
                </motion.button>
              ))
            : (
                <p className="text-[11px]" style={{ color: isDark ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.3)" }}>
                  No pending balances yet
                </p>
              )}
          <motion.button
            onClick={() => navigate("/friends")}
            title="Add Friend"
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
              border: isDark ? "2px dashed rgba(255,255,255,0.2)" : "2px dashed rgba(0,0,0,0.12)",
            }}
            whileHover={{ scale: 1.1 }}
          >
            <FiArrowRight size={12} style={{ color: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.38)" }} />
          </motion.button>
        </div>
      </motion.div>

      {/* UPI ID + QR */}
      <motion.div
        className="rounded-2xl p-4 mb-5"
        style={{
          background: isDark
            ? "linear-gradient(135deg, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0.02) 100%)"
            : "rgba(255,255,255,0.88)",
          border: isDark ? "1px solid rgba(255,255,255,0.09)" : "1px solid rgba(0,0,0,0.07)",
          boxShadow: isDark ? "0 4px 24px rgba(0,0,0,0.3)" : "0 2px 12px rgba(0,0,0,0.06)",
        }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 26, delay: 0.08 }}
      >
        <p className="text-[9px] font-black uppercase tracking-[0.16em] mb-3" style={{ color: isDark ? "rgba(255,255,255,0.33)" : "rgba(0,0,0,0.33)" }}>
          Your UPI
        </p>
        {upiId ? (
          <>
            <div className="flex justify-center mb-3">
              <div className="p-2.5 rounded-xl" style={{ background: "#fff" }}>
                <QRCodeSVG value={upiString} size={100} bgColor="#ffffff" fgColor="#0d0d0d" level="M" />
              </div>
            </div>
            <div
              className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl"
              style={{
                background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.06)",
              }}
            >
              <p className="text-[11px] font-semibold truncate" style={{ color: isDark ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.65)" }}>
                {upiId}
              </p>
              <button onClick={copyUpi} className="flex-shrink-0 transition hover:scale-110" title="Copy UPI ID">
                {copied
                  ? <FiCheck size={14} color="#10b981" />
                  : <FiCopy size={14} style={{ color: isDark ? "rgba(255,255,255,0.42)" : "rgba(0,0,0,0.38)" }} />}
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-3">
            <p className="text-[11px] mb-3" style={{ color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.38)" }}>
              No UPI ID set yet
            </p>
            <button
              onClick={() => navigate("/profile")}
              className="text-[11px] font-bold px-3 py-1.5 rounded-xl"
              style={{ background: `linear-gradient(135deg, ${theme.gradFrom}, ${theme.gradTo})`, color: "#fff" }}
            >
              Add UPI ID
            </button>
          </div>
        )}
      </motion.div>

      {/* Recent Transactions */}
      <motion.div
        className="flex-1 flex flex-col min-h-0 rounded-2xl p-4"
        style={{
          background: isDark
            ? "linear-gradient(135deg, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0.02) 100%)"
            : "rgba(255,255,255,0.88)",
          border: isDark ? "1px solid rgba(255,255,255,0.09)" : "1px solid rgba(0,0,0,0.07)",
          boxShadow: isDark ? "0 4px 24px rgba(0,0,0,0.3)" : "0 2px 12px rgba(0,0,0,0.06)",
        }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 26, delay: 0.15 }}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-[13px] font-black" style={{ color: isDark ? "#fff" : "#111" }}>
            Recent Transactions
          </p>
          <button
            onClick={() => navigate("/expenses")}
            className="text-[10px] font-bold flex items-center gap-0.5 transition hover:opacity-70"
            style={{ color: theme.gradFrom }}
          >
            View All <FiArrowRight size={10} />
          </button>
        </div>
        {recentExpenses.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-8">
            <p className="text-[11px]" style={{ color: isDark ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.3)" }}>
              No transactions yet
            </p>
          </div>
        ) : (
          <div className="flex flex-col overflow-y-auto sidebar-scroll" style={{ maxHeight: "calc(100vh - 380px)" }}>
            {recentExpenses.slice(0, 7).map((exp, i) => {
              const cat = (exp.category || "other").toLowerCase();
              // Use CAT_EMOJI first; fall back to getCategoryInfo icon from categories.js
              const emoji = CAT_EMOJI[cat] || getCategoryInfo(cat).icon || "💸";
              const amt = parseFloat(exp.amount || 0);
              const maxIdx = Math.min(recentExpenses.length, 7) - 1;
              return (
                <div
                  key={exp._id || exp.id || i}
                  className="flex items-center gap-2.5 py-2.5"
                  style={{
                    borderBottom: i < maxIdx
                      ? (isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.05)")
                      : "none",
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                    style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)" }}
                  >
                    {emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold truncate" style={{ color: isDark ? "rgba(255,255,255,0.88)" : "rgba(0,0,0,0.82)" }}>
                      {exp.title || "Expense"}
                    </p>
                    <p className="text-[10px]" style={{ color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.4)" }}>
                      {fmtDate(exp.createdAt || exp.created_at)}
                    </p>
                  </div>
                  <p className="text-[12px] font-bold flex-shrink-0" style={{ color: "#ef4444" }}>
                    {formatAmt(amt)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </aside>
  );
}