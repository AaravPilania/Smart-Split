import { useTheme } from "../utils/theme";

export default function StatsCard({ title, value, subtext, icon }) {
  const { isDark, theme } = useTheme();
  return (
    <div
      className="rounded-2xl p-5 flex justify-between items-center transition-all duration-200 hover:scale-[1.015]"
      style={isDark ? {
        background: "linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)",
        border: "1px solid rgba(255,255,255,0.11)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        boxShadow: "0 4px 28px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.09)",
      } : {
        background: "linear-gradient(135deg, #ffffff 0%, #f8f8fe 100%)",
        border: "1px solid rgba(0,0,0,0.07)",
        boxShadow: "0 2px 16px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.04)",
      }}
    >
      <div className="min-w-0 flex-1">
        <h3 className="text-gray-400 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider">{title}</h3>
        <p className="text-xl sm:text-2xl font-bold mt-1.5 truncate text-gray-900 dark:text-white">{value}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subtext}</p>
      </div>
      <div
        className="h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0 ml-4"
        style={isDark ? {
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.10)",
        } : {
          background: `linear-gradient(135deg, ${theme.gradFrom}18, ${theme.gradTo}10)`,
          border: `1px solid ${theme.gradFrom}28`,
        }}
      >
        {icon}
      </div>
    </div>
  );
}
