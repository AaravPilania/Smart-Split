import { useTheme } from "../utils/theme";

const TYPE_STYLE = {
  category: { icon: "🏷️", grad: "linear-gradient(135deg, #f97316, #ec4899)" },
  trend:    { icon: "📈", grad: "linear-gradient(135deg, #3b82f6, #06b6d4)" },
  social:   { icon: "👥", grad: "linear-gradient(135deg, #8b5cf6, #ec4899)" },
  action:   { icon: "⚡", grad: "linear-gradient(135deg, #10b981, #3b82f6)" },
  income:   { icon: "💚", grad: "linear-gradient(135deg, #10b981, #059669)" },
};

export default function InsightsPanel({ insights = [] }) {
  const { isDark } = useTheme();

  if (!insights || insights.length === 0) return null;

  return (
    <div className="space-y-2.5">
      {insights.map((insight, i) => {
        const ts = TYPE_STYLE[insight.type] || TYPE_STYLE.category;
        return (
          <div
            key={i}
            className="flex items-start gap-3.5 p-4 rounded-2xl"
            style={{
              background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.025)",
              border: isDark ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(0,0,0,0.06)",
            }}
          >
            {/* Icon pill */}
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
              style={{ background: ts.grad, boxShadow: "0 4px 12px rgba(0,0,0,0.25)" }}
            >
              {insight.icon}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0 pt-0.5">
              <p className="text-[13px] font-bold leading-tight"
                style={{ color: isDark ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.82)" }}>
                {insight.title}
              </p>
              <p className="text-xs mt-0.5 leading-snug"
                style={{ color: isDark ? "rgba(255,255,255,0.42)" : "rgba(0,0,0,0.44)" }}>
                {insight.text}
              </p>
            </div>

            {/* "Good" badge */}
            {insight.good && (
              <span className="flex-shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full self-start mt-0.5"
                style={{
                  background: isDark ? "rgba(16,185,129,0.18)" : "rgba(16,185,129,0.12)",
                  color: "#10b981",
                  border: "1px solid rgba(16,185,129,0.25)",
                }}>
                ✓
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
