import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTheme, getGradientStyle, getPageBgStyle } from "../utils/theme";
import CurvedLoop from "../components/CurvedLoop";

export default function NotFound() {
  const { theme, isDark } = useTheme();

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-6"
      style={getPageBgStyle(theme, isDark)}
    >
      {/* Ambient glow — top */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none"
        style={{
          background: `radial-gradient(ellipse, ${theme.gradFrom}28 0%, transparent 70%)`,
          filter: "blur(70px)",
        }}
      />
      {/* Ambient glow — bottom */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] pointer-events-none"
        style={{
          background: `radial-gradient(ellipse, ${theme.gradTo}20 0%, transparent 70%)`,
          filter: "blur(60px)",
        }}
      />

      {/* 404 */}
      <motion.p
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="text-[9rem] md:text-[12rem] font-black leading-none select-none"
        style={{
          background: `linear-gradient(135deg, ${theme.gradFrom}, ${theme.gradTo})`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        404
      </motion.p>

      {/* Taglines */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.08 }}
        className="text-center -mt-4"
      >
        <p className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white">
          Looks like this expense went{" "}
          <span
            style={{
              background: `linear-gradient(135deg, ${theme.gradFrom}, ${theme.gradTo})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            down the drain.
          </span>
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
          The page you're looking for was split — and nobody claimed it.
        </p>
      </motion.div>

      {/* Toilet GIF — breathing room above and below */}
      <motion.div
        initial={{ opacity: 0, scale: 0.75 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 240, damping: 22, delay: 0.18 }}
        className="my-14"
      >
        <img
          src="https://media.giphy.com/media/l0HlBO7eyXzSZkJri/giphy.gif"
          alt="money down the toilet"
          className="w-48 h-48 md:w-56 md:h-56 object-cover rounded-3xl"
          style={{
            boxShadow: `0 24px 70px ${theme.gradFrom}35, 0 4px 20px rgba(0,0,0,0.25)`,
          }}
        />
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.3 }}
      >
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-8 py-3.5 text-white rounded-2xl font-semibold text-base hover:opacity-90 active:scale-95 transition-all shadow-xl"
          style={getGradientStyle(theme)}
        >
          ← Take me home
        </Link>
      </motion.div>

      {/* CurvedLoop — pinned to bottom */}
      <div className="absolute bottom-0 left-0 right-0 pb-5">
        <CurvedLoop
          marqueeText="He ✦ was ✦ here ✦ before ✦ you ✦"
          speed={2.3}
          curveAmount={0}
          direction="left"
          interactive={true}
          className={`text-xs md:text-sm font-bold uppercase tracking-[0.18em] ${
            isDark ? "text-gray-700" : "text-gray-300"
          }`}
        />
      </div>
    </div>
  );
}
