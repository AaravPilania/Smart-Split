import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTheme } from "../utils/theme";

const G_FROM = "#ec4899";
const G_TO   = "#f97316";

function ArrowBtn({ rotate = 0, size = 58, id }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none">
      <rect width="60" height="60" rx="14" fill={`url(#g${id})`} />
      {/* NE-pointing arrow; rotate via CSS */}
      <g style={{ transform: `rotate(${rotate}deg)`, transformOrigin: "30px 30px" }}>
        <path
          d="M18 42 L42 18M42 18H26M42 18V34"
          stroke="white"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
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
    /* 3-column grid: each column = 1/3 of viewport width */
    <div
      className="w-screen h-screen bg-black overflow-hidden"
      style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", alignItems: "center" }}
    >
      {/* ── COL 1: LEFT "4" + top arrow ── */}
      <div className="relative flex items-center justify-center h-full overflow-hidden">
        {/* TOP-LEFT ARROW */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, delay: 0.2 }}
          className="absolute"
          style={{ top: "10%", left: "10%" }}
        >
          <ArrowBtn rotate={0} size={58} id="tl" />
        </motion.div>

        <motion.span
          initial={{ opacity: 0, x: -60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="font-black text-white pointer-events-none select-none"
          style={{ fontSize: "100%", lineHeight: 1, width: "100%", textAlign: "center",
            /* fill the column height: font-size = column width since "4" is roughly square */
            fontSize: "33vw",
          }}
        >
          4
        </motion.span>
      </div>

      {/* ── COL 2: CENTRE CARD ── */}
      <div className="flex items-center justify-center h-full py-4">
      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.93 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
        className="bg-white flex flex-col items-center overflow-y-auto w-full"
        style={{
          maxHeight: "92vh",
          borderRadius: "28px",
          padding: "1.5rem 1.4rem 1.4rem",
          boxShadow: "0 40px 100px rgba(0,0,0,0.75)",
        }}
      >
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

        <p className="text-[1.3rem] font-extrabold text-gray-900 text-center leading-snug mb-4">
          Sorry, page not<br />found
        </p>

        <div className="w-full rounded-2xl overflow-hidden mb-4" style={{ aspectRatio: "1/1" }}>
          <img
            src="/videos/toilet%20breaking%20GIF.gif"
            alt="toilet breaking"
            className="w-full h-full object-cover"
          />
        </div>

        <p className="text-[11px] text-gray-400 text-center mb-3 leading-snug">
          Go to other sections to learn more about Smart Split
        </p>

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

      {/* ── COL 3: RIGHT "4" + bottom arrows ── */}
      <div className="relative flex items-center justify-center h-full overflow-hidden">
        <motion.span
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="font-black text-white pointer-events-none select-none"
          style={{ lineHeight: 1, width: "100%", textAlign: "center", fontSize: "33vw" }}
        >
          4
        </motion.span>

        {/* BOTTOM-RIGHT ARROWS */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, delay: 0.25 }}
          className="absolute flex gap-2"
          style={{ bottom: "8%", right: "8%" }}
        >
          <ArrowBtn rotate={90}  size={54} id="br1" />
          <ArrowBtn rotate={180} size={54} id="br2" />
        </motion.div>
      </div>
    </div>
  );
}
