import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import BottomNav from "../components/BottomNav";
import {
  FiFile,
  FiPlus,
  FiX,
  FiCheck,
  FiUser,
  FiDollarSign,
} from "react-icons/fi";
import { API_URL, apiFetch, getUserId } from "../utils/api";
import { useTheme, getGradientStyle } from "../utils/theme";
import { detectCategory, getCategoryInfo } from "../utils/categories";
import { downloadExpensesCSV } from "../utils/export";

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [userId, setUserId] = useState(null);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { theme, isDark } = useTheme();

  const [createForm, setCreateForm] = useState({
    title: "",
    amount: "",
    paidBy: null,
    splits: [], // [{userId, amount}]
  });

  useEffect(() => {
    const userIdStr = getUserId();
    if (!userIdStr) {
      navigate("/");
      return;
    }
    const id = userIdStr;
    setUserId(id);
    setCreateForm((prev) => ({ ...prev, paidBy: id }));
    fetchGroups(id);

    // Check if group is specified in URL
    const groupParam = searchParams.get("group");
    if (groupParam) {
      setSelectedGroupId(groupParam);
    }
  }, [navigate, searchParams]);

  useEffect(() => {
    if (selectedGroupId && userId) {
      fetchExpenses(selectedGroupId);
    } else if (groups.length > 0 && !selectedGroupId) {
      // Default to first group
      setSelectedGroupId(groups[0].id);
    }
  }, [selectedGroupId, groups, userId]);

  const fetchGroups = async (userId) => {
    try {
      const response = await apiFetch(`${API_URL}/groups?userId=${userId}`);
      if (!response.ok) throw new Error("Failed to fetch groups");
      const data = await response.json();
      setGroups(data.groups || []);
      if (data.groups?.length > 0 && !selectedGroupId) {
        setSelectedGroupId(data.groups[0].id);
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
    }
  };

  const fetchExpenses = async (groupId) => {
    try {
      setLoading(true);
      const response = await apiFetch(`${API_URL}/expenses/group/${groupId}`);
      if (!response.ok) throw new Error("Failed to fetch expenses");
      const data = await response.json();
      setExpenses(data.expenses || []);
    } catch (error) {
      console.error("Error fetching expenses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    if (!createForm.title.trim() || !createForm.amount || !selectedGroupId) {
      alert("Please fill in all required fields");
      return;
    }

    const amount = parseFloat(createForm.amount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    const totalSplit = createForm.splits.reduce(
      (sum, split) => sum + parseFloat(split.amount || 0),
      0
    );

    if (Math.abs(totalSplit - amount) > 0.01) {
      alert(`Split amounts (${totalSplit.toFixed(2)}) must equal total amount (${amount.toFixed(2)})`);
      return;
    }

    try {
      const splitBetween = createForm.splits.map((split) => ({
        user: split.userId,
        amount: parseFloat(split.amount),
      }));

      const response = await apiFetch(
        `${API_URL}/expenses/group/${selectedGroupId}`,
        {
          method: "POST",
          body: JSON.stringify({
            title: createForm.title,
            amount: amount,
            paidBy: createForm.paidBy,
            splitBetween: splitBetween,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to create expense");

      setCreateForm({
        title: "",
        amount: "",
        paidBy: userId,
        splits: [],
      });
      setShowCreateModal(false);
      fetchExpenses(selectedGroupId);
      alert("Expense created successfully!");
    } catch (error) {
      alert(error.message || "Failed to create expense");
    }
  };

  const addSplitRow = () => {
    setCreateForm({
      ...createForm,
      splits: [
        ...createForm.splits,
        { userId: "", amount: "" },
      ],
    });
  };

  const removeSplitRow = (index) => {
    setCreateForm({
      ...createForm,
      splits: createForm.splits.filter((_, i) => i !== index),
    });
  };

  const updateSplit = (index, field, value) => {
    const newSplits = [...createForm.splits];
    newSplits[index] = { ...newSplits[index], [field]: value };
    setCreateForm({ ...createForm, splits: newSplits });
  };

  const getSelectedGroup = () => {
    return groups.find((g) => g.id === selectedGroupId);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading && expenses.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${theme.spinner}`}></div>
        </div>
      </div>
    );
  }

  const selectedGroup = getSelectedGroup();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />

      <div className="max-w-6xl mx-auto py-4 sm:py-8 px-4 sm:px-6 pb-24 md:pb-10">
        {/* Page Header */}
        <div className="flex justify-between items-center mb-6 sm:mb-8 gap-3">
          <div className="min-w-0">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">All Expenses</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">Track and manage your spending</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const group = groups.find((g) => g.id === selectedGroupId);
                downloadExpensesCSV(expenses, group?.name || "expenses");
              }}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              disabled={!expenses.length}
              title="Export as CSV"
            >
              ⬇️ Export CSV
            </button>
            <button
              onClick={() => {
                if (!selectedGroupId) {
                  alert("Please select a group first");
                  return;
                }
                setShowCreateModal(true);
              }}
              className="text-white px-5 py-2.5 rounded-lg shadow-md flex items-center gap-2 hover:shadow-lg transition disabled:opacity-50"
              style={getGradientStyle(theme)}
              disabled={!selectedGroupId}
            >
              <FiPlus /> Add Expense
            </button>
          </div>
        </div>

        {/* Group Filter */}
        <div className="mb-6">
          <label className="block mb-2 text-gray-600 dark:text-gray-300 font-semibold text-sm">
            Select Group
          </label>
          <select
            value={selectedGroupId || ""}
            onChange={(e) => {
              const groupId = parseInt(e.target.value);
              setSelectedGroupId(groupId);
              fetchExpenses(groupId);
            }}
            className="w-full max-w-md px-4 py-3 rounded-xl border dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-white font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
          >
            <option value="">Select a group...</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
          {!groups.length && (
            <p className="text-sm text-gray-500 mt-2">
              No groups found.{" "}
              <button
                onClick={() => navigate("/groups")}
                className={`${theme.text} hover:underline`}
              >
                Create a group first
              </button>
            </p>
          )}
        </div>

        {/* Expenses List */}
        {!selectedGroupId ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border dark:border-gray-700 shadow-md p-14 flex flex-col items-center justify-center min-h-[250px]">
            <div className="text-gray-400 text-5xl mb-4">
              <FiFile />
            </div>
            <h3 className="text-gray-700 dark:text-white font-semibold text-lg mb-1">
              Select a group
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Choose a group from the dropdown above to view expenses
            </p>
          </div>
        ) : expenses.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border dark:border-gray-700 shadow-md p-14 flex flex-col items-center justify-center min-h-[250px]">
            <div className="text-gray-400 text-5xl mb-4">
              <FiFile />
            </div>
            <h3 className="text-gray-700 dark:text-white font-semibold text-lg mb-1">
              No expenses found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Start adding expenses to track your spending
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {expenses.map((expense) => (
              <div
                key={expense.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border dark:border-gray-700 hover:shadow-lg transition"
              >
              <div className="flex justify-between items-start mb-3 gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-lg font-bold text-gray-800 dark:text-white truncate">
                        {expense.title}
                      </h3>
                      {(() => { const cat = getCategoryInfo(detectCategory(expense.title)); return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cat.badge}`}>{cat.icon} {cat.label}</span>; })()}
                      {expense.settled && (
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 rounded text-xs font-semibold">
                          <FiCheck className="inline mr-1" />
                          Settled
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                      {expense.group?.name || "Unknown Group"}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {formatDate(expense.createdAt || expense.created_at)}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(parseFloat(expense.amount || 0))}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Paid by {expense.paidBy?.name || "Unknown"}
                    </p>
                  </div>
                </div>

                <div className="border-t dark:border-gray-700 pt-4">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Split between:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {expense.splitBetween?.map((split, idx) => (
                      <span
                        key={idx}
                        className={`px-3 py-1 ${theme.bgActive} ${theme.text} rounded-full text-sm`}
                      >
                        {split.user?.name || "Unknown"}:{" "}
                        {formatCurrency(parseFloat(split.amount || 0))}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Expense Modal */}
      {showCreateModal && selectedGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full p-6 my-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                Add Expense - {selectedGroup.name}
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Expense Title *
                </label>
                <input
                  type="text"
                  value={createForm.title}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="e.g., Dinner, Groceries"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Total Amount *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={createForm.amount}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, amount: e.target.value })
                  }
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Paid By *
                </label>
                <select
                  value={createForm.paidBy || ""}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      paidBy: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  required
                >
                  <option value="">Select member...</option>
                  {selectedGroup.members?.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Split Between *
                  </label>
                  <button
                    type="button"
                    onClick={addSplitRow}
                    className={`text-sm ${theme.text} flex items-center gap-1`}
                  >
                    <FiPlus /> Add Person
                  </button>
                </div>

                {createForm.splits.map((split, index) => (
                  <div key={index} className="flex gap-1.5 mb-2">
                    <select
                      value={split.userId || ""}
                      onChange={(e) =>
                        updateSplit(index, "userId", e.target.value)
                      }
                      className="flex-1 min-w-0 px-2 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm"
                      required
                    >
                      <option value="">Select member...</option>
                      {selectedGroup.members?.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      step="0.01"
                      value={split.amount}
                      onChange={(e) =>
                        updateSplit(index, "amount", e.target.value)
                      }
                      className="w-24 sm:w-28 px-2 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm"
                      placeholder="Amount"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => removeSplitRow(index)}
                      className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <FiX />
                    </button>
                  </div>
                ))}

                {createForm.splits.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Click "Add Person" to split the expense
                  </p>
                )}

                {createForm.amount && (
                  <p className="text-sm mt-2">
                    Total split:{" "}
                    <span className="font-semibold">
                      {formatCurrency(
                        createForm.splits.reduce(
                          (sum, split) =>
                            sum + parseFloat(split.amount || 0),
                          0
                        )
                      )}
                    </span>
                    {" / "}
                    Total amount:{" "}
                    <span className="font-semibold">
                      {formatCurrency(parseFloat(createForm.amount || 0))}
                    </span>
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 text-white rounded-lg hover:opacity-90"
                  style={getGradientStyle(theme)}
                >
                  Create Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <BottomNav />
    </div>
  );
}
