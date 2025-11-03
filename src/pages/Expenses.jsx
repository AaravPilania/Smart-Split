import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import {
  FiFile,
  FiPlus,
  FiX,
  FiCheck,
  FiUser,
  FiDollarSign,
} from "react-icons/fi";

const API_URL = "http://localhost:5000/api";

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [userId, setUserId] = useState(null);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [createForm, setCreateForm] = useState({
    title: "",
    amount: "",
    paidBy: null,
    splits: [], // [{userId, amount}]
  });

  useEffect(() => {
    const userIdStr = localStorage.getItem("userId");
    if (!userIdStr) {
      navigate("/");
      return;
    }
    const id = parseInt(userIdStr);
    setUserId(id);
    setCreateForm((prev) => ({ ...prev, paidBy: id }));
    fetchGroups(id);

    // Check if group is specified in URL
    const groupParam = searchParams.get("group");
    if (groupParam) {
      setSelectedGroupId(parseInt(groupParam));
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
      const response = await fetch(`${API_URL}/groups?userId=${userId}`);
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
      const response = await fetch(`${API_URL}/expenses/group/${groupId}`);
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
        user: parseInt(split.userId),
        amount: parseFloat(split.amount),
      }));

      const response = await fetch(
        `${API_URL}/expenses/group/${selectedGroupId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
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
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
        </div>
      </div>
    );
  }

  const selectedGroup = getSelectedGroup();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto py-10 px-6">
        {/* Page Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">All Expenses</h2>
            <p className="text-gray-500">Track and manage your spending</p>
          </div>
          <button
            onClick={() => {
              if (!selectedGroupId) {
                alert("Please select a group first");
                return;
              }
              setShowCreateModal(true);
            }}
            className="bg-gradient-to-r from-pink-500 to-orange-400 text-white px-5 py-2.5 rounded-lg shadow-md flex items-center gap-2 hover:shadow-lg transition"
            disabled={!selectedGroupId}
          >
            <FiPlus /> Add Expense
          </button>
        </div>

        {/* Group Filter */}
        <div className="mb-6">
          <label className="block mb-2 text-gray-600 font-semibold text-sm">
            Select Group
          </label>
          <select
            value={selectedGroupId || ""}
            onChange={(e) => {
              const groupId = parseInt(e.target.value);
              setSelectedGroupId(groupId);
              fetchExpenses(groupId);
            }}
            className="w-full max-w-md px-4 py-3 rounded-xl border bg-white text-gray-700 font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
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
                className="text-pink-500 hover:underline"
              >
                Create a group first
              </button>
            </p>
          )}
        </div>

        {/* Expenses List */}
        {!selectedGroupId ? (
          <div className="bg-white rounded-2xl border shadow-md p-14 flex flex-col items-center justify-center min-h-[250px]">
            <div className="text-gray-400 text-5xl mb-4">
              <FiFile />
            </div>
            <h3 className="text-gray-700 font-semibold text-lg mb-1">
              Select a group
            </h3>
            <p className="text-gray-500 text-sm">
              Choose a group from the dropdown above to view expenses
            </p>
          </div>
        ) : expenses.length === 0 ? (
          <div className="bg-white rounded-2xl border shadow-md p-14 flex flex-col items-center justify-center min-h-[250px]">
            <div className="text-gray-400 text-5xl mb-4">
              <FiFile />
            </div>
            <h3 className="text-gray-700 font-semibold text-lg mb-1">
              No expenses found
            </h3>
            <p className="text-gray-500 text-sm">
              Start adding expenses to track your spending
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {expenses.map((expense) => (
              <div
                key={expense.id}
                className="bg-white rounded-xl shadow-md p-6 border hover:shadow-lg transition"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-800">
                        {expense.title}
                      </h3>
                      {expense.settled && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">
                          <FiCheck className="inline mr-1" />
                          Settled
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mb-1">
                      {expense.group?.name || "Unknown Group"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatDate(expense.createdAt || expense.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(parseFloat(expense.amount || 0))}
                    </p>
                    <p className="text-sm text-gray-500">
                      Paid by {expense.paidBy?.name || "Unknown"}
                    </p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Split between:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {expense.splitBetween?.map((split, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm"
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
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 my-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                Add Expense - {selectedGroup.name}
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expense Title *
                </label>
                <input
                  type="text"
                  value={createForm.title}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="e.g., Dinner, Groceries"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Amount *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={createForm.amount}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, amount: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Paid By *
                </label>
                <select
                  value={createForm.paidBy || ""}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      paidBy: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
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
                  <label className="block text-sm font-medium text-gray-700">
                    Split Between *
                  </label>
                  <button
                    type="button"
                    onClick={addSplitRow}
                    className="text-sm text-pink-500 hover:text-pink-600 flex items-center gap-1"
                  >
                    <FiPlus /> Add Person
                  </button>
                </div>

                {createForm.splits.map((split, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <select
                      value={split.userId || ""}
                      onChange={(e) =>
                        updateSplit(index, "userId", e.target.value)
                      }
                      className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
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
                      className="w-32 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
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
                  <p className="text-sm text-gray-500">
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
                  className="flex-1 px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-pink-500 to-orange-400 text-white rounded-lg hover:opacity-90"
                >
                  Create Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
