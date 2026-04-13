import { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, animate as fmAnimate, useInView } from "framer-motion";
import Navbar from "../components/Navbar";
import CategoryDonut from "../components/CategoryDonut";
import BottomNav from "../components/BottomNav";
import DashboardSidebar from "../components/DashboardSidebar";
import DashboardRightPanel from "../components/DashboardRightPanel";
import InsightsPanel from "../components/InsightsPanel";
import { FiArrowRight, FiX, FiTrendingUp, FiTrendingDown, FiDollarSign, FiUsers, FiBarChart2, FiPlus, FiMoreHorizontal, FiZap } from "react-icons/fi";
import { API_URL, apiFetch, getUser, getUserId, cachedApiFetch, setCache } from "../utils/api";
import { useTheme, getGradientStyle, getPageBgStyle } from "../utils/theme";
import { detectCategory, getCategoryInfo } from "../utils/categories";
import { computeInsights } from "../utils/insights";
import { staggerContainer, staggerItem, use3DTilt, GRAD_TEXT } from "../utils/desktopAnimations";

// ─── Helpers ─────────────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
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

// ─── CountUp component — defined OUTSIDE Dashboard so it never remounts ───
function CurrencyCountUp({ amount }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-30px" });
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
}

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
  const isRealDesktop = () =>
    typeof window !== "undefined" &&
    window.innerWidth >= 768 &&
    !window.matchMedia("(pointer: coarse)").matches;
  const [isDesktop, setIsDesktop] = useState(isRealDesktop);

  useEffect(() => {
    const onResize = () => setIsDesktop(isRealDesktop());
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
    // Fetch fresh profile for monthlyBudget
    apiFetch(`${API_URL}/auth/profile/${userId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.user) setUser(prev => ({ ...prev, monthlyBudget: d.user.monthlyBudget || 0 })); })
      .catch(() => {});
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
      // Use already-loaded allExpensesRaw; only re-fetch if empty
      let allExpenses = allExpensesRaw;
      if (allExpenses.length === 0) {
        const res = await apiFetch(`${API_URL}/auth/dashboard/summary`);
        if (!res.ok) return;
        const data = await res.json();
        allExpenses = data.allExpenses || [];
      }
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
      for (let i = 7; i >= 0; i--) {
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

  // ── Desktop Cashflow Chart — smooth glowing line chart ───────────────
  const CashflowChart = () => {
    const [hoveredIdx, setHoveredIdx] = useState(null);
    const containerRef = useRef(null);
    const [dims, setDims] = useState({ w: 600, h: 240 });
    const chartInView = useInView(containerRef, { once: true, margin: "-40px" });
    const lineRef = useRef(null);
    const [pathLen, setPathLen] = useState(0);

    useEffect(() => {
      const el = containerRef.current;
      if (!el) return;
      const ro = new ResizeObserver(([entry]) => {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) setDims({ w: width, h: height });
      });
      ro.observe(el);
      return () => ro.disconnect();
    }, []);

    /* Measure SVG path length for line-draw animation */
    useEffect(() => {
      if (lineRef.current) setPathLen(lineRef.current.getTotalLength());
    });

    if (!monthlyData.some((m) => m.amount > 0)) return null;

    const { w, h } = dims;
    const PAD_L = 16, PAD_R = 28, PAD_T = 20, PAD_B = 28;
    const plotW = w - PAD_L - PAD_R;
    const plotH = h - PAD_T - PAD_B;
    const max = Math.max(...monthlyData.map((d) => d.amount), 1);

    const pts = monthlyData.map((d, i) => ({
      x: PAD_L + (i / Math.max(monthlyData.length - 1, 1)) * plotW,
      y: PAD_T + plotH - (d.amount / max) * plotH,
    }));

    let linePath = `M${pts[0].x},${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const cp = (pts[i + 1].x - pts[i].x) * 0.4;
      linePath += ` C${pts[i].x + cp},${pts[i].y} ${pts[i + 1].x - cp},${pts[i + 1].y} ${pts[i + 1].x},${pts[i + 1].y}`;
    }
    const fillPath = `${linePath} L${pts[pts.length - 1].x},${PAD_T + plotH} L${pts[0].x},${PAD_T + plotH} Z`;
    const last = pts[pts.length - 1];

    // Derive chart-specific background tinted very subtly with the theme hue
    const chartBg = isDark
      ? `linear-gradient(160deg, ${theme.gradFrom}0d 0%, ${theme.gradFrom}06 50%, ${theme.gradFrom}0d 100%)`
      : `linear-gradient(160deg, ${theme.gradFrom}12 0%, ${theme.gradFrom}08 50%, ${theme.gradFrom}12 100%)`;

    return (
      <div
        className="rounded-2xl p-5 relative overflow-hidden flex flex-col h-full"
        style={{
          background: chartBg,
          border: isDark ? `1px solid ${theme.gradFrom}22` : `1px solid ${theme.gradFrom}28`,
          boxShadow: isDark ? `0 4px 32px ${theme.gradFrom}14` : `0 2px 16px ${theme.gradFrom}10`,
        }}
      >
        {/* Header row */}
        <div className="flex items-center justify-between mb-3 flex-shrink-0">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em]"
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

        {/* SVG chart area fills remaining height */}
        <div ref={containerRef} className="flex-1 min-h-0 relative">
          <svg
            width="100%"
            height="100%"
            style={{ display: "block", overflow: "visible" }}
          >
            <defs>
              <linearGradient id="cfFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={`${theme.gradFrom}3a`} />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
              <filter id="cfGlow" x="-10%" y="-40%" width="120%" height="180%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <filter id="cfDotGlow" x="-200%" y="-200%" width="500%" height="500%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            {/* Gradient fill under curve */}
            <path d={fillPath} fill="url(#cfFill)"
              style={{ opacity: chartInView ? 1 : 0, transition: "opacity 0.8s ease 0.4s" }} />

            {/* Outer glow layer */}
            <path d={linePath} fill="none"
              stroke={`${theme.gradFrom}70`}
              strokeWidth="6" strokeLinecap="round" opacity={chartInView ? 0.5 : 0}
              strokeDasharray={pathLen || 2000}
              strokeDashoffset={chartInView ? 0 : (pathLen || 2000)}
              style={{ transition: "stroke-dashoffset 1.2s ease-out, opacity 0.3s ease" }} />

            {/* Main glowing line — line-draw animation */}
            <path ref={lineRef} d={linePath} fill="none"
              stroke={theme.gradFrom}
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              filter="url(#cfGlow)"
              strokeDasharray={pathLen || 2000}
              strokeDashoffset={chartInView ? 0 : (pathLen || 2000)}
              style={{ transition: "stroke-dashoffset 1.2s ease-out" }} />

            {/* Bright core — mix toward gradTo */}
            <path d={linePath} fill="none"
              stroke={theme.gradTo}
              strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.55"
              strokeDasharray={pathLen || 2000}
              strokeDashoffset={chartInView ? 0 : (pathLen || 2000)}
              style={{ transition: "stroke-dashoffset 1.2s ease-out" }} />

            {/* Data point dots */}
            {pts.map((p, i) => {
              const cur = monthlyData[i]?.isCurrent;
              const hov = hoveredIdx === i;
              return (
                <circle key={i} cx={p.x} cy={p.y}
                  r={cur || hov ? 5 : 3}
                  fill={cur ? "#fff" : theme.gradFrom}
                  stroke={cur ? theme.gradFrom : "none"} strokeWidth={cur ? 2.5 : 0}
                  style={{
                    opacity: chartInView ? 1 : 0,
                    transform: chartInView ? "scale(1)" : "scale(0)",
                    transformOrigin: `${p.x}px ${p.y}px`,
                    transformBox: "fill-box",
                    transition: `opacity 0.3s ease ${0.8 + i * 0.08}s, transform 0.3s ease ${0.8 + i * 0.08}s`,
                  }} />
              );
            })}

            {/* Terminal glowing dot at latest point */}
            <circle cx={last.x} cy={last.y} r="9" fill={theme.gradFrom} opacity="0.22" filter="url(#cfDotGlow)" />
            <circle cx={last.x} cy={last.y} r="5" fill={theme.gradFrom} />
            <circle cx={last.x} cy={last.y} r="2.5" fill="#fff" opacity="0.9" />

            {/* Month labels */}
            {monthlyData.map((m, i) => (
              <text key={`lbl${i}`} x={pts[i].x} y={PAD_T + plotH + PAD_B - 4}
                textAnchor="middle"
                fill={m.isCurrent
                  ? theme.gradFrom
                  : (isDark ? "rgba(255,255,255,0.38)" : "rgba(0,0,0,0.3)")}
                fontSize="10" fontWeight={m.isCurrent ? "700" : "500"}>
                {m.label}
              </text>
            ))}

            {/* Hover tooltip */}
            {hoveredIdx !== null && (() => {
              const p = pts[hoveredIdx];
              return (
                <>
                  <rect x={p.x - 36} y={p.y - 32} width="72" height="20" rx="6"
                    fill={theme.gradFrom} opacity="0.92" />
                  <text x={p.x} y={p.y - 18} textAnchor="middle"
                    fill="white" fontSize="9" fontWeight="700">
                    {formatCurrency(monthlyData[hoveredIdx]?.amount)}
                  </text>
                </>
              );
            })()}
          </svg>

          {/* Invisible hover strips per month */}
          <div className="absolute inset-0 flex" style={{ pointerEvents: "none" }}>
            {monthlyData.map((_, i) => (
              <div key={i} className="flex-1 h-full" style={{ pointerEvents: "all" }}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)} />
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ── DESKTOP RENDER ───────────────────────────────────────────────────
  if (isDesktop) {
    const netBalance = stats.owedToYou - stats.youOwe;
    const isNetPositive = netBalance >= 0;

    return (
      <div className="min-h-screen relative" style={getPageBgStyle(theme, isDark)}>
        {/* Ambient decorative dots */}
        <div className="desktop-ambient-dots" aria-hidden />
        <div className="desktop-glow-a" aria-hidden />
        <div className="desktop-glow-b" aria-hidden />

        <div className="relative z-[1]" style={{ display: "grid", gridTemplateColumns: "68px 1fr 290px", height: "100vh" }}>
          {/* Left Sidebar */}
          <DashboardSidebar goals={goals} />

          {/* ── Main Content ── */}
          <main className="flex flex-col overflow-hidden pt-8 pb-8 px-8 page-enter-desktop" style={{ height: "100vh" }}>

            {/* ── Page Header ── */}
            <motion.div
              className="flex items-center justify-between mb-8 flex-shrink-0"
              initial={{ opacity: 0, y: -14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 340, damping: 28 }}
            >
              <div className="flex items-center gap-3">
                <motion.div
                  className="relative flex-shrink-0"
                  initial={{ opacity: 0, scale: 0, rotate: -10 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 320, damping: 20, delay: 0.05 }}
                >
                  <div className="absolute -inset-2 rounded-2xl opacity-40 pointer-events-none"
                    style={{ background: `radial-gradient(${theme.gradFrom}, transparent)`, filter: "blur(8px)" }} />
                  <Link to="/dashboard">
                    <img src="/icon.png" alt="Smart Split" className="relative h-10 w-10 rounded-xl shadow-xl" />
                  </Link>
                </motion.div>
                <div>
                  <h1 className="text-[1.9rem] font-black tracking-tight leading-[1.12]" style={{ color: isDark ? "#fff" : "#0d0d0d" }}>
                    {getGreeting()},{" "}
                    <span style={GRAD_TEXT}>{firstName}</span>
                  </h1>
                  <p className="text-[13px] mt-1.5" style={{ color: isDark ? "rgba(255,255,255,0.38)" : "rgba(0,0,0,0.38)" }}>
                    Track expenses, settle debts, stay friends
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {avatar ? (
                  <img
                    src={avatar}
                    alt="avatar"
                    className="h-12 w-12 rounded-2xl object-cover shadow-xl"
                    style={{ border: `2.5px solid ${theme.gradFrom}66` }}
                  />
                ) : (
                  <div
                    className="h-12 w-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-xl"
                    style={{ background: `linear-gradient(135deg, ${theme.gradFrom}, ${theme.gradTo})` }}
                  >
                    {user.name?.[0]?.toUpperCase() || "?"}
                  </div>
                )}
                <motion.button
                  onClick={() => navigate("/balances")}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className="px-5 py-2.5 rounded-2xl text-white text-sm font-bold flex items-center gap-2 magnetic-cta"
                  style={{
                    background: `linear-gradient(135deg, ${theme.gradFrom}, ${theme.gradTo})`,
                    boxShadow: `0 4px 24px ${theme.gradFrom}44`,
                  }}
                >
                  Settle Up <FiArrowRight size={14} />
                </motion.button>
              </div>
            </motion.div>

            {/* ── Error state ── */}
            {fetchError && (
              <div className="rounded-2xl p-6 mb-6 text-center" style={glass}>
                <div className="text-3xl mb-3">⚡</div>
                <p className="font-bold mb-1" style={{ color: isDark ? "#fff" : "#111" }}>Server Warming Up</p>
                <p className="text-sm mb-3" style={{ color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.45)" }}>
                  Your data is safe — usually resolves in 30–60 seconds.
                </p>
                {retryIn !== null && (
                  <p className="text-xs mb-3" style={{ color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)" }}>
                    Auto-retrying in <span className="font-semibold">{retryIn}s</span>…
                  </p>
                )}
                <button
                  onClick={() => { const uid = getUserId(); if (uid) fetchDashboardData(uid); }}
                  className="px-5 py-2 rounded-xl text-white text-sm font-semibold"
                  style={getGradientStyle(theme)}
                >
                  Retry Now
                </button>
              </div>
            )}

            {/* ── Loading skeleton ── */}
            {loading && !fetchError && (
              <div className="flex-1 space-y-4">
                <div className="rounded-2xl animate-pulse h-36" style={glass} />
                <div className="grid grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => <div key={i} className="rounded-2xl animate-pulse h-28" style={glass} />)}
                </div>
                <div className="rounded-2xl animate-pulse h-52" style={glass} />
              </div>
            )}

            {!loading && !fetchError && (
              <div className="flex flex-col flex-1 min-h-0">
                {/* ── Monetra card grid: Smart Wallet (row-span-2) + 4 stat cards ── */}
                <div className="grid gap-4 mb-5" style={{ gridTemplateColumns: "1.35fr 1fr 1fr" }}>
                  {/* Smart Wallet — spans both rows */}
                  <motion.div
                    className="row-span-2 rounded-3xl p-6 relative overflow-hidden flex flex-col"
                    style={{
                      background: isDark
                        ? `linear-gradient(140deg, ${theme.gradFrom}22 0%, ${theme.gradTo}12 60%, rgba(255,255,255,0.03) 100%)`
                        : `linear-gradient(140deg, ${theme.gradFrom}16 0%, ${theme.gradTo}08 100%)`,
                      border: isDark ? `1px solid ${theme.gradFrom}28` : `1px solid ${theme.gradFrom}22`,
                      boxShadow: isDark ? `0 8px 40px ${theme.gradFrom}18` : `0 4px 24px ${theme.gradFrom}12`,
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 26 }}
                  >
                    <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full pointer-events-none"
                      style={{ background: `radial-gradient(circle, ${theme.gradFrom}30 0%, transparent 65%)`, filter: "blur(28px)" }} />
                    <div className="flex items-start justify-between mb-1 relative">
                      <div>
                        <p className="text-[14px] font-black" style={{ color: isDark ? "#fff" : "#111" }}>Smart Wallet</p>
                        <p className="text-[11px] mt-0.5" style={{ color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.42)" }}>
                          Effortless expense tracking.
                        </p>
                      </div>
                      <button
                        onClick={() => navigate("/groups")}
                        className="text-[11px] font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 transition hover:opacity-80 relative flex-shrink-0"
                        style={{ background: isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.06)", color: theme.gradFrom }}
                      >
                        Add New <FiPlus size={10} />
                      </button>
                    </div>
                    <p className="text-[2.8rem] font-black leading-none tracking-tight mt-5 mb-1.5 relative"
                      style={{ color: isNetPositive ? "#10b981" : "#ef4444" }}>
                      {isNetPositive ? "+" : "\u2212"}<CurrencyCountUp amount={Math.abs(netBalance)} />
                    </p>
                    <p className="text-[11px] mb-6 relative" style={{ color: isDark ? "rgba(255,255,255,0.38)" : "rgba(0,0,0,0.42)" }}>
                      Net Balance
                    </p>
                    <div className="flex gap-4 flex-wrap mt-auto relative">
                      {groups.length > 0
                        ? groups.slice(0, 3).map((group) => (
                            <button
                              key={group._id || group.id}
                              onClick={() => navigate("/groups")}
                              className="flex flex-col items-center gap-1.5 group/cat"
                            >
                              <div
                                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-[15px] shadow-md group-hover/cat:scale-110 transition-transform"
                                style={{ background: `linear-gradient(135deg, ${theme.gradFrom}cc, ${theme.gradTo}bb)` }}
                              >
                                {group.name?.[0]?.toUpperCase() || "G"}
                              </div>
                              <span className="text-[9px] font-semibold max-w-[48px] truncate"
                                style={{ color: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)" }}>
                                {group.name}
                              </span>
                            </button>
                          ))
                        : (
                            <button onClick={() => navigate("/groups")} className="flex flex-col items-center gap-1.5">
                              <div
                                className="w-12 h-12 rounded-2xl flex items-center justify-center transition hover:scale-110"
                                style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)", border: isDark ? "2px dashed rgba(255,255,255,0.25)" : `2px dashed ${theme.gradFrom}55` }}
                              >
                                <FiPlus size={18} style={{ color: theme.gradFrom }} />
                              </div>
                              <span className="text-[9px] font-semibold" style={{ color: isDark ? "rgba(255,255,255,0.38)" : "rgba(0,0,0,0.38)" }}>
                                Add Group
                              </span>
                            </button>
                          )}
                    </div>
                  </motion.div>

                  {/* 4 stat cards in 2x2 grid */}
                  {[
                    { label: "Current Balance", icon: "\u{1F4B0}", amount: stats.youOwe,         isCurrency: true,  trend: "down",    color: "#ef4444",      sub: "you owe",      delay: 0.07 },
                    { label: "Savings",         icon: "\u{1F6E1}\uFE0F",  amount: stats.owedToYou,      isCurrency: true,  trend: "up",      color: "#10b981",      sub: "owed to you",  delay: 0.11 },
                    { label: "__insights__", delay: 0.15 },
                    { label: "Expenses",        icon: "\u{1F4CA}", amount: allExpensesRaw.length, isCurrency: false, trend: "neutral", color: "#a855f7",      sub: "transactions", delay: 0.19 },
                  ].map(({ label, icon, amount, isCurrency, trend, color, sub, delay }) => {
                    // Insights mini-card (replaces Income)
                    if (label === "__insights__") {
                      const topInsight = insights[0];
                      return (
                        <motion.div
                          key="insights-card"
                          className="rounded-2xl p-4 relative overflow-hidden flex flex-col cursor-pointer"
                          style={{
                            background: `linear-gradient(135deg, ${theme.gradFrom}22 0%, ${theme.gradTo}12 100%)`,
                            border: `1px solid ${theme.gradFrom}44`,
                            boxShadow: `0 4px 24px ${theme.gradFrom}22`,
                          }}
                          initial={{ opacity: 0, y: 14, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ type: "spring", stiffness: 280, damping: 26, delay }}
                          onClick={() => { fetchInsightsData(); setShowInsights(true); }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full pointer-events-none"
                            style={{ background: `radial-gradient(circle, ${theme.gradFrom}35 0%, transparent 65%)`, filter: "blur(12px)" }} />
                          <div className="flex items-center justify-between mb-2 relative">
                            <div className="flex items-center gap-1.5">
                              <FiZap size={14} style={{ color: theme.gradFrom }} />
                              <p className="text-[13px] font-bold" style={{ color: isDark ? "rgba(255,255,255,0.9)" : theme.gradFrom }}>Insights</p>
                            </div>
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: `linear-gradient(135deg, ${theme.gradFrom}, ${theme.gradTo})` }}>View →</span>
                          </div>
                          {insightsLoading ? (
                            <div className="flex-1 space-y-1.5">
                              <div className="h-2.5 rounded-full animate-pulse" style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }} />
                              <div className="h-2 w-3/4 rounded-full animate-pulse" style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)" }} />
                            </div>
                          ) : topInsight ? (
                            <div className="flex-1 min-w-0">
                              <p className="text-[12px] font-bold leading-tight truncate" style={{ color: isDark ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.8)" }}>{topInsight.title}</p>
                              <p className="text-[10px] mt-0.5 leading-snug" style={{ color: isDark ? "rgba(255,255,255,0.42)" : "rgba(0,0,0,0.44)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{topInsight.text}</p>
                            </div>
                          ) : (
                            <p className="text-[11px] mt-1" style={{ color: isDark ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.28)" }}>Tap to view insights</p>
                          )}
                        </motion.div>
                      );
                    }
                    return (
                    <motion.div
                      key={label}
                      className="rounded-2xl p-4 relative overflow-hidden"
                      style={glass}
                      initial={{ opacity: 0, y: 14, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ type: "spring", stiffness: 280, damping: 26, delay }}
                    >
                      <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none"
                        style={{ background: `radial-gradient(circle at 100% 0%, ${color}18 0%, transparent 70%)` }} />
                      <div className="flex items-center justify-between mb-2.5 relative">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm leading-none">{icon}</span>
                          <p className="text-[10px] font-semibold" style={{ color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)" }}>{label}</p>
                        </div>
                        <button
                          className="h-5 w-5 rounded-full flex items-center justify-center"
                          style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)" }}
                        >
                          <FiMoreHorizontal size={10} style={{ color: isDark ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.28)" }} />
                        </button>
                      </div>
                      <p className="text-[1.5rem] font-black tracking-tight leading-none mb-2.5 relative"
                        style={{ color: isDark ? "#fff" : "#111" }}>
                        {isCurrency ? <CurrencyCountUp amount={amount} /> : amount}
                      </p>
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full w-fit"
                        style={{ background: `${color}14` }}>
                        {trend === "up" && <FiTrendingUp size={10} color={color} />}
                        {trend === "down" && <FiTrendingDown size={10} color={color} />}
                        <span className="text-[9px] font-bold" style={{ color }}>{sub}</span>
                      </div>
                    </motion.div>
                    );
                  })}
                </div>

                {/* Cashflow Chart — fills remaining height */}
                <motion.div
                  className="flex-1 min-h-0"
                  initial={{ opacity: 0, y: 24, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 280, damping: 26, delay: 0.3 }}
                >
                  <CashflowChart />
                </motion.div>


              </div>
            )}
          </main>

          {/* Right Panel */}
          <DashboardRightPanel
            settlements={settlements}
            userId={userId}
            user={user}
            theme={theme}
            isDark={isDark}
            navigate={navigate}
            onScanReceipt={() => window.dispatchEvent(new Event("open-scan-receipt"))}
            recentExpenses={allExpensesRaw.slice(0, 7)}
          />
        </div>

        {/* ── Spending Insights Sheet — desktop (same modal as mobile) ── */}
        <AnimatePresence>
          {showInsights && (
            <>
              <motion.div
                key="dt-insights-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22 }}
                className="fixed inset-0 z-50"
                style={{ backdropFilter: "blur(18px) saturate(150%)", WebkitBackdropFilter: "blur(18px) saturate(150%)", background: isDark ? "rgba(5,5,15,0.82)" : "rgba(0,0,0,0.55)" }}
                onClick={() => setShowInsights(false)}
              />
              <motion.div
                key="dt-insights-sheet"
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
                <div className="flex justify-center pt-3 pb-1">
                  <div className="w-10 h-1 rounded-full" style={{ background: isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.13)" }} />
                </div>
                <div className="flex items-center justify-between px-5 pt-2 pb-3">
                  <div className="flex items-center gap-2.5">
                    <FiZap size={18} style={{ color: theme.gradFrom }} />
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
                      <p className="text-4xl mb-3">📊</p>
                      <p className="font-semibold" style={{ color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.35)" }}>No expense data yet</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-[10px] font-bold uppercase tracking-[0.17em] mb-3 mt-1"
                        style={{ color: isDark ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.28)" }}>Top Categories</p>
                      <div className="space-y-2 mb-5">
                        {categoryData.slice(0, 6).map((cat, i) => {
                          const total = categoryData.reduce((s, c) => s + c.amount, 0);
                          const pct = Math.round((cat.amount / total) * 100);
                          return (
                            <div key={cat.key} className="flex items-center gap-3 p-4 rounded-2xl"
                              style={{
                                background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                                border: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)",
                              }}>
                              <span className="text-2xl flex-shrink-0 w-9 text-center">{cat.icon || "📦"}</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center mb-1.5">
                                  <p className="text-sm font-bold truncate" style={{ color: isDark ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.8)" }}>{cat.label || cat.key}</p>
                                  <p className="text-xs font-black ml-3 flex-shrink-0" style={{ color: theme.gradFrom }}>{formatCurrency(cat.amount)}</p>
                                </div>
                                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}>
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
                                style={{ color: isDark ? "rgba(255,255,255,0.32)" : "rgba(0,0,0,0.3)" }}>{pct}%</p>
                            </div>
                          );
                        })}
                      </div>
                      {insights.length > 0 && (
                        <>
                          <p className="text-[10px] font-bold uppercase tracking-[0.17em] mb-3"
                            style={{ color: isDark ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.28)" }}>Smart Insights</p>
                          <div className="space-y-2">
                            {insights.map((insight, i) => (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.07 }}
                                className="flex gap-3 p-4 rounded-2xl"
                                style={{
                                  background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                                  border: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)",
                                }}
                              >
                                <span className="text-lg flex-shrink-0 mt-0.5">{insight.icon || "💡"}</span>
                                <div>
                                  <p className="text-[13px] font-bold mb-0.5" style={{ color: isDark ? "rgba(255,255,255,0.88)" : "rgba(0,0,0,0.82)" }}>{insight.title}</p>
                                  <p className="text-[12px] leading-relaxed" style={{ color: isDark ? "rgba(255,255,255,0.48)" : "rgba(0,0,0,0.5)" }}>{insight.text}</p>
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

  // ── MOBILE RENDER (unchanged) ────────────────────────────────────────
  return (
    <div
      className="min-h-screen"
      style={getPageBgStyle(theme, isDark)}
    >
      <Navbar />
      <div className="h-16" />

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
            <div className="text-3xl mb-2">⚡</div>
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
            {/* ── Active Trip Banner ──────────────────────────── */}
            {(() => {
              const now = new Date();
              const activeTrips = groups.filter(g => g.type === 'trip' && !g.archived && g.endDate && new Date(g.endDate) > now);
              if (!activeTrips.length) return null;
              return activeTrips.map(trip => {
                const end = new Date(trip.endDate);
                const daysLeft = Math.ceil((end - now) / 86400000);
                return (
                  <div key={trip._id || trip.id} className="rounded-2xl p-4 mb-4 flex items-center gap-3 cursor-pointer"
                    style={{ background: isDark ? "rgba(59,130,246,0.1)" : "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.2)" }}
                    onClick={() => navigate(`/expenses?group=${trip._id || trip.id}`)}>
                    <span className="text-2xl">✈️</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate" style={{ color: isDark ? "#fff" : "#111" }}>{trip.name}</p>
                      <p className="text-[11px]" style={{ color: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)" }}>
                        {daysLeft > 0 ? `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left` : 'Ending today'}
                        {trip.budget ? ` · Budget: ₹${trip.budget.toLocaleString()}` : ''}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold"
                      style={{ background: daysLeft <= 2 ? "rgba(245,158,11,0.15)" : "rgba(34,197,94,0.15)", color: daysLeft <= 2 ? "#f59e0b" : "#22c55e" }}>
                      {daysLeft <= 2 ? "Ending Soon" : "Active"}
                    </span>
                  </div>
                );
              });
            })()}

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
                    +{formatCurrency(stats.owedToYou)} owed to you
                  </p>
                </div>
              </div>
              {/* Budget progress bar */}
              {user?.monthlyBudget > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs text-gray-400 dark:text-gray-500">Monthly Budget</p>
                    <p className="text-xs font-bold" style={{ color: stats.totalExpenses > user.monthlyBudget ? "#ef4444" : theme.gradFrom }}>
                      {formatCurrency(stats.totalExpenses)} / {formatCurrency(user.monthlyBudget)}
                    </p>
                  </div>
                  <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min(100, (stats.totalExpenses / user.monthlyBudget) * 100)}%`,
                        background: stats.totalExpenses > user.monthlyBudget
                          ? "#ef4444"
                          : stats.totalExpenses > user.monthlyBudget * 0.8
                            ? "#f59e0b"
                            : `linear-gradient(135deg, ${theme.gradFrom}, ${theme.gradTo})`,
                      }}
                    />
                  </div>
                  {stats.totalExpenses > user.monthlyBudget * 0.8 && stats.totalExpenses <= user.monthlyBudget && (
                    <p className="text-[10px] text-amber-500 mt-1 font-semibold">Approaching budget limit</p>
                  )}
                  {stats.totalExpenses > user.monthlyBudget && (
                    <p className="text-[10px] text-red-500 mt-1 font-semibold">Over budget by {formatCurrency(stats.totalExpenses - user.monthlyBudget)}</p>
                  )}
                </div>
              )}
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
              style={{
                background: `linear-gradient(135deg, ${theme.gradFrom}22 0%, ${theme.gradTo}12 100%)`,
                border: `1px solid ${theme.gradFrom}44`,
              }}
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, ${theme.gradFrom}, ${theme.gradTo})` }}><FiZap size={13} /></div>
                <span className="text-sm font-bold" style={{ color: isDark ? "#fff" : theme.gradFrom }}>Spending Insights</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold px-3 py-1 rounded-full text-white" style={{ background: `linear-gradient(135deg, ${theme.gradFrom}, ${theme.gradTo})` }}>View</span>
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
                  <p className="text-4xl mb-2">📋</p>
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
                            {expense.group?.name || "Unknown Group"} ┬╖{" "}
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
                  <span className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm" style={getGradientStyle(theme)}>✨</span>
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
                    <div className="mb-5 p-4 rounded-2xl"
                      style={{
                        background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.025)",
                        border: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.05)",
                      }}>
                      <CategoryDonut categoryData={categoryData} formatCurrency={formatCurrency} theme={theme} isDark={isDark} />
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
                          const MobileTrendSvg = () => {
                            const svgRef = useRef(null);
                            const trendLineRef = useRef(null);
                            const trendInView = useInView(svgRef, { once: true, margin: "-20px" });
                            const [tLen, setTLen] = useState(0);
                            useEffect(() => { if (trendLineRef.current) setTLen(trendLineRef.current.getTotalLength()); });
                            return (
                              <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ display: "block", height: 160 }}>
                                <defs>
                                  <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={isDark ? `${theme.gradFrom}59` : `${theme.gradFrom}40`} />
                                    <stop offset="100%" stopColor="transparent" />
                                  </linearGradient>
                                  <filter id="trendGlow">
                                    <feGaussianBlur stdDeviation="3" result="blur" />
                                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                                  </filter>
                                </defs>
                                {/* Gradient fill under curve */}
                                <path d={fillD} fill="url(#trendFill)"
                                  style={{ opacity: trendInView ? 1 : 0, transition: "opacity 0.8s ease 0.4s" }} />
                                {/* Glowing curve — line-draw animation */}
                                <path ref={trendLineRef} d={d} fill="none" stroke={isDark ? theme.gradTo : theme.gradFrom} strokeWidth="2.5" strokeLinecap="round" filter="url(#trendGlow)"
                                  strokeDasharray={tLen || 1000}
                                  strokeDashoffset={trendInView ? 0 : (tLen || 1000)}
                                  style={{ transition: "stroke-dashoffset 1s ease-out" }} />
                                {/* Dots on data points */}
                                {pts.map((p, i) => (
                                  <circle key={i} cx={p.x} cy={p.y} r={monthlyData[i].isCurrent ? 4 : 2.5}
                                    fill={monthlyData[i].isCurrent ? "#fff" : isDark ? theme.gradTo : theme.gradFrom}
                                    stroke={monthlyData[i].isCurrent ? theme.gradFrom : "none"} strokeWidth={monthlyData[i].isCurrent ? 2 : 0}
                                    style={{ opacity: trendInView ? 1 : 0, transition: `opacity 0.3s ease ${0.6 + i * 0.08}s` }} />
                                ))}
                                {/* Month labels */}
                                {monthlyData.map((m, i) => (
                                  <text key={`l-${i}`} x={pts[i].x} y={H - 4} textAnchor="middle"
                                    fill={isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.4)"}
                                    fontSize="9" fontWeight="600">{m.label}</text>
                                ))}
                              </svg>
                            );
                          };
                          return (
                            <div className="rounded-2xl mb-5 overflow-hidden"
                              style={{
                                background: isDark
                                  ? `linear-gradient(160deg, ${theme.gradFrom}0d 0%, ${theme.gradFrom}06 50%, ${theme.gradFrom}0d 100%)`
                                  : `linear-gradient(160deg, ${theme.gradFrom}12 0%, ${theme.gradFrom}08 50%, ${theme.gradFrom}12 100%)`,
                              }}>
                              <MobileTrendSvg />
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