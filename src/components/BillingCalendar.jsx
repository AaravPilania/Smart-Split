import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/**
 * Generates recurring dates from `start` within the visible month.
 * @param {Date} start - first billing date
 * @param {"weekly"|"monthly"|"quarterly"|"yearly"} cycle
 * @param {number} year - calendar year
 * @param {number} month - calendar month (0-indexed)
 * @returns {Date[]} recurring dates that fall in the given month
 */
function getRecurringDates(start, cycle, year, month) {
  if (!start || !cycle) return [];
  const results = [];
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);
  // Generate occurrences from start forwards
  let cursor = new Date(start);
  // Quick bail if start is way past
  const limit = new Date(year, month + 1, 1);
  const earliest = new Date(year, month - 1, 1); // one month before for safety

  // step back if cursor is ahead (shouldn't happen often)
  // We'll iterate forward from start
  let safety = 0;
  while (cursor <= limit && safety < 500) {
    if (cursor >= monthStart && cursor <= monthEnd) {
      results.push(new Date(cursor));
    }
    // If cursor is past the month, break
    if (cursor > limit) break;

    // Advance cursor
    const prev = new Date(cursor);
    if (cycle === "weekly") cursor.setDate(cursor.getDate() + 7);
    else if (cycle === "monthly") cursor.setMonth(cursor.getMonth() + 1);
    else if (cycle === "quarterly") cursor.setMonth(cursor.getMonth() + 3);
    else if (cycle === "yearly") cursor.setFullYear(cursor.getFullYear() + 1);
    // Safety: if cursor didn't change, break
    if (cursor.getTime() === prev.getTime()) break;
    safety++;
  }
  return results;
}

export default function BillingCalendar({
  selectedDate,
  onSelectDate,
  billingCycle = "monthly",
  theme,
  isDark,
  existingSubs = [],
  mode = "single",      // "single" | "range"
  rangeEnd = null,       // ISO string for end date (range mode)
}) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [direction, setDirection] = useState(0);

  const prevMonth = () => { setDirection(-1); setViewMonth(m => m === 0 ? (setViewYear(y => y - 1), 11) : m - 1); };
  const nextMonth = () => { setDirection(1); setViewMonth(m => m === 11 ? (setViewYear(y => y + 1), 0) : m + 1); };

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const rows = [];
    let day = 1 - firstDay;
    for (let w = 0; w < 6; w++) {
      const week = [];
      for (let d = 0; d < 7; d++, day++) {
        if (day >= 1 && day <= daysInMonth) {
          week.push(new Date(viewYear, viewMonth, day));
        } else {
          week.push(null);
        }
      }
      // Skip empty trailing weeks
      if (week.every(d => d === null)) continue;
      rows.push(week);
    }
    return rows;
  }, [viewYear, viewMonth]);

  // Recurring shading for the selected date + cycle 
  const recurringDates = useMemo(() => {
    if (!selectedDate) return [];
    return getRecurringDates(new Date(selectedDate), billingCycle, viewYear, viewMonth);
  }, [selectedDate, billingCycle, viewYear, viewMonth]);

  // Existing subscription billing dates (dots)
  const existingDots = useMemo(() => {
    const map = new Map(); // day number -> array of colors
    existingSubs.forEach(sub => {
      if (!sub.active || !sub.nextBillingDate) return;
      const dates = getRecurringDates(new Date(sub.nextBillingDate), sub.billingCycle, viewYear, viewMonth);
      dates.forEach(d => {
        const key = d.getDate();
        if (!map.has(key)) map.set(key, []);
        const arr = map.get(key);
        if (arr.length < 3) arr.push(sub.color || theme.gradFrom);
      });
    });
    return map;
  }, [existingSubs, viewYear, viewMonth, theme]);

  const isToday = (d) => d && sameDay(d, today);
  const isSelected = (d) => d && selectedDate && sameDay(d, new Date(selectedDate));
  const isRecurring = (d) => d && recurringDates.some(r => sameDay(r, d));
  const isEnd = (d) => d && rangeEnd && sameDay(d, new Date(rangeEnd));
  const isInRange = (d) => {
    if (!d || mode !== "range" || !selectedDate || !rangeEnd) return false;
    const t = d.getTime(), s = new Date(selectedDate).getTime(), e = new Date(rangeEnd).getTime();
    return t > s && t < e;
  };

  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const cellBg = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";
  const textMuted = isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)";
  const textNormal = isDark ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.85)";

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{
        background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
        border: isDark ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(0,0,0,0.06)",
      }}>
      {/* Month navigation */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <button onClick={prevMonth} type="button"
          className="h-7 w-7 rounded-lg flex items-center justify-center active:scale-90 transition"
          style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)", color: textNormal }}>
          <FiChevronLeft size={14} />
        </button>
        <p className="text-[13px] font-bold" style={{ color: textNormal }}>{monthLabel}</p>
        <button onClick={nextMonth} type="button"
          className="h-7 w-7 rounded-lg flex items-center justify-center active:scale-90 transition"
          style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)", color: textNormal }}>
          <FiChevronRight size={14} />
        </button>
      </div>

      {/* Day name headers */}
      <div className="grid grid-cols-7 px-1.5">
        {DAY_NAMES.map(d => (
          <div key={d} className="text-center py-1">
            <span className="text-[10px] font-bold uppercase" style={{ color: textMuted }}>{d}</span>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="px-1.5 pb-2">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`${viewYear}-${viewMonth}`}
            initial={{ opacity: 0, x: direction * 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -20 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
          >
            {calendarDays.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7">
                {week.map((day, di) => {
                  if (!day) {
                    return <div key={di} className="aspect-square" />;
                  }
                  const sel = isSelected(day);
                  const end = isEnd(day);
                  const inRange = isInRange(day);
                  const tod = isToday(day);
                  const rec = isRecurring(day) && !sel && !end;
                  const dots = existingDots.get(day.getDate()) || [];
                  const dayNum = day.getDate();
                  const highlighted = sel || end;

                  return (
                    <button
                      key={di}
                      type="button"
                      onClick={() => onSelectDate(day)}
                      className="aspect-square flex flex-col items-center justify-center rounded-lg mx-0.5 my-0.5 transition-colors active:scale-90 relative"
                      style={{
                        background: highlighted
                          ? `linear-gradient(135deg, ${theme.gradFrom}, ${theme.gradTo})`
                          : inRange
                            ? `${theme.gradFrom}18`
                            : rec
                              ? `${theme.gradFrom}22`
                              : cellBg,
                        border: tod && !highlighted ? `1.5px solid ${theme.gradFrom}` : inRange ? `1.5px solid ${theme.gradFrom}33` : "1.5px solid transparent",
                      }}
                    >
                      <span className="text-[11px] font-bold leading-none" style={{
                        color: highlighted ? "#fff" : inRange ? theme.gradFrom : rec ? theme.gradFrom : textNormal,
                      }}>
                        {dayNum}
                      </span>
                      {/* Billing cycle label under day */}
                      {rec && (
                        <span className="text-[6px] font-bold uppercase mt-0.5 leading-none" style={{ color: theme.gradFrom }}>
                          {billingCycle === "weekly" ? "W" : billingCycle === "monthly" ? "M" : billingCycle === "quarterly" ? "Q" : "Y"}
                        </span>
                      )}
                      {sel && (
                        <span className="text-[6px] font-bold uppercase mt-0.5 leading-none text-white/80">
                          {mode === "range" ? "Start" : "Start"}
                        </span>
                      )}
                      {end && (
                        <span className="text-[6px] font-bold uppercase mt-0.5 leading-none text-white/80">
                          End
                        </span>
                      )}
                      {/* Existing subscription dots */}
                      {dots.length > 0 && !sel && (
                        <div className="absolute bottom-0.5 flex gap-px">
                          {dots.map((c, ci) => (
                            <div key={ci} className="h-1 w-1 rounded-full" style={{ background: c }} />
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 px-3 pb-2.5 pt-0.5">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full" style={{ background: `linear-gradient(135deg, ${theme.gradFrom}, ${theme.gradTo})` }} />
          <span className="text-[9px] font-semibold" style={{ color: textMuted }}>{mode === "range" ? "Start/End" : "Selected"}</span>
        </div>
        {mode === "range" ? (
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-sm" style={{ background: `${theme.gradFrom}18`, border: `1px solid ${theme.gradFrom}33` }} />
            <span className="text-[9px] font-semibold" style={{ color: textMuted }}>In Range</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full" style={{ background: `${theme.gradFrom}55` }} />
            <span className="text-[9px] font-semibold" style={{ color: textMuted }}>Recurring</span>
          </div>
        )}
        {existingSubs.length > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="h-1 w-1 rounded-full" style={{ background: "#10b981" }} />
            <span className="text-[9px] font-semibold" style={{ color: textMuted }}>Existing</span>
          </div>
        )}
      </div>
    </div>
  );
}
