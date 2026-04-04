import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTheme } from "../utils/theme";

/* Pink → orange gradient constants (matches project theme) */
const G_FROM = "#ec4899";
const G_TO   = "#f97316";

/* Arrow icon — rotated variants */
function Arrow({ rotate = 0, size = 72 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 72 72"
      fill="none"
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      <rect width="72" height="72" rx="18" fill={`url(#ag${rotate})`} />
      <path
        d="M22 50 L50 22M50 22H30M50 22V42"
        stroke="white"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient id={`ag${rotate}`} x1="0" y1="0" x2="72" y2="72" gradientUnits="userSpaceOnUse">
          <stop stopColor={G_FROM} />
          <stop offset="1" stopColor={G_TO} />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* Navigation pills inside the card */
const NAV_LINKS = [
  { to: "/dashboard", label: "Dashboard",   desc: "Your splits at a glance" },
  { to: "/expenses",  label: "Expenses",    desc: "Manage all your expenses" },
  { to: "/friends",   label: "Friends",     desc: "See who owes what" },
];

export default function NotFound() {
  useTheme(); // keep theme context alive

  return (
    <div className="min-h-screen w-full bg-black flex items-center justify-center overflow-hidden relative select-none">

      {/* ── LEFT  "4" ── */}
      <motion.div
        initial={{ opacity: 0, x: -60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col items-start"
        style={{ paddingLeft: "clamp(0px, 2vw, 48px)" }}
      >
        {/* top-left arrow */}
        <div className="mb-4 ml-1">
          <Arrow rotate={0} size={56} />
        </div>
        <span
          className="font-black leading-none"
          style={{
            fontSize: "clamp(140px, 22vw, 320px)",
            color: "white",
            letterSpacing: "-0.04em",
          }}
        >
          4
        </span>
      </motion.div>

      {/* ── RIGHT "4" ── */}
      <motion.div
        initial={{ opacity: 0, x: 60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col items-end"
        style={{ paddingRight: "clamp(0px, 2vw, 48px)" }}
      >
        <span
          className="font-black leading-none"
          style={{
            fontSize: "clamp(140px, 22vw, 320px)",
            color: "white",
            letterSpacing: "-0.04em",
          }}
        >
          4
        </span>
        {/* bottom-right arrows */}
        <div className="mt-4 flex gap-3 mr-1">
          <Arrow rotate={90} size={48} />
          <Arrow rotate={180} size={48} />
        </div>
      </motion.div>

      {/* ── CENTRE CARD ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.88, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        className="relative z-10 bg-white rounded-3xl shadow-2xl flex flex-col items-center overflow-hidden"
        style={{
          width: "clamp(300px, 90vw, 420px)",
          padding: "2rem 1.75rem 1.75rem",
          boxShadow: `0 32px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06)`,
        }}
      >
        {/* Header text */}
        <p
          className="text-2xl font-black text-center leading-tight mb-1"
          style={{
            background: `linear-gradient(135deg, ${G_FROM}, ${G_TO})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          ... 404 error ...
        </p>
        <p className="text-[1.45rem] font-extrabold text-gray-900 text-center leading-snug mb-4">
          Sorry, page not<br />found
        </p>

        {/* Toilet GIF */}
        <div className="w-full rounded-2xl overflow-hidden mb-5" style={{ aspectRatio: "1/1" }}>
          <img
            src="/videos/toilet%20breaking%20GIF.gif"
            alt="toilet breaking"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Subtitle */}
        <p className="text-xs text-gray-400 text-center mb-4">
          Go to other sections to learn more about Smart Split
        </p>

        {/* Nav pills */}
        <div className="w-full flex flex-col gap-2">
          {NAV_LINKS.map(({ to, label, desc }, i) => (
            <motion.div
              key={to}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.28 + i * 0.07, duration: 0.4 }}
            >
              <Link
                to={to}
                className="flex items-center justify-between w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 hover:bg-gray-100 transition-colors group"
              >
                <div>
                  <p
                    className="text-sm font-semibold"
                    style={{
                      background: i === 0 ? `linear-gradient(135deg, ${G_FROM}, ${G_TO})` : undefined,
                      WebkitBackgroundClip: i === 0 ? "text" : undefined,
                      WebkitTextFillColor: i === 0 ? "transparent" : undefined,
                      backgroundClip: i === 0 ? "text" : undefined,
                      color: i === 0 ? undefined : "#111827",
                    }}
                  >
                    {label}
                  </p>
                  <p className="text-xs text-gray-400">{desc}</p>
                </div>
                <span
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-sm font-bold"
                  style={{
                    background: i === 0
                      ? `linear-gradient(135deg, ${G_FROM}, ${G_TO})`
                      : "#e5e7eb",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M3 13 L13 3M13 3H7M13 3V9"
                      stroke={i === 0 ? "white" : "#9ca3af"}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
