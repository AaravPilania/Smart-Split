import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, animate as fmAnimate, useInView } from "framer-motion";
import Navbar from "../components/Navbar";
import BottomNav from "../components/BottomNav";
import DashboardSidebar from "../components/DashboardSidebar";
import DashboardRightPanel from "../components/DashboardRightPanel";
import ExpenseTable from "../components/ExpenseTable";
import { FiArrowRight, FiX, FiTrendingUp, FiTrendingDown, FiDollarSign, FiUsers } from "react-icons/fi";
import { API_URL, apiFetch, getUser, getUserId, cachedApiFetch, setCache } from "../utils/api";
import { useTheme, getGradientStyle, getPageBgStyle } from "../utils/theme";
import { detectCategory, getCategoryInfo } from "../utils/categories";
import { computeInsights } from "../utils/insights";
import { staggerContainer, staggerItem, use3DTilt, GRAD_TEXT } from "../utils/desktopAnimations";

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
        background: "rgba(255,255,255,0.85)",
        border: `1px solid rgba(0,0,0,0.06)`,
        boxShadow: "0 2px 16px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03)",
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
  const [goals, setGoals] = useState([]);
  const [allExpensesRaw, setAllExpensesRaw] = useState([]);
  const navigate = useNavigate();
  const { theme, isDark } = useTheme();
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== "undefined" && window.innerWidth >= 768
  );

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

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
    // Fetch goals for desktop sidebar
    if (isDesktop) {
      apiFetch(`${API_URL}/goals`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => { if (d?.goals) setGoals(d.goals.filter((g) => g.active !== false)); })
        .catch(() => {});
    }
  }, [navigate]);

  // Desktop: auto-fetch insights data when dashboard loads
  useEffect(() => {
    if (isDesktop && !loading && !fetchError && allExpensesRaw.length > 0 && !insightsFetched) {
      fetchInsightsData();
    }
  }, [isDesktop, loading, fetchError, allExpensesRaw, insightsFetched]);

  // ── All data fetching — unchanged from original ──────────────────────
  const fetchDashboardData = async (userId) => {
    setRetryIn(null);
    try {
      setLoading(true);

      const summaryRes = await cachedApiFetch(`${API_URL}/auth/dashboard/summary`, 'dashboard_summary');
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
        setAllExpensesRaw(allExpenses);
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

      setAllExpensesRaw(allExpenses);
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
  const userId = getUserId();

  // ── CountUp component for currency values ────────────────────────────
  const CurrencyCountUp = ({ amount }) => {
    const ref = useRef(null);
    const inView = useInView(ref, { once: false, margin: "-30px" });
    const count = useMotionValue(0);
    const display = useTransform(count, (v) =>
      new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 }).format(v)
    );
    useEffect(() => {
      if (!inView) return;
      count.set(0);
      const ctrl = fmAnimate(count, amount, { duration: 1.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] });
      return ctrl.stop;
    }, [inView, amount]);
    return <motion.span ref={ref}>{display}</motion.span>;
  };

  // ── Desktop Stat Card — 3D tilt + CountUp + accent glow ───────────────
  const StatCard = ({ icon, label, value, rawAmount, sub, color, index = 0 }) => {
    const { ref, onMouseMove, onMouseLeave, motionStyle } = use3DTilt(7);
    return (
      <motion.div
        ref={ref}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        className="rounded-2xl p-5 stat-card-desktop cursor-default"
        style={{
          ...glass,
          "--card-accent-shadow": `${color}22`,
          border: isDark ? `1px solid ${color}18` : `1px solid ${color}20`,
        }}
        initial={{ opacity: 0, y: 28, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 26, delay: index * 0.09 }}
        {...motionStyle}
      >
        {/* Subtle accent glow top-right */}
        <div className="absolute top-0 right-0 w-20 h-20 rounded-2xl pointer-events-none"
          style={{ background: `radial-gradient(circle at 80% 20%, ${color}14 0%, transparent 70%)` }} />
        <div className="flex items-center gap-3 mb-3 relative">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: `${color}18`, border: `1px solid ${color}28` }}>
            {icon}
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)" }}>
            {label}
          </span>
        </div>
        <p className="text-2xl font-black relative" style={{ color: isDark ? "#fff" : "#111" }}>
          {rawAmount !== undefined ? <CurrencyCountUp amount={rawAmount} /> : value}
        </p>
        {sub && (
          <p className="text-[11px] mt-1" style={{ color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)" }}>
            {sub}
          </p>
        )}
      </motion.div>
    );
  };

  // ── Desktop Cashflow Chart — spring bars + hover glow + tooltip ───────
  const CashflowChart = () => {
    const [hoveredBar, setHoveredBar] = useState(null);
    if (!monthlyData.some((m) => m.amount > 0)) return null;
    const max = Math.max(...monthlyData.map((d) => d.amount), 1);
    return (
      <div className="rounded-2xl p-5 relative overflow-hidden" style={glass}>
        {/* Subtle glow behind current-month bar */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(ellipse at 50% 100%, ${theme.gradFrom}0d 0%, transparent 60%)` }} />
        <div className="flex items-center justify-between mb-1 relative">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-1"
              style={{ color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)" }}>
              Cashflow
            </p>
            <p className="text-xl font-black" style={{ color: isDark ? "#fff" : "#111" }}>
              <CurrencyCountUp amount={stats.totalExpenses} />
            </p>
          </div>
          <span className="text-[11px] font-semibold px-3 py-1 rounded-full"
            style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.45)" }}>
            This Year
          </span>
        </div>
        <div className="flex items-end gap-2 mt-6 relative" style={{ height: 160 }}>
          {monthlyData.map((m, i) => {
            const pct = Math.max((m.amount / max) * 100, 4);
            const isHov = hoveredBar === i;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5 relative"
                onMouseEnter={() => setHoveredBar(i)}
                onMouseLeave={() => setHoveredBar(null)}>
                {/* Hover tooltip */}
                {isHov && m.amount > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="absolute -top-9 left-1/2 -translate-x-1/2 px-2 py-1 rounded-lg text-[10px] font-bold text-white whitespace-nowrap z-10"
                    style={{ background: `linear-gradient(135deg,${theme.gradFrom},${theme.gradTo})`, boxShadow: `0 4px 16px ${theme.gradFrom}55` }}>
                    {formatCurrency(m.amount)}
                  </motion.div>
                )}
                <motion.div
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ delay: i * 0.07, type: "spring", stiffness: 260, damping: 18 }}
                  whileHover={{ scaleY: 1.04 }}
                  className="w-full rounded-lg min-h-[4px] cursor-pointer"
                  style={{
                    height: `${pct}%`,
                    transformOrigin: "bottom",
                    background: m.isCurrent || isHov
                      ? `linear-gradient(to top, ${theme.gradFrom}, ${theme.gradTo})`
                      : isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
                    boxShadow: (m.isCurrent || isHov) ? `0 0 18px ${theme.gradFrom}55` : "none",
                    transition: "background 0.2s ease, box-shadow 0.2s ease",
                  }}
                />
                <span className="text-[10px] font-semibold"
                  style={{ color: (m.isCurrent || isHov) ? theme.gradFrom : isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.35)" }}>
                  {m.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ── DESKTOP RENDER ───────────────────────────────────────────────────
  if (isDesktop) {
    return (
      <div className="min-h-screen" style={getPageBgStyle(theme, isDark)}>
        <div style={{ display: "grid", gridTemplateColumns: "260px 1fr 290px", minHeight: "100vh" }}>
          {/* Left Sidebar */}
          <DashboardSidebar goals={goals} />

          {/* Main Content */}
          <main className="overflow-y-auto py-7 px-8">

            {/* ── Greeting banner ── */}
            <motion.div
              className="mb-7 flex items-end justify-between"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
            >
              <div>
                <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-1.5"
                  style={{ color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)" }}>
                  {getGreeting()}, {firstName}
                </p>
                <h1 className="text-[2.4rem] font-black leading-[1.05] tracking-tight"
                  style={{ color: isDark ? "#fff" : "#111" }}>
                  Your Financial{" "}
                  <span style={GRAD_TEXT}>Atmosphere.</span>
                </h1>
              </div>
              {/* Quick action badge */}
              <motion.button
                onClick={() => navigate("/balances")}
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                className="px-5 py-2.5 rounded-2xl text-white text-sm font-bold flex items-center gap-2 magnetic-cta"
                style={{ background: `linear-gradient(135deg,${theme.gradFrom},${theme.gradTo})` }}>
                Settle Up <FiArrowRight size={14} />
              </motion.button>
            </motion.div>

            {/* Error state */}
            {fetchError && (
              <div className="rounded-2xl p-5 mb-5 text-center" style={glass}>
                <div className="text-3xl mb-2">⚠️</div>
                <p className="font-bold text-gray-800 dark:text-white mb-1">Server Unreachable</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  Your data is safe — the server is warming up. Usually resolves in 30–60 seconds.
                </p>
                {retryIn !== null && <p className="text-xs text-gray-400 mb-3">Auto-retrying in <span className="font-semibold">{retryIn}s</span>…</p>}
                <button onClick={() => { const uid = getUserId(); if (uid) fetchDashboardData(uid); }}
                  className="px-5 py-2 rounded-xl text-white text-sm font-semibold" style={getGradientStyle(theme)}>
                  Retry Now
                </button>
              </div>
            )}

            {/* Loading skeleton */}
            {loading && !fetchError && (
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[1, 2, 3].map((i) => <div key={i} className="rounded-2xl animate-pulse h-36" style={glass} />)}
                <div className="col-span-3 rounded-2xl animate-pulse h-64" style={glass} />
              </div>
            )}

            {!loading && !fetchError && (
              <>
                {/* ── Stat Cards Row — staggered spring entrance, 3D tilt, CountUp ── */}
                <motion.div
                  className="grid grid-cols-3 xl:grid-cols-4 gap-4 mb-6"
                  variants={staggerContainer}
                  initial="hidden"
                  animate="show"
                >
                  <StatCard
                    icon={<FiDollarSign size={20} style={{ color: theme.gradFrom }} />}
                    label="Total Spend"
                    value={formatCurrency(stats.totalExpenses)}
                    rawAmount={stats.totalExpenses}
                    sub={`across ${groups.length} group${groups.length !== 1 ? "s" : ""}`}
                    color={theme.gradFrom}
                    index={0}
                  />
                  <StatCard
                    icon={<FiTrendingDown size={20} style={{ color: "#ef4444" }} />}
                    label="You Owe"
                    value={formatCurrency(stats.youOwe)}
                    rawAmount={stats.youOwe}
                    sub="debts outstanding"
                    color="#ef4444"
                    index={1}
                  />
                  <StatCard
                    icon={<FiTrendingUp size={20} style={{ color: "#10b981" }} />}
                    label="Owed to You"
                    value={formatCurrency(stats.owedToYou)}
                    rawAmount={stats.owedToYou}
                    sub="to collect"
                    color="#10b981"
                    index={2}
                  />
                  <div className="hidden xl:block">
                    <StatCard
                      icon={<FiUsers size={20} style={{ color: theme.gradTo }} />}
                      label="Groups"
                      value={String(groups.length)}
                      sub={`${recentExpenses.length > 0 ? "active" : "no activity"}`}
                      color={theme.gradTo}
                      index={3}
                    />
                  </div>
                </motion.div>

                {/* ── Cashflow Chart — spring bars, hover tooltip, glow ── */}
                <motion.div
                  className="mb-6"
                  initial={{ opacity: 0, y: 24, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 280, damping: 26, delay: 0.3 }}
                >
                  <CashflowChart />
                </motion.div>

                {/* ── Recent Transactions Table ── */}
                <motion.div
                  className="rounded-2xl p-5"
                  style={glass}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 26, delay: 0.45 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[15px] font-bold" style={{ color: isDark ? "#fff" : "#111" }}>
                      Recent Transactions
                    </p>
                    <button onClick={() => navigate("/expenses")}
                      className="text-xs font-semibold flex items-center gap-1 transition hover:opacity-80"
                      style={{ color: theme.gradFrom }}>
                      View All <FiArrowRight size={11} />
                    </button>
                  </div>
                  <ExpenseTable
                    expenses={allExpensesRaw.slice(0, 8)}
                    userId={userId}
                    isDark={isDark}
                    theme={theme}
                    glass={glass}
                  />
                </motion.div>
              </>
            )}
          </main>

          {/* Right Panel */}
          <DashboardRightPanel
            categoryData={categoryData}
            settlements={settlements}
            recentExpenses={allExpensesRaw}
            userId={userId}
            theme={theme}
            isDark={isDark}
            navigate={navigate}
          />
        </div>
      </div>
    );
  }

  // ── MOBILE RENDER (unchanged) ────────────────────────────────────────
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

                    {/* Monthly trend — smooth wave chart */}
                    {monthlyData.some((m) => m.amount > 0) && (
                      <>
                        <p className="text-[10px] font-bold uppercase tracking-[0.17em] mb-3"
                          style={{ color: isDark ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.28)" }}>
                          6-Month Trend
                        </p>
                        {(() => {
                          const max = Math.max(...monthlyData.map(d => d.amount), 1);
                          const W = 300, H = 140, PX = 24, PY = 20;
                          const plotW = W - PX * 2, plotH = H - PY * 2;
                          const pts = monthlyData.map((m, i) => ({
                            x: PX + (i / Math.max(monthlyData.length - 1, 1)) * plotW,
                            y: PY + plotH - (m.amount / max) * plotH,
                          }));
                          // Smooth cubic bezier path
                          let d = `M${pts[0].x},${pts[0].y}`;
                          for (let i = 0; i < pts.length - 1; i++) {
                            const cp = (pts[i + 1].x - pts[i].x) * 0.4;
                            d += ` C${pts[i].x + cp},${pts[i].y} ${pts[i + 1].x - cp},${pts[i + 1].y} ${pts[i + 1].x},${pts[i + 1].y}`;
                          }
                          const fillD = `${d} L${pts[pts.length - 1].x},${H} L${pts[0].x},${H} Z`;
                          return (
                            <div className="rounded-2xl mb-5 overflow-hidden"
                              style={{
                                background: isDark
                                  ? "linear-gradient(135deg, #0c1929, #0f2744, #0c1929)"
                                  : "linear-gradient(135deg, #e0f2fe, #bae6fd, #e0f2fe)",
                              }}>
                              <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ display: "block", height: 160 }}>
                                <defs>
                                  <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={isDark ? "rgba(59,130,246,0.35)" : "rgba(59,130,246,0.25)"} />
                                    <stop offset="100%" stopColor="transparent" />
                                  </linearGradient>
                                  <filter id="trendGlow">
                                    <feGaussianBlur stdDeviation="3" result="blur" />
                                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                                  </filter>
                                </defs>
                                {/* Gradient fill under curve */}
                                <path d={fillD} fill="url(#trendFill)" />
                                {/* Glowing curve */}
                                <path d={d} fill="none" stroke={isDark ? "#60a5fa" : "#3b82f6"} strokeWidth="2.5" strokeLinecap="round" filter="url(#trendGlow)" />
                                {/* Dots on data points */}
                                {pts.map((p, i) => (
                                  <circle key={i} cx={p.x} cy={p.y} r={monthlyData[i].isCurrent ? 4 : 2.5}
                                    fill={monthlyData[i].isCurrent ? "#fff" : isDark ? "#60a5fa" : "#3b82f6"}
                                    stroke={monthlyData[i].isCurrent ? "#3b82f6" : "none"} strokeWidth={monthlyData[i].isCurrent ? 2 : 0} />
                                ))}
                                {/* Month labels */}
                                {monthlyData.map((m, i) => (
                                  <text key={`l-${i}`} x={pts[i].x} y={H - 4} textAnchor="middle"
                                    fill={isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.4)"}
                                    fontSize="9" fontWeight="600">{m.label}</text>
                                ))}
                              </svg>
                            </div>
                          );
                        })()}
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
