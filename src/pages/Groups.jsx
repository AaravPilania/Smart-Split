import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import DesktopLayout from "../components/DesktopLayout";
import DesktopPageHeader from "../components/DesktopPageHeader";
import { FiUsers, FiPlus, FiX, FiUserPlus, FiLink, FiZap, FiHeart, FiClock, FiTrash2, FiCamera, FiArchive, FiCalendar, FiLock, FiHome, FiGlobe, FiRepeat, FiDollarSign } from "react-icons/fi";
import { API_URL, apiFetch, getUserId, cachedApiFetch, invalidateCache } from "../utils/api";
import { useTheme, getGradientStyle, getPageBgStyle } from "../utils/theme";
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
  const [archivedGroups, setArchivedGroups] = useState([]);
  const [showArchived, setShowArchived] = useState(false);

  // Premium gate for trip groups
  const [isPremium, setIsPremium] = useState(null);
  const [showTripPremiumGate, setShowTripPremiumGate] = useState(false);

  const [pfpUploading, setPfpUploading] = useState(null); // groupId being uploaded
  const pfpInputRef = useRef(null);
  const pfpTargetGroupId = useRef(null);

  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
    type: "regular",
    startDate: "",
    endDate: "",
    budget: "",
    defaultCurrency: "INR",
    recurringBills: [],
  });

  const [addMemberForm, setAddMemberForm] = useState({
    memberEmail: "",
  });

  const getGroupColor = (group) => {
    switch (group.type) {
      case 'trip': return '#3b82f6';
      case 'home': return '#f59e0b';
      case 'couple': return '#ec4899';
      default: return theme.gradFrom;
    }
  };

  useEffect(() => {
    const userIdStr = getUserId();
    if (!userIdStr) {
      navigate("/");
      return;
    }
    setUserId(userIdStr);
    fetchGroups(userIdStr);
    fetchArchivedGroups(userIdStr);
    fetchFriends();
    // Check premium status for trip group gating
    (async () => {
      try {
        const res = await apiFetch(`${API_URL}/auth/premium-status`);
        if (res.ok) {
          const data = await res.json();
          setIsPremium(!!data.isPremium);
        } else {
          setIsPremium(false);
        }
      } catch {
        setIsPremium(false);
      }
    })();
  }, [navigate]);

  const fetchFriends = async () => {
    const uid = getUserId();
    try {
      const res = await cachedApiFetch(
        `${API_URL}/friends`,
        `friends_${uid}`,
        (d) => setFriends(d.friends || [])
      );
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
        invalidateCache(`groups_${userId}`, `expenses_`, `balance_summary_`, 'dashboard_summary');
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
      const response = await cachedApiFetch(
        `${API_URL}/groups?userId=${userId}`,
        `groups_${userId}`,
        (freshData) => {
          setGroups(freshData.groups || []);
          setFetchError(false);
        }
      );
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

  const fetchArchivedGroups = async (uid) => {
    try {
      const res = await apiFetch(`${API_URL}/groups?userId=${uid}&archived=true`);
      if (res.ok) {
        const data = await res.json();
        setArchivedGroups(data.groups || []);
      }
    } catch {}
  };

  const handleArchiveGroup = async (group) => {
    if (!window.confirm(`Archive "${group.name}"? It will move to your Archived tab.`)) return;
    try {
      const res = await apiFetch(`${API_URL}/groups/${group.id}/archive`, { method: "PATCH" });
      if (res.ok) {
        setGroups(prev => prev.filter(g => g.id !== group.id));
        invalidateCache(`groups_${userId}`, 'dashboard_summary');
        fetchArchivedGroups(userId);
      } else {
        const d = await res.json();
        alert(d.message || "Failed to archive");
      }
    } catch { alert("Failed to archive group"); }
  };

  // Trip status helper
  const getTripStatus = (group) => {
    if (group.type !== 'trip') return null;
    const now = new Date();
    const start = group.startDate ? new Date(group.startDate) : null;
    const end = group.endDate ? new Date(group.endDate) : null;
    if (group.archived) return { label: "Ended", color: "#6b7280", bg: "rgba(107,114,128,0.15)" };
    if (end && now > end) return { label: "Ending soon", color: "#f59e0b", bg: "rgba(245,158,11,0.15)" };
    if (start && now < start) {
      const days = Math.ceil((start - now) / 86400000);
      return { label: `Starts in ${days}d`, color: "#3b82f6", bg: "rgba(59,130,246,0.15)" };
    }
    if (start && end) {
      const days = Math.ceil((end - now) / 86400000);
      return { label: `${days}d left`, color: "#22c55e", bg: "rgba(34,197,94,0.15)" };
    }
    return { label: "Active", color: "#22c55e", bg: "rgba(34,197,94,0.15)" };
  };

  // Sort groups: trips first, then by creation date
  const sortedGroups = [...groups].sort((a, b) => {
    if (a.type === 'trip' && b.type !== 'trip') return -1;
    if (a.type !== 'trip' && b.type === 'trip') return 1;
    return 0;
  });

  const handlePfpButtonClick = (groupId) => {
    pfpTargetGroupId.current = groupId;
    pfpInputRef.current?.click();
  };

  const handlePfpChange = async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Image must be under 2MB");
      return;
    }
    const groupId = pfpTargetGroupId.current;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target.result;
      setPfpUploading(groupId);
      try {
        const res = await apiFetch(`${API_URL}/groups/${groupId}/pfp`, {
          method: "PATCH",
          body: JSON.stringify({ pfp: base64 }),
        });
        if (res.ok) {
          setGroups(prev => prev.map(g => g.id === groupId ? { ...g, pfp: base64 } : g));
        } else {
          const d = await res.json();
          alert(d.message || "Failed to update group photo");
        }
      } catch {
        alert("Failed to update group photo");
      } finally {
        setPfpUploading(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!createForm.name.trim()) {
      alert("Group name is required");
      return;
    }

    // Gate trip groups behind premium
    if (createForm.type === "trip" && !isPremium) {
      setShowTripPremiumGate(true);
      return;
    }

    try {
      const payload = {
        name: createForm.name,
        description: createForm.description,
        createdBy: userId,
        type: createForm.type,
        defaultCurrency: createForm.defaultCurrency,
      };
      if (createForm.type === "trip") {
        payload.startDate = createForm.startDate;
        payload.endDate = createForm.endDate;
        if (createForm.budget) payload.budget = Number(createForm.budget);
      }
      if (createForm.type === "home" && createForm.recurringBills.length > 0) {
        payload.recurringBills = createForm.recurringBills;
      }
      const response = await apiFetch(`${API_URL}/groups`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to create group");

      setCreateForm({ name: "", description: "", type: "regular", startDate: "", endDate: "", budget: "", defaultCurrency: "INR", recurringBills: [] });
      setShowCreateModal(false);
      invalidateCache(`groups_${userId}`, 'dashboard_summary');
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
      invalidateCache(`groups_${userId}`);
      fetchGroups(userId);
      alert("Member added successfully!");
    } catch (error) {
      alert(error.message || "Failed to add member");
    }
  };


  if (loading) {
    return (
      <DesktopLayout>
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
      </DesktopLayout>
    );
  }

  return (
    <DesktopLayout>
      {/* Hidden file input shared across all group pfp pickers */}
      <input
        ref={pfpInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handlePfpChange}
      />

      <div className="max-w-6xl mx-auto py-8 px-6 pb-28 md:pb-8">
        <DesktopPageHeader
          label="Manage"
          title="Your"
          gradWord="Groups"
          subtitle={`${groups.length} active group${groups.length !== 1 ? "s" : ""}${archivedGroups.length ? ` · ${archivedGroups.length} archived` : ""} · Split expenses effortlessly`}
          actions={
            <motion.button
              onClick={() => setShowCreateModal(true)}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="text-white px-5 py-2.5 rounded-2xl shadow-lg flex items-center gap-2 text-sm font-bold magnetic-cta"
              style={{ background: `linear-gradient(135deg, ${theme.gradFrom}, ${theme.gradTo})`, boxShadow: `0 4px 20px ${theme.gradFrom}44` }}
            >
              <FiPlus size={15} /> Create Group
            </motion.button>
          }
        />

        {/* Active / Archived tabs */}
        <div className="flex gap-2 mb-5">
          {["active", "archived"].map(tab => (
            <button
              key={tab}
              onClick={() => setShowArchived(tab === "archived")}
              className="px-4 py-2 rounded-xl text-sm font-bold transition-all"
              style={{
                background: (showArchived ? tab === "archived" : tab === "active")
                  ? `linear-gradient(135deg, ${theme.gradFrom}, ${theme.gradTo})`
                  : isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                color: (showArchived ? tab === "archived" : tab === "active") ? "#fff" : isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)",
              }}
            >
              {tab === "active" ? `Active (${groups.length})` : `Archived (${archivedGroups.length})`}
            </button>
          ))}
        </div>

        {/* Groups List */}
        {fetchError ? (
          <div className="flex flex-col items-center justify-center py-20 gap-5">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-8 max-w-sm w-full text-center shadow">
              <FiX className="mx-auto mb-3 text-red-400" size={40} />
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
        ) : showArchived ? (
          /* ── Archived Groups View ── */
          archivedGroups.length === 0 ? (
            <div className="rounded-2xl p-10 sm:p-14 flex flex-col items-center justify-center"
              style={isDark
                ? { background: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)", border: "1px solid rgba(255,255,255,0.08)" }
                : { background: "rgba(255,255,255,0.92)", border: "1px solid rgba(0,0,0,0.06)" }}>
              <FiArchive size={28} className="mb-3" style={{ color: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.25)" }} />
              <h3 className="font-black text-lg mb-1" style={{ color: isDark ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.8)" }}>No archived groups</h3>
              <p className="text-sm" style={{ color: isDark ? "rgba(255,255,255,0.38)" : "rgba(0,0,0,0.42)" }}>Ended trips and archived groups appear here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {archivedGroups.map((group, gIdx) => (
                <motion.div key={group.id} className="rounded-2xl p-5 flex flex-col relative overflow-hidden opacity-75"
                  style={isDark
                    ? { background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.015) 100%)", border: "1px solid rgba(255,255,255,0.06)" }
                    : { background: "rgba(255,255,255,0.8)", border: "1px solid rgba(0,0,0,0.05)" }}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 0.75, y: 0 }}
                  transition={{ type: "spring", stiffness: 280, damping: 26, delay: gIdx * 0.05 }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm text-white font-bold" style={{ background: "#6b7280" }}>
                      {group.type === 'trip' ? <FiGlobe size={18} /> : group.type === 'home' ? <FiHome size={18} /> : group.type === 'couple' ? <FiHeart size={18} /> : group.name?.[0]?.toUpperCase() || "G"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[15px] font-bold truncate" style={{ color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)" }}>{group.name}</h3>
                      {group.endDate && <p className="text-[11px]" style={{ color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)" }}>Ended {new Date(group.endDate).toLocaleDateString()}</p>}
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: "rgba(107,114,128,0.15)", color: "#6b7280" }}>Archived</span>
                  </div>
                  <button onClick={() => navigate(`/expenses?group=${group.id}`)}
                    className="w-full py-2 rounded-xl text-sm font-semibold transition"
                    style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)" }}>
                    View Expenses
                  </button>
                </motion.div>
              ))}
            </div>
          )
        ) : groups.length === 0 ? (
          <div
            className="rounded-2xl p-10 sm:p-14 flex flex-col items-center justify-center"
            style={isDark
              ? { background: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(20px)" }
              : { background: "rgba(255,255,255,0.92)", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 2px 16px rgba(0,0,0,0.05)" }}
          >
            <div className="text-4xl mb-3" style={{ color: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.25)" }}>
              <FiUsers />
            </div>
            <h3 className="font-black text-lg mb-1" style={{ color: isDark ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.8)" }}>No groups yet</h3>
            <p className="text-sm" style={{ color: isDark ? "rgba(255,255,255,0.38)" : "rgba(0,0,0,0.42)" }}>Create your first group to start splitting expenses</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {sortedGroups.map((group, gIdx) => {
              const tripStatus = getTripStatus(group);
              return (
              <motion.div
                key={group.id}
                className="rounded-2xl p-5 flex flex-col premium-list-card card-grid-item relative overflow-hidden"
                style={isDark
                  ? { background: "linear-gradient(135deg, rgba(255,255,255,0.065) 0%, rgba(255,255,255,0.025) 100%)", border: `1px solid ${group.type === 'trip' ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.09)'}`, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }
                  : { background: "rgba(255,255,255,0.9)", border: `1px solid ${group.type === 'trip' ? 'rgba(59,130,246,0.15)' : 'rgba(0,0,0,0.07)'}`, boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}
                initial={{ opacity: 0, y: 24, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 280, damping: 26, delay: gIdx * 0.07 }}
              >
                {/* Subtle top-right glow */}
                <div
                  className="absolute top-0 right-0 w-24 h-24 pointer-events-none rounded-2xl"
                  style={{ background: `radial-gradient(circle at 100% 0%, ${getGroupColor(group)}16 0%, transparent 60%)` }}
                />

                {/* Trip badge + dates */}
                {tripStatus && (
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1"
                      style={{ background: tripStatus.bg, color: tripStatus.color }}>
                      {tripStatus.label}
                    </span>
                    {group.startDate && group.endDate && (
                      <span className="text-[10px] flex items-center gap-1" style={{ color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)" }}>
                        <FiCalendar size={9} />
                        {new Date(group.startDate).toLocaleDateString('en-IN', { day:'numeric', month:'short' })} – {new Date(group.endDate).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}
                      </span>
                    )}
                  </div>
                )}
                <div className="flex justify-between items-start mb-4 gap-3">
                  {/* Avatar with camera overlay */}
                  <div className="relative flex-shrink-0 self-start">
                    {group.pfp ? (
                      <img
                        src={group.pfp}
                        alt={group.name}
                        className="w-12 h-12 rounded-xl object-cover"
                      />
                    ) : (
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-lg text-white font-bold select-none"
                        style={getGradientStyle(theme)}
                      >
                        {group.name?.[0]?.toUpperCase() || "G"}
                      </div>
                    )}
                    <button
                      onClick={() => handlePfpButtonClick(group.id)}
                      disabled={pfpUploading === group.id}
                      className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center shadow-md border-2 border-white dark:border-gray-800 transition-opacity hover:opacity-80 disabled:opacity-50"
                      style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
                      title="Set group photo"
                    >
                      {pfpUploading === group.id
                        ? <div className="w-2.5 h-2.5 rounded-full border border-white border-t-transparent animate-spin" />
                        : <FiCamera size={10} color="white" />
                      }
                    </button>
                  </div>

                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => navigate(`/expenses?group=${group.id}`)}
                  >
                    <h3 className="text-[17px] font-black leading-tight mb-1 hover:opacity-75 transition-opacity truncate" style={{ color: isDark ? "#fff" : "#111" }}>
                      {group.name}
                    </h3>
                    {group.description && group.description !== "No description" ? (
                      <p className="text-[12px] mb-1.5 truncate" style={{ color: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)" }}>{group.description}</p>
                    ) : (
                      <p className="text-[12px] italic mb-1.5" style={{ color: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.25)" }}>No description</p>
                    )}
                    <p className="text-[11px]" style={{ color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)" }}>
                      By {group.createdBy?.name || "Unknown"}
                    </p>
                  </div>

                  {/* Member pills — top right */}
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <FiUsers size={11} className={theme.text} />
                      <span className="font-medium">{group.members?.length || 0}</span>
                    </div>
                    <div className="flex flex-wrap justify-end gap-1 max-w-[120px]">
                      {group.members?.slice(0, 3).map((member) => (
                        <span
                          key={member.id}
                          className={`px-2 py-0.5 ${theme.bgActive} ${theme.text} rounded-full text-[11px] font-medium`}
                        >
                          {member.name.split(" ")[0]}
                        </span>
                      ))}
                      {group.members?.length > 3 && (
                        <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-full text-[11px] font-medium">
                          +{group.members.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Trip budget bar */}
                {group.type === 'trip' && group.budget > 0 && (
                  <div className="mb-3 px-1">
                    <div className="flex justify-between text-[11px] mb-1">
                      <span style={{ color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)" }}>Trip Budget</span>
                      <span className="font-bold" style={{ color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)" }}>
                        {group.budgetCurrency || group.defaultCurrency || '₹'} {group.budget.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}>
                      <div className="h-full rounded-full transition-all" style={{ width: "0%", background: `linear-gradient(90deg, ${theme.gradFrom}, ${theme.gradTo})` }} />
                    </div>
                  </div>
                )}

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
                    <div className={`grid ${group.type === 'trip' || group.type === 'home' ? 'grid-cols-3' : 'grid-cols-2'} gap-2`}>
                      <button
                        onClick={() => setShowAddMemberModal(group.id)}
                        className={`min-h-[38px] bg-white dark:bg-gray-700 border ${theme.border} ${theme.text} px-3 py-2 rounded-lg text-xs font-semibold ${theme.bgHover} active:scale-95 transition flex items-center justify-center gap-1.5`}
                      >
                        <FiUserPlus size={13} /> Add Member
                      </button>
                      {group.type === 'trip' && (
                        <button
                          onClick={() => handleArchiveGroup(group)}
                          className="min-h-[38px] px-3 py-2 rounded-lg text-amber-500 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/40 active:scale-95 transition text-xs font-medium flex items-center justify-center gap-1.5 border border-amber-100 dark:border-amber-900/30"
                          title="Archive this trip"
                        >
                          <FiArchive size={13} /> Archive
                        </button>
                      )}
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
              </motion.div>
              );
            })}
          </div>
        )}

      </div>

      <AnimatePresence>
      {simplifyGroupId && (
        <motion.div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          <motion.div className="rounded-xl shadow-xl max-w-md w-full p-6" style={{ background: isDark ? "rgba(10,12,24,0.97)" : "#fff", border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}`, backdropFilter: "blur(28px)" }} initial={{ opacity: 0, y: 40, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 30, scale: 0.97 }} transition={{ type: "spring", stiffness: 340, damping: 28 }}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2" style={{ color: isDark ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.85)" }}>
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
              <div className="text-center py-8 text-green-600 font-semibold">All settled up!</div>
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
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Activity Log Modal */}
      <AnimatePresence>
      {activityGroupId && (
        <motion.div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          <motion.div className="rounded-xl shadow-xl max-w-md w-full p-6 flex flex-col max-h-[80vh]" style={{ background: isDark ? "rgba(10,12,24,0.97)" : "#fff", border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}`, backdropFilter: "blur(28px)" }} initial={{ opacity: 0, y: 40, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 30, scale: 0.97 }} transition={{ type: "spring", stiffness: 340, damping: 28 }}>
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
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Create Group Modal */}
      <AnimatePresence>
      {showCreateModal && (
        <motion.div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          <motion.div className="rounded-xl shadow-xl max-w-md w-full p-6" style={{ background: isDark ? "rgba(10,12,24,0.97)" : "#fff", border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}`, backdropFilter: "blur(28px)" }} initial={{ opacity: 0, y: 40, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 30, scale: 0.97 }} transition={{ type: "spring", stiffness: 340, damping: 28 }}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold" style={{ color: isDark ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.85)" }}>Create Group</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            <form onSubmit={handleCreateGroup}>
              {/* Type selector */}
              <div className="mb-4 grid grid-cols-4 gap-2">
                {[
                  { key: "regular", label: "Regular", Icon: FiUsers },
                  { key: "trip", label: "Trip", Icon: FiGlobe },
                  { key: "home", label: "Home", Icon: FiHome },
                  { key: "couple", label: "Couple", Icon: FiHeart },
                ].map(({ key, label, Icon }) => (
                  <button key={key} type="button"
                    onClick={() => setCreateForm({ ...createForm, type: key })}
                    className="flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-bold transition"
                    style={{
                      background: createForm.type === key
                        ? `linear-gradient(135deg, ${theme.gradFrom}, ${theme.gradTo})`
                        : isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
                      color: createForm.type === key ? "#fff" : isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)",
                    }}>
                    <Icon size={16} />
                    {label}
                  </button>
                ))}
              </div>

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
                  placeholder={createForm.type === "trip" ? "e.g., Goa Trip 2026" : createForm.type === "home" ? "e.g., Flat 302, Our Apartment" : createForm.type === "couple" ? "e.g., Us, Our Expenses" : "e.g., Roommates, Office lunch"}
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
                  rows={2}
                />
              </div>

              {/* Trip-specific fields */}
              {createForm.type === "trip" && (
                <>
                  <div className="mb-4 grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold mb-1" style={{ color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)" }}>Start Date *</label>
                      <input type="date" required value={createForm.startDate}
                        onChange={e => setCreateForm({ ...createForm, startDate: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg text-sm bg-white dark:bg-gray-700 border dark:border-gray-600 text-gray-900 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1" style={{ color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)" }}>End Date *</label>
                      <input type="date" required value={createForm.endDate}
                        onChange={e => setCreateForm({ ...createForm, endDate: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg text-sm bg-white dark:bg-gray-700 border dark:border-gray-600 text-gray-900 dark:text-white" />
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-xs font-semibold mb-1" style={{ color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)" }}>Trip Budget (optional)</label>
                    <input type="number" min="0" placeholder="e.g., 50000"
                      value={createForm.budget}
                      onChange={e => setCreateForm({ ...createForm, budget: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg text-sm bg-white dark:bg-gray-700 border dark:border-gray-600 text-gray-900 dark:text-white" />
                  </div>
                </>
              )}

              {/* Home-specific: recurring bills */}
              {createForm.type === "home" && (
                <div className="mb-4">
                  <label className="flex items-center gap-1.5 text-xs font-semibold mb-2" style={{ color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)" }}>
                    <FiRepeat size={12} /> Recurring Bills
                  </label>
                  <div className="space-y-2 mb-2">
                    {createForm.recurringBills.map((bill, i) => (
                      <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl" style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)", border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}` }}>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold truncate" style={{ color: isDark ? "#fff" : "#111" }}>{bill.name}</p>
                          <p className="text-[10px]" style={{ color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)" }}>
                            {createForm.defaultCurrency} {bill.amount} · Day {bill.billingDay}
                          </p>
                        </div>
                        <button type="button" onClick={() => {
                          const updated = [...createForm.recurringBills];
                          updated.splice(i, 1);
                          setCreateForm({ ...createForm, recurringBills: updated });
                        }} className="p-1 rounded-lg hover:bg-red-500/10">
                          <FiX size={14} className="text-red-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                  {/* Quick-add common bills */}
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {[
                      { name: "Rent", amount: 0, category: "rent", billingDay: 1 },
                      { name: "Electricity", amount: 0, category: "utilities", billingDay: 5 },
                      { name: "WiFi", amount: 0, category: "utilities", billingDay: 10 },
                      { name: "Water", amount: 0, category: "utilities", billingDay: 5 },
                      { name: "Gas", amount: 0, category: "utilities", billingDay: 15 },
                      { name: "Maintenance", amount: 0, category: "maintenance", billingDay: 1 },
                      { name: "Groceries", amount: 0, category: "groceries", billingDay: 1 },
                      { name: "Cleaning", amount: 0, category: "services", billingDay: 15 },
                    ].filter(preset => !createForm.recurringBills.some(b => b.name === preset.name))
                     .map(preset => (
                      <button key={preset.name} type="button"
                        onClick={() => {
                          const amt = prompt(`Enter monthly amount for ${preset.name}:`);
                          if (!amt || isNaN(Number(amt)) || Number(amt) <= 0) return;
                          const day = prompt(`Billing day of month (1-28):`, String(preset.billingDay));
                          if (!day || isNaN(Number(day)) || Number(day) < 1 || Number(day) > 28) return;
                          setCreateForm({
                            ...createForm,
                            recurringBills: [...createForm.recurringBills, { ...preset, amount: Number(amt), billingDay: Number(day) }],
                          });
                        }}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition"
                        style={{
                          background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                          color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.5)",
                          border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
                        }}>
                        + {preset.name}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px]" style={{ color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)" }}>
                    Bills are auto-split among members each month on the billing day
                  </p>
                </div>
              )}

              {/* Currency selector */}
              <div className="mb-4">
                <label className="block text-xs font-semibold mb-1" style={{ color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)" }}>Default Currency</label>
                <select value={createForm.defaultCurrency}
                  onChange={e => setCreateForm({ ...createForm, defaultCurrency: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm bg-white dark:bg-gray-700 border dark:border-gray-600 text-gray-900 dark:text-white">
                  <option value="INR">₹ INR</option>
                  <option value="USD">$ USD</option>
                  <option value="EUR">€ EUR</option>
                  <option value="GBP">£ GBP</option>
                  <option value="JPY">¥ JPY</option>
                  <option value="AUD">A$ AUD</option>
                  <option value="CAD">C$ CAD</option>
                  <option value="SGD">S$ SGD</option>
                  <option value="AED">د.إ AED</option>
                  <option value="THB">฿ THB</option>
                </select>
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
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Add Member Modal */}
      <AnimatePresence>
      {showAddMemberModal && (
        <motion.div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          <motion.div className="rounded-xl shadow-xl max-w-md w-full p-6" style={{ background: isDark ? "rgba(10,12,24,0.97)" : "#fff", border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}`, backdropFilter: "blur(28px)" }} initial={{ opacity: 0, y: 40, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 30, scale: 0.97 }} transition={{ type: "spring", stiffness: 340, damping: 28 }}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold" style={{ color: isDark ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.85)" }}>Add Member</h3>
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
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Trip Premium Gate Modal */}
      <AnimatePresence>
      {showTripPremiumGate && (
        <motion.div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="flex flex-col items-center justify-center text-center p-8 rounded-2xl max-w-sm w-full"
            style={{
              background: isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.85)",
              border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.06)",
              backdropFilter: "blur(20px)",
            }}
          >
            <FiZap className="mx-auto mb-3" size={40} style={{ color: theme.gradFrom }} />
            <h3 className="text-lg font-semibold mb-2" style={{ color: isDark ? "#fff" : "#1a1a2e" }}>
              Trip Groups are a Premium Feature
            </h3>
            <p className="text-sm opacity-60 mb-1" style={{ color: isDark ? "#fff" : "#333" }}>
              Plan group trips with:
            </p>
            <ul className="text-sm opacity-50 mb-4 space-y-1" style={{ color: isDark ? "#fff" : "#333" }}>
              <li>Start &amp; end dates</li>
              <li>Trip budgets</li>
              <li>🌍 Multi-currency support</li>
            </ul>
            <p className="text-xs opacity-40 mb-4" style={{ color: isDark ? "#fff" : "#333" }}>
              Regular groups are always free!
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setShowTripPremiumGate(false)}
                className="flex-1 px-4 py-2.5 rounded-full text-sm font-medium transition hover:opacity-80"
                style={{
                  background: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)",
                  color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)",
                }}
              >
                Go Back
              </button>
              <button
                onClick={() => { setShowTripPremiumGate(false); navigate("/profile"); }}
                style={getGradientStyle(theme)}
                className="flex-1 px-4 py-2.5 rounded-full text-white font-medium text-sm shadow-lg transition hover:opacity-90"
              >
                Upgrade to Premium
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </DesktopLayout>
  );
}

