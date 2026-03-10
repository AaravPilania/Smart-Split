import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import BottomNav from "../components/BottomNav";
import StatsCard from "../components/Statscard";
import { FiTrendingUp, FiTrendingDown, FiPlus, FiClock, FiUser } from "react-icons/fi";
import { BsPeopleFill } from "react-icons/bs";
import { API_URL, apiFetch, getUser, getUserId } from "../utils/api";
import { useTheme, getGradientStyle, getPageBgStyle } from "../utils/theme";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalExpenses: 0,
    youOwe: 0,
    owedToYou: 0,
  });
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [groups, setGroups] = useState([]);
  const [groupSpending, setGroupSpending] = useState([]);
  const [monthlyChartData, setMonthlyChartData] = useState([]);
  const [avatar, setAvatar] = useState(localStorage.getItem("selectedAvatar") || "");
  const navigate = useNavigate();
  const { theme, isDark } = useTheme();

  useEffect(() => {
    const onAvatarChanged = () => setAvatar(localStorage.getItem("selectedAvatar") || "");
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

    if (!userData || !userId) {
      navigate("/");
      return;
    }

    setUser(userData);
    fetchDashboardData(userId);
  }, [navigate]);

  const fetchDashboardData = async (userId) => {
    try {
      setLoading(true);

      // Fetch user's groups
      const groupsResponse = await apiFetch(`${API_URL}/groups?userId=${userId}`);
      if (!groupsResponse.ok) throw new Error("Failed to fetch groups");
      const groupsData = await groupsResponse.json();
      const userGroups = groupsData.groups || [];
      setGroups(userGroups);

      // Fetch expenses from all groups
      let allExpenses = [];
      let totalExpensesAmount = 0;
      let userOweTotal = 0;
      let owedToUserTotal = 0;
      let allSettlements = [];
      const perGroupSpending = [];

      for (const group of userGroups) {
        try {
          // Fetch expenses
          const expensesResponse = await apiFetch(
            `${API_URL}/expenses/group/${group.id}`
          );
          if (expensesResponse.ok) {
            const expensesData = await expensesResponse.json();
            const groupExpenses = expensesData.expenses || [];
            allExpenses = [...allExpenses, ...groupExpenses];
            const groupTotal = groupExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
            totalExpensesAmount += groupTotal;
            if (groupTotal > 0) perGroupSpending.push({ name: group.name, amount: groupTotal });
          }

          // Fetch balances
          const balancesResponse = await apiFetch(
            `${API_URL}/expenses/group/${group.id}/balances`
          );
          if (balancesResponse.ok) {
            const balancesData = await balancesResponse.json();
            const balances = balancesData.balances || [];
            const userBalance = balances.find((b) => b.user.id === userId);
            if (userBalance) {
              const balance = parseFloat(userBalance.balance || 0);
              if (balance < 0) {
                userOweTotal += Math.abs(balance);
              } else if (balance > 0) {
                owedToUserTotal += balance;
              }
            }
          }

          // Fetch settlements
          const settlementsResponse = await apiFetch(
            `${API_URL}/expenses/group/${group.id}/settlements`
          );
          if (settlementsResponse.ok) {
            const settlementsData = await settlementsResponse.json();
            const groupSettlements = settlementsData.settlements || [];
            allSettlements = [...allSettlements, ...groupSettlements];
          }
        } catch (error) {
          console.error(`Error fetching data for group ${group.id}:`, error);
        }
      }

      // Sort expenses by date (most recent first)
      allExpenses.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.created_at);
        const dateB = new Date(b.createdAt || b.created_at);
        return dateB - dateA;
      });

      // Get recent 5 expenses
      setRecentExpenses(allExpenses.slice(0, 5));

      // Filter settlements where user is involved
      const userSettlements = allSettlements.filter(
        (s) => s.from.id === userId || s.to.id === userId
      );
      setSettlements(userSettlements.slice(0, 5));

      // Update stats
      setStats({
        totalExpenses: totalExpensesAmount,
        youOwe: userOweTotal,
        owedToYou: owedToUserTotal,
      });
      setGroupSpending(perGroupSpending.sort((a, b) => b.amount - a.amount).slice(0, 6));

      // Monthly chart — last 6 months
      const now = new Date();
      const monthBuckets = {};
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        monthBuckets[key] = {
          label: d.toLocaleDateString("en-US", { month: "short" }),
          amount: 0,
          userShare: 0,
          isCurrent: i === 0,
        };
      }
      allExpenses.forEach((exp) => {
        const d = new Date(exp.createdAt || exp.created_at);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (monthBuckets[key]) {
          monthBuckets[key].amount += parseFloat(exp.amount || 0);
          const userSplit = exp.splitBetween?.find((s) => s.user?.id === userId);
          if (userSplit) monthBuckets[key].userShare += parseFloat(userSplit.amount || 0);
        }
      });
      setMonthlyChartData(Object.values(monthBuckets));
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown date";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={getPageBgStyle(theme, isDark)}>
        <div className="text-center">
          <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${theme.spinner} mx-auto`}></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={getPageBgStyle(theme, isDark)}>
      <Navbar />

      <div className="max-w-7xl mx-auto mt-4 sm:mt-10 px-4 sm:px-6 pb-24 md:pb-10">
        {/* Header */}
        <div className="flex justify-between items-start mb-6 sm:mb-8">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            {/* Avatar */}
            {avatar ? (
              <img src={avatar} alt="avatar" className={`h-14 w-14 rounded-full border-2 ${theme.border} shadow flex-shrink-0 object-cover`} />
            ) : (
              <div className={`h-14 w-14 rounded-full ${theme.bgLight} ${theme.text} flex items-center justify-center text-2xl font-bold flex-shrink-0 border-2 ${theme.border} shadow`}>
                {user.name?.[0]?.toUpperCase() || <FiUser />}
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-1">
                Welcome back, {user.name || "User"}!
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-1 text-base sm:text-lg font-semibold">
                Here's your expense overview
              </p>
              <p className={`font-mono ${theme.text} text-xs`}>
                ID: {user.id?.slice(0,6)}...{user.id?.slice(-4)}
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${theme.spinner} mx-auto`}></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your data...</p>
          </div>
        ) : (
          <>
            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
              <StatsCard
                title="Total Expenses"
                value={formatCurrency(stats.totalExpenses)}
                subtext={`Across ${groups.length} group${groups.length !== 1 ? 's' : ''}`}
                icon={<FiTrendingUp className={`${theme.text} text-xl`} />}
              />

              <StatsCard
                title="You Owe"
                value={
                  <span className="text-red-500 font-semibold">
                    {formatCurrency(stats.youOwe)}
                  </span>
                }
                subtext="To friends"
                icon={<FiTrendingUp className="text-red-500 text-xl" />}
              />

              <StatsCard
                title="Owed to You"
                value={
                  <span className="text-green-600 font-semibold">
                    {formatCurrency(stats.owedToYou)}
                  </span>
                }
                subtext="From friends"
                icon={<FiTrendingDown className="text-green-600 text-xl" />}
              />
            </div>

            {/* Buttons Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
              {/* Add Expense */}
              <button
                onClick={() => navigate("/expenses")}
                className="rounded-xl shadow-lg p-6 flex items-center justify-center cursor-pointer hover:opacity-90 hover:shadow-xl transition text-white text-lg font-semibold"
                style={getGradientStyle(theme)}
              >
                <FiPlus className="mr-2" /> Add New Expense
              </button>

              {/* Manage Groups */}
              <button
                onClick={() => navigate("/groups")}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 flex items-center justify-center cursor-pointer hover:shadow-2xl transition text-orange-600 text-lg font-semibold border dark:border-gray-700 hover:border-orange-400"
              >
                <BsPeopleFill className="mr-2" /> Manage Groups
              </button>
            </div>

            {/* Spending by Group chart */}
            {groupSpending.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border dark:border-gray-700 mt-8">
                <h3 className="font-bold text-lg mb-1 text-gray-800 dark:text-white">Spending by Group</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">Total across all expenses</p>
                <div className="space-y-4">
                  {groupSpending.map((g, i) => {
                    const pct = (g.amount / groupSpending[0].amount) * 100;
                    return (
                      <div key={i}>
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="text-gray-700 dark:text-gray-300 font-medium truncate">{g.name}</span>
                          <span className="text-gray-500 dark:text-gray-400 ml-3 flex-shrink-0 font-semibold">{formatCurrency(g.amount)}</span>
                        </div>
                        <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, ...getGradientStyle(theme) }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Monthly Expense Chart */}
            {monthlyChartData.some((m) => m.amount > 0) && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border dark:border-gray-700 mt-8 mb-8">
                <h3 className="font-bold text-lg mb-1 text-gray-800 dark:text-white">Monthly Expenses</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">Last 6 months spending</p>
                {/* Vertical bars */}
                <div className="flex items-end gap-2 sm:gap-3" style={{ height: "120px" }}>
                  {monthlyChartData.map((m, i) => {
                    const max = Math.max(...monthlyChartData.map((x) => x.amount), 1);
                    const pct = (m.amount / max) * 100;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center h-full justify-end gap-1.5">
                        <div
                          className="w-full rounded-t-lg transition-all duration-700"
                          style={{
                            height: `${Math.max(pct, 3)}%`,
                            ...(m.isCurrent
                              ? getGradientStyle(theme)
                              : { backgroundColor: isDark ? "#374151" : "#d1d5db" }),
                          }}
                        />
                        <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium">
                          {m.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {/* Stats row */}
                <div className="mt-5 grid grid-cols-2 gap-4 pt-4 border-t dark:border-gray-700">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total spent this month</p>
                    <p className="text-xl font-bold" style={{ color: theme.gradFrom }}>
                      {formatCurrency(monthlyChartData.at(-1)?.amount || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Your share this month</p>
                    <p className="text-xl font-bold" style={{ color: theme.gradFrom }}>
                      {formatCurrency(monthlyChartData.at(-1)?.userShare || 0)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom sections */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
              {/* Recent Expenses */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border dark:border-gray-700">
                <h3 className="font-bold text-lg mb-1 text-gray-800 dark:text-white">
                  Recent Expenses
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Your latest transactions
                </p>

                {recentExpenses.length === 0 ? (
                  <div className="text-center mt-10 py-8">
                    <p className="text-gray-600 dark:text-gray-400">
                      No expenses yet. Add your first one!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentExpenses.map((expense) => (
                      <div
                        key={expense.id}
                        className="border-b border-gray-100 dark:border-gray-700 pb-3 last:border-0 last:pb-0"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-800 dark:text-white">
                              {expense.title}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {expense.group?.name || "Unknown Group"}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <FiClock className="text-gray-400 text-xs" />
                              <span className="text-xs text-gray-400 dark:text-gray-500">
                                {formatDate(
                                  expense.createdAt || expense.created_at
                                )}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-900 dark:text-white">
                              {formatCurrency(parseFloat(expense.amount || 0))}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Paid by {expense.paidBy?.name || "Unknown"}
                            </p>
                            {expense.settled && (
                              <span className="inline-block mt-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                                Settled
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Outstanding Balances */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border dark:border-gray-700">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-bold text-lg text-gray-800 dark:text-white">
                    Outstanding Balances
                  </h3>
                  <button
                    onClick={() => navigate("/balances")}
                    className={`text-sm font-semibold ${theme.text} hover:underline`}
                  >
                    View All →
                  </button>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Who owes whom</p>

                {settlements.length === 0 ? (
                  <div className="text-center mt-10 py-8">
                    <p className="text-gray-600 dark:text-gray-400">All settled up! 🎉</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {settlements.map((settlement, index) => {
                      const isOwedToUser = settlement.to.id === user.id;
                      const otherPerson = isOwedToUser
                        ? settlement.from
                        : settlement.to;

                      return (
                        <div
                          key={index}
                          className="border-b border-gray-100 pb-3 last:border-0 last:pb-0"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              {isOwedToUser ? (
                                <p className="font-semibold text-green-600">
                                  {otherPerson.name} owes you
                                </p>
                              ) : (
                                <p className="font-semibold text-red-500">
                                  You owe {otherPerson.name}
                                </p>
                              )}
                              <p className="text-xs text-gray-500 mt-1">
                                {otherPerson.email}
                              </p>
                            </div>
                            <div className="text-right">
                              <p
                                className={`font-bold ${
                                  isOwedToUser
                                    ? "text-green-600"
                                    : "text-red-500"
                                }`}
                              >
                                {formatCurrency(
                                  parseFloat(settlement.amount || 0)
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
