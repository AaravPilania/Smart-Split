import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import BottomNav from "../components/BottomNav";
import { FiUsers, FiPlus, FiX, FiUserPlus, FiLink, FiZap, FiHeart, FiClock, FiTrash2 } from "react-icons/fi";
import { API_URL, apiFetch, getUserId } from "../utils/api";
import { useTheme, getGradientStyle } from "../utils/theme";
import { simplifyDebts } from "../utils/debts";

export default function Groups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(null);
  const [userId, setUserId] = useState(null);
  const navigate = useNavigate();
  const { theme, isDark } = useTheme();
  const [copiedGroupId, setCopiedGroupId] = useState(null);
  const [deletingGroup, setDeletingGroup] = useState(null);
  const [simplifyGroupId, setSimplifyGroupId] = useState(null);
  const [simplifiedDebts, setSimplifiedDebts] = useState([]);
  const [simplifying, setSimplifying] = useState(false);
  const [friends, setFriends] = useState([]);
  const [activityGroupId, setActivityGroupId] = useState(null);
  const [activityLogs, setActivityLogs] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);

  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
  });

  const [addMemberForm, setAddMemberForm] = useState({
    memberEmail: "",
  });

  useEffect(() => {
    const userIdStr = getUserId();
    if (!userIdStr) {
      navigate("/");
      return;
    }
    setUserId(userIdStr);
    fetchGroups(userIdStr);
    fetchFriends();
  }, [navigate]);

  const fetchFriends = async () => {
    try {
      const res = await apiFetch(`${API_URL}/friends`);
      if (res.ok) { const d = await res.json(); setFriends(d.friends || []); }
    } catch {}
  };

  const fetchActivity = async (groupId) => {
    setActivityGroupId(groupId);
    setActivityLoading(true);
    setActivityLogs([]);
    try {
      const res = await apiFetch(`${API_URL}/groups/${groupId}/activity`);
      if (res.ok) {
        const data = await res.json();
        setActivityLogs(data.logs || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActivityLoading(false);
    }
  };

  const handleDeleteGroup = async (group) => {
    if (!window.confirm(`Delete "${group.name}"? This will permanently delete all expenses and payment records in this group.`)) return;
    setDeletingGroup(group.id);
    try {
      const res = await apiFetch(`${API_URL}/groups/${group.id}`, { method: 'DELETE' });
      if (res.ok) {
        setGroups(prev => prev.filter(g => g.id !== group.id));
      } else {
        const d = await res.json();
        alert(d.message || 'Failed to delete group');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingGroup(null);
    }
  };

  const handleCopyInvite = (groupId, groupName) => {
    const code = groupId;
    navigator.clipboard.writeText(String(code)).then(() => {
      setCopiedGroupId(groupId);
      setTimeout(() => setCopiedGroupId(null), 2000);
    });
  };

  const handleSimplifyDebts = async (groupId) => {
    setSimplifyGroupId(groupId);
    setSimplifying(true);
    setSimplifiedDebts([]);
    try {
      const res = await apiFetch(`${API_URL}/expenses/group/${groupId}/balances`);
      if (res.ok) {
        const data = await res.json();
        setSimplifiedDebts(simplifyDebts(data.balances || []));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSimplifying(false);
    }
  };

  const fetchGroups = async (userId) => {
    try {
      setLoading(true);
      const response = await apiFetch(`${API_URL}/groups?userId=${userId}`);
      if (!response.ok) throw new Error("Failed to fetch groups");
      const data = await response.json();
      setGroups(data.groups || []);
      setFetchError(false);
    } catch (error) {
      console.error("Error fetching groups:", error);
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!createForm.name.trim()) {
      alert("Group name is required");
      return;
    }

    try {
      const response = await apiFetch(`${API_URL}/groups`, {
        method: "POST",
        body: JSON.stringify({
          name: createForm.name,
          description: createForm.description,
          createdBy: userId,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to create group");

      setCreateForm({ name: "", description: "" });
      setShowCreateModal(false);
      fetchGroups(userId);
      alert("Group created successfully!");
    } catch (error) {
      alert(error.message || "Failed to create group");
    }
  };

  const handleAddMember = async (groupId, e) => {
    e.preventDefault();
    const memberId = addMemberForm.memberEmail.trim();
    if (!memberId) {
      alert("User ID is required");
      return;
    }

    try {
      const response = await apiFetch(`${API_URL}/groups/${groupId}/members`, {
        method: "POST",
        body: JSON.stringify({ memberIds: [memberId] }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to add member");

      setAddMemberForm({ memberEmail: "" });
      setShowAddMemberModal(null);
      fetchGroups(userId);
      alert("Member added successfully!");
    } catch (error) {
      alert(error.message || "Failed to add member");
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Navbar />
        <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 pb-28 space-y-4">
          <div className="flex justify-between items-center mb-2">
            <div className="space-y-2">
              <div className="h-6 w-36 rounded-xl animate-pulse" style={{ background: "rgba(128,128,128,0.12)" }} />
              <div className="h-4 w-48 rounded-xl animate-pulse" style={{ background: "rgba(128,128,128,0.08)" }} />
            </div>
            <div className="h-10 w-28 rounded-xl animate-pulse" style={{ background: "rgba(128,128,128,0.12)" }} />
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl p-5 animate-pulse space-y-3"
              style={{ background: "rgba(128,128,128,0.07)", border: "1px solid rgba(128,128,128,0.08)" }}>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl flex-shrink-0" style={{ background: "rgba(128,128,128,0.15)" }} />
                <div className="flex-1 space-y-2">
                  <div className="h-4 rounded-full w-2/5" style={{ background: "rgba(128,128,128,0.15)" }} />
                  <div className="h-3 rounded-full w-3/5" style={{ background: "rgba(128,128,128,0.1)" }} />
                </div>
              </div>
              <div className="h-3 rounded-full w-full" style={{ background: "rgba(128,128,128,0.08)" }} />
              <div className="h-3 rounded-full w-4/5" style={{ background: "rgba(128,128,128,0.08)" }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />

      <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 pb-28">
        {/* Page Header */}
        <div className="flex justify-between items-center mb-6 sm:mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">Your Groups</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">Manage your expense groups</p>
          </div>

          {/* Create Group Button */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="text-white px-4 py-2.5 rounded-xl shadow flex items-center gap-2 hover:shadow-md transition text-sm font-semibold"
            style={getGradientStyle(theme)}
          >
            <FiPlus /> Create Group
          </button>
        </div>

        {/* Groups List */}
        {fetchError ? (
          <div className="flex flex-col items-center justify-center py-20 gap-5">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-8 max-w-sm w-full text-center shadow">
              <div className="text-4xl mb-3">⚠️</div>
              <h3 className="text-lg font-bold text-red-700 dark:text-red-400 mb-2">Server Unreachable</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
                Your groups are <span className="font-semibold text-green-600 dark:text-green-400">safe in the cloud</span> — the server is temporarily offline. Usually resolves in 30–60 seconds.
              </p>
              <button
                onClick={() => { if (userId) fetchGroups(userId); }}
                className="w-full py-2.5 rounded-xl text-white font-semibold shadow hover:opacity-90 transition"
                style={getGradientStyle(theme)}
              >
                Retry Now
              </button>
            </div>
          </div>
        ) : groups.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border dark:border-gray-700 shadow-sm p-10 sm:p-14 flex flex-col items-center justify-center">
            <div className="text-gray-400 text-5xl mb-3">
              <FiUsers />
            </div>
            <h3 className="text-gray-700 dark:text-white font-semibold text-lg mb-1">
              No groups yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Create your first group to start splitting expenses
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => (
              <div
                key={group.id}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 sm:p-5 border border-gray-100 dark:border-gray-800 hover:shadow-md transition flex flex-col"
              >
                <div className="flex justify-between items-start mb-4">
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => navigate(`/expenses?group=${group.id}`)}
                  >
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-1 hover:opacity-75 transition-opacity">
                      {group.name}
                    </h3>
                    {group.description && group.description !== "No description" ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{group.description}</p>
                    ) : (
                      <p className="text-sm text-gray-400 dark:text-gray-600 italic mb-2">No description</p>
                    )}
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      Created by {group.createdBy?.name || "Unknown"}
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <FiUsers className={theme.text} />
                    <span>{group.members?.length || 0} members</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {group.members?.slice(0, 3).map((member) => (
                      <span
                        key={member.id}
                      className={`px-2 py-1 ${theme.bgActive} ${theme.text} rounded-full text-xs`}
                      >
                        {member.name}
                      </span>
                    ))}
                    {group.members?.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-full text-xs">
                        +{group.members.length - 3}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 space-y-2">
                  {/* Primary action */}
                  <button
                    onClick={() => navigate(`/expenses?group=${group.id}`)}
                    className="w-full min-h-[44px] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 active:opacity-80 transition-all flex items-center justify-center gap-2"
                    style={getGradientStyle(theme)}
                  >
                    <span className="font-bold text-base leading-none">₹</span> View Expenses
                  </button>

                  {/* Secondary actions — always 3 equal columns */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleCopyInvite(group.id, group.name)}
                      className="min-h-[38px] px-2 py-2 rounded-lg text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/80 hover:bg-gray-200 dark:hover:bg-gray-600 active:scale-95 transition text-xs font-medium flex items-center justify-center gap-1"
                      title="Copy Group ID to share"
                    >
                      <FiLink size={12} />
                      {copiedGroupId === group.id ? "Copied!" : "Invite"}
                    </button>
                    <button
                      onClick={() => handleSimplifyDebts(group.id)}
                      className="min-h-[38px] px-2 py-2 rounded-lg text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/80 hover:bg-gray-200 dark:hover:bg-gray-600 active:scale-95 transition text-xs font-medium flex items-center justify-center gap-1"
                      title="Show minimum transactions to settle all debts"
                    >
                      <FiZap size={12} /> Simplify
                    </button>
                    <button
                      onClick={() => fetchActivity(group.id)}
                      className="min-h-[38px] px-2 py-2 rounded-lg text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/80 hover:bg-gray-200 dark:hover:bg-gray-600 active:scale-95 transition text-xs font-medium flex items-center justify-center gap-1"
                      title="View activity log for this group"
                    >
                      <FiClock size={12} /> Activity
                    </button>
                  </div>

                  {/* Creator-only actions */}
                  {group.createdBy?.id === userId && (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setShowAddMemberModal(group.id)}
                        className={`min-h-[38px] bg-white dark:bg-gray-700 border ${theme.border} ${theme.text} px-3 py-2 rounded-lg text-xs font-semibold ${theme.bgHover} active:scale-95 transition flex items-center justify-center gap-1.5`}
                      >
                        <FiUserPlus size={13} /> Add Member
                      </button>
                      <button
                        onClick={() => handleDeleteGroup(group)}
                        disabled={deletingGroup === group.id}
                        className="min-h-[38px] px-3 py-2 rounded-lg text-red-400 hover:text-red-600 dark:hover:text-red-300 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 active:scale-95 transition text-xs font-medium flex items-center justify-center gap-1.5 disabled:opacity-40 border border-red-100 dark:border-red-900/30"
                        title="Delete this group"
                      >
                        <FiTrash2 size={13} /> {deletingGroup === group.id ? "Deleting…" : "Delete"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {simplifyGroupId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <FiZap className={theme.text} /> Simplified Debts
              </h3>
              <button onClick={() => setSimplifyGroupId(null)} className="text-gray-400 hover:text-gray-600">
                <FiX className="text-xl" />
              </button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Minimum transactions to settle all balances in this group.</p>
            {simplifying ? (
              <div className="text-center py-8">
                <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${theme.spinner} mx-auto`}></div>
              </div>
            ) : simplifiedDebts.length === 0 ? (
              <div className="text-center py-8 text-green-600 font-semibold">✅ All settled up!</div>
            ) : (
              <div className="space-y-3">
                {simplifiedDebts.map((t, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-sm">
                      <span className="font-semibold text-gray-800 dark:text-white">{t.from?.name || "?"}</span>
                      <span className="text-gray-500 dark:text-gray-400"> pays </span>
                      <span className="font-semibold text-gray-800 dark:text-white">{t.to?.name || "?"}</span>
                    </div>
                    <span className="font-bold text-green-600">₹{t.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Activity Log Modal */}
      {activityGroupId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <FiClock className={theme.text} /> Activity Log
              </h3>
              <button onClick={() => setActivityGroupId(null)} className="text-gray-400 hover:text-gray-600">
                <FiX className="text-xl" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1">
              {activityLoading ? (
                <div className="text-center py-8">
                  <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${theme.spinner} mx-auto`}></div>
                </div>
              ) : activityLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">No activity yet.</div>
              ) : (
                <div className="space-y-2">
                  {activityLogs.map((log, i) => (
                    <div key={i} className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={getGradientStyle(theme)}>
                        {(log.actorName || "?")[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 dark:text-white">{log.details}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {log.actorName} &bull; {new Date(log.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">Create Group</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            <form onSubmit={handleCreateGroup}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Group Name *
                </label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., Roommates, Trip to Goa"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={createForm.description}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Optional description"
                  rows={3}
                />
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
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">Add Member</h3>
              <button
                onClick={() => setShowAddMemberModal(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            <form onSubmit={(e) => handleAddMember(showAddMemberModal, e)}>
              {/* Friends quick-add */}
              {friends.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                    <FiHeart size={13} className={theme.text} /> Add from Friends
                  </label>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {friends.map((f) => {
                      const currentGroup = groups.find(g => g.id === showAddMemberModal);
                      const alreadyMember = currentGroup?.members?.some(m => m.id === f.id);
                      return (
                        <div key={f.id} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-700">
                          <div className="h-7 w-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={getGradientStyle(theme)}>
                            {f.name?.[0]?.toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-800 dark:text-white truncate">{f.name}</p>
                            <p className="text-[10px] text-gray-400 truncate">{f.email}</p>
                          </div>
                          {alreadyMember ? (
                            <span className="text-[10px] text-green-500 font-semibold">Already in</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setAddMemberForm({ memberEmail: f.id });
                                setTimeout(() => document.getElementById("addMemberSubmitBtn")?.click(), 50);
                              }}
                              className="text-xs font-semibold px-2.5 py-1 rounded-lg text-white"
                              style={getGradientStyle(theme)}
                            >
                              Add
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="my-3 flex items-center gap-2 text-gray-300 dark:text-gray-600">
                    <div className="flex-1 border-t dark:border-gray-700" />
                    <span className="text-xs">or enter ID manually</span>
                    <div className="flex-1 border-t dark:border-gray-700" />
                  </div>
                </div>
              )}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Member User ID
                </label>
                <input
                  type="text"
                  value={addMemberForm.memberEmail}
                  onChange={(e) =>
                    setAddMemberForm({ memberEmail: e.target.value })
                  }
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="Enter user ID"
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Ask the person for their user ID. They can find it in their Profile page or Dashboard
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(null)}
                  className="flex-1 px-4 py-2 border dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  id="addMemberSubmitBtn"
                  type="submit"
                  className="flex-1 px-4 py-2 text-white rounded-lg hover:opacity-90"
                  style={getGradientStyle(theme)}
                >
                  Add Member
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

