import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import DesktopLayout from "../components/DesktopLayout";
import DesktopPageHeader from "../components/DesktopPageHeader";
import {
  FiCheck,
  FiBell,
  FiChevronDown,
  FiChevronUp,
  FiRefreshCw,
  FiBarChart2,
  FiZap,
  FiSmartphone,
  FiX,
} from "react-icons/fi";
import { QRCodeSVG } from "qrcode.react";
import { API_URL, apiFetch, getUserId, cachedApiFetch, invalidateCache } from "../utils/api";
import { useTheme, getGradientStyle, getPageBgStyle } from "../utils/theme";
import { simplifyDebts } from "../utils/debts";

export default function Balances() {
  const [groupBalances, setGroupBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [settling, setSettling] = useState(null);
  const [reminderSent, setReminderSent] = useState(null);
  const [paying, setPaying] = useState(null);
  const [paidNotice, setPaidNotice] = useState(null);
  const [viewMode, setViewMode] = useState("standard"); // "standard" | "simplified"
  const [simplifiedByGroup, setSimplifiedByGroup] = useState({});
  const [upiModal, setUpiModal] = useState(null); // { amount, toName, toId, settlement, group }
  const [showPaidPrompt, setShowPaidPrompt] = useState(false);
  const [proofImage, setProofImage] = useState(null);
  const proofInputRef = useRef(null);
  const upiOpenedRef = useRef(false);

  // Detect when user returns from UPI app (page becomes visible again)
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "visible" && upiOpenedRef.current && upiModal) {
        upiOpenedRef.current = false;
        setShowPaidPrompt(true);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [upiModal]);
  const navigate = useNavigate();
  const userId = getUserId();
  const { theme, isDark } = useTheme();

  useEffect(() => {
    if (!userId) {
      navigate("/");
      return;
    }
    fetchAllBalances();
  }, [navigate]);

  const fetchAllBalances = async () => {
    setLoading(true);
    try {
      const groupsRes = await cachedApiFetch(
        `${API_URL}/groups?userId=${userId}`,
        `groups_${userId}`,
        () => {} // onFresh handled below via re-fetch pattern
      );
      if (!groupsRes.ok) return;
      const groupsData = await groupsRes.json();
      const groups = groupsData.groups || [];

      // Single request per group instead of two (balance-summary returns both)
      const grouped = await Promise.all(
        groups.map(async (group) => {
          const res = await cachedApiFetch(
            `${API_URL}/expenses/group/${group.id}/balance-summary`,
            `balance_summary_${group.id}`,
            (freshData) => {
              // Update this group's data when background refresh arrives
              setGroupBalances(prev => prev.map(r =>
                r.group.id === group.id
                  ? { ...r, settlements: freshData.settlements || [], simplified: simplifyDebts(freshData.balances || []) }
                  : r
              ));
            }
          );
          const data = res.ok ? await res.json() : { settlements: [], balances: [] };
          const settlements = data.settlements || [];
          const simplified = simplifyDebts(data.balances || []);
          return { group, settlements, simplified };
        })
      );

      const results = grouped.filter(r => r.settlements.length > 0);
      const simplifiedMap = {};
      const initialExpanded = {};
      grouped.forEach(({ group, simplified }) => { simplifiedMap[group.id] = simplified; });
      results.forEach(({ group }) => { initialExpanded[group.id] = true; });

      setGroupBalances(results);
      setSimplifiedByGroup(simplifiedMap);
      setExpandedGroups(initialExpanded);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRemind = async (settlement, groupId, groupName) => {
    const key = `${settlement.from.id}-${settlement.to.id}-${groupName}`;
    const msg = `Hey ${settlement.from.name}! You owe ${settlement.to.name} ${settlement.amount.toFixed(2)} in "${groupName}". Please settle up on Smart Split!`;
    try {
      await apiFetch(`${API_URL}/notifications`, {
        method: "POST",
        body: JSON.stringify({ to: settlement.from.id, message: msg, groupId, amount: settlement.amount }),
      });
      setReminderSent(key);
      setTimeout(() => setReminderSent(null), 3000);
    } catch {
      navigator.clipboard.writeText(msg).catch(() => {});
      setReminderSent(key);
      setTimeout(() => setReminderSent(null), 2000);
    }
  };

  const handleIPaid = async (settlement, group) => {
    const key = `${settlement.from.id}-${settlement.to.id}-${group.id}`;
    setPaying(key);
    try {
      const payload = { toUserId: settlement.to.id, amount: settlement.amount };
      if (proofImage) payload.proofImage = proofImage;
      const res = await apiFetch(`${API_URL}/expenses/group/${group.id}/payment`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        // Notify the payee that payment was made
        apiFetch(`${API_URL}/notifications`, {
          method: "POST",
          body: JSON.stringify({
            to: settlement.to.id,
            message: `${settlement.from.name} paid you ₹${settlement.amount.toFixed(2)} in "${group.name}"! 🎉`,
            groupId: group.id,
            amount: settlement.amount,
          }),
        }).catch(() => {});
        setPaidNotice(key);
        invalidateCache(`balance_summary_${group.id}`, 'dashboard_summary');
        setTimeout(() => { setPaidNotice(null); fetchAllBalances(); }, 1800);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPaying(null);
    }
  };

  const handleSettleUp = async (group) => {
    if (
      !window.confirm(
        `Mark all expenses in "${group.name}" as settled? This will clear all balances for this group.`
      )
    )
      return;
    setSettling(group.id);
    try {
      const expRes = await apiFetch(`${API_URL}/expenses/group/${group.id}`);
      if (expRes.ok) {
        const expData = await expRes.json();
        const expenses = (expData.expenses || []).filter((e) => !e.settled);
        for (const exp of expenses) {
          await apiFetch(`${API_URL}/expenses/${exp.id}/settle`, {
            method: "POST",
            body: JSON.stringify({ settledBy: userId, amount: exp.amount }),
          });
        }
      }
      invalidateCache(`balance_summary_${group.id}`, `expenses_${group.id}`, 'dashboard_summary');
      await fetchAllBalances();
    } catch (e) {
      console.error(e);
    } finally {
      setSettling(null);
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount);

  // Fetch the payee's profile to get their latest UPI ID, then open modal
  const openUpiModal = async (s, group) => {
    let toUpiId = s.to.upiId || '';
    if (!toUpiId) {
      try {
        const res = await apiFetch(`${API_URL}/auth/profile/${s.to.id}`);
        if (res.ok) {
          const data = await res.json();
          toUpiId = data.user?.upiId || '';
        }
      } catch {}
    }
    setUpiModal({ toName: s.to.name, toId: s.to.id, toUpiId, amount: s.amount, settlement: s, group });
  };

  const allSettlements = groupBalances.flatMap((g) => g.settlements);
  const totalOwed = allSettlements
    .filter((s) => s.from.id?.toString() === userId?.toString())
    .reduce((sum, s) => sum + s.amount, 0);
  const totalOwedToYou = allSettlements
    .filter((s) => s.to.id?.toString() === userId?.toString())
    .reduce((sum, s) => sum + s.amount, 0);

  return (
    <DesktopLayout>

      <div className="max-w-2xl mx-auto py-8 px-6 pb-28 md:pb-8 md:max-w-5xl">
        <DesktopPageHeader
          label="Finance"
          title="Split"
          gradWord="Balances"
          subtitle="Who owes whom across all your groups"
          actions={
            <div className="flex items-center gap-2">
              <div className="flex rounded-2xl overflow-hidden text-xs font-bold" style={{ border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.09)", background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)" }}>
                <button
                  onClick={() => setViewMode("standard")}
                  className="px-3.5 py-2 transition-all"
                  style={viewMode === "standard" ? { background: `linear-gradient(135deg, ${theme.gradFrom}, ${theme.gradTo})`, color: "#fff" } : { color: isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.5)" }}
                >Standard</button>
                <button
                  onClick={() => setViewMode("simplified")}
                  className="px-3.5 py-2 flex items-center gap-1 transition-all"
                  style={viewMode === "simplified" ? { background: `linear-gradient(135deg, ${theme.gradFrom}, ${theme.gradTo})`, color: "#fff" } : { color: isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.5)" }}
                ><FiZap size={10} /> Smart</button>
              </div>
              <button
                onClick={fetchAllBalances}
                className="h-9 w-9 rounded-xl flex items-center justify-center transition hover:scale-110"
                style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)", color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.5)" }}
                title="Refresh"
              >
                <FiRefreshCw size={15} className={loading ? "animate-spin" : ""} />
              </button>
            </div>
          }
        />
        {viewMode === "simplified" && (
          <div className="mb-4 px-4 py-3 rounded-xl text-xs font-medium flex items-center gap-2"
            style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)", border: isDark ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(0,0,0,0.06)" }}>
            <FiZap size={13} className={theme.text} />
            <span style={{ color: isDark ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.58)" }}><strong>Smart mode</strong> — minimises transactions using debt simplification.</span>
          </div>
        )}

        {/* Summary cards */}
        {(totalOwed > 0 || totalOwedToYou > 0) && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <motion.div
              className="rounded-2xl p-5 relative overflow-hidden"
              style={isDark ? { background: "linear-gradient(135deg, rgba(239,68,68,0.12) 0%, rgba(239,68,68,0.05) 100%)", border: "1px solid rgba(239,68,68,0.2)", backdropFilter: "blur(20px)" } : { background: "rgba(255,241,241,0.9)", border: "1px solid rgba(239,68,68,0.15)" }}
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 26, delay: 0.1 }}
            >
              <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none" style={{ background: "radial-gradient(circle at 100% 0%, rgba(239,68,68,0.2) 0%, transparent 70%)" }} />
              <p className="text-[10px] font-black uppercase tracking-[0.15em] mb-2" style={{ color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.38)" }}>You owe total</p>
              <p className="text-2xl font-black" style={{ color: "#ef4444" }}>{formatCurrency(totalOwed)}</p>
            </motion.div>
            <motion.div
              className="rounded-2xl p-5 relative overflow-hidden"
              style={isDark ? { background: "linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(16,185,129,0.05) 100%)", border: "1px solid rgba(16,185,129,0.2)", backdropFilter: "blur(20px)" } : { background: "rgba(240,253,249,0.9)", border: "1px solid rgba(16,185,129,0.15)" }}
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 26, delay: 0.18 }}
            >
              <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none" style={{ background: "radial-gradient(circle at 100% 0%, rgba(16,185,129,0.2) 0%, transparent 70%)" }} />
              <p className="text-[10px] font-black uppercase tracking-[0.15em] mb-2" style={{ color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.38)" }}>Owed to you</p>
              <p className="text-2xl font-black" style={{ color: "#10b981" }}>{formatCurrency(totalOwedToYou)}</p>
            </motion.div>
          </div>
        )}

        {loading && groupBalances.length === 0 ? (
          <div className="space-y-4">
            {/* Summary cards skeleton */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {[0,1].map(i => (
                <div key={i} className="rounded-2xl p-5 animate-pulse"
                  style={isDark ? {background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)"} : {background:"rgba(0,0,0,0.03)",border:"1px solid rgba(0,0,0,0.06)"}}>
                  <div className="h-2.5 w-20 rounded-full mb-3" style={{background: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)'}}/>
                  <div className="h-8 w-28 rounded-lg" style={{background: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)'}}/>
                </div>
              ))}
            </div>
            {/* Group card skeletons */}
            {[0,1,2].map(i => (
              <div key={i} className="rounded-2xl overflow-hidden animate-pulse"
                style={isDark ? {background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)"} : {background:"rgba(255,255,255,0.9)",border:"1px solid rgba(0,0,0,0.06)"}}>
                {/* Group header skeleton */}
                <div className="p-4 sm:p-5 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full flex-shrink-0" style={{background: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)'}}/>
                  <div className="flex-1">
                    <div className="h-4 w-32 rounded mb-2" style={{background: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)'}}/>
                    <div className="h-3 w-24 rounded" style={{background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'}}/>
                  </div>
                  <div className="h-8 w-20 rounded-xl" style={{background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}}/>
                </div>
                {/* Settlement row skeleton */}
                <div className="border-t p-4 sm:p-5 flex items-center gap-3"
                  style={{borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}}>
                  <div className="h-11 w-11 rounded-full flex-shrink-0" style={{background: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)'}}/>
                  <div className="flex-1">
                    <div className="h-3.5 w-44 rounded mb-2" style={{background: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)'}}/>
                    <div className="h-5 w-20 rounded" style={{background: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)'}}/>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-8 w-20 rounded-xl" style={{background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}}/>
                    <div className="h-8 w-20 rounded-xl" style={{background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}}/>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : groupBalances.length === 0 ? (
          <div
            className="rounded-2xl p-16 text-center"
            style={isDark
              ? { background: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(20px)" }
              : { background: "rgba(255,255,255,0.92)", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 2px 16px rgba(0,0,0,0.05)" }}
          >
            <p className="text-5xl mb-4">🎉</p>
            <p className="text-xl font-black mb-1" style={{ color: isDark ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.85)" }}>All settled up!</p>
            <p className="text-sm" style={{ color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.45)" }}>No outstanding balances across any of your groups</p>
          </div>
        ) : (
          <div className="space-y-4">
            {groupBalances.map(({ group, settlements }) => {
              const isExpanded = expandedGroups[group.id];
              const effectiveSettlements = viewMode === "simplified"
                ? (simplifiedByGroup[group.id] || settlements)
                : settlements;
              const groupTotalOwed = effectiveSettlements
                .filter((s) => s.from.id?.toString() === userId?.toString())
                .reduce((sum, s) => sum + s.amount, 0);
              const groupTotalOwedToYou = effectiveSettlements
                .filter((s) => s.to.id?.toString() === userId?.toString())
                .reduce((sum, s) => sum + s.amount, 0);

              return (
                <motion.div
                  key={group.id}
                  className="rounded-2xl overflow-hidden premium-list-card"
                  style={isDark
                    ? { background: "linear-gradient(135deg, rgba(255,255,255,0.065) 0%, rgba(255,255,255,0.02) 100%)", border: "1px solid rgba(255,255,255,0.09)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }
                    : { background: "rgba(255,255,255,0.9)", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}
                  initial={{ opacity: 0, y: 24, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 26, delay: 0.1 }}
                >
                  {/* Group header — clickable to expand/collapse */}
                  <button
                    className="w-full flex justify-between items-center p-4 sm:p-5 transition text-left"
                    style={{ "--hover-bg": isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)" }}
                    onMouseEnter={e => e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    onClick={() =>
                      setExpandedGroups((prev) => ({
                        ...prev,
                        [group.id]: !prev[group.id],
                      }))
                    }
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="h-10 w-10 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-bold"
                        style={getGradientStyle(theme)}
                      >
                        {group.name[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-black truncate text-[15px]" style={{ color: isDark ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.85)" }}>
                          {group.name}
                        </p>
                        <div className="flex items-center gap-3 mt-0.5">
                          {groupTotalOwed > 0 && (
                            <span className="text-xs font-bold" style={{ color: "#ef4444" }}>
                              You owe {formatCurrency(groupTotalOwed)}
                            </span>
                          )}
                          {groupTotalOwedToYou > 0 && (
                            <span className="text-xs font-bold" style={{ color: "#10b981" }}>
                              Gets back {formatCurrency(groupTotalOwedToYou)}
                            </span>
                          )}
                          {groupTotalOwed === 0 && groupTotalOwedToYou === 0 && (
                            <span className="text-xs" style={{ color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.4)" }}>
                              {settlements.length} balance{settlements.length !== 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSettleUp(group);
                        }}
                        disabled={settling === group.id}
                        className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition disabled:opacity-50"
                        style={getGradientStyle(theme)}
                        title="Settle all expenses in this group"
                      >
                        {settling === group.id ? (
                          <FiRefreshCw size={12} className="animate-spin" />
                        ) : (
                          <FiCheck size={12} />
                        )}
                        Settle All
                      </button>
                      {isExpanded ? (
                        <FiChevronUp className="text-gray-400" size={18} />
                      ) : (
                        <FiChevronDown className="text-gray-400" size={18} />
                      )}
                    </div>
                  </button>

                  {/* Settlement details */}
                  {isExpanded && (() => {
                    const displaySettlements = viewMode === "simplified"
                      ? (simplifiedByGroup[group.id] || settlements)
                      : settlements;
                    return (
                    <div className="border-t dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
                      {viewMode === "simplified" && simplifiedByGroup[group.id]?.length < settlements.length && (
                        <div className="px-4 py-2 flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 font-semibold bg-green-50 dark:bg-green-900/20">
                          <FiZap size={11} /> Reduced from {settlements.length} to {simplifiedByGroup[group.id]?.length} transaction{simplifiedByGroup[group.id]?.length !== 1 ? "s" : ""}
                        </div>
                      )}
                      {displaySettlements.map((s, idx) => {
                        const isFromMe = s.from.id?.toString() === userId?.toString();
                        const isToMe = s.to.id?.toString() === userId?.toString();
                        const reminderKey = `${s.from.id}-${s.to.id}-${group.name}`;

                        return (
                          <div
                            key={idx}
                            className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3"
                            style={{ borderTop: idx > 0 ? `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"}` : undefined }}
                          >
                            {/* Person info */}
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div
                                className={`h-11 w-11 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold ${
                                  isFromMe
                                    ? "text-white"
                                    : "text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-600"
                                }`}
                                style={isFromMe ? getGradientStyle(theme) : undefined}
                              >
                                {s.from.name[0]?.toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold" style={{ color: isDark ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.8)" }}>
                                  <span className={isFromMe ? theme.text : ""}
                                  >{isFromMe ? "You" : s.from.name}</span>
                                  <span style={{ color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.38)" }} className="font-normal"> owe{isFromMe ? "" : "s"} </span>
                                  <span style={{ color: isToMe ? "#10b981" : isDark ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.75)" }}>{isToMe ? "you" : s.to.name}</span>
                                </p>
                                <p className={`text-lg font-black mt-0.5`} style={{ color: isFromMe ? "#ef4444" : isToMe ? "#10b981" : isDark ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.75)" }}>
                                  {formatCurrency(s.amount)}
                                </p>
                              </div>
                            </div>

                            {/* Action buttons */}
                            <div className="flex gap-2 sm:flex-shrink-0 flex-wrap">
                              {isFromMe && (
                                <button
                                  onClick={() => openUpiModal(s, group)}
                                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition"
                                  style={isDark ? { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.1)" } : { background: "rgba(0,0,0,0.05)", color: "rgba(0,0,0,0.6)", border: "1px solid rgba(0,0,0,0.08)" }}
                                >
                                  <FiSmartphone size={13} /> Pay UPI
                                </button>
                              )}
                              {isFromMe && (
                                <button
                                  onClick={() => handleIPaid(s, group)}
                                  disabled={paying === reminderKey || paidNotice === reminderKey}
                                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white transition disabled:opacity-60"
                                  style={getGradientStyle(theme)}
                                >
                                  {paying === reminderKey
                                    ? <FiRefreshCw size={13} className="animate-spin" />
                                    : paidNotice === reminderKey
                                    ? <><FiCheck size={13} /> Paid!</>
                                    : <><FiCheck size={13} /> I Paid It</>}
                                </button>
                              )}
                              {isToMe && (
                                <button
                                  onClick={() => handleRemind(s, group.id, group.name)}
                                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition"
                                  style={isDark ? { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.1)" } : { background: "rgba(0,0,0,0.05)", color: "rgba(0,0,0,0.6)", border: "1px solid rgba(0,0,0,0.08)" }}
                                >
                                  {reminderSent === reminderKey ? (<><FiCheck className="text-green-500" size={13} /> Sent!</>) : (<><FiBell size={13} /> Remind</>)}
                                </button>
                              )}
                              <button
                                onClick={() => handleSettleUp(group)}
                                disabled={settling === group.id}
                                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white transition disabled:opacity-50"
                                style={getGradientStyle(theme)}
                              >
                                {settling === group.id ? <FiRefreshCw size={13} className="animate-spin" /> : <FiCheck size={13} />}
                                Settle up
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    );
                  })()}
              </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* UPI Payment Modal */}
      <AnimatePresence>
      {upiModal && (
        <motion.div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          <motion.div className="rounded-2xl p-6 w-full max-w-xs text-center"
            style={{ background: isDark ? "#111827" : "#fff", boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}
            initial={{ opacity: 0, y: 40, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 30, scale: 0.97 }} transition={{ type: "spring", stiffness: 340, damping: 28 }}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-800 dark:text-white text-lg">Pay via UPI</h3>
              <button onClick={() => setUpiModal(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><FiX size={18} /></button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Paying to</p>
            <p className="font-bold text-gray-900 dark:text-white mb-1">{upiModal.toName}</p>
            {/* Editable amount for partial settlement */}
            <div className="mb-4">
              <input
                type="number"
                min="1"
                max={upiModal.amount}
                step="0.01"
                value={upiModal.editAmount ?? upiModal.amount.toFixed(2)}
                onChange={(e) => setUpiModal(prev => ({ ...prev, editAmount: e.target.value }))}
                className="text-2xl font-bold text-center w-full bg-transparent outline-none"
                style={{ color: theme.gradFrom, border: "none", borderBottom: `2px dashed ${theme.gradFrom}44` }}
              />
              {Number(upiModal.editAmount ?? upiModal.amount) < upiModal.amount && (
                <p className="text-[10px] mt-1" style={{ color: theme.gradFrom }}>
                  Partial: ₹{Number(upiModal.editAmount).toFixed(2)} of ₹{upiModal.amount.toFixed(2)}
                </p>
              )}
            </div>
            {/* QR Code — only shown when payee has a UPI ID */}
            {upiModal.toUpiId ? (
              <>
                <div className="inline-block bg-white p-3 rounded-2xl shadow mb-2">
                  <QRCodeSVG
                    value={`upi://pay?pa=${encodeURIComponent(upiModal.toUpiId)}&pn=${encodeURIComponent(upiModal.toName)}&am=${Number(upiModal.editAmount ?? upiModal.amount).toFixed(2)}&cu=INR&tn=SmartSplit`}
                    size={160}
                  />
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-1 font-mono">{upiModal.toUpiId}</p>
              </>
            ) : (
              <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl px-4 py-3 mb-4 text-left">
                <span className="text-amber-500 text-base mt-0.5">⚠️</span>
                <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                  <strong>{upiModal.toName}</strong> hasn&apos;t set a UPI ID yet.<br />
                  Ask them to add it in <strong>Profile → UPI ID</strong> field so you can pay directly.
                </p>
              </div>
            )}
            <a
              href={`upi://pay?${new URLSearchParams({ ...(upiModal.toUpiId ? { pa: upiModal.toUpiId } : {}), pn: upiModal.toName, am: Number(upiModal.editAmount ?? upiModal.amount).toFixed(2), cu: "INR", tn: `SmartSplit: ${upiModal.toName}` }).toString()}`}
              onClick={() => { upiOpenedRef.current = true; try { navigator.clipboard.writeText(Number(upiModal.editAmount ?? upiModal.amount).toFixed(2)); } catch {} }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold text-sm mb-2"
              style={getGradientStyle(theme)}
            >
              <FiSmartphone size={15} /> Pay ₹{Number(upiModal.editAmount ?? upiModal.amount).toFixed(2)} via UPI
            </a>
            {showPaidPrompt && (
              <div className="mb-2 px-3 py-2.5 rounded-xl text-xs text-center"
                style={{ background: isDark ? "rgba(34,197,94,0.12)" : "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.3)" }}>
                <p className="text-green-600 dark:text-green-400 font-semibold mb-1.5">Payment complete?</p>
                <button
                  onClick={() => { handleIPaid(upiModal.settlement, upiModal.group); setUpiModal(null); setShowPaidPrompt(false); }}
                  className="px-4 py-1.5 rounded-lg text-white text-xs font-bold"
                  style={{ background: "linear-gradient(135deg,#22c55e,#16a34a)" }}
                >
                  Yes, mark as paid ✓
                </button>
              </div>
            )}

            {/* Proof of payment */}
            <div className="mb-2">
              <input ref={proofInputRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  if (file.size > 2 * 1024 * 1024) { alert("Image must be under 2MB"); return; }
                  const reader = new FileReader();
                  reader.onload = (ev) => setProofImage(ev.target.result);
                  reader.readAsDataURL(file);
                  e.target.value = "";
                }}
              />
              {proofImage ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)" }}>
                  <img src={proofImage} alt="Proof" className="h-10 w-10 rounded-lg object-cover" />
                  <span className="text-xs flex-1" style={{ color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)" }}>Screenshot attached</span>
                  <button onClick={() => setProofImage(null)} className="text-red-400 text-xs font-bold">Remove</button>
                </div>
              ) : (
                <button onClick={() => proofInputRef.current?.click()}
                  className="w-full py-2 rounded-xl text-xs font-medium transition flex items-center justify-center gap-1.5"
                  style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)", color: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)" }}>
                  📸 Attach payment screenshot (optional)
                </button>
              )}
            </div>

            <button
              onClick={() => { handleIPaid(upiModal.settlement, upiModal.group); setUpiModal(null); setProofImage(null); }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm mb-2 border border-green-400 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition"
            >
              <FiCheck size={15} /> I&apos;ve Paid — Mark as Done
            </button>
            <button onClick={() => { setUpiModal(null); setProofImage(null); }} className="w-full py-2.5 rounded-xl text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition font-medium">
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

    </DesktopLayout>
  );
}
