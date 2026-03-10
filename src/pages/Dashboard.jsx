import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import BottomNav from "../components/BottomNav";
import StatsCard from "../components/Statscard";
import { FiTrendingUp, FiTrendingDown, FiPlus, FiClock, FiArrowRight } from "react-icons/fi";
import { BsPeopleFill } from "react-icons/bs";
import { API_URL, apiFetch, getUser, getUserId } from "../utils/api";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalExpenses: 0, youOwe: 0, owedToYou: 0 });
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [groups, setGroups] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = getUser();
    const userId = getUserId();
    if (!userData || !userId) { navigate("/"); return; }
    setUser(userData);
    fetchDashboardData(userId);
  }, [navigate]);

  const fetchDashboardData = async (userId) => {
    try {
      setLoading(true);
      const groupsResponse = await apiFetch(`${API_URL}/groups?userId=${userId}`);
      if (!groupsResponse.ok) throw new Error("Failed to fetch groups");
      const groupsData = await groupsResponse.json();
      const userGroups = groupsData.groups || [];
      setGroups(userGroups);

      let allExpenses = [], totalExpensesAmount = 0, userOweTotal = 0, owedToUserTotal = 0, allSettlements = [];

      for (const group of userGroups) {
        try {
          const expensesResponse = await apiFetch(`${API_URL}/expenses/group/${group.id}`);
          if (expensesResponse.ok) {
            const expensesData = await expensesResponse.json();
            const groupExpenses = expensesData.expenses || [];
            allExpenses = [...allExpenses, ...groupExpenses];
            totalExpensesAmount += groupExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
          }
          const balancesResponse = await apiFetch(`${API_URL}/expenses/group/${group.id}/balances`);
          if (balancesResponse.ok) {
            const balancesData = await balancesResponse.json();
            const userBalance = (balancesData.balances || []).find((b) => b.user.id === userId);
            if (userBalance) {
              const balance = parseFloat(userBalance.balance || 0);
              if (balance < 0) userOweTotal += Math.abs(balance);
              else if (balance > 0) owedToUserTotal += balance;
            }
          }
          const settlementsResponse = await apiFetch(`${API_URL}/expenses/group/${group.id}/settlements`);
          if (settlementsResponse.ok) {
            const settlementsData = await settlementsResponse.json();
            allSettlements = [...allSettlements, ...(settlementsData.settlements || [])];
          }
        } catch (error) { console.error(`Error fetching data for group ${group.id}:`, error); }
      }

      allExpenses.sort((a, b) => new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at));
      setRecentExpenses(allExpenses.slice(0, 5));
      setSettlements(allSettlements.filter((s) => s.from.id === userId || s.to.id === userId).slice(0, 5));
      setStats({ totalExpenses: totalExpensesAmount, youOwe: userOweTotal, owedToYou: owedToUserTotal });
    } catch (error) { console.error("Error fetching dashboard data:", error); }
    finally { setLoading(false); }
  };

  const fmt = (amount) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
  const fmtFull = (amount) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 }).format(amount);
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 rounded-full border-4 border-pink-200 border-t-pink-500 animate-spin mx-auto" />
          <p className="mt-3 text-sm text-gray-500">Loading…</p>
        </div>
      </div>
    );
  }

  const initials = (user.name || "U").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-28 md:pb-10">

        {/* ── Hero header ── */}
        <div className="relative overflow-hidden bg-gradient-to-br from-pink-500 via-rose-500 to-orange-400 rounded-2xl p-6 sm:p-8 mb-6 shadow-lg shadow-pink-200">
          {/* decorative circles */}
          <span className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10" />
          <span className="absolute bottom-0 right-16 w-24 h-24 rounded-full bg-white/10" />
          <div className="relative flex items-center justify-between gap-4">
            <div>
              <p className="text-pink-100 text-sm font-medium mb-1">Good day 👋</p>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{user.name || "User"}</h1>
              <p className="text-pink-100 text-sm mt-1">Your finances at a glance</p>
            </div>
            <div className="flex-shrink-0 h-14 w-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-white text-xl font-bold border border-white/30">
              {initials}
            </div>
          </div>
          {/* user ID strip */}
          <div className="relative mt-4 bg-white/15 rounded-xl px-4 py-2.5 flex items-center gap-3">
            <span className="text-pink-100 text-xs font-medium whitespace-nowrap">Your ID</span>
            <span className="text-white text-xs font-mono truncate">{user.id}</span>
            <span className="text-pink-100 text-xs whitespace-nowrap">· share to join groups</span>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-10 h-10 rounded-full border-4 border-pink-200 border-t-pink-500 animate-spin" />
          </div>
        ) : (
          <>
            {/* ── Stats ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <StatsCard
                title="Total Spent"
                value={fmt(stats.totalExpenses)}
                subtext={`Across ${groups.length} group${groups.length !== 1 ? "s" : ""}`}
                icon={<FiTrendingUp className="text-pink-500" size={20} />}
                accent="pink"
              />
              <StatsCard
                title="You Owe"
                value={<span className="text-red-500">{fmt(stats.youOwe)}</span>}
                subtext="To friends"
                icon={<FiTrendingUp className="text-red-400" size={20} />}
                accent="red"
              />
              <StatsCard
                title="Owed to You"
                value={<span className="text-emerald-600">{fmt(stats.owedToYou)}</span>}
                subtext="From friends"
                icon={<FiTrendingDown className="text-emerald-500" size={20} />}
                accent="green"
              />
            </div>

            {/* ── Quick actions ── */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                onClick={() => navigate("/expenses")}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-orange-400 text-white font-semibold rounded-xl py-4 shadow hover:shadow-md hover:opacity-95 transition-all text-sm sm:text-base"
              >
                <FiPlus size={18} /> Add Expense
              </button>
              <button
                onClick={() => navigate("/groups")}
                className="flex items-center justify-center gap-2 bg-white text-gray-700 font-semibold rounded-xl py-4 border border-gray-200 shadow-sm hover:shadow-md hover:border-pink-300 transition-all text-sm sm:text-base"
              >
                <BsPeopleFill className="text-pink-400" size={16} /> Manage Groups
              </button>
            </div>

            {/* ── Bottom cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Recent Expenses */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 pt-5 pb-3">
                  <div>
                    <h3 className="font-bold text-gray-900">Recent Expenses</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Latest transactions</p>
                  </div>
                  <button onClick={() => navigate("/expenses")} className="text-xs text-pink-500 font-semibold flex items-center gap-1 hover:gap-2 transition-all">
                    View all <FiArrowRight size={12} />
                  </button>
                </div>
                {recentExpenses.length === 0 ? (
                  <div className="px-5 pb-8 pt-4 text-center">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                      <FiClock className="text-gray-400" size={22} />
                    </div>
                    <p className="text-sm text-gray-500">No expenses yet</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-50 px-5 pb-4">
                    {recentExpenses.map((expense) => (
                      <li key={expense.id} className="py-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-pink-50 flex items-center justify-center text-base">
                            🧾
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">{expense.title}</p>
                            <p className="text-xs text-gray-400">{expense.group?.name || "—"} · {fmtDate(expense.createdAt || expense.created_at)}</p>
                          </div>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <p className="text-sm font-bold text-gray-900">{fmtFull(parseFloat(expense.amount || 0))}</p>
                          <p className="text-xs text-gray-400">by {expense.paidBy?.name || "?"}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Balances */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 pt-5 pb-3">
                  <div>
                    <h3 className="font-bold text-gray-900">Outstanding Balances</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Who owes whom</p>
                  </div>
                </div>
                {settlements.length === 0 ? (
                  <div className="px-5 pb-8 pt-4 text-center">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3 text-xl">🎉</div>
                    <p className="text-sm text-gray-500">All settled up!</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-50 px-5 pb-4">
                    {settlements.map((s, i) => {
                      const isMine = s.to.id === user.id;
                      const other = isMine ? s.from : s.to;
                      return (
                        <li key={i} className="py-3 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold ${isMine ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
                              {(other.name || "?")[0].toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className={`text-sm font-semibold ${isMine ? "text-emerald-600" : "text-red-500"}`}>
                                {isMine ? `${other.name} owes you` : `You owe ${other.name}`}
                              </p>
                              <p className="text-xs text-gray-400 truncate">{other.email}</p>
                            </div>
                          </div>
                          <p className={`flex-shrink-0 text-sm font-bold ${isMine ? "text-emerald-600" : "text-red-500"}`}>
                            {fmtFull(parseFloat(s.amount || 0))}
                          </p>
                        </li>
                      );
                    })}
                  </ul>
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
  const navigate = useNavigate();

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
            totalExpensesAmount += groupExpenses.reduce(
              (sum, exp) => sum + parseFloat(exp.amount || 0),
              0
            );
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
      <div className="min-h-screen bg-gradient-to-r from-pink-300 via-pink-200 to-orange-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-pink-300 via-pink-200 to-orange-200">
      <Navbar />

      <div className="max-w-7xl mx-auto mt-4 sm:mt-10 px-4 sm:px-6 pb-24 md:pb-10">
        {/* Header */}
        <div className="flex justify-between items-start mb-6 sm:mb-8">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-1">
              Welcome back, {user.name || "User"}!
            </h2>
            <p className="text-gray-700 mb-2 text-base sm:text-lg font-semibold">
              Here's your expense overview
            </p>
            <p className="text-sm text-gray-500">
              Your User ID:
            </p>
            <p className="font-mono font-semibold text-pink-600 text-xs break-all mt-0.5">{user.id}</p>
            <p className="text-xs text-gray-400 mt-0.5">(Share this to be added to groups)</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your data...</p>
          </div>
        ) : (
          <>
            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
              <StatsCard
                title="Total Expenses"
                value={formatCurrency(stats.totalExpenses)}
                subtext={`Across ${groups.length} group${groups.length !== 1 ? 's' : ''}`}
                icon={<FiTrendingUp className="text-pink-500 text-xl" />}
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
                className="bg-gradient-to-r from-pink-500 to-orange-400 rounded-xl shadow-lg p-6 flex items-center justify-center cursor-pointer hover:opacity-90 hover:shadow-xl transition text-white text-lg font-semibold"
              >
                <FiPlus className="mr-2" /> Add New Expense
              </button>

              {/* Manage Groups */}
              <button
                onClick={() => navigate("/groups")}
                className="bg-white rounded-xl shadow-lg p-6 flex items-center justify-center cursor-pointer hover:shadow-2xl transition text-orange-600 text-lg font-semibold border hover:border-orange-400"
              >
                <BsPeopleFill className="mr-2" /> Manage Groups
              </button>
            </div>

            {/* Bottom sections */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
              {/* Recent Expenses */}
              <div className="bg-white rounded-xl shadow-lg p-6 border">
                <h3 className="font-bold text-lg mb-1 text-gray-800">
                  Recent Expenses
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Your latest transactions
                </p>

                {recentExpenses.length === 0 ? (
                  <div className="text-center mt-10 py-8">
                    <p className="text-gray-600">
                      No expenses yet. Add your first one!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentExpenses.map((expense) => (
                      <div
                        key={expense.id}
                        className="border-b border-gray-100 pb-3 last:border-0 last:pb-0"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-800">
                              {expense.title}
                            </p>
                            <p className="text-sm text-gray-500">
                              {expense.group?.name || "Unknown Group"}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <FiClock className="text-gray-400 text-xs" />
                              <span className="text-xs text-gray-400">
                                {formatDate(
                                  expense.createdAt || expense.created_at
                                )}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-900">
                              {formatCurrency(parseFloat(expense.amount || 0))}
                            </p>
                            <p className="text-xs text-gray-500">
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
              <div className="bg-white rounded-xl shadow-lg p-6 border">
                <h3 className="font-bold text-lg mb-1 text-gray-800">
                  Outstanding Balances
                </h3>
                <p className="text-sm text-gray-500 mb-4">Who owes whom</p>

                {settlements.length === 0 ? (
                  <div className="text-center mt-10 py-8">
                    <p className="text-gray-600">All settled up! 🎉</p>
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
