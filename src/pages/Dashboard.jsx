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

