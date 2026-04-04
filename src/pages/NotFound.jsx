import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const CORAL = "#F4705F";

const NAV_LINKS = [
  {  },
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
        initial={{ opacity: 0, x: -80, y: "-50%" }}
        animate={{ opacity: 1, x: 0, y: "-50%" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="absolute font-black text-white pointer-events-none select-none text-center"
        style={{
          fontSize: "clamp(300px, 50vw, 700px)",
          lineHeight: 1,
          width: "50vw",
          left: -100,
          top: "50%",
          overflow: "hidden",
        }}
      >
        4
      </motion.span>

      {/* RIGHT "4" */}
      <motion.span
        initial={{ opacity: 0, x: 80, y: "-50%" }}
        animate={{ opacity: 1, x: 0, y: "-50%" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="absolute font-black text-white pointer-events-none select-none text-center"
        style={{
          fontSize: "clamp(300px, 50vw, 700px)",
          lineHeight: 1,
          width: "50vw",
          right: -100,
          top: "50%",
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
        style={{ top: "9%", left: "14%" }}
      >
        <BentArrow size={100} />
      </motion.div>

      {/* BOTTOM-RIGHT BENT ARROW (flipped 180°) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45, delay: 0.25 }}
        className="absolute z-20"
        style={{ bottom: "8%", right: "8%", transform: "rotate(180deg)" }}
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

        <h1 className="text-3xl font-black text-gray-900 leading-tight mb-5">
          Sorry, page not found
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

        <div className="w-full flex flex-col gap-2">
          {NAV_LINKS.map(({ to, label, desc }, i) => (
            <motion.div
              key={to}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.07 }}
            >
              
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}