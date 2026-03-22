import { useState, useEffect, useRef } from "react";
import { FiX, FiSend, FiCheck } from "react-icons/fi";
import { apiFetch, API_URL } from "../utils/api";
import { useTheme, getGradientStyle } from "../utils/theme";
import { getCategoryInfo } from "../utils/categories";

// ── Robot avatar ──────────────────────────────────────────────────────────
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

// ── ConfirmCard: shown inside chat when Gemini parses an expense ──────────
function ConfirmCard({ card, groups, userId, theme, onExpenseCreated }) {
  const [groupId, setGroupId] = useState("");
  const [adding, setAdding] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const catInfo = getCategoryInfo(card.category || "other");

  const add = async () => {
    if (!groupId) { setError("Please select a group"); return; }
    setError("");
    setAdding(true);
    try {
      const group = groups.find((g) => g.id === groupId);
      const members = group?.members || [];
      let splitBetween;
      if (members.length > 0) {
        const each = parseFloat((card.amount / members.length).toFixed(2));
        splitBetween = members.map((m) => ({ userId: m.id, amount: each }));
      } else {
        splitBetween = [{ userId, amount: card.amount }];
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
    <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-tl-sm p-3 space-y-2 w-full">
      {done ? (
        <p className="text-green-600 dark:text-green-400 text-sm font-semibold flex items-center gap-1.5">
          <FiCheck /> Added!
        </p>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <span className="text-xl">{catInfo.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{card.title}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{catInfo.label}</p>
            </div>
            {card.amount != null && (
              <span className="font-bold text-sm shrink-0" style={{ color: theme.gradFrom }}>
                ₹{card.amount}
              </span>
            )}
          </div>
          {(card.splitCount || card.people?.length > 0) && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {card.splitCount ? `Split ${card.splitCount} ways` : ""}
              {card.people?.length > 0
                ? (card.splitCount ? " · " : "") + card.people.join(", ")
                : ""}
            </p>
          )}
          <select
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            className={`w-full text-xs px-2 py-1.5 rounded-lg border focus:outline-none dark:bg-gray-700 dark:text-white ${
              error && !groupId ? "border-red-400 ring-1 ring-red-400" : "border-gray-300 dark:border-gray-600"
            }`}
          >
            <option value="">Select group…</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            onClick={add}
            disabled={adding}
            className="w-full py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
            style={getGradientStyle(theme)}
          >
            {adding ? "Adding…" : "Add Expense"}
          </button>
        </>
      )}
    </div>
  );
}

// ── Question detection ─────────────────────────────────────────────────────
const Q_RE = /^(how|what|who|when|am i|can you|help|show|tell|budget|spending|advice|do i|is it|why|where|which)/i;
function looksLikeQuestion(text) {
  return text.trim().endsWith("?") || Q_RE.test(text.trim());
}

// ── Aaru main component ───────────────────────────────────────────────────
export default function Aaru({ groups = [], userId, friends = [], onExpenseCreated }) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "bot", text: "Hi! I'm Aaru \u2728\nTell me about any expense and I'll fill it in for you — or ask me anything about your spending!" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
  }, [messages, open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 250);
  }, [open]);

  const pushBot = (text) => setMessages((m) => [...m, { role: "bot", text }]);
  const pushCard = (card) => setMessages((m) => [...m, { role: "bot", card, text: "" }]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text }]);
    setLoading(true);
    try {
      if (looksLikeQuestion(text)) {
        // Route questions to the advice endpoint
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
          pushBot(data.message || "I'm not sure — try asking me to add an expense!");
        } else {
          pushBot("Hmm, I couldn't fetch an answer right now. Try asking me to log an expense instead!");
        }
      } else {
        // Route to expense parse endpoint
        const res = await apiFetch(`${API_URL}/expenses/parse-text`, {
          method: "POST",
          body: JSON.stringify({ text, friends }),
        });
        if (res.ok) {
          const parsed = await res.json();
          if (parsed?.title) {
            pushCard(parsed);
          } else {
            pushBot("I got a response but couldn't extract expense details. Try: \"Pizza ₹500 with Priya\"");
          }
        } else if (res.status === 422) {
          pushBot(
            "I couldn't quite parse that 🤔 Try phrasing it like:\n• \"Petrol ₹400 split with Aarushi\"\n• \"Pizza 500 with Rahul and Priya\"\n• \"Movie tickets 800 split 3 ways\""
          );
        } else {
          pushBot("Something went wrong. Please try again.");
        }
      }
    } catch {
      pushBot("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ── Floating toggle button ─────────────────────────────── */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="aaru-btn fixed bottom-4 right-4 z-[200] w-14 h-14 rounded-full flex items-center justify-center shadow-2xl overflow-hidden border-2 border-white/30"
        style={{
          "--aaru-c1": theme.gradFrom,
          "--aaru-c2": theme.gradTo,
          "--aaru-shadow": `${theme.gradFrom}80`,
        }}
        aria-label="Open Aaru expense assistant"
      >
        {open
          ? <FiX size={22} color="white" />
          : <RobotAvatar size={38} />}
      </button>

      {/* ── Chat panel ───────────────────────────────────── */}
      {open && (
        <div
          className="fixed bottom-[5.5rem] right-4 z-[199] flex flex-col rounded-2xl shadow-2xl overflow-hidden bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700"
          style={{ width: "min(92vw, 370px)", maxHeight: "min(520px, 60vh)" }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-2.5 px-4 py-3 text-white shrink-0"
            style={getGradientStyle(theme)}
          >
            <RobotAvatar size={30} />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm leading-tight">Aaru</p>
              <p className="text-xs opacity-80">Your expense assistant</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="shrink-0 opacity-80 hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-white/20"
              aria-label="Close"
            >
              <FiX size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-2.5 space-y-2.5 min-h-0">
            {messages.map((msg, i) => (
              <div key={i} className={`flex items-end gap-2 ${
                msg.role === "user" ? "flex-row-reverse" : "flex-row"
              }`}>
                {msg.role === "bot" && (
                  <div className="shrink-0 mb-0.5">
                    <RobotAvatar size={24} />
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
                    className={`max-w-[78%] px-3 py-2 rounded-2xl text-sm whitespace-pre-line leading-relaxed ${
                      msg.role === "user"
                        ? "text-white rounded-br-none"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-bl-none"
                    }`}
                    style={msg.role === "user" ? getGradientStyle(theme) : {}}
                  >
                    {msg.text}
                  </div>
                )}
              </div>
            ))}

            {/* Typing dots */}
            {loading && (
              <div className="flex items-end gap-2">
                <div className="shrink-0 mb-0.5"><RobotAvatar size={24} /></div>
                <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-2xl rounded-bl-none">
                  <div className="flex gap-1 items-center">
                    {[0, 1, 2].map((n) => (
                      <span
                        key={n}
                        className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"
                        style={{ animationDelay: `${n * 0.18}s` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input bar */}
          <div className="px-3 py-2.5 border-t border-gray-100 dark:border-gray-800 flex gap-2 shrink-0 bg-white dark:bg-gray-900">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
              placeholder="e.g. pizza ₹500 with Priya"
              className="flex-1 px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2"
              style={{ "--tw-ring-color": theme.gradFrom }}
              disabled={loading}
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              className="w-9 h-9 rounded-xl text-white flex items-center justify-center disabled:opacity-40 shrink-0 transition-opacity"
              style={getGradientStyle(theme)}
              aria-label="Send"
            >
              <FiSend size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

  const [groupId, setGroupId] = useState("");
  const [adding, setAdding] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const catInfo = getCategoryInfo(card.category || "other");

  const add = async () => {
    if (!groupId) { setError("Please select a group"); return; }
    setError("");
    setAdding(true);
    try {
      const group = groups.find((g) => g.id === groupId);
      const members = group?.members || [];
      let splitBetween;
      if (members.length > 0) {
        const each = parseFloat((card.amount / members.length).toFixed(2));
        splitBetween = members.map((m) => ({ userId: m.id, amount: each }));
      } else {
        splitBetween = [{ userId, amount: card.amount }];
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
    <div className="max-w-[90%] bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-bl-sm p-3 space-y-2">
      {done ? (
        <p className="text-green-600 dark:text-green-400 text-sm font-semibold flex items-center gap-1.5">
          <FiCheck /> Expense added successfully!
        </p>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <span className="text-xl">{catInfo.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{card.title}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{catInfo.label}</p>
            </div>
            {card.amount != null && (
              <span className="font-bold text-sm shrink-0" style={{ color: theme.gradFrom }}>
                ₹{card.amount}
              </span>
            )}
          </div>

          {(card.splitCount || card.people?.length > 0) && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {card.splitCount ? `Split ${card.splitCount} ways` : ""}
              {card.people?.length > 0
                ? (card.splitCount ? " · " : "") + card.people.join(", ")
                : ""}
            </p>
          )}

          <select
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            className={`w-full text-xs px-2 py-1.5 rounded-lg border focus:outline-none dark:bg-gray-700 dark:text-white ${
              error && !groupId ? "border-red-400 ring-1 ring-red-400" : "border-gray-300 dark:border-gray-600"
            }`}
          >
            <option value="">Select group…</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button
            onClick={add}
            disabled={adding}
            className="w-full py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
            style={getGradientStyle(theme)}
          >
            {adding ? "Adding…" : "Add Expense"}
          </button>
        </>
      )}
    </div>
  );
}

// ── Aaru: the floating NL expense chatbot ─────────────────────────────────
export default function Aaru({ groups = [], userId, friends = [], onExpenseCreated }) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "bot", text: "Hi! I'm Aaru ✦\nTell me about an expense and I'll fill in the details for you." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (open) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text }]);
    setLoading(true);
    try {
      const res = await apiFetch(`${API_URL}/expenses/parse-text`, {
        method: "POST",
        body: JSON.stringify({ text, friends }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setMessages((m) => [
          ...m,
          {
            role: "bot",
            text:
              err.message ||
              "Sorry, I couldn't parse that. Try being more specific — e.g. \"Pizza ₹500 with Priya and Rahul\".",
          },
        ]);
      } else {
        const parsed = await res.json();
        setMessages((m) => [...m, { role: "bot", card: parsed, text: "" }]);
      }
    } catch {
      setMessages((m) => [...m, { role: "bot", text: "Network error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating toggle button — animated orb */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="aaru-orb fixed bottom-[4.5rem] sm:bottom-6 right-4 z-[110] w-12 h-12 rounded-full text-white shadow-lg flex items-center justify-center text-xl font-bold"
        style={{
          "--aaru-c1": theme.gradFrom,
          "--aaru-c2": theme.gradTo,
          "--aaru-c3": theme.gradFrom + "99",
          "--aaru-glow": `${theme.gradFrom}88`,
        }}
        aria-label="Open Aaru expense assistant"
      >
        {open ? <FiX /> : "✦"}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-[7.5rem] sm:bottom-20 right-4 z-[109] w-[min(88vw,380px)] max-h-[min(520px,70vh)] flex flex-col rounded-2xl shadow-2xl overflow-hidden bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div
            className="flex items-center gap-3 px-4 py-3 text-white shrink-0"
            style={getGradientStyle(theme)}
          >
            <span className="text-xl font-bold select-none">✦</span>
            <div>
              <p className="font-bold text-sm leading-tight">Aaru</p>
              <p className="text-xs opacity-80">Your expense assistant</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="ml-auto opacity-80 hover:opacity-100 transition-opacity"
              aria-label="Close"
            >
              <FiX />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "bot" && msg.card ? (
                  <ConfirmCard
                    card={msg.card}
                    groups={groups}
                    userId={userId}
                    theme={theme}
                    onExpenseCreated={onExpenseCreated}
                  />
                ) : (
                  <div
                    className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm whitespace-pre-line ${
                      msg.role === "user"
                        ? "text-white rounded-br-sm"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-bl-sm"
                    }`}
                    style={msg.role === "user" ? getGradientStyle(theme) : {}}
                  >
                    {msg.text}
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-2xl rounded-bl-sm">
                  <div className="flex gap-1 items-center">
                    {[0, 1, 2].map((n) => (
                      <span
                        key={n}
                        className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: `${n * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input row */}
          <div className="p-3 border-t dark:border-gray-700 flex gap-2 shrink-0">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
              placeholder="e.g. Pizza ₹400 split with Priya"
              className="flex-1 px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2"
              style={{ "--tw-ring-color": theme.gradFrom }}
              disabled={loading}
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              className="w-9 h-9 rounded-xl text-white flex items-center justify-center disabled:opacity-40 shrink-0"
              style={getGradientStyle(theme)}
              aria-label="Send"
            >
              <FiSend size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
