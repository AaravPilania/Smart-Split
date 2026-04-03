import { motion } from "framer-motion";
import CategoryDonut from "./CategoryDonut";
import { FiArrowRight } from "react-icons/fi";

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", minimumFractionDigits: 2,
  }).format(amount);
}

export default function DashboardRightPanel({
  categoryData = [],
  settlements = [],
  recentExpenses = [],
  userId,
  theme,
  isDark,
  navigate,
}) {
  const glass = isDark
    ? { background: "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 4px 24px rgba(0,0,0,0.3)" }
    : { background: "rgba(255,255,255,0.85)", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" };

  return (
    <aside className="h-screen sticky top-0 overflow-y-auto py-6 px-5 sidebar-scroll"
      style={{ borderLeft: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)" }}>

      {/* Category Breakdown */}
      <motion.div
        className="rounded-2xl p-5 mb-5"
        style={glass}
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 280, damping: 26 }}
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-4"
          style={{ color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)" }}>
          Spending Breakdown
        </p>
        {categoryData.length > 0 ? (
          <CategoryDonut
            categoryData={categoryData}
            formatCurrency={formatCurrency}
            theme={theme}
            isDark={isDark}
          />
        ) : (
          <div className="text-center py-8">
            <p className="text-3xl mb-2">📊</p>
            <p className="text-xs" style={{ color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)" }}>
              Add expenses to see breakdown
            </p>
          </div>
        )}  
      </motion.div>
      <motion.div
        className="rounded-2xl p-5 mb-5"
        style={glass}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 26, delay: 0.1 }}
      >
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em]"
            style={{ color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)" }}>
            Recent Activity
          </p>
        </div>
        {recentExpenses.length === 0 ? (
          <p className="text-xs text-center py-4" style={{ color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)" }}>
            No recent activity
          </p>
        ) : (
          <div className="space-y-3">
            {recentExpenses.slice(0, 4).map((expense, idx) => {
              const youPaid = expense.paidBy?.id === userId || expense.paidBy?._id === userId;
              const time = expense.createdAt || expense.created_at;
              const timeStr = time ? new Date(time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "";
              return (
                <motion.div
                  key={expense.id || expense._id || idx}
                  className="flex items-start gap-3"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + idx * 0.07, type: "spring", stiffness: 300, damping: 28 }}
                  whileHover={{ x: 2, transition: { duration: 0.15 } }}
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)" }}>
                    <span className="text-xs font-bold" style={{ color: theme.gradFrom }}>
                      {(expense.paidBy?.name?.[0] || "?").toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold truncate"
                      style={{ color: isDark ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.75)" }}>
                      {expense.paidBy?.name || "Someone"}{" "}
                      <span style={{ color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)" }}>
                        {youPaid ? "paid" : "added"}
                      </span>
                    </p>
                    <p className="text-[11px] truncate capitalize"
                      style={{ color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)" }}>
                      {expense.title} · {formatCurrency(parseFloat(expense.amount || 0))}
                    </p>
                  </div>
                  <span className="text-[10px] font-medium flex-shrink-0 mt-0.5"
                    style={{ color: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.25)" }}>
                    {timeStr}
                  </span>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
      {settlements.length > 0 && (
        <motion.div
          className="rounded-2xl p-5"
          style={glass}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 240, damping: 26, delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em]"
              style={{ color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)" }}>
              Settlements
            </p>
            <button onClick={() => navigate("/balances")}
              className="text-[10px] font-semibold flex items-center gap-1"
              style={{ color: theme.gradFrom }}>
              View <FiArrowRight size={10} />
            </button>
          </div>
          <div className="space-y-2.5">
            {settlements.slice(0, 4).map((s, idx) => {
              const isOwedToUser = s.to?.id === userId || s.to?._id === userId;
              const other = isOwedToUser ? s.from : s.to;
              return (
                <motion.div
                  key={idx}
                  className="flex items-center justify-between px-2 py-1.5 rounded-xl"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + idx * 0.07, type: "spring", stiffness: 280, damping: 26 }}
                  whileHover={{
                    backgroundColor: isOwedToUser ? "rgba(16,185,129,0.07)" : "rgba(239,68,68,0.07)",
                    x: 2,
                    transition: { duration: 0.15 },
                  }}
                >
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold truncate"
                      style={{ color: isOwedToUser ? "#10b981" : "#ef4444" }}>
                      {isOwedToUser ? `${other?.name || "?"} owes you` : `You owe ${other?.name || "?"}`}
                    </p>
                  </div>
                  <p className="text-[12px] font-bold ml-2 flex-shrink-0 tabular-nums"
                    style={{ color: isOwedToUser ? "#10b981" : "#ef4444" }}>
                    {formatCurrency(parseFloat(s.amount || 0))}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}
    </aside>
  );
}
