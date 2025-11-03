import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import StatsCard from "../components/Statscard";
import { FiTrendingUp, FiTrendingDown, FiPlus, FiClock } from "react-icons/fi";
import { BsPeopleFill } from "react-icons/bs";

const API_URL = "http://localhost:5000/api";

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
    const userData = localStorage.getItem("user");
    const userId = localStorage.getItem("userId");

    if (!userData || !userId) {
      navigate("/");
      return;
    }

    setUser(JSON.parse(userData));
    fetchDashboardData(parseInt(userId));
  }, [navigate]);

  const fetchDashboardData = async (userId) => {
    try {
      setLoading(true);

      // Fetch user's groups
      const groupsResponse = await fetch(`${API_URL}/groups?userId=${userId}`);
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
          const expensesResponse = await fetch(
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
          const balancesResponse = await fetch(
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
          const settlementsResponse = await fetch(
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
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
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

      <div className="max-w-7xl mx-auto mt-10 px-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-4xl font-bold text-gray-900 mb-1">
              Welcome back, {user.name || "User"}!
            </h2>
            <p className="text-gray-700 mb-2 text-lg font-semibold">
              Here's your expense overview
            </p>
            <p className="text-sm text-gray-500">
              Your User ID: <span className="font-mono font-semibold text-pink-600">{user.id}</span>
              {" "}(Share this with others to add you to groups)
            </p>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pb-24">
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
    </div>
  );
}
