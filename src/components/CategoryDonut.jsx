import { motion } from "framer-motion";

const DONUT_COLORS = [
  "#ec4899", "#a855f7", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#8b5cf6",
];

export default function CategoryDonut({ categoryData = [], formatCurrency, theme, isDark }) {
  const total = categoryData.reduce((s, c) => s + c.amount, 0);
  if (!total) return null;

  const SIZE = 160, STROKE = 28, R = (SIZE - STROKE) / 2, C = Math.PI * 2 * R;
  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* SVG Donut */}
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="-rotate-90">
          {/* Background track */}
          <circle
            cx={SIZE / 2} cy={SIZE / 2} r={R}
            fill="none"
            stroke={isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"}
            strokeWidth={STROKE}
          />
          {categoryData.slice(0, 6).map((cat, i) => {
            const pct = cat.amount / total;
            const dashLen = pct * C;
            const gap = C - dashLen;
            const currentOffset = offset;
            offset += dashLen;
            return (
              <motion.circle
                key={cat.key}
                cx={SIZE / 2} cy={SIZE / 2} r={R}
                fill="none"
                stroke={DONUT_COLORS[i % DONUT_COLORS.length]}
                strokeWidth={STROKE}
                strokeLinecap="butt"
                strokeDashoffset={-currentOffset}
                initial={{ strokeDasharray: `0 ${C}` }}
                animate={{ strokeDasharray: `${dashLen} ${gap}` }}
                transition={{ delay: 0.3 + i * 0.12, duration: 0.7, ease: "easeOut" }}
              />
            );
          })}
        </svg>
        {/* Center label */}
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.35)" }}>
            Total
          </p>
          <p className="text-base font-black" style={{ color: isDark ? "#fff" : "#111" }}>
            {formatCurrency(total)}
          </p>
        </motion.div>
      </div>

      {/* Legend */}
      <div className="w-full space-y-2">
        {categoryData.slice(0, 6).map((cat, i) => {
          const pct = Math.round((cat.amount / total) * 100);
          return (
            <motion.div
              key={cat.key}
              className="flex items-center gap-2.5"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + i * 0.08, duration: 0.3 }}
            >
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
              <span className="text-xs font-semibold flex-1 truncate"
                style={{ color: isDark ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.7)" }}>
                {cat.label || cat.key}
              </span>
              <span className="text-[11px] font-bold tabular-nums"
                style={{ color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)" }}>
                {pct}%
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
