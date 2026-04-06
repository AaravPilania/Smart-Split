import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import DesktopLayout from "../components/DesktopLayout";
import DesktopPageHeader from "../components/DesktopPageHeader";
import {
  FiFile,
  FiPlus,
  FiX,
  FiCheck,
  FiUser,
  FiDownload,
  FiTrash2,
  FiEdit2,
} from "react-icons/fi";
import { API_URL, apiFetch, getUserId, cachedApiFetch, invalidateCache } from "../utils/api";
import { useTheme, getGradientStyle, getPageBgStyle } from "../utils/theme";
import { CATEGORIES, detectCategory, getCategoryInfo } from "../utils/categories";
import { downloadExpensesCSV } from "../utils/export";

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [userId, setUserId] = useState(null);
  const [deletingExpense, setDeletingExpense] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', amount: '', category: 'other' });
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { theme, isDark } = useTheme();

  const [createForm, setCreateForm] = useState({
    title: "",
    amount: "",
    paidBy: null,
    splits: [],
    category: "other",
  });
  const [splitMode, setSplitMode] = useState("equal"); // "equal" | "percentage" | "exact"

  // Apply equal split whenever amount or mode changes
  const applyEqualSplit = (amt, members, form) => {
    const amount = parseFloat(amt);
    if (!amount || !members?.length) return form.splits;
    const each = parseFloat((amount / members.length).toFixed(2));
    return members.map((m, i) => ({
      userId: m.id,
      pct: parseFloat((100 / members.length).toFixed(2)),
      amount: i === members.length - 1
        ? parseFloat((amount - each * (members.length - 1)).toFixed(2)).toString()
        : each.toString(),
    }));
  };

  const handleSplitModeChange = (mode) => {
    setSplitMode(mode);
    const members = getSelectedGroup()?.members || [];
    const amt = parseFloat(createForm.amount) || 0;
    if (!members.length || !amt) return;
    if (mode === "equal") {
      setCreateForm(f => ({ ...f, splits: applyEqualSplit(amt, members, f) }));
    } else if (mode === "percentage") {
      // Init equal percentages
      const pct = parseFloat((100 / members.length).toFixed(2));
      const splits = members.map((m, i) => ({
        userId: m.id,
        pct: i === members.length - 1 ? parseFloat((100 - pct * (members.length - 1)).toFixed(2)) : pct,
        amount: i === members.length - 1
          ? parseFloat((amt * (100 - pct * (members.length - 1)) / 100).toFixed(2)).toString()
          : parseFloat((amt * pct / 100).toFixed(2)).toString(),
      }));
      setCreateForm(f => ({ ...f, splits }));
    }
    // "exact": keep current splits as-is
  };

  const updateSplitPct = (index, pct) => {
    const amt = parseFloat(createForm.amount) || 0;
    const v = Math.min(100, Math.max(0, parseFloat(pct) || 0));
    const newSplits = [...createForm.splits];
    newSplits[index] = {
      ...newSplits[index],
      pct: v,
      amount: parseFloat((amt * v / 100).toFixed(2)).toString(),
    };
    setCreateForm(f => ({ ...f, splits: newSplits }));
  };

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

  // Auto-apply equal split when a new group is selected (if amount is set)
  useEffect(() => {
    if (!selectedGroupId || !createForm.amount) return;
    const group = groups.find(g => g.id === selectedGroupId);
    if (group?.members?.length && splitMode === "equal") {
      setCreateForm(f => ({ ...f, splits: applyEqualSplit(f.amount, group.members, f) }));
    }
  }, [selectedGroupId]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchGroups = async (userId) => {
    try {
      const response = await cachedApiFetch(
        `${API_URL}/groups?userId=${userId}`,
        `groups_${userId}`,
        (freshData) => {
          setGroups(freshData.groups || []);
          if (freshData.groups?.length > 0 && !selectedGroupId) {
            setSelectedGroupId(freshData.groups[0].id);
          }
        }
      );
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
      const response = await cachedApiFetch(
        `${API_URL}/expenses/group/${groupId}`,
        `expenses_${groupId}`,
        (freshData) => setExpenses(freshData.expenses || [])
      );
      if (!response.ok) throw new Error("Failed to fetch expenses");
      const data = await response.json();
      setExpenses(data.expenses || []);
    } catch (error) {
      console.error("Error fetching expenses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm('Delete this expense? This cannot be undone.')) return;
    setDeletingExpense(expenseId);
    try {
      const res = await apiFetch(`${API_URL}/expenses/${expenseId}`, { method: 'DELETE' });
      if (res.ok) {
        setExpenses(prev => prev.filter(e => e.id !== expenseId));
        invalidateCache(`expenses_${selectedGroupId}`, `balance_summary_${selectedGroupId}`, 'dashboard_summary');
      } else {
        const d = await res.json();
        alert(d.message || 'Failed to delete expense');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingExpense(null);
    }
  };

  const openEditModal = (expense) => {
    setEditingExpense(expense);
    setEditForm({ title: expense.title, amount: String(expense.amount), category: expense.category || 'other' });
  };

  const handleEditExpense = async (e) => {
    e.preventDefault();
    setSubmittingEdit(true);
    try {
      const newAmount = parseFloat(editForm.amount);
      const updates = { title: editForm.title.trim(), category: editForm.category };

      if (!isNaN(newAmount) && newAmount > 0) {
        updates.amount = newAmount;
        const originalTotal = parseFloat(editingExpense.amount);
        const splits = editingExpense.splitBetween.map((s) => ({
          user: s.user?.id || s.user,
          amount: parseFloat(((s.amount / originalTotal) * newAmount).toFixed(2)),
        }));
        const splitTotal = splits.reduce((sum, s) => sum + s.amount, 0);
        const diff = parseFloat((newAmount - splitTotal).toFixed(2));
        if (Math.abs(diff) > 0.001 && splits.length > 0) {
          splits[splits.length - 1].amount = parseFloat((splits[splits.length - 1].amount + diff).toFixed(2));
        }
        updates.splitBetween = splits;
      }

      const res = await apiFetch(`${API_URL}/expenses/${editingExpense.id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update expense');
      setExpenses(prev => prev.map(ex => ex.id === editingExpense.id ? data.expense : ex));
      setEditingExpense(null);
      invalidateCache(`expenses_${selectedGroupId}`, `balance_summary_${selectedGroupId}`, 'dashboard_summary');
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmittingEdit(false);
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
            category: createForm.category || "other",
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
        category: "other",
      });
      setShowCreateModal(false);
      invalidateCache(`expenses_${selectedGroupId}`, `balance_summary_${selectedGroupId}`, 'dashboard_summary');
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
      <DesktopLayout>
        <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 pb-28 space-y-4">
          <div className="flex justify-between items-center mb-2">
            <div className="space-y-2">
              <div className="h-6 w-32 rounded-xl animate-pulse" style={{ background: "rgba(128,128,128,0.12)" }} />
              <div className="h-4 w-44 rounded-xl animate-pulse" style={{ background: "rgba(128,128,128,0.08)" }} />
            </div>
            <div className="h-10 w-32 rounded-xl animate-pulse" style={{ background: "rgba(128,128,128,0.12)" }} />
          </div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="rounded-2xl p-4 animate-pulse flex items-center gap-3"
              style={{ background: "rgba(128,128,128,0.07)", border: "1px solid rgba(128,128,128,0.08)" }}>
              <div className="h-10 w-10 rounded-2xl flex-shrink-0" style={{ background: "rgba(128,128,128,0.15)" }} />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 rounded-full w-2/5" style={{ background: "rgba(128,128,128,0.15)" }} />
                <div className="h-3 rounded-full w-3/5" style={{ background: "rgba(128,128,128,0.1)" }} />
              </div>
              <div className="space-y-1.5 flex-shrink-0">
                <div className="h-4 w-16 rounded-lg" style={{ background: "rgba(128,128,128,0.15)" }} />
                <div className="h-3 w-12 rounded-lg" style={{ background: "rgba(128,128,128,0.1)" }} />
              </div>
            </div>
          ))}
        </div>
      </DesktopLayout>
    );
  }

  const selectedGroup = getSelectedGroup();

  return (
    <DesktopLayout>

      <div className="max-w-6xl mx-auto py-8 px-6 pb-28 md:pb-8">
        <DesktopPageHeader
          label="Track"
          title="All"
          gradWord="Expenses"
          subtitle="Manage and monitor your shared spending"
          actions={
            <>
              <motion.button
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => {
                  const group = groups.find((g) => g.id === selectedGroupId);
                  downloadExpensesCSV(expenses, group?.name || "expenses");
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold transition disabled:opacity-40"
                style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)", color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)", border: isDark ? "1px solid rgba(255,255,255,0.09)" : "1px solid rgba(0,0,0,0.08)" }}
                disabled={!expenses.length}
                title="Export as CSV"
              >
                <FiDownload size={14} />
                <span>Export CSV</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  if (!selectedGroupId) { alert("Please select a group first"); return; }
                  setShowCreateModal(true);
                }}
                className="text-white px-5 py-2.5 rounded-2xl shadow-lg flex items-center gap-2 disabled:opacity-50 text-sm font-bold magnetic-cta"
                style={{ background: `linear-gradient(135deg, ${theme.gradFrom}, ${theme.gradTo})`, boxShadow: `0 4px 20px ${theme.gradFrom}44` }}
                disabled={!selectedGroupId}
              >
                <FiPlus size={15} /> Add Expense
              </motion.button>
            </>
          }
        />

        {/* Group Filter */}
        <div className="mb-6">
          <label className="block mb-2 text-gray-500 dark:text-gray-400 font-medium text-xs uppercase tracking-wide">
            Select Group
          </label>
          <select
            value={selectedGroupId || ""}
            onChange={(e) => {
              const groupId = e.target.value;
              setSelectedGroupId(groupId);
              fetchExpenses(groupId);
            }}
            className="w-full max-w-md px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-white font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1"
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
          <div className="bg-white dark:bg-gray-800 rounded-2xl border dark:border-gray-700 shadow-sm p-10 sm:p-14 flex flex-col items-center justify-center min-h-[220px]">
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
          <div className="bg-white dark:bg-gray-800 rounded-2xl border dark:border-gray-700 shadow-sm p-10 sm:p-14 flex flex-col items-center justify-center min-h-[220px]">
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
            {expenses.map((expense, eIdx) => (
              <motion.div
                key={expense.id}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 sm:p-5 border border-gray-100 dark:border-gray-800"
                initial={{ opacity: 0, y: 20, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: eIdx * 0.05, type: "spring", stiffness: 280, damping: 26 }}
                whileHover={{
                  y: -3,
                  boxShadow: isDark ? "0 10px 36px rgba(0,0,0,0.45)" : "0 10px 32px rgba(0,0,0,0.12)",
                  transition: { type: "spring", stiffness: 400, damping: 28 },
                }}
              >
                <div className="flex justify-between items-start mb-3 gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-lg font-bold text-gray-800 dark:text-white truncate">
                        {expense.title}
                      </h3>
                      {(() => { const cat = getCategoryInfo(expense.category || detectCategory(expense.title)); return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cat.badge}`}>{cat.icon} {cat.label}</span>; })()}
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
                    {(expense.paidBy?.id?.toString() === userId || selectedGroup?.createdBy?.id?.toString() === userId) && (
                      <div className="flex items-center gap-1 mt-1.5">
                        <button
                          onClick={() => openEditModal(expense)}
                          className="text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition p-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
                          title="Edit expense"
                        >
                          <FiEdit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteExpense(expense.id)}
                          disabled={deletingExpense === expense.id}
                          className="text-red-400 hover:text-red-600 dark:hover:text-red-300 transition p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-40"
                          title="Delete expense"
                        >
                          <FiTrash2 size={15} />
                        </button>
                      </div>
                    )}
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
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Create Expense Modal */}
      {createPortal(
      <AnimatePresence>
      {showCreateModal && selectedGroup && (
        <motion.div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          <motion.div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full p-6 overflow-y-auto max-h-[90vh]" initial={{ opacity: 0, y: 40, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 30, scale: 0.97 }} transition={{ type: "spring", stiffness: 340, damping: 28 }}>
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
                  onChange={(e) => {
                    const t = e.target.value;
                    const aiCat = detectCategory(t);
                    setCreateForm({ ...createForm, title: t, category: aiCat });
                  }}
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="e.g., Dinner, Groceries"
                  required
                />
                {/* AI category suggestion */}
                {createForm.title.length > 2 && (() => {
                  const cat = getCategoryInfo(createForm.category);
                  return (
                    <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                      <span className="text-blue-400 dark:text-blue-300 text-xs font-semibold">✨ AI suggests:</span>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${cat.badge}`}>{cat.icon} {cat.label}</span>
                      <span className="ml-auto text-[10px] text-blue-300 dark:text-blue-400">tap below to change</span>
                    </div>
                  );
                })()}
              </div>

              {/* Category picker */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => setCreateForm({ ...createForm, category: cat.key })}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                        createForm.category === cat.key
                          ? cat.badge + " border-current scale-105"
                          : "border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-gray-400"
                      }`}
                    >
                      {cat.icon} {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Total Amount *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={createForm.amount}
                  onChange={(e) => {
                    const newAmt = e.target.value;
                    const group = getSelectedGroup();
                    let newSplits = createForm.splits;
                    if (splitMode === "equal" && group?.members?.length) {
                      newSplits = applyEqualSplit(newAmt, group.members, createForm);
                    } else if (splitMode === "percentage" && group?.members?.length) {
                      // Recompute amounts from existing percentages
                      newSplits = createForm.splits.map(s => ({
                        ...s,
                        amount: parseFloat(((parseFloat(newAmt) || 0) * (parseFloat(s.pct) || 0) / 100).toFixed(2)).toString(),
                      }));
                    }
                    setCreateForm({ ...createForm, amount: newAmt, splits: newSplits });
                  }}
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
                {/* Split Mode Tabs */}
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Split Between *
                  </label>
                </div>
                <div className="flex mb-3 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600">
                  {[
                    { key: "equal",      label: "= Equal" },
                    { key: "percentage", label: "% Split" },
                    { key: "exact",      label: "✏ Custom" },
                  ].map((m) => (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => handleSplitModeChange(m.key)}
                      className={`flex-1 py-2 text-xs font-semibold transition-all ${splitMode === m.key ? "text-white" : "text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"}`}
                      style={splitMode === m.key ? getGradientStyle(theme) : {}}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                {/* Equal mode — read-only equal shares */}
                {splitMode === "equal" && (
                  <div>
                    {!createForm.amount ? (
                      <p className="text-xs text-amber-500 mb-2">Enter total amount first to auto-split</p>
                    ) : createForm.splits.length === 0 ? (
                      <button type="button" onClick={() => handleSplitModeChange("equal")} className={`text-xs ${theme.text} underline`}>Apply even split now</button>
                    ) : (
                      <div className="space-y-1.5">
                        {createForm.splits.map((split, i) => {
                          const member = getSelectedGroup()?.members?.find(m => m.id === split.userId);
                          return (
                            <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 dark:bg-gray-700/60 text-sm">
                              <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={getGradientStyle(theme)}>
                                  {member?.name?.[0]?.toUpperCase() || "?"}
                                </div>
                                <span className="text-gray-700 dark:text-gray-300">{member?.name || split.userId}</span>
                              </div>
                              <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(parseFloat(split.amount || 0))}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Percentage mode */}
                {splitMode === "percentage" && (
                  <div>
                    {!createForm.amount && <p className="text-xs text-amber-500 mb-2">Enter total amount first</p>}
                    {createForm.splits.map((split, i) => {
                      const member = getSelectedGroup()?.members?.find(m => m.id === split.userId);
                      return (
                        <div key={i} className="flex items-center gap-2 mb-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="h-6 w-6 flex-shrink-0 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={getGradientStyle(theme)}>
                              {member?.name?.[0]?.toUpperCase() || "?"}
                            </div>
                            <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{member?.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <input
                              type="number" min="0" max="100" step="0.5"
                              value={split.pct ?? ""}
                              onChange={(e) => updateSplitPct(i, e.target.value)}
                              className="w-16 px-2 py-1.5 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-sm text-right focus:outline-none focus:ring-1 focus:ring-pink-500"
                            />
                            <span className="text-gray-400 text-xs">%</span>
                          </div>
                          <span className="w-24 text-right text-sm font-semibold text-gray-700 dark:text-gray-300 flex-shrink-0">
                            {formatCurrency(parseFloat(split.amount || 0))}
                          </span>
                        </div>
                      );
                    })}
                    {createForm.splits.length > 0 && (() => {
                      const total = createForm.splits.reduce((s, x) => s + (parseFloat(x.pct) || 0), 0);
                      const ok = Math.abs(total - 100) < 0.5;
                      return <p className={`text-xs mt-1 font-semibold ${ok ? "text-green-600" : "text-amber-500"}`}>{ok ? "✓" : "⚠"} Total: {total.toFixed(1)}%</p>;
                    })()}
                  </div>
                )}

                {/* Exact / Custom mode */}
                {splitMode === "exact" && (
                  <div>
                    <div className="flex justify-end mb-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (!selectedGroup?.members?.length || !createForm.amount) return;
                          const amt = parseFloat(createForm.amount);
                          const members = selectedGroup.members;
                          const each = parseFloat((amt / members.length).toFixed(2));
                          const splits = members.map((m, i) => ({
                            userId: m.id,
                            amount: i === members.length - 1
                              ? parseFloat((amt - each * (members.length - 1)).toFixed(2)).toString()
                              : each.toString(),
                          }));
                          setCreateForm({ ...createForm, splits });
                        }}
                        className={`text-xs px-2 py-1 rounded-lg border ${theme.border} ${theme.text} transition`}
                      >
                        ✨ Even Split
                      </button>
                      <button type="button" onClick={addSplitRow} className={`text-sm ${theme.text} flex items-center gap-1`}>
                        <FiPlus /> Add
                      </button>
                    </div>
                    {createForm.splits.map((split, index) => (
                      <div key={index} className="flex gap-1.5 mb-2">
                        <select
                          value={split.userId || ""}
                          onChange={(e) => updateSplit(index, "userId", e.target.value)}
                          className="flex-1 min-w-0 px-2 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm"
                          required
                        >
                          <option value="">Select member...</option>
                          {selectedGroup.members?.map((member) => (
                            <option key={member.id} value={member.id}>{member.name}</option>
                          ))}
                        </select>
                        <input
                          type="number" step="0.01"
                          value={split.amount}
                          onChange={(e) => updateSplit(index, "amount", e.target.value)}
                          className="w-24 sm:w-28 px-2 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm"
                          placeholder="Amount"
                          required
                        />
                        <button type="button" onClick={() => removeSplitRow(index)} className="px-3 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                          <FiX />
                        </button>
                      </div>
                    ))}
                    {createForm.splits.length === 0 && (
                      <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-3">Click Add to add people to the split</p>
                    )}
                  </div>
                )}

                {/* Running total */}
                {createForm.amount && createForm.splits.length > 0 && (() => {
                  const splitTotal = createForm.splits.reduce((s, x) => s + parseFloat(x.amount || 0), 0);
                  const ok = Math.abs(splitTotal - parseFloat(createForm.amount)) < 0.02;
                  return (
                    <p className={`text-sm mt-2 font-medium ${ok ? "text-green-600 dark:text-green-400" : "text-amber-500"}`}>
                      {ok ? "✓ Balanced" : `Split: ${formatCurrency(splitTotal)} / Total: ${formatCurrency(parseFloat(createForm.amount))}`}
                    </p>
                  );
                })()}
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
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
      , document.body)}
      {/* Edit Expense Modal */}
      {createPortal(
      <AnimatePresence>
      {editingExpense && (
        <motion.div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          <motion.div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6" initial={{ opacity: 0, y: 40, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 30, scale: 0.97 }} transition={{ type: "spring", stiffness: 340, damping: 28 }}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">Edit Expense</h3>
              <button onClick={() => setEditingExpense(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <FiX className="text-xl" />
              </button>
            </div>
            <form onSubmit={handleEditExpense} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editForm.amount}
                  onChange={(e) => setEditForm(f => ({ ...f, amount: e.target.value }))}
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">Splits will be adjusted proportionally</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => setEditForm(f => ({ ...f, category: cat.key }))}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                        editForm.category === cat.key
                          ? cat.badge + " border-current scale-105"
                          : "border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {cat.icon} {cat.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingExpense(null)}
                  className="flex-1 px-4 py-2 border dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit}
                  className="flex-1 px-4 py-2 text-white rounded-lg hover:opacity-90 disabled:opacity-60"
                  style={getGradientStyle(theme)}
                >
                  {submittingEdit ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
      , document.body)}
    </DesktopLayout>
  );
}
