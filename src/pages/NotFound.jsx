import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTheme } from "../utils/theme";

const G_FROM = "#ec4899";
const G_TO   = "#f97316";

/* Gradient arrow rounded-square */
function ArrowBtn({ rotate = 0, size = 60, id }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none">
      <rect width="60" height="60" rx="14" fill={`url(#g${id})`} />
      <path
        d="M18 42 L42 18M42 18H26M42 18V34"
        stroke="white"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ transform: `rotate(${rotate}deg)`, transformOrigin: "center" }}
      />
      <defs>
        <linearGradient id={`g${id}`} x1="0" y1="0" x2="60" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor={G_FROM} />
          <stop offset="1" stopColor={G_TO} />
        </linearGradient>
      </defs>
    </svg>
  );
}

const NAV_LINKS = [
  { to: "/dashboard", label: "Dashboard", desc: "Your splits at a glance" },
  { to: "/expenses",  label: "Expenses",  desc: "Manage all your expenses" },
  { to: "/friends",   label: "Friends",   desc: "See who owes what" },
];

export default function NotFound() {
  useTheme();

  return (
    <div
      className="w-screen h-screen bg-black overflow-hidden relative flex items-center justify-center"
      style={{ fontFamily: "inherit" }}
    >
      {/* ═══ LEFT "4" — bottom-left, massive, partially cut off ═══ */}
      <motion.span
        initial={{ opacity: 0, x: -80 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
        className="absolute font-black text-white leading-none pointer-events-none"
        style={{
          fontSize: "clamp(220px, 34vw, 480px)",
          bottom: "-4%",
          left: "-1%",
          lineHeight: 0.85,
          userSelect: "none",
        }}
      >
        4
      </motion.span>

      {/* ═══ TOP-LEFT ARROW — independently positioned ═══ */}
      <motion.div
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="absolute"
        style={{ top: "32%", left: "3%" }}
      >
        <ArrowBtn rotate={0} size={58} id="tl" />
      </motion.div>

      {/* ═══ RIGHT "4" — bottom-right, massive, partially cut off ═══ */}
      <motion.span
        initial={{ opacity: 0, x: 80 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
        className="absolute font-black text-white leading-none pointer-events-none"
        style={{
          fontSize: "clamp(220px, 34vw, 480px)",
          bottom: "-4%",
          right: "-1%",
          lineHeight: 0.85,
          userSelect: "none",
        }}
      >
        4
      </motion.span>

      {/* ═══ BOTTOM-RIGHT ARROWS — independently positioned ═══ */}
      <motion.div
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="absolute flex gap-2"
        style={{ bottom: "3%", right: "2.5%" }}
      >
        <ArrowBtn rotate={45} size={54} id="br1" />
        <ArrowBtn rotate={135} size={54} id="br2" />
      </motion.div>

      {/* ═══ CENTRE CARD ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.93 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
        className="relative z-10 bg-white flex flex-col items-center overflow-y-auto"
        style={{
          width: "clamp(280px, 34vw, 400px)",
          maxHeight: "92vh",
          borderRadius: "28px",
          padding: "1.6rem 1.5rem 1.5rem",
          boxShadow: "0 40px 100px rgba(0,0,0,0.7)",
        }}
      >
        {/* "... 404 error ..." */}
        <p
          className="text-xl font-black text-center mb-1"
          style={{
            background: `linear-gradient(90deg, ${G_FROM}, ${G_TO})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          ... 404 error ...
        </p>

        {/* "Sorry, page not found" */}
        <p className="text-[1.35rem] font-extrabold text-gray-900 text-center leading-[1.25] mb-4">
          Sorry, page not<br />found
        </p>

        {/* GIF */}
        <div className="w-full rounded-2xl overflow-hidden mb-4" style={{ aspectRatio: "1/1" }}>
          <img
            src="/videos/toilet%20breaking%20GIF.gif"
            alt="toilet breaking"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Subtitle */}
        <p className="text-[11px] text-gray-400 text-center mb-3 leading-snug">
          Go to other sections to learn more about Smart Split
        </p>

        {/* Nav rows */}
        <div className="w-full flex flex-col gap-[6px]">
          {NAV_LINKS.map(({ to, label, desc }, i) => (
            <motion.div
              key={to}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.07 }}
            >
              <Link
                to={to}
                className="flex items-center justify-between w-full px-4 py-[10px] rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-100"
              >
                <div>
                  <p
                    className="text-[13px] font-semibold leading-tight"
                    style={
                      i === 0
                        ? {
                            background: `linear-gradient(90deg, ${G_FROM}, ${G_TO})`,
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                          }
                        : { color: "#111827" }
                    }
                  >
                    {label}
                  </p>
                  <p className="text-[11px] text-gray-400">{desc}</p>
                </div>

                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    background: i === 0
                      ? `linear-gradient(135deg, ${G_FROM}, ${G_TO})`
                      : "#e5e7eb",
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path
                      d="M2.5 11.5 L11.5 2.5M11.5 2.5H5.5M11.5 2.5V8.5"
                      stroke={i === 0 ? "white" : "#9ca3af"}
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
