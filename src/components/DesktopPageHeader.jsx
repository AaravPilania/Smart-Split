import { motion } from "framer-motion";
import { useTheme } from "../utils/theme";

/**
 * Premium desktop page header — consistent across all inner pages.
 * Matches the Dashboard's visual quality.
 *
 * Props:
 *  label     — small caps label above the title (e.g. "MANAGE")
 *  title     — main heading (plain text)
 *  gradWord  — word inside title rendered with gradient
 *  subtitle  — optional grey subtitle line
 *  actions   — optional JSX rendered on the right
 */
export default function DesktopPageHeader({ label, title, gradWord, subtitle, actions }) {
  const { theme, isDark } = useTheme();

  return (
    <motion.div
      className="flex items-start justify-between mb-8"
      initial={{ opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 340, damping: 28 }}
    >
      <div>
        {label && (
          <p
            className="text-[10px] font-black uppercase tracking-[0.22em] mb-1.5"
            style={{ color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)" }}
          >
            {label}
          </p>
        )}
        <h1
          className="text-[2rem] font-black leading-[1.1] tracking-tight"
          style={{ color: isDark ? "#fff" : "#0d0d0d" }}
        >
          {title}{" "}
          {gradWord && (
            <span
              style={{
                background: `linear-gradient(90deg, ${theme.gradFrom} 0%, ${theme.gradTo} 100%)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {gradWord}
            </span>
          )}
        </h1>
        {subtitle && (
          <p
            className="text-[13px] mt-1"
            style={{ color: isDark ? "rgba(255,255,255,0.38)" : "rgba(0,0,0,0.38)" }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2.5 flex-shrink-0">
          {actions}
        </div>
      )}
    </motion.div>
  );
}
