import { useTheme } from "../utils/theme";

const TYPE_COLORS = {
  category:    { bg: "bg-orange-50 dark:bg-orange-900/20", border: "border-orange-200 dark:border-orange-800", text: "text-orange-700 dark:text-orange-300" },
  trend:       { bg: "bg-blue-50 dark:bg-blue-900/20",    border: "border-blue-200 dark:border-blue-800",    text: "text-blue-700 dark:text-blue-300" },
  social:      { bg: "bg-purple-50 dark:bg-purple-900/20",border: "border-purple-200 dark:border-purple-800",text: "text-purple-700 dark:text-purple-300" },
  action:      { bg: "bg-green-50 dark:bg-green-900/20",  border: "border-green-200 dark:border-green-800",  text: "text-green-700 dark:text-green-300" },
  income:      { bg: "bg-emerald-50 dark:bg-emerald-900/20", border: "border-emerald-200 dark:border-emerald-800", text: "text-emerald-700 dark:text-emerald-300" },
};

export default function InsightsPanel({ insights = [] }) {
  const { theme } = useTheme();

  if (!insights || insights.length === 0) return null;

  return (
    <div className="mb-6 mt-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">✦</span>
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Insights
        </h3>

      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {insights.map((insight, i) => {
          const colors = TYPE_COLORS[insight.type] || TYPE_COLORS.category;
          return (
            <div
              key={i}
              className={`flex items-start gap-3 p-3.5 rounded-2xl border ${colors.bg} ${colors.border}`}
            >
              <span className="text-2xl flex-shrink-0 leading-none mt-0.5">{insight.icon}</span>
              <div className="min-w-0">
                <p className={`text-sm font-bold ${colors.text} leading-tight truncate`}>
                  {insight.title}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
                  {insight.text}
                </p>
              </div>
              {insight.good && (
                <span className="flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400">
                  ✓ Good
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
