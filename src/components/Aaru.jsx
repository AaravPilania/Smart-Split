import { useState, useEffect, useRef } from "react";
import { FiX, FiSend, FiCheck, FiMic } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { apiFetch, API_URL } from "../utils/api";
import { useTheme, getGradientStyle } from "../utils/theme";
import { getCategoryInfo, detectCategory } from "../utils/categories";

// ─── Client-side fallback parser — always extracts something ──────────────
function parseExpenseLocally(text) {
  // Amount: ₹500, rs 500, 500rs, bare number
  const amountRe =
    /(?:₹|rs\.?\s*)(\d+(?:\.\d{1,2})?)|(\d+(?:\.\d{1,2})?)\s*(?:₹|rs\.?)/i;
  let amountMatch = text.match(amountRe);
  // bare number fallback
  if (!amountMatch) amountMatch = text.match(/\b(\d{2,6}(?:\.\d{1,2})?)\b/);
  const amount = amountMatch
    ? parseFloat(amountMatch[1] ?? amountMatch[2] ?? amountMatch[0])
    : null;

  // People after "with", "for", "between", "and"
  const peopleRe =
    /(?:with|for|between)\s+([\w][\w\s,&]*?)(?:\s+(?:split|in|at|on|₹|rs\b|\d)|$)/i;
  const peopleMatch = text.match(peopleRe);
  const people = peopleMatch
    ? peopleMatch[1]
        .split(/,|\s+and\s+|\s+&\s+/i)
        .map((p) => p.trim())
        .filter((p) => p && p.length > 1 && !/^(me|us|split)$/i.test(p))
    : [];

  // Split count: "3 ways", "split 4"
  const splitCountMatch =
    text.match(/(\d+)\s*ways?/i) || text.match(/split\s+(\d+)/i);
  const splitCount = splitCountMatch ? parseInt(splitCountMatch[1]) : null;

  // Title: strip amount + with-clause + split-info
  let title = text
    .replace(/(?:₹|rs\.?\s*)\d+(?:\.\d{1,2})?/gi, "")
    .replace(/\d+(?:\.\d{1,2})?\s*(?:₹|rs\.?)/gi, "")
    .replace(/(?:with|for|between)\s+[\w\s,&]+/gi, "")
    .replace(/\d+\s*ways?/gi, "")
    .replace(/split\s+\d+/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  const category = detectCategory((title || text).toLowerCase());
  if (!title || title.length < 2) title = "Expense";

  return { title, amount, people, splitCount, category, isLocal: true };
}

// ─── Robot avatar ─────────────────────────────────────────────────────────
function RobotAvatar({ size = 28 }) {
  return (
    <img
      src="/aaru-robot.svg"
      alt="Aaru"
      width={size}
      height={size}
      style={{ objectFit: "contain", display: "block", flexShrink: 0 }}
    />
  );
}

// ─── ConfirmCard — smart group matching + split logic ─────────────────────
function ConfirmCard({ card, groups, userId, theme, onExpenseCreated }) {
  const [groupId, setGroupId] = useState("");
  const [adding, setAdding] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const catInfo = getCategoryInfo(card.category || "other");

  // Filter to groups that contain any of the named people
  const smartGroups =
    card.people?.length > 0
      ? groups.filter((g) =>
          g.members?.some((m) =>
            card.people.some(
              (p) =>
                m.name?.toLowerCase().includes(p.toLowerCase()) ||
                p.toLowerCase().includes((m.name || "").toLowerCase())
            )
          )
        )
      : [];

  const displayGroups = smartGroups.length > 0 ? smartGroups : groups;
  const isFiltered = smartGroups.length > 0 && smartGroups.length < groups.length;

  // Auto-select when only one sensible group
  useEffect(() => {
    if (displayGroups.length === 1 && !groupId) {
      setGroupId(displayGroups[0].id);
    }
  }, [displayGroups.length]);

  const handleAdd = async () => {
    if (!groupId) { setError("Please select a group"); return; }
    setError("");
    setAdding(true);
    try {
      const group = groups.find((g) => g.id === groupId);
      const members = group?.members || [];
      let splitBetween;

      if (card.people?.length > 0 && members.length > 0) {
        // Split between named people + current user
        const involved = members.filter(
          (m) =>
            (m.id || m._id) === userId ||
            card.people.some((p) =>
              (m.name || "").toLowerCase().includes(p.toLowerCase())
            )
        );
        if (involved.length > 0) {
          const each = parseFloat((card.amount / involved.length).toFixed(2));
          splitBetween = involved.map((m) => ({
            user: m.id || m._id,
            amount: each,
          }));
        }
      }

      // Fallback: split across group or by splitCount
      if (!splitBetween && members.length > 0) {
        const n = card.splitCount || members.length;
        const each = parseFloat((card.amount / n).toFixed(2));
        splitBetween = members
          .slice(0, n)
          .map((m) => ({ user: m.id || m._id, amount: each }));
      }

      if (!splitBetween) {
        splitBetween = [{ user: userId, amount: card.amount }];
      }

      const res = await apiFetch(`${API_URL}/expenses/group/${groupId}`, {
        method: "POST",
        body: JSON.stringify({
          title: card.title,
          amount: card.amount,
          paidBy: userId,
          splitBetween,
          category: card.category || "other",
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.message || "Failed to add expense");
      } else {
        setDone(true);
        onExpenseCreated?.();
      }
    } catch {
      setError("Network error");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-tl-sm p-3 space-y-2 w-full">
      {done ? (
        <p className="text-green-600 dark:text-green-400 text-sm font-semibold flex items-center gap-1.5">
          <FiCheck /> Added successfully!
        </p>
      ) : (
        <>
          {/* Expense summary row */}
          <div className="flex items-center gap-2">
            <span className="text-xl leading-none">{catInfo.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate capitalize">
                {card.title}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {catInfo.label}
              </p>
            </div>
            {card.amount != null && (
              <span
                className="font-bold text-sm shrink-0"
                style={{ color: theme.gradFrom }}
              >
                ₹{card.amount}
              </span>
            )}
          </div>

          {/* Split info */}
          {(card.splitCount || card.people?.length > 0) && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {card.splitCount ? `Split ${card.splitCount} ways` : ""}
              {card.people?.length > 0
                ? (card.splitCount ? " · " : "") +
                  "with " +
                  card.people.join(", ")
                : ""}
            </p>
          )}

          {/* Smart group filter hint */}
          {isFiltered && (
            <p className="text-[11px] font-medium" style={{ color: theme.gradFrom }}>
              ✦ Showing groups with {card.people.join(", ")}
            </p>
          )}

          {/* Group selector */}
          <select
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            className={`w-full text-xs px-2 py-1.5 rounded-lg border focus:outline-none bg-white dark:bg-gray-700 dark:text-white transition ${
              error && !groupId
                ? "border-red-400 ring-1 ring-red-400"
                : "border-gray-300 dark:border-gray-600"
            }`}
          >
            <option value="">
              {displayGroups.length === 0 ? "No groups yet" : "Select group…"}
            </option>
            {displayGroups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button
            onClick={handleAdd}
            disabled={adding || !card.amount}
            className="w-full py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50 transition-opacity"
            style={getGradientStyle(theme)}
          >
            {adding ? "Adding…" : "Add Expense"}
          </button>
        </>
      )}
    </div>
  );
}

// ─── Question detection ───────────────────────────────────────────────────
const Q_RE =
  /^(how|what|who|when|am i|can you|help|show|tell|budget|spending|advice|do i|is it|why|where|which)/i;
function looksLikeQuestion(text) {
  return text.trim().endsWith("?") || Q_RE.test(text.trim());
}

// ─── Aaru — bottom-sheet AI assistant ────────────────────────────────────
export default function Aaru({ groups = [], userId, friends = [], onExpenseCreated }) {
  const { theme, isDark } = useTheme();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "Hi! I'm Aaru ✨\n\nTell me about an expense and I'll sort it out — or ask me anything about your spending.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Listen for aaru-open event (dispatched by BottomNav)
  useEffect(() => {
    const handleOpen = () => setOpen(true);
    window.addEventListener("aaru-open", handleOpen);
    return () => window.removeEventListener("aaru-open", handleOpen);
  }, []);

  // Body scroll lock
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    } else {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, [open]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (open)
      setTimeout(
        () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }),
        80
      );
  }, [messages, open]);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 320);
  }, [open]);

  const pushBot = (text) => setMessages((m) => [...m, { role: "bot", text }]);
  const pushCard = (card) =>
    setMessages((m) => [...m, { role: "bot", card, text: "" }]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text }]);
    setLoading(true);

    try {
      if (looksLikeQuestion(text)) {
        // ── Advice / question route ──────────────────────────────────
        const res = await apiFetch(`${API_URL}/expenses/aaru-advice`, {
          method: "POST",
          body: JSON.stringify({
            text,
            context: {
              groupCount: groups.length,
              groupNames: groups.map((g) => g.name),
            },
          }),
        });
        if (res.ok) {
          const data = await res.json();
          pushBot(
            data.message || "I'm not sure — try asking me to log an expense!"
          );
        } else {
          pushBot(
            "Couldn't fetch an answer right now. Try asking me to log an expense!"
          );
        }
      } else {
        // ── Expense parse route ──────────────────────────────────────
        let parsed = null;

        // 1. Try backend (Gemini or server-side regex)
        try {
          const res = await apiFetch(`${API_URL}/expenses/parse-text`, {
            method: "POST",
            body: JSON.stringify({ text, friends }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data?.title && data?.amount) parsed = data;
          }
        } catch {
          // network error — will fall through to local parser
        }

        // 2. Client-side fallback — always produces something
        if (!parsed) {
          const local = parseExpenseLocally(text);
          if (local.title || local.amount) {
            parsed = local;
          }
        }

        if (parsed) {
          if (parsed.isLocal) {
            pushBot("Got it! Confirm the details below:");
          }
          pushCard(parsed);
        } else {
          pushBot(
            'Try something like:\n• "Pizza ₹500 with Priya"\n• "Uber 150 with Vishal"\n• "Movie tickets 800 split 3 ways"\n• "Petrol 300"'
          );
        }
      }
    } catch {
      pushBot("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Voice input via Web Speech API ──
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const hasSpeech = typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const toggleVoice = () => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = "en-IN";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => {
      const transcript = e.results[0]?.[0]?.transcript || "";
      if (transcript) setInput((prev) => (prev ? prev + " " : "") + transcript);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognitionRef.current = rec;
    rec.start();
    setListening(true);
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[300] flex flex-col justify-end">
          {/* Backdrop */}
          <motion.div
            key="aaru-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Bottom sheet */}
          <motion.div
            key="aaru-sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
            className="relative flex flex-col rounded-t-3xl z-10 overflow-hidden"
            style={{
              height: "78vh",
              background: isDark ? "rgba(11,11,20,0.98)" : "#ffffff",
              backdropFilter: "blur(32px)",
              borderTop: isDark
                ? "1px solid rgba(255,255,255,0.09)"
                : "1px solid rgba(0,0,0,0.08)",
              borderLeft: isDark
                ? "1px solid rgba(255,255,255,0.06)"
                : "1px solid rgba(0,0,0,0.06)",
              borderRight: isDark
                ? "1px solid rgba(255,255,255,0.06)"
                : "1px solid rgba(0,0,0,0.06)",
            }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-9 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
            </div>

            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${theme.gradFrom}22, ${theme.gradTo}22)`,
                  border: `1px solid ${theme.gradFrom}33`,
                }}
              >
                <RobotAvatar size={26} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-800 dark:text-white text-sm leading-tight">
                  Aaru
                </p>
                <p className="text-xs text-gray-400">AI expense assistant</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                <FiX size={15} />
              </button>
            </div>

            {/* Divider */}
            <div
              className="flex-shrink-0"
              style={{
                height: "1px",
                background: isDark
                  ? "rgba(255,255,255,0.07)"
                  : "rgba(0,0,0,0.07)",
              }}
            />

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex items-end gap-2 ${
                    msg.role === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  {msg.role === "bot" && (
                    <div className="shrink-0 mb-0.5">
                      <RobotAvatar size={22} />
                    </div>
                  )}
                  {msg.role === "bot" && msg.card ? (
                    <div className="flex-1 min-w-0">
                      <ConfirmCard
                        card={msg.card}
                        groups={groups}
                        userId={userId}
                        theme={theme}
                        onExpenseCreated={onExpenseCreated}
                      />
                    </div>
                  ) : (
                    <div
                      className={`max-w-[80%] px-3 py-2.5 rounded-2xl text-sm whitespace-pre-line leading-relaxed ${
                        msg.role === "user"
                          ? "text-white rounded-br-sm"
                          : "bg-gray-100 dark:bg-gray-800/80 text-gray-800 dark:text-gray-100 rounded-bl-sm"
                      }`}
                      style={
                        msg.role === "user" ? getGradientStyle(theme) : {}
                      }
                    >
                      {msg.text}
                    </div>
                  )}
                </div>
              ))}

              {/* Typing indicator */}
              {loading && (
                <div className="flex items-end gap-2">
                  <div className="shrink-0 mb-0.5">
                    <RobotAvatar size={22} />
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-800/80 px-4 py-3 rounded-2xl rounded-bl-sm">
                    <div className="flex gap-1 items-center">
                      {[0, 1, 2].map((n) => (
                        <span
                          key={n}
                          className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"
                          style={{ animationDelay: `${n * 0.18}s` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick-reply chips — shown when no user messages yet */}
            {messages.length <= 1 && !loading && (
              <div className="flex flex-wrap gap-1.5 px-3 pt-2 pb-1">
                {[
                  "₹ for lunch",
                  "Split 3 ways",
                  "How much do I owe?",
                  ...groups.slice(0, 3).map((g) => g.name),
                ].map((chip) => (
                  <button
                    key={chip}
                    onClick={() => { setInput(chip); inputRef.current?.focus(); }}
                    className="px-3 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95"
                    style={{
                      background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
                      border: isDark ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(0,0,0,0.10)",
                      color: isDark ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.55)",
                    }}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}

            {/* Input bar */}
            <div
              className="flex gap-2 px-3 py-3 flex-shrink-0"
              style={{
                borderTop: isDark
                  ? "1px solid rgba(255,255,255,0.07)"
                  : "1px solid rgba(0,0,0,0.07)",
                background: isDark ? "rgba(11,11,20,0.98)" : "#ffffff",
                paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))",
              }}
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && !e.shiftKey && send()
                }
                placeholder="e.g. pizza ₹500 with Priya"
                className="flex-1 px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 transition"
                style={{ "--tw-ring-color": theme.gradFrom + "66" }}
                disabled={loading}
              />
              {hasSpeech && (
                <button
                  onClick={toggleVoice}
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all"
                  style={{
                    background: listening
                      ? `linear-gradient(135deg, ${theme.gradFrom}, ${theme.gradTo})`
                      : isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                    color: listening ? "#fff" : isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.4)",
                  }}
                  aria-label={listening ? "Stop recording" : "Voice input"}
                >
                  <FiMic size={14} />
                </button>
              )}
              <button
                onClick={send}
                disabled={!input.trim() || loading}
                className="w-10 h-10 rounded-xl text-white flex items-center justify-center disabled:opacity-40 shrink-0 transition-opacity"
                style={getGradientStyle(theme)}
                aria-label="Send"
              >
                <FiSend size={14} />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
