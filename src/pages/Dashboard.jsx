import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import BottomNav from "../components/BottomNav";
import { FiArrowRight } from "react-icons/fi";
import { API_URL, apiFetch, getUser, getUserId } from "../utils/api";
import { useTheme, getGradientStyle, getPageBgStyle } from "../utils/theme";
import { detectCategory, getCategoryInfo } from "../utils/categories";

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
            <h1 className="text-[26px] font-black leading-tight text-gray-900 dark:text-white">
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
                  <p className="text-2xl font-black text-gray-900 dark:text-white leading-tight">
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
                    className="text-2xl font-black leading-tight"
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
                className="w-full py-3 rounded-2xl text-white font-bold text-sm tracking-wide transition-opacity hover:opacity-90 active:scale-[0.98]"
                style={getGradientStyle(theme)}
              >
                Settle Now
              </button>
            </div>

            {/* ── Insights shortcut ───────────────────────────── */}
            <button
              onClick={() => navigate("/profile")}
              className="w-full flex items-center justify-between px-5 py-3 rounded-2xl mb-4 transition active:scale-[0.98]"
              style={glass}
            >
              <div className="flex items-center gap-2">
                <span className="text-base">✦</span>
                <span className="text-sm font-bold text-gray-800 dark:text-white">Spending Insights</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold" style={{ color: theme.gradFrom }}>View on Profile</span>
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
                          <p className="text-sm font-semibold text-gray-800 dark:text-white truncate capitalize">
                            {expense.title}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            {expense.group?.name || "Unknown Group"} ·{" "}
                            {formatDate(expense.createdAt || expense.created_at)}
                          </p>
                        </div>

                        {/* Amount */}
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold text-gray-900 dark:text-white">
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
                  <p className="font-bold text-gray-800 dark:text-white text-sm">
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
    </div>
  );
}
