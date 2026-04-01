import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/Navbar";
import BottomNav from "../components/BottomNav";
import { FiArrowRight, FiX } from "react-icons/fi";
import { API_URL, apiFetch, getUser, getUserId } from "../utils/api";
import { useTheme, getGradientStyle, getPageBgStyle } from "../utils/theme";
import { detectCategory, getCategoryInfo } from "../utils/categories";
import { computeInsights } from "../utils/insights";

// ─── Helpers ─────────────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "GOOD MORNING";
  if (h < 17) return "GOOD AFTERNOON";
  return "GOOD EVENING";
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateString) {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
  });
}

// ─── Glass card style ─────────────────────────────────────────────────────
const glassCard = (isDark) =>
  isDark
    ? {
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)",
        border: "1px solid rgba(255,255,255,0.09)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        boxShadow:
          "0 4px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
      }
    : {
        background: "#ffffff",
        border: "1px solid rgba(0,0,0,0.07)",
        boxShadow: "0 2px 16px rgba(0,0,0,0.08)",
      };

// ─── Main component ───────────────────────────────────────────────────────
export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [retryIn, setRetryIn] = useState(null);
  const [stats, setStats] = useState({ totalExpenses: 0, youOwe: 0, owedToYou: 0 });
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [groups, setGroups] = useState([]);
  const [groupSpending, setGroupSpending] = useState([]);
  const [avatar, setAvatar] = useState(localStorage.getItem("selectedAvatar") || "");
  // Insights modal state
  const [showInsights, setShowInsights] = useState(false);
  const [insightsFetched, setInsightsFetched] = useState(false);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [categoryData, setCategoryData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [insights, setInsights] = useState([]);
  const navigate = useNavigate();
  const { theme, isDark } = useTheme();

  // Auto-retry countdown when server is unreachable
  useEffect(() => {
    if (retryIn === null) return;
    if (retryIn === 0) {
      const uid = getUserId();
      if (uid) fetchDashboardData(uid);
      return;
    }
    const t = setTimeout(() => setRetryIn((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [retryIn]);

  useEffect(() => {
    const onAvatarChanged = () =>
      setAvatar(localStorage.getItem("selectedAvatar") || "");
    window.addEventListener("avatar-changed", onAvatarChanged);
    window.addEventListener("storage", onAvatarChanged);
    return () => {
      window.removeEventListener("avatar-changed", onAvatarChanged);
      window.removeEventListener("storage", onAvatarChanged);
    };
  }, []);

  useEffect(() => {
    const userData = getUser();
    const userId = getUserId();
    if (!userData || !userId) { navigate("/"); return; }
    setUser(userData);
    fetchDashboardData(userId);
  }, [navigate]);

  // ── All data fetching — unchanged from original ──────────────────────
  const fetchDashboardData = async (userId) => {
    setRetryIn(null);
    try {
      setLoading(true);

      const summaryRes = await apiFetch(`${API_URL}/auth/dashboard/summary`);
      if (summaryRes.ok) {
        const {
          groups: userGroups,
          allExpenses,
          perGroupSpending,
          stats,
          userSettlements,
        } = await summaryRes.json();
        setGroups(userGroups);
        setGroupSpending(perGroupSpending.slice(0, 6));
        setStats({
          totalExpenses: stats.totalExpenses,
          youOwe: stats.youOwe,
          owedToYou: stats.owedToYou,
        });
        setRecentExpenses(allExpenses.slice(0, 2));
        setSettlements(userSettlements.slice(0, 2));
        setFetchError(false);
        return;
      }

      // Fallback: per-group fetching
      const groupsResponse = await apiFetch(
        `${API_URL}/groups?userId=${userId}`
      );
      if (!groupsResponse.ok) throw new Error("Failed to fetch groups");
      const groupsData = await groupsResponse.json();
      const userGroups = groupsData.groups || [];
      setGroups(userGroups);

      if (!userGroups.length) {
        setStats({ totalExpenses: 0, youOwe: 0, owedToYou: 0 });
        setFetchError(false);
        return;
      }

      const groupDataArr = await Promise.all(
        userGroups.map(async (group) => {
          const [expRes, balRes, setRes] = await Promise.all([
            apiFetch(`${API_URL}/expenses/group/${group.id}`),
            apiFetch(`${API_URL}/expenses/group/${group.id}/balances`),
            apiFetch(`${API_URL}/expenses/group/${group.id}/settlements`),
          ]);
          return {
            group,
            expenses: expRes.ok ? (await expRes.json()).expenses || [] : [],
            balances: balRes.ok ? (await balRes.json()).balances || [] : [],
            settlements: setRes.ok
              ? (await setRes.json()).settlements || []
              : [],
          };
        })
      );

      let allExpenses = [];
      let totalExpensesAmount = 0;
      let userOweTotal = 0;
      let owedToUserTotal = 0;
      let allSettlements = [];
      const perGroupSpending = [];

      for (const { group, expenses, balances, settlements } of groupDataArr) {
        allExpenses = allExpenses.concat(expenses);
        const groupTotal = expenses.reduce(
          (s, e) => s + parseFloat(e.amount || 0),
          0
        );
        totalExpensesAmount += groupTotal;
        if (groupTotal > 0)
          perGroupSpending.push({ name: group.name, amount: groupTotal });

        const userBalance = balances.find((b) => b.user.id === userId);
        if (userBalance) {
          const bal = parseFloat(userBalance.balance || 0);
          if (bal < 0) userOweTotal += Math.abs(bal);
          else if (bal > 0) owedToUserTotal += bal;
        }
        allSettlements = allSettlements.concat(settlements);
      }

      allExpenses.sort(
        (a, b) =>
          new Date(b.createdAt || b.created_at) -
          new Date(a.createdAt || a.created_at)
      );

      setRecentExpenses(allExpenses.slice(0, 2));
      setSettlements(
        allSettlements
          .filter((s) => s.from.id === userId || s.to.id === userId)
          .slice(0, 2)
      );
      setStats({
        totalExpenses: totalExpensesAmount,
        youOwe: userOweTotal,
        owedToYou: owedToUserTotal,
      });
      setGroupSpending(
        perGroupSpending
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 6)
      );
      setFetchError(false);
    } catch {
      setFetchError(true);
      setRetryIn(45);
    } finally {
      setLoading(false);
    }
  };

  // ── Insights data fetch ──────────────────────────────────────────
  const fetchInsightsData = async () => {
    if (insightsFetched) return;
    setInsightsLoading(true);
    try {
      const res = await apiFetch(`${API_URL}/auth/dashboard/summary`);
      if (!res.ok) return;
      const { allExpenses = [] } = await res.json();
      const catTotals = {};
      allExpenses.forEach((e) => {
        const cat = e.category || detectCategory(e.title || "");
        catTotals[cat] = (catTotals[cat] || 0) + parseFloat(e.amount || 0);
      });
      const catArr = Object.entries(catTotals)
        .map(([key, amount]) => ({ key, amount, ...getCategoryInfo(key) }))
        .filter((c) => c.amount > 0)
        .sort((a, b) => b.amount - a.amount);
      setCategoryData(catArr);
      const now = new Date();
      const buckets = {};
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        buckets[key] = { label: d.toLocaleDateString("en-US", { month: "short" }), amount: 0, isCurrent: i === 0 };
      }
      allExpenses.forEach((e) => {
        const d = new Date(e.createdAt || e.created_at);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (buckets[key]) buckets[key].amount += parseFloat(e.amount || 0);
      });
      const mData = Object.values(buckets);
      setMonthlyData(mData);
      setInsights(computeInsights({ expenses: allExpenses, categoryData: catArr, monthlyData: mData }));
    } catch {}
    finally { setInsightsLoading(false); setInsightsFetched(true); }
  };

  // ── Loading state ────────────────────────────────────────────────────
  if (!user) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={getPageBgStyle(theme, isDark)}
      >
        <div className={`animate-spin rounded-full h-10 w-10 border-b-2 ${theme.spinner}`} />
      </div>
    );
  }

  const firstName = user.name?.split(" ")[0] || "there";
  const glass = glassCard(isDark);

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen"
      style={getPageBgStyle(theme, isDark)}
    >
      <Navbar />

      {/* ── Scrollable content — pb accounts for bottom nav ── */}
      <div className="max-w-lg mx-auto px-4 pt-5 pb-28">

        {/* ── Greeting ──────────────────────────────────────── */}
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold tracking-[0.18em] text-gray-400 dark:text-gray-500 uppercase mb-1">
              {getGreeting()}, {firstName}
            </p>
            <h1 className="text-[32px] font-black leading-tight text-gray-900 dark:text-white">
              Your Financial<br />Atmosphere.
            </h1>
          </div>
          {/* Avatar */}
          {avatar ? (
            <img
              src={avatar}
              alt="avatar"
              className="h-12 w-12 rounded-2xl object-cover flex-shrink-0 shadow-lg"
              style={{ border: `2px solid ${theme.gradFrom}55` }}
            />
          ) : (
            <div
              className="h-12 w-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-lg"
              style={getGradientStyle(theme)}
            >
              {user.name?.[0]?.toUpperCase() || "?"}
            </div>
          )}
        </div>

        {/* ── Error state ────────────────────────────────────── */}
        {fetchError && (
          <div
            className="rounded-2xl p-5 mb-5 text-center"
            style={glass}
          >
            <div className="text-3xl mb-2">⚠️</div>
            <p className="font-bold text-gray-800 dark:text-white mb-1">
              Server Unreachable
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              Your data is safe — the server is warming up. Usually resolves in
              30–60 seconds.
            </p>
            {retryIn !== null && (
              <p className="text-xs text-gray-400 mb-3">
                Auto-retrying in{" "}
                <span className="font-semibold">{retryIn}s</span>…
              </p>
            )}
            <button
              onClick={() => {
                const uid = getUserId();
                if (uid) fetchDashboardData(uid);
              }}
              className="px-5 py-2 rounded-xl text-white text-sm font-semibold"
              style={getGradientStyle(theme)}
            >
              Retry Now
            </button>
          </div>
        )}

        {/* ── Loading skeleton ────────────────────────────────── */}
        {loading && !fetchError && (
          <div className="space-y-4">
            {[120, 80, 200, 160].map((h, i) => (
              <div
                key={i}
                className="rounded-2xl animate-pulse"
                style={{ height: h, ...glass }}
              />
            ))}
          </div>
        )}

        {!loading && !fetchError && (
          <>
            {/* ── Hero Financial Overview card ─────────────────── */}
            <div className="rounded-3xl p-5 mb-4" style={glass}>
              <p className="text-[10px] font-bold tracking-[0.15em] text-gray-400 dark:text-gray-500 uppercase mb-4">
                Financial Overview
              </p>
              <div className="flex gap-4 mb-5">
                {/* Total Spend */}
                <div className="flex-1">
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">
                    Total Spend
                  </p>
                  <p className="text-[28px] font-black text-gray-900 dark:text-white leading-tight">
                    {formatCurrency(stats.totalExpenses)}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    across {groups.length} group{groups.length !== 1 ? "s" : ""}
                  </p>
                </div>
                {/* Debts */}
                <div className="flex-1">
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">
                    Debts Owed
                  </p>
                  <p
                    className="text-[28px] font-black leading-tight"
                    style={{ color: stats.youOwe > 0 ? "#ef4444" : theme.gradFrom }}
                  >
                    {formatCurrency(stats.youOwe)}
                  </p>
                  <p className="text-[11px] text-green-500 mt-0.5">
                    ↑ {formatCurrency(stats.owedToYou)} owed to you
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate("/balances")}
                data-guide="settle"
                className="w-full py-3 rounded-2xl text-white font-bold text-sm tracking-wide transition-opacity hover:opacity-90 active:scale-[0.98]"
                style={getGradientStyle(theme)}
              >
                Settle Now
              </button>
            </div>

            {/* ── Insights shortcut ───────────────────────────── */}
            <button
              onClick={() => { fetchInsightsData(); setShowInsights(true); }}
              className="w-full flex items-center justify-between px-5 py-3 rounded-2xl mb-4 transition active:scale-[0.98]"
              style={glass}
            >
              <div className="flex items-center gap-2">
                <span className="text-base">✦</span>
                <span className="text-sm font-bold text-gray-800 dark:text-white">Spending Insights</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold" style={{ color: theme.gradFrom }}>View</span>
                <FiArrowRight size={12} style={{ color: theme.gradFrom }} />
              </div>
            </button>

            {/* ── Recent Activity ──────────────────────────────── */}
            <div className="rounded-3xl p-5 mb-4" style={glass}>
              <div className="flex items-center justify-between mb-4">
                <p className="font-bold text-gray-800 dark:text-white text-sm">
                  Recent Activity
                </p>
                <button
                  onClick={() => navigate("/expenses")}
                  className="text-xs font-semibold flex items-center gap-1"
                  style={{ color: theme.gradFrom }}
                >
                  All <FiArrowRight size={11} />
                </button>
              </div>

              {recentExpenses.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-4xl mb-2">🧾</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No expenses yet — add your first one!
                  </p>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {recentExpenses.map((expense, idx) => {
                    const catInfo = getCategoryInfo(
                      expense.category ||
                        detectCategory(expense.title || "")
                    );
                    const youPaid =
                      expense.paidBy?.id === getUserId() ||
                      expense.paidBy?.name === user.name;
                    return (
                      <div
                        key={expense.id || idx}
                        className="flex items-center gap-3 py-3"
                        style={{
                          borderBottom:
                            idx < recentExpenses.length - 1
                              ? isDark
                                ? "1px solid rgba(255,255,255,0.05)"
                                : "1px solid rgba(0,0,0,0.05)"
                              : "none",
                        }}
                      >
                        {/* Category icon */}
                        <div
                          className="w-10 h-10 rounded-2xl flex items-center justify-center text-base flex-shrink-0"
                          style={{
                            background: isDark
                              ? "rgba(255,255,255,0.07)"
                              : "rgba(0,0,0,0.04)",
                          }}
                        >
                          {catInfo.icon}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <p className="text-[15px] font-semibold text-gray-800 dark:text-white truncate capitalize">
                            {expense.title}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            {expense.group?.name || "Unknown Group"} ·{" "}
                            {formatDate(expense.createdAt || expense.created_at)}
                          </p>
                        </div>

                        {/* Amount */}
                        <div className="text-right flex-shrink-0">
                          <p className="text-[15px] font-bold text-gray-900 dark:text-white">
                            {formatCurrency(parseFloat(expense.amount || 0))}
                          </p>
                          <p
                            className="text-[10px] font-semibold uppercase tracking-wide"
                            style={{
                              color: youPaid ? "#ef4444" : "#10b981",
                            }}
                          >
                            {youPaid ? "YOU PAID" : "TO RECEIVE"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Outstanding Balances ─────────────────────────── */}
            {settlements.length > 0 && (
              <div className="rounded-3xl p-5" style={glass}>
                <div className="flex items-center justify-between mb-4">
                  <p className="font-bold text-gray-800 dark:text-white text-[15px]">
                    Outstanding Balances
                  </p>
                  <button
                    onClick={() => navigate("/balances")}
                    className="text-xs font-semibold flex items-center gap-1"
                    style={{ color: theme.gradFrom }}
                  >
                    View All <FiArrowRight size={11} />
                  </button>
                </div>
                <div className="space-y-0.5">
                  {settlements.map((settlement, idx) => {
                    const isOwedToUser = settlement.to.id === user.id;
                    const other = isOwedToUser
                      ? settlement.from
                      : settlement.to;
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between py-3"
                        style={{
                          borderBottom:
                            idx < settlements.length - 1
                              ? isDark
                                ? "1px solid rgba(255,255,255,0.05)"
                                : "1px solid rgba(0,0,0,0.05)"
                              : "none",
                        }}
                      >
                        <div className="min-w-0">
                          <p
                            className="text-sm font-semibold"
                            style={{
                              color: isOwedToUser ? "#10b981" : "#ef4444",
                            }}
                          >
                            {isOwedToUser
                              ? `${other.name} owes you`
                              : `You owe ${other.name}`}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5 truncate">
                            {other.email}
                          </p>
                        </div>
                        <p
                          className="font-bold text-sm ml-3 flex-shrink-0"
                          style={{
                            color: isOwedToUser ? "#10b981" : "#ef4444",
                          }}
                        >
                          {formatCurrency(
                            parseFloat(settlement.amount || 0)
                          )}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav />

      {/* ── Spending Insights Full-Screen Modal ─────────────── */}
      <AnimatePresence>
        {showInsights && (
          <>
            {/* Backdrop */}
            <motion.div
              key="insights-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="fixed inset-0 z-50"
              style={{ backdropFilter: "blur(18px) saturate(150%)", WebkitBackdropFilter: "blur(18px) saturate(150%)", background: isDark ? "rgba(5,5,15,0.82)" : "rgba(0,0,0,0.55)" }}
              onClick={() => setShowInsights(false)}
            />
            {/* Sheet */}
            <motion.div
              key="insights-sheet"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 290 }}
              className="fixed inset-x-0 bottom-0 z-50 rounded-t-[28px] overflow-hidden"
              style={{
                background: isDark ? "rgba(11,11,22,0.98)" : "#ffffff",
                maxHeight: "90vh",
                paddingBottom: "env(safe-area-inset-bottom)",
              }}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full" style={{ background: isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.13)" }} />
              </div>
              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-2 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm" style={getGradientStyle(theme)}>✦</span>
                  <h2 className="text-[17px] font-black" style={{ color: isDark ? "#ffffff" : "#0f0f1a" }}>Spending Insights</h2>
                </div>
                <button
                  onClick={() => setShowInsights(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl"
                  style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}
                >
                  <FiX size={14} style={{ color: isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.5)" }} />
                </button>
              </div>

              {/* Scrollable content */}
              <div className="overflow-y-auto px-5 pb-8" style={{ maxHeight: "calc(90vh - 90px)" }}>
                {insightsLoading ? (
                  <div className="space-y-3 pt-2">
                    {[72, 56, 88, 72, 56].map((h, i) => (
                      <div key={i} className="rounded-2xl animate-pulse"
                        style={{ height: h, background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }} />
                    ))}
                  </div>
                ) : categoryData.length === 0 ? (
                  <div className="text-center py-16">
                    <p className="text-4xl mb-3">💸</p>
                    <p className="font-semibold" style={{ color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.35)" }}>
                      No expense data yet
                    </p>
                    <p className="text-sm mt-1" style={{ color: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.25)" }}>
                      Add expenses to see patterns
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Category breakdown */}
                    <p className="text-[10px] font-bold uppercase tracking-[0.17em] mb-3 mt-1"
                      style={{ color: isDark ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.28)" }}>
                      Top Categories
                    </p>
                    <div className="space-y-2 mb-5">
                      {categoryData.slice(0, 6).map((cat, i) => {
                        const total = categoryData.reduce((s, c) => s + c.amount, 0);
                        const pct = Math.round((cat.amount / total) * 100);
                        return (
                          <div key={cat.key}
                            className="flex items-center gap-3 p-4 rounded-2xl"
                            style={{
                              background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                              border: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)",
                            }}>
                            <span className="text-2xl flex-shrink-0 w-9 text-center">{cat.icon || "💰"}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-center mb-1.5">
                                <p className="text-sm font-bold truncate"
                                  style={{ color: isDark ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.8)" }}>
                                  {cat.label || cat.key}
                                </p>
                                <p className="text-xs font-black ml-3 flex-shrink-0" style={{ color: theme.gradFrom }}>
                                  {formatCurrency(cat.amount)}
                                </p>
                              </div>
                              <div className="h-1.5 rounded-full overflow-hidden"
                                style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}>
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${pct}%` }}
                                  transition={{ delay: i * 0.05, duration: 0.55, ease: "easeOut" }}
                                  className="h-full rounded-full"
                                  style={{ background: `linear-gradient(to right, ${theme.gradFrom}, ${theme.gradTo})` }}
                                />
                              </div>
                            </div>
                            <p className="text-xs font-bold flex-shrink-0 w-8 text-right tabular-nums"
                              style={{ color: isDark ? "rgba(255,255,255,0.32)" : "rgba(0,0,0,0.3)" }}>
                              {pct}%
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    {/* Monthly trend */}
                    {monthlyData.some((m) => m.amount > 0) && (
                      <>
                        <p className="text-[10px] font-bold uppercase tracking-[0.17em] mb-3"
                          style={{ color: isDark ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.28)" }}>
                          6-Month Trend
                        </p>
                        <div className="p-4 rounded-2xl mb-5"
                          style={{
                            background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                            border: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)",
                          }}>
                          <div className="flex items-end gap-2 h-24">
                            {monthlyData.map((m, i) => {
                              const max = Math.max(...monthlyData.map((d) => d.amount), 1);
                              return (
                                <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                                  <motion.div
                                    initial={{ height: "4%" }}
                                    animate={{ height: `${Math.max((m.amount / max) * 100, 4)}%` }}
                                    transition={{ delay: i * 0.07, duration: 0.5, ease: "easeOut" }}
                                    className="w-full rounded-lg"
                                    style={{
                                      background: m.isCurrent
                                        ? `linear-gradient(to top, ${theme.gradFrom}, ${theme.gradTo})`
                                        : isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.07)",
                                    }}
                                  />
                                  <span className="text-[9px] font-bold"
                                    style={{ color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.3)" }}>
                                    {m.label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Smart insights */}
                    {insights.length > 0 && (
                      <>
                        <p className="text-[10px] font-bold uppercase tracking-[0.17em] mb-3"
                          style={{ color: isDark ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.28)" }}>
                          Smart Insights
                        </p>
                        <div className="space-y-2">
                          {insights.map((insight, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.25 + i * 0.06, duration: 0.28 }}
                              className="flex gap-3.5 p-4 rounded-2xl"
                              style={{
                                background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.025)",
                                border: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.05)",
                              }}
                            >
                              <span className="text-2xl flex-shrink-0 leading-none mt-0.5">{insight.icon}</span>
                              <div className="min-w-0">
                                <p className="text-sm font-bold mb-0.5"
                                  style={{ color: isDark ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.8)" }}>
                                  {insight.title}
                                </p>
                                <p className="text-xs leading-snug"
                                  style={{ color: isDark ? "rgba(255,255,255,0.42)" : "rgba(0,0,0,0.45)" }}>
                                  {insight.text}
                                </p>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
