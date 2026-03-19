import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import BottomNav from "../components/BottomNav";
import {
  FiCheck,
  FiBell,
  FiChevronDown,
  FiChevronUp,
  FiRefreshCw,
  FiBarChart2,
} from "react-icons/fi";
import { API_URL, apiFetch, getUserId } from "../utils/api";
import { useTheme, getGradientStyle } from "../utils/theme";

export default function Balances() {
  const [groupBalances, setGroupBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [settling, setSettling] = useState(null);
  const [reminderSent, setReminderSent] = useState(null);
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
      const groupsRes = await apiFetch(`${API_URL}/groups?userId=${userId}`);
      if (!groupsRes.ok) return;
      const groupsData = await groupsRes.json();
      const groups = groupsData.groups || [];

      const results = [];
      for (const group of groups) {
        const settleRes = await apiFetch(
          `${API_URL}/expenses/group/${group.id}/settlements`
        );
        if (settleRes.ok) {
          const settleData = await settleRes.json();
          const settlements = settleData.settlements || [];
          if (settlements.length > 0) {
            results.push({ group, settlements });
          }
        }
      }
      setGroupBalances(results);
      // Expand all groups with balances by default
      const initialExpanded = {};
      results.forEach(({ group }) => {
        initialExpanded[group.id] = true;
      });
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

  const allSettlements = groupBalances.flatMap((g) => g.settlements);
  const totalOwed = allSettlements
    .filter((s) => s.from.id?.toString() === userId?.toString())
    .reduce((sum, s) => sum + s.amount, 0);
  const totalOwedToYou = allSettlements
    .filter((s) => s.to.id?.toString() === userId?.toString())
    .reduce((sum, s) => sum + s.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />

      <div className="max-w-2xl mx-auto py-6 px-4 sm:px-6 pb-10">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div
                className="h-9 w-9 rounded-xl flex items-center justify-center text-white shadow-md"
                style={getGradientStyle(theme)}
              >
                <FiBarChart2 size={18} />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">
                Balances
              </h2>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Who owes whom across all your groups
            </p>
          </div>
          <button
            onClick={fetchAllBalances}
            className="p-2.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            title="Refresh"
          >
            <FiRefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Summary cards */}
        {(totalOwed > 0 || totalOwedToYou > 0) && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border dark:border-gray-700 shadow-sm">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                You owe in total
              </p>
              <p className="text-xl sm:text-2xl font-bold text-red-500">
                {formatCurrency(totalOwed)}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border dark:border-gray-700 shadow-sm">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                Owed to you
              </p>
              <p className="text-xl sm:text-2xl font-bold text-green-600">
                {formatCurrency(totalOwedToYou)}
              </p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-20">
            <div
              className={`animate-spin rounded-full h-10 w-10 border-b-2 ${theme.spinner} mx-auto`}
            ></div>
            <p className="mt-4 text-gray-400 dark:text-gray-500 text-sm">
              Loading balances...
            </p>
          </div>
        ) : groupBalances.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border dark:border-gray-700 p-16 text-center shadow-sm">
            <p className="text-5xl mb-4">🎉</p>
            <p className="font-bold text-gray-800 dark:text-white text-xl mb-1">
              All settled up!
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No outstanding balances across any of your groups
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {groupBalances.map(({ group, settlements }) => {
              const isExpanded = expandedGroups[group.id];
              const groupTotalOwed = settlements
                .filter((s) => s.from.id?.toString() === userId?.toString())
                .reduce((sum, s) => sum + s.amount, 0);
              const groupTotalOwedToYou = settlements
                .filter((s) => s.to.id?.toString() === userId?.toString())
                .reduce((sum, s) => sum + s.amount, 0);

              return (
                <div
                  key={group.id}
                  className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden"
                >
                  {/* Group header — clickable to expand/collapse */}
                  <button
                    className="w-full flex justify-between items-center p-4 sm:p-5 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-left"
                    onClick={() =>
                      setExpandedGroups((prev) => ({
                        ...prev,
                        [group.id]: !prev[group.id],
                      }))
                    }
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="h-10 w-10 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-bold shadow-sm"
                        style={getGradientStyle(theme)}
                      >
                        {group.name[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-800 dark:text-white truncate">
                          {group.name}
                        </p>
                        <div className="flex items-center gap-3 mt-0.5">
                          {groupTotalOwed > 0 && (
                            <span className="text-xs text-red-500 font-semibold">
                              You owe {formatCurrency(groupTotalOwed)}
                            </span>
                          )}
                          {groupTotalOwedToYou > 0 && (
                            <span className="text-xs text-green-600 font-semibold">
                              Gets back {formatCurrency(groupTotalOwedToYou)}
                            </span>
                          )}
                          {groupTotalOwed === 0 && groupTotalOwedToYou === 0 && (
                            <span className="text-xs text-gray-400">
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
                  {isExpanded && (
                    <div className="border-t dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
                      {settlements.map((s, idx) => {
                        const isFromMe = s.from.id?.toString() === userId?.toString();
                        const isToMe = s.to.id?.toString() === userId?.toString();
                        const reminderKey = `${s.from.id}-${s.to.id}-${group.name}`;

                        return (
                          <div
                            key={idx}
                            className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3"
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
                                <p className="text-sm font-semibold text-gray-800 dark:text-white">
                                  <span
                                    className={isFromMe ? theme.text : ""}
                                  >
                                    {isFromMe ? "You" : s.from.name}
                                  </span>
                                  <span className="text-gray-400 dark:text-gray-500 font-normal">
                                    {" "}
                                    owe{isFromMe ? "" : "s"}{" "}
                                  </span>
                                  <span
                                    className={isToMe ? "text-green-600" : ""}
                                  >
                                    {isToMe ? "you" : s.to.name}
                                  </span>
                                </p>
                                <p
                                  className={`text-lg font-bold mt-0.5 ${
                                    isFromMe
                                      ? "text-red-500"
                                      : isToMe
                                      ? "text-green-600"
                                      : "text-gray-700 dark:text-gray-200"
                                  }`}
                                >
                                  {formatCurrency(s.amount)}
                                </p>
                              </div>
                            </div>

                            {/* Action buttons */}
                            <div className="flex gap-2 sm:flex-shrink-0">
                              {isToMe && (
                                <button
                                  onClick={() => handleRemind(s, group.id, group.name)}
                                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                                >
                                  {reminderSent === `${s.from.id}-${s.to.id}-${group.name}` ? (
                                    <><FiCheck className="text-green-500" size={13} /> Sent!</>
                                  ) : (
                                    <><FiBell size={13} /> Remind</>
                                  )}
                                </button>
                              )}
                              <button
                                onClick={() => handleSettleUp(group)}
                                disabled={settling === group.id}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white transition disabled:opacity-50"
                                style={getGradientStyle(theme)}
                              >
                                {settling === group.id ? (
                                  <FiRefreshCw size={13} className="animate-spin" />
                                ) : (
                                  <FiCheck size={13} />
                                )}
                                Settle up
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
