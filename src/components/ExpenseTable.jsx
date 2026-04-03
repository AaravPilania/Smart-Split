import { getCategoryInfo, detectCategory } from "../utils/categories";
import { motion } from "framer-motion";

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", minimumFractionDigits: 2,
  }).format(amount);
}

function formatDateTime(dateString) {
  if (!dateString) return "";
  const d = new Date(dateString);
  return d.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "2-digit" }) +
    "\n" + d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

export default function ExpenseTable({ expenses = [], userId, isDark, theme, glass }) {
  if (expenses.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-4xl mb-2">🧾</p>
        <p className="text-sm" style={{ color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)" }}>
          No expenses yet — add your first one!
        </p>
      </div>
    );
  }

  const headerStyle = {
    color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)",
  };
  const cellStyle = {
    color: isDark ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.8)",
  };
  const rowBorder = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr style={{ borderBottom: `1px solid ${rowBorder}` }}>
            <th className="text-[11px] font-bold uppercase tracking-wider pb-3 pl-1" style={headerStyle}>
              Transaction Name
            </th>
            <th className="text-[11px] font-bold uppercase tracking-wider pb-3" style={headerStyle}>
              Date &amp; Time
            </th>
            <th className="text-[11px] font-bold uppercase tracking-wider pb-3" style={headerStyle}>
              Amount
            </th>
            <th className="text-[11px] font-bold uppercase tracking-wider pb-3 hidden xl:table-cell" style={headerStyle}>
              Note
            </th>
            <th className="text-[11px] font-bold uppercase tracking-wider pb-3 text-right pr-1" style={headerStyle}>
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((expense, idx) => {
            const catInfo = getCategoryInfo(expense.category || detectCategory(expense.title || ""));
            const youPaid = expense.paidBy?.id === userId || expense.paidBy?._id === userId;
            const isSettled = expense.settled;
            return (
              <motion.tr
                key={expense.id || expense._id || idx}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05, type: "spring", stiffness: 300, damping: 28 }}
                style={{ borderBottom: idx < expenses.length - 1 ? `1px solid ${rowBorder}` : "none" }}
                className="group cursor-default"
                whileHover={{
                  backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.025)",
                  x: 3,
                  transition: { duration: 0.15 }
                }}
              >
                {/* Name + Category */}
                <td className="py-3.5 pl-1">
                  <div className="flex items-center gap-3">
                    <motion.span
                      className="text-lg flex-shrink-0"
                      whileHover={{ scale: 1.3, rotate: 8, transition: { type: "spring", stiffness: 400 } }}
                    >
                      {catInfo.icon}
                    </motion.span>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold truncate capitalize" style={cellStyle}>
                        {expense.title}
                      </p>
                      <p className="text-[11px] mt-0.5"
                        style={{ color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)" }}>
                        {catInfo.label}
                      </p>
                    </div>
                  </div>
                </td>
                {/* Date */}
                <td className="py-3.5">
                  <p className="text-[12px] font-medium whitespace-pre-line leading-tight" style={cellStyle}>
                    {formatDateTime(expense.createdAt || expense.created_at)}
                  </p>
                </td>
                {/* Amount */}
                <td className="py-3.5">
                  <p className="text-[13px] font-bold tabular-nums" style={cellStyle}>
                    {formatCurrency(parseFloat(expense.amount || 0))}
                  </p>
                </td>
                {/* Note */}
                <td className="py-3.5 hidden xl:table-cell">
                  <p className="text-[12px] truncate max-w-[180px]"
                    style={{ color: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)" }}>
                    {expense.group?.name || "—"}
                  </p>
                </td>
                {/* Status */}
                <td className="py-3.5 text-right pr-1">
                  <motion.span
                    whileHover={{ scale: 1.08, transition: { type: "spring", stiffness: 500 } }}
                    className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                      isSettled
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : youPaid
                          ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    }`}>
                    {isSettled ? "Settled" : youPaid ? "You Paid" : "Pending"}
                  </motion.span>
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
