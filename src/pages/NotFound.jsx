import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const CORAL = "#F4705F";

const NAV_LINKS = [
  { to: "/dashboard", label: "Dashboard", desc: "Your splits at a glance" },
  { to: "/expenses", label: "Expenses", desc: "Manage all your expenses" },
  { to: "/friends", label: "Friends", desc: "See who owes what" },
];

/* Right-angle bent arrow decoration (↙ shape) — rotate 180° for ↗ variant */
function BentArrow({ size = 80 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <path
        d="M70 10 L70 65 L20 65"
        stroke={CORAL}
        strokeWidth="16"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M35 50 L20 65 L35 80"
        stroke={CORAL}
        strokeWidth="16"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function NotFound() {
  return (
    <div className="w-screen h-screen bg-black overflow-hidden relative flex items-center justify-center">
      {/* LEFT "4" */}
      <motion.span
        initial={{ opacity: 0, x: -80 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="absolute font-black text-white pointer-events-none select-none text-center"
        style={{
          fontSize: "clamp(300px, 50vw, 700px)",
          lineHeight: 1,
          width: "50vw",
          left: 0,
          bottom: 0,
          overflow: "hidden",
        }}
      >
        4
      </motion.span>

      {/* RIGHT "4" */}
      <motion.span
        initial={{ opacity: 0, x: 80 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="absolute font-black text-white pointer-events-none select-none text-center"
        style={{
          fontSize: "clamp(300px, 50vw, 700px)",
          lineHeight: 1,
          width: "50vw",
          right: 0,
          bottom: 0,
          overflow: "hidden",
        }}
      >
        4
      </motion.span>

      {/* TOP-LEFT BENT ARROW */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45, delay: 0.2 }}
        className="absolute z-20"
        style={{ top: "8%", left: "16%" }}
      >
        <BentArrow size={70} />
      </motion.div>

      {/* BOTTOM-RIGHT BENT ARROW (flipped 180°) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45, delay: 0.25 }}
        className="absolute z-20"
        style={{ bottom: "4%", right: "8%", transform: "rotate(180deg)" }}
      >
        <BentArrow size={100} />
      </motion.div>

      {/* CENTRE CARD */}
      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.93 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
        className="relative bg-white flex flex-col items-center overflow-y-auto"
        style={{
          zIndex: 10,
          width: "min(460px, 88vw)",
          maxHeight: "92vh",
          borderRadius: "28px",
          padding: "2.8rem 2.4rem 2.4rem",
          boxShadow: "0 40px 100px rgba(0,0,0,0.75)",
        }}
      >
        <p className="text-lg font-medium text-gray-800 text-center mb-1 tracking-wide">
          ... 404 error ...
        </p>

        <h1 className="text-3xl font-black text-gray-900 text-center leading-tight mb-5">
          Sorry, page not
          <br />
          found
        </h1>

        {/* Toilet GIF */}
        <div className="w-full rounded-2xl overflow-hidden mb-5">
          <img
            src="/videos/toilet%20breaking%20GIF.gif"
            alt="toilet breaking"
            className="w-full object-cover"
            style={{ maxHeight: "260px" }}
          />
        </div>

        {/* Return to homepage button */}
        <Link
          to="/"
          className="w-full flex items-center justify-center py-3 rounded-2xl font-semibold text-white mb-5 transition-opacity hover:opacity-90"
          style={{ background: CORAL, fontSize: "15px" }}
        >
          Return to homepage
        </Link>

        <p className="text-xs text-gray-400 text-center mb-4 leading-snug">
          Or go to other sections:
        </p>

        <div className="w-full flex flex-col gap-2">
          {NAV_LINKS.map(({ to, label, desc }, i) => (
            <motion.div
              key={to}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.07 }}
            >
              <Link
                to={to}
                className="flex items-center justify-between w-full px-4 py-3 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div>
                  <p
                    className="text-sm font-semibold leading-tight"
                    style={{ color: i === 0 ? CORAL : "#111827" }}
                  >
                    {label}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                </div>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: i === 0 ? CORAL : "#e5e7eb" }}
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
