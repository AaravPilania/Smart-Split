import { useRef, useEffect, useCallback } from "react";

/**
 * CurvedLoop — infinite draggable marquee (flat mode, curveAmount=0 recommended)
 * Props match the ReactBits CurvedLoop API.
 */
export default function CurvedLoop({
  marqueeText = "",
  speed = 2,
  className = "",
  curveAmount = 0,   // 0 = flat (SVG curve support coming later)
  direction = "left",
  interactive = true,
}) {
  const wrapRef   = useRef(null);
  const trackRef  = useRef(null);
  const scrolled  = useRef(0);   // total px scrolled (always increases for "left")
  const vel       = useRef(0);   // inertia after drag release
  const dragging  = useRef(false);
  const lastX     = useRef(0);
  const raf       = useRef(null);
  const itemW     = useRef(300); // width of one text copy — measured after mount

  // Re-measure whenever the DOM updates
  useEffect(() => {
    const child = trackRef.current?.firstElementChild;
    if (child) itemW.current = Math.max(1, child.offsetWidth);
  });

  const frame = useCallback(() => {
    const W   = itemW.current;
    const spd = speed * 0.4;

    if (!dragging.current) {
      scrolled.current += direction === "left" ? spd : -spd;
    }
    if (Math.abs(vel.current) > 0.05) {
      scrolled.current += vel.current;
      vel.current      *= 0.91;
    }

    // Normalize into [0, W) — gives position within one cycle
    const pos = ((scrolled.current % W) + W) % W;

    if (trackRef.current) {
      // left: shift track left by pos  |  right: shift right
      trackRef.current.style.transform =
        `translateX(${direction === "left" ? -pos : pos - W}px)`;
    }

    raf.current = requestAnimationFrame(frame);
  }, [speed, direction]);

  useEffect(() => {
    raf.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf.current);
  }, [frame]);

  /* ── Pointer drag ─────────────────────────────────── */
  const onPointerDown = (e) => {
    if (!interactive) return;
    dragging.current = true;
    lastX.current    = e.clientX;
    vel.current      = 0;
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastX.current;
    lastX.current    = e.clientX;
    vel.current      = -dx * 0.5;       // inertia on release
    // drag left (dx<0) → content moves left → scrolled increases
    scrolled.current = ((scrolled.current - dx + itemW.current * 1000) % itemW.current + itemW.current) % itemW.current;
    // keep scrolled in [0, W) so modulo is always clean
    scrolled.current += Math.floor(scrolled.current < 0 ? -scrolled.current / itemW.current + 1 : 0) * itemW.current;
  };
  const onPointerUp = () => { dragging.current = false; };

  // 12 copies — enough for any screen width up to ~7200px given typical text width
  const COPIES = 12;

  return (
    <div
      ref={wrapRef}
      className="w-full overflow-hidden"
      style={{
        cursor    : interactive ? "grab" : "default",
        touchAction: "none",
        userSelect: "none",
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      <div
        ref={trackRef}
        className="flex whitespace-nowrap"
        style={{ willChange: "transform", userSelect: "none" }}
      >
        {Array.from({ length: COPIES }, (_, i) => (
          <span
            key={i}
            className={`inline-block shrink-0 ${className}`}
            style={{ paddingRight: "0.6em" }}
          >
            {marqueeText}
          </span>
        ))}
      </div>
    </div>
  );
}
