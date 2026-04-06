import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import DesktopLayout from "../components/DesktopLayout";
import {
  FiUser, FiMail, FiEdit2, FiCheck, FiX,
  FiCopy, FiChevronRight,
  FiSun, FiMoon, FiLogOut, FiCamera, FiLock, FiArrowLeft, FiUsers,
  FiTarget, FiRepeat, FiPlus, FiTrash2, FiCalendar,
} from "react-icons/fi";
import { QRCodeSVG } from "qrcode.react";
import { API_URL, apiFetch, getUserId, clearAuth, cachedApiFetch, invalidateCache } from "../utils/api";
import {
  ACCENT_PRESETS,
  getGradientStyle,
  getPageBgStyle,
  useTheme,
  toggleDarkMode,
} from "../utils/theme";
import { detectCategory, getCategoryInfo } from "../utils/categories";
import BillingCalendar from "../components/BillingCalendar";

const APP_URL = import.meta.env.VITE_APP_URL || "https://thesmartsplit.pages.dev";

const CAT_COLORS = [
  "#ec4899", "#f59e0b", "#3b82f6", "#8b5cf6",
  "#10b981", "#ef4444", "#f97316", "#14b8a6", "#6b7280",
];

function fmt(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(amount);
}

const sectionSty = (isDark) => ({
  background: isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.85)",
  border: isDark ? "1px solid rgba(255,255,255,0.085)" : "1px solid rgba(0,0,0,0.06)",
  boxShadow: isDark ? "0 4px 28px rgba(0,0,0,0.35)" : "0 2px 14px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.02)",
});

const sepSty = (isDark) => ({
  borderTop: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.055)",
});

const avatarOptions = [
  `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'><defs><linearGradient id='g' x1='0' x2='1' y1='0' y2='1'><stop stop-color='%23ec4899'/><stop offset='1' stop-color='%23f59e0b'/></linearGradient></defs><rect width='80' height='80' rx='16' fill='url(%23g)'/><circle cx='24' cy='24' r='10' fill='white' opacity='.2'/><circle cx='56' cy='56' r='14' fill='white' opacity='.2'/></svg>`,
  `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'><defs><radialGradient id='r' cx='.3' cy='.3'><stop offset='0' stop-color='%2363b3ed'/><stop offset='1' stop-color='%238b5cf6'/></radialGradient></defs><rect width='80' height='80' rx='16' fill='url(%23r)'/><path d='M0,50 C20,30 60,70 80,40 L80,80 L0,80 Z' fill='white' opacity='.15'/></svg>`,
  `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'><defs><linearGradient id='g2' x1='0' x2='1'><stop stop-color='%230ea5e9'/><stop offset='1' stop-color='%2322c55e'/></linearGradient></defs><rect width='80' height='80' rx='16' fill='url(%23g2)'/><g fill='white' opacity='.2'><rect x='10' y='10' width='12' height='12' rx='3'/><rect x='30' y='26' width='16' height='16' rx='4'/><rect x='54' y='12' width='10' height='10' rx='3'/><rect x='16' y='50' width='20' height='20' rx='6'/></g></svg>`,
  `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'><defs><linearGradient id='g3' x1='0' x2='1' y1='1' y2='0'><stop stop-color='%23ef4444'/><stop offset='1' stop-color='%233b82f6'/></linearGradient></defs><rect width='80' height='80' rx='16' fill='url(%23g3)'/><circle cx='40' cy='40' r='26' fill='white' opacity='.12'/><circle cx='40' cy='40' r='18' fill='white' opacity='.12'/></svg>`,
];

const PRESET_SUBSCRIPTIONS = [
  { name: "Netflix",       label: "Netflix",  logo: "https://cdn.simpleicons.org/netflix/ffffff",    color: "#e50914", category: "entertainment" },
  { name: "YouTube",       label: "YouTube",  logo: "https://cdn.simpleicons.org/youtube/ffffff",    color: "#ff0000", category: "entertainment" },
  { name: "Spotify",       label: "Spotify",  logo: "https://cdn.simpleicons.org/spotify/ffffff",    color: "#1db954", category: "entertainment" },
  { name: "Prime Video",   label: "Prime",    logo: "/logos/prime.jpg",   color: "#00a8e0", category: "entertainment" },
  { name: "Disney+ Hotstar", label: "Hotstar", logo: "/logos/hotstar.jpg", color: "#113ccf", category: "entertainment" },
  { name: "ChatGPT Plus",  label: "ChatGPT",  logo: "/logos/chatgpt.png", color: "#10a37f", category: "utilities"    },
  { name: "Gym / Fitness", label: "Gym",      logo: null, emoji: "💪",                               color: "#f59e0b", category: "health"       },
  { name: "Custom",        label: "Custom",   logo: null, emoji: "✏️",                               color: "#6b7280", category: "subscription" },
];

export default function Profile() {
  const [user, setUser] = useState(null);
  const [groups, setGroups] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [frLoading, setFrLoading] = useState(false);
  const [frAction, setFrAction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", username: "", upiId: "", password: "", currentPassword: "",
  });
  const [avatar, setAvatar] = useState(localStorage.getItem("selectedAvatar") || "");
  const { theme, isDark } = useTheme();
  const [localAccent, setLocalAccent] = useState(localStorage.getItem("accentColor") || "pink");
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [toast, setToast] = useState(null);
  const [groupsOpen, setGroupsOpen] = useState(false);
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [categoryData, setCatData] = useState([]);
  const [monthlyData, setMonthly] = useState([]);
  const [insights, setInsights] = useState([]);
  const [insightsFetched, setIFetched] = useState(false);
  const [profileTab, setProfileTab] = useState("account");
  const [goals, setGoals] = useState([]);
  const [goalsLoading, setGoalsLoading] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goalForm, setGoalForm] = useState({ title: "", targetAmount: "", monthlyBudget: "", startDate: "", deadline: "" });
  const [goalSubmitting, setGoalSubmitting] = useState(false);
  const [subscriptions, setSubscriptions] = useState([]);
  const [subsLoading, setSubsLoading] = useState(false);
  const [showSubForm, setShowSubForm] = useState(false);
  const [subStep, setSubStep] = useState("pick"); // "pick" | "form"
  const [subSearch, setSubSearch] = useState("");
  const [subForm, setSubForm] = useState({ name: "", amount: "", billingCycle: "monthly", nextBillingDate: "", color: "#6b7280", icon: "" });
  const [totalSpent, setTotalSpent] = useState(0);
  const navigate = useNavigate();

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const saveAccent = (key) => {
    setLocalAccent(key);
    localStorage.setItem("accentColor", key);
    window.dispatchEvent(new Event("theme-changed"));
  };

  const truncateId = (id) => id?.length > 12 ? `${id.slice(0, 6)}...${id.slice(-4)}` : id;

  const copyId = () => {
    navigator.clipboard.writeText(user.id).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (ev) => saveAvatar(ev.target.result);
    reader.readAsDataURL(file);
  };

  const saveAvatar = (value) => {
    setAvatar(value);
    if (value) localStorage.setItem("selectedAvatar", value);
    else localStorage.removeItem("selectedAvatar");
    window.dispatchEvent(new Event("avatar-changed"));
    const uid = getUserId();
    if (uid) {
      apiFetch(`${API_URL}/auth/profile/${uid}`, {
        method: "PUT", body: JSON.stringify({ pfp: value || "" }),
      }).catch(() => {});
    }
  };

  useEffect(() => {
    const uid = getUserId();
    if (!uid) { navigate("/"); return; }
    fetchProfile(uid);
    fetchGroups(uid);
    fetchFR();
  }, [navigate]);

  // Lazy-load goals, subscriptions, and spending data when switching tabs
  useEffect(() => {
    if (profileTab === "goals") { fetchGoals(); if (!insightsFetched) fetchInsightsData(); }
    if (profileTab === "subscriptions") fetchSubscriptions();
  }, [profileTab]);

  const fetchProfile = async (uid) => {
    try {
      const res = await cachedApiFetch(
        `${API_URL}/auth/profile/${uid}`,
        `profile_${uid}`,
        (d) => {
          setUser(d.user);
          setForm({ name: d.user.name||"", email: d.user.email||"", username: d.user.username||"", upiId: d.user.upiId||"", password: "", currentPassword: "" });
        }
      );
      if (!res.ok) throw new Error();
      const d = await res.json();
      setUser(d.user);
      setForm({ name: d.user.name||"", email: d.user.email||"", username: d.user.username||"", upiId: d.user.upiId||"", password: "", currentPassword: "" });
      const saved = localStorage.getItem("selectedAvatar");
      if (saved) setAvatar(saved);
      else if (d.user.pfp) { setAvatar(d.user.pfp); localStorage.setItem("selectedAvatar", d.user.pfp); }
    } catch {}
    finally { setLoading(false); }
  };

  const fetchGroups = async (uid) => {
    try {
      const res = await cachedApiFetch(
        `${API_URL}/groups?userId=${uid}`,
        `groups_${uid}`,
        (d) => setGroups(d.groups || [])
      );
      if (res.ok) { const d = await res.json(); setGroups(d.groups || []); }
    } catch {}
  };

  const fetchFR = async () => {
    setFrLoading(true);
    try {
      const res = await apiFetch(`${API_URL}/friends/requests`);
      if (res.ok) { const d = await res.json(); setFriendRequests(d.requests || []); }
    } catch {}
    finally { setFrLoading(false); }
  };

  const fetchInsightsData = async () => {
    if (insightsFetched) return;
    try {
      const res = await apiFetch(`${API_URL}/auth/dashboard/summary`);
      if (!res.ok) return;
      const { allExpenses = [] } = await res.json();
      const catTotals = {};
      allExpenses.forEach((e) => {
        const cat = e.category || detectCategory(e.title || "");
        catTotals[cat] = (catTotals[cat] || 0) + parseFloat(e.amount || 0);
      });
      const catArr = Object.entries(catTotals)
        .map(([key, amount]) => ({ key, amount, ...getCategoryInfo(key) }))
        .filter((c) => c.amount > 0)
        .sort((a, b) => b.amount - a.amount);
      setCatData(catArr);
      const now = new Date();
      const buckets = {};
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        buckets[key] = { label: d.toLocaleDateString("en-US", { month: "short" }), amount: 0, isCurrent: i === 0 };
      }
      allExpenses.forEach((e) => {
        const d = new Date(e.createdAt || e.created_at);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (buckets[key]) buckets[key].amount += parseFloat(e.amount || 0);
      });
      const mData = Object.values(buckets);
      setMonthly(mData);
      setInsights(computeInsights({ expenses: allExpenses, categoryData: catArr, monthlyData: mData }));
      // total spent this month for goal savings calc
      const now2 = new Date();
      const thisMonthExp = allExpenses.filter(e => {
        const d = new Date(e.createdAt || e.created_at);
        return d.getMonth() === now2.getMonth() && d.getFullYear() === now2.getFullYear();
      });
      setTotalSpent(thisMonthExp.reduce((s, e) => s + parseFloat(e.amount || 0), 0));
    } catch {}
    setIFetched(true);
  };

  const fetchGoals = async () => {
    setGoalsLoading(true);
    try {
      const res = await apiFetch(`${API_URL}/goals`);
      if (res.ok) { const d = await res.json(); setGoals(d.goals || []); }
    } catch {}
    finally { setGoalsLoading(false); }
  };

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    if (goalSubmitting) return;
    setGoalSubmitting(true);
    try {
      const res = await apiFetch(`${API_URL}/goals`, {
        method: "POST", body: JSON.stringify({
          title: goalForm.title,
          targetAmount: Number(goalForm.targetAmount),
          monthlyBudget: Number(goalForm.monthlyBudget),
          startDate: goalForm.startDate || undefined,
          deadline: goalForm.deadline || undefined,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message); }
      setShowGoalForm(false);
      setGoalForm({ title: "", targetAmount: "", monthlyBudget: "", startDate: "", deadline: "" });
      fetchGoals();
      showToast("Goal created!");
    } catch (err) { showToast(err.message || "Failed", "error"); }
    finally { setGoalSubmitting(false); }
  };

  const handleDeleteGoal = async (id) => {
    try {
      await apiFetch(`${API_URL}/goals/${id}`, { method: "DELETE" });
      fetchGoals();
      showToast("Goal deleted");
    } catch { showToast("Failed to delete", "error"); }
  };

  const handleUpdateSaved = async (goal) => {
    // Calculate savings this month: budget - spent
    const savings = Math.max(0, goal.monthlyBudget - totalSpent);
    const newSaved = (goal.savedAmount || 0) + savings;
    try {
      await apiFetch(`${API_URL}/goals/${goal._id}`, {
        method: "PUT", body: JSON.stringify({ savedAmount: newSaved }),
      });
      fetchGoals();
      showToast(`Added ₹${Math.round(savings)} savings!`);
    } catch { showToast("Failed to update", "error"); }
  };

  const fetchSubscriptions = async () => {
    setSubsLoading(true);
    try {
      const res = await apiFetch(`${API_URL}/subscriptions`);
      if (res.ok) { const d = await res.json(); setSubscriptions(d.subscriptions || []); }
    } catch {}
    finally { setSubsLoading(false); }
  };

  const handleCreateSub = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch(`${API_URL}/subscriptions`, {
        method: "POST", body: JSON.stringify({
          name: subForm.name,
          amount: Number(subForm.amount),
          billingCycle: subForm.billingCycle,
          nextBillingDate: subForm.nextBillingDate,
          color: subForm.color,
          icon: subForm.icon,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message); }
      setShowSubForm(false);
      setSubStep("pick");
      setSubSearch("");
      setSubForm({ name: "", amount: "", billingCycle: "monthly", nextBillingDate: "", color: "#6b7280", icon: "" });
      fetchSubscriptions();
      showToast("Subscription added!");
    } catch (err) { showToast(err.message || "Failed", "error"); }
  };

  const handleToggleSub = async (sub) => {
    try {
      await apiFetch(`${API_URL}/subscriptions/${sub._id}`, {
        method: "PUT", body: JSON.stringify({ active: !sub.active }),
      });
      fetchSubscriptions();
    } catch { showToast("Failed to update", "error"); }
  };

  const handleDeleteSub = async (id) => {
    try {
      await apiFetch(`${API_URL}/subscriptions/${id}`, { method: "DELETE" });
      fetchSubscriptions();
      showToast("Subscription removed");
    } catch { showToast("Failed to delete", "error"); }
  };

  const handleAcceptFR = async (id) => {
    setFrAction(id);
    try {
      const res = await apiFetch(`${API_URL}/friends/accept/${id}`, { method: "PATCH" });
      if (res.ok) fetchFR();
    } finally { setFrAction(null); }
  };

  const handleRejectFR = async (id) => {
    setFrAction(id);
    try {
      const res = await apiFetch(`${API_URL}/friends/reject/${id}`, { method: "PATCH" });
      if (res.ok) fetchFR();
    } finally { setFrAction(null); }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const uid = getUserId();
    try {
      if (form.password && !form.currentPassword.trim()) {
        showToast("Enter your current password to set a new one.", "error"); return;
      }
      const updates = {};
      if (form.name !== user.name) updates.name = form.name;
      if (form.email !== user.email) updates.email = form.email;
      if (form.username && form.username !== user.username) updates.username = form.username;
      if (form.upiId !== (user.upiId || "")) updates.upiId = form.upiId;
      if (form.password) { updates.password = form.password; updates.currentPassword = form.currentPassword; }
      if (!Object.keys(updates).length) { setEditing(false); return; }
      const res = await apiFetch(`${API_URL}/auth/profile/${uid}`, { method: "PUT", body: JSON.stringify(updates) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.message || "Failed");
      setUser(d.user);
      localStorage.setItem("user", JSON.stringify(d.user));
      invalidateCache(`profile_${uid}`);
      setEditing(false);
      setForm((f) => ({ ...f, password: "", currentPassword: "" }));
      showToast("Profile updated!");
    } catch (err) {
      showToast(err.message || "Failed to update", "error");
    }
  };

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setShowLogoutConfirm(false);
    setLoggingOut(true);
    try {
      await apiFetch(`${API_URL}/auth/logout`, { method: "POST" });
    } catch { /* ignore — clear locally regardless */ }
    setTimeout(() => {
      clearAuth();
      localStorage.removeItem("selectedAvatar");
      sessionStorage.clear();
      navigate("/", { replace: true });
    }, 400);
  };

  if (loading || !user) {
    return (
      <DesktopLayout>
        <div className="max-w-lg mx-auto px-4 pt-4 pb-28 space-y-4">
          {/* Hero card skeleton */}
          <div className="rounded-3xl p-6 animate-pulse flex flex-col items-center gap-3"
            style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)", border: isDark ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(0,0,0,0.06)" }}>
            <div className="h-20 w-20 rounded-full" style={{ background: "rgba(128,128,128,0.16)" }} />
            <div className="h-4 w-32 rounded-full" style={{ background: "rgba(128,128,128,0.14)" }} />
            <div className="h-3 w-24 rounded-full" style={{ background: "rgba(128,128,128,0.09)" }} />
            <div className="h-9 w-full rounded-2xl mt-2" style={{ background: "rgba(128,128,128,0.1)" }} />
          </div>
          {[1, 2].map((i) => (
            <div key={i} className="rounded-2xl p-4 animate-pulse space-y-3"
              style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)", border: isDark ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(0,0,0,0.06)" }}>
              {[1, 2].map((j) => (
                <div key={j} className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl flex-shrink-0" style={{ background: "rgba(128,128,128,0.14)" }} />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 rounded-full w-1/3" style={{ background: "rgba(128,128,128,0.14)" }} />
                    <div className="h-3 rounded-full w-1/2" style={{ background: "rgba(128,128,128,0.09)" }} />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </DesktopLayout>
    );
  }

  const ss = sectionSty(isDark);
  const sep = sepSty(isDark);
  const labelClr = isDark ? "rgba(255,255,255,0.36)" : "rgba(0,0,0,0.38)";
  const textClr = isDark ? "#ffffff" : "#0f0f1a";
  const subClr = isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)";
  const chevClr = isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)";

  // ── Helper: a settings row with icon, label, optional right content ─
  const SettingsRow = ({ icon, label, sub, right, onClick, danger, first, last }) => (
    <button
      onClick={onClick}
      className="w-full flex items-center px-4 py-3.5 active:opacity-55 transition-opacity text-left"
      style={!first ? sep : {}}
    >
      {icon && (
        <span className="flex-shrink-0 mr-3.5 w-[30px] h-[30px] rounded-xl flex items-center justify-center text-white text-sm"
          style={danger ? { background: "rgba(239,68,68,0.12)", color: "#f87171" } : getGradientStyle(theme)}>
          {icon}
        </span>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold" style={{ color: danger ? "#f87171" : textClr }}>{label}</p>
        {sub && <p className="text-xs mt-0.5" style={{ color: subClr }}>{sub}</p>}
      </div>
      {right !== undefined ? right : <FiChevronRight size={15} style={{ color: chevClr, flexShrink: 0 }} />}
    </button>
  );

  // ── EDIT PROFILE PAGE ──────────────────────────────────────────────
  if (editing) {
    return (
      <DesktopLayout>
        {/* Sticky header */}
        <div className="sticky top-0 z-40 flex items-center justify-between px-4 h-14"
          style={{
            background: isDark ? "rgba(15,15,25,0.88)" : "rgba(255,255,255,0.88)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}>
          <button
            onClick={() => { setEditing(false); setForm({ name: user.name, email: user.email, username: user.username||"", upiId: user.upiId||"", password: "", currentPassword: "" }); }}
            className="h-9 w-9 rounded-xl flex items-center justify-center active:scale-90 transition"
            style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", color: textClr }}
          >
            <FiArrowLeft size={18} />
          </button>
          <h1 className="text-[16px] font-black" style={{ color: textClr }}>Edit Profile</h1>
          <button
            form="edit-profile-form"
            type="submit"
            className="px-4 py-2 rounded-xl text-white text-sm font-black active:scale-95 transition"
            style={getGradientStyle(theme)}
          >
            Save
          </button>
        </div>

        <div className="max-w-lg mx-auto px-4 pt-5 pb-28">
          {/* Avatar editor */}
          <div className="flex flex-col items-center mb-7">
            <div className="relative mb-3">
              <div className="p-[3px] rounded-full shadow-2xl" style={{ background: `linear-gradient(135deg, ${theme.gradFrom}, ${theme.gradTo})` }}>
                <div className="p-[2px] rounded-full" style={{ background: isDark ? "rgba(10,10,20,0.9)" : "rgba(255,255,255,0.9)" }}>
                  {avatar ? (
                    <img src={avatar} alt="avatar" className="h-24 w-24 rounded-full object-cover" />
                  ) : (
                    <div className="h-24 w-24 rounded-full flex items-center justify-center text-3xl font-black text-white" style={getGradientStyle(theme)}>
                      {user.name?.[0]?.toUpperCase() || "?"}
                    </div>
                  )}
                </div>
              </div>
              <label className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full flex items-center justify-center cursor-pointer shadow-lg text-white" style={getGradientStyle(theme)}>
                <FiCamera size={14} />
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </label>
            </div>
            {/* Avatar presets row */}
            <div className="flex gap-2 mt-2">
              {avatarOptions.map((opt, idx) => (
                <button key={idx} onClick={() => saveAvatar(opt)}
                  className="rounded-xl overflow-hidden transition-all active:scale-90"
                  style={{ padding: "2px", background: avatar === opt ? `linear-gradient(135deg, ${theme.gradFrom}, ${theme.gradTo})` : "transparent" }}>
                  <img src={opt} alt="" className="h-11 w-11 rounded-lg object-cover" />
                </button>
              ))}
              <button onClick={() => saveAvatar("")}
                className="h-[50px] w-[50px] rounded-xl border-2 border-dashed flex items-center justify-center transition active:scale-90"
                style={{ borderColor: isDark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.1)" }}>
                <FiX size={13} style={{ color: subClr }} />
              </button>
            </div>
          </div>

          {/* Form */}
          <form id="edit-profile-form" onSubmit={handleUpdate} className="space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] mb-2 px-1" style={{ color: labelClr }}>Basic Info</p>
            <div className="rounded-2xl overflow-hidden" style={ss}>
              {[
                { key: "name", label: "Name", type: "text", icon: <FiUser size={13} /> },
                { key: "email", label: "Email", type: "email", icon: <FiMail size={13} /> },
              ].map(({ key, label, type, icon }, i) => (
                <div key={key} className="flex items-center px-4 py-3.5" style={i > 0 ? sep : {}}>
                  <span className="mr-3 flex-shrink-0" style={{ color: subClr }}>{icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: labelClr }}>{label}</p>
                    <input type={type} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      className={`w-full text-[14px] font-semibold bg-transparent outline-none ${isDark ? "text-white" : "text-gray-900"}`}
                      placeholder={label} />
                  </div>
                </div>
              ))}
              <div className="flex items-center px-4 py-3.5" style={sep}>
                <span className="mr-3 flex-shrink-0 font-bold text-sm" style={{ color: subClr }}>@</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: labelClr }}>Username</p>
                  <input type="text" value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") })}
                    className={`w-full text-[14px] font-semibold bg-transparent outline-none ${isDark ? "text-white" : "text-gray-900"}`}
                    placeholder="your_handle" />
                </div>
              </div>
              <div className="flex items-center px-4 py-3.5" style={sep}>
                <span className="mr-3 flex-shrink-0 font-bold text-sm" style={{ color: subClr }}>₹</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: labelClr }}>UPI ID</p>
                  <input type="text" value={form.upiId} onChange={(e) => setForm({ ...form, upiId: e.target.value.trim() })}
                    className={`w-full text-[14px] font-semibold bg-transparent outline-none ${isDark ? "text-white" : "text-gray-900"}`}
                    placeholder="name@upi" />
                </div>
              </div>
            </div>

            <p className="text-[11px] font-bold uppercase tracking-[0.15em] mt-5 mb-2 px-1" style={{ color: labelClr }}>Security</p>
            <div className="rounded-2xl overflow-hidden" style={ss}>
              <div className="flex items-center px-4 py-3.5">
                <span className="mr-3 flex-shrink-0" style={{ color: subClr }}><FiLock size={13} /></span>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: labelClr }}>New Password</p>
                  <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className={`w-full text-[14px] font-semibold bg-transparent outline-none ${isDark ? "text-white" : "text-gray-900"}`}
                    placeholder="Leave blank to keep current" />
                </div>
              </div>
              {form.password && (
                <div className="flex items-center px-4 py-3.5" style={sep}>
                  <span className="mr-3 flex-shrink-0" style={{ color: subClr }}><FiLock size={13} /></span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: labelClr }}>
                      Current Password <span style={{ color: "#f87171" }}>*</span>
                    </p>
                    <input type="password" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                      className={`w-full text-[14px] font-semibold bg-transparent outline-none ${isDark ? "text-white" : "text-gray-900"}`}
                      placeholder="Required to change password" required />
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>

        {toast && (
          <div className={`fixed bottom-24 left-4 right-4 max-w-sm mx-auto z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl text-white text-sm font-bold pointer-events-none ${toast.type === "error" ? "bg-red-500" : "bg-green-500"}`}>
            {toast.type === "error" ? <FiX size={15} /> : <FiCheck size={15} />}
            {toast.msg}
          </div>
        )}
      </DesktopLayout>
    );
  }

  // ── MAIN PROFILE VIEW ──────────────────────────────────────────────
  return (
    <motion.div
      animate={{ opacity: loggingOut ? 0 : 1, scale: loggingOut ? 0.97 : 1 }}
      transition={{ duration: 0.35, ease: "easeInOut" }}
    >
    <DesktopLayout>
      <div className="max-w-lg mx-auto px-4 pt-4 pb-28 md:pb-6 md:max-w-3xl">

        {/* ── HERO CARD ─────────────────────────────────────── */}
        <div className="rounded-3xl overflow-hidden mb-6 relative" style={ss}>
          <div className="absolute top-0 left-0 right-0 h-24" style={{ background: `linear-gradient(135deg, ${theme.gradFrom}55, ${theme.gradTo}40)` }} />
          <div className="relative z-10 flex flex-col items-center pt-10 pb-6 px-5">
            {/* Avatar */}
            <div className="relative mb-3">
              <div className="p-[3px] rounded-full shadow-2xl" style={{ background: `linear-gradient(135deg, ${theme.gradFrom}, ${theme.gradTo})` }}>
                <div className="p-[2px] rounded-full" style={{ background: isDark ? "rgba(10,10,20,0.9)" : "rgba(255,255,255,0.9)" }}>
                  {avatar ? (
                    <img src={avatar} alt="avatar" className="h-20 w-20 rounded-full object-cover" />
                  ) : (
                    <div className="h-20 w-20 rounded-full flex items-center justify-center text-2xl font-black text-white" style={getGradientStyle(theme)}>
                      {user.name?.[0]?.toUpperCase() || "?"}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <h1 className="text-xl font-black tracking-tight" style={{ color: textClr }}>{user.name}</h1>
            {user.username && <p className="text-sm mt-0.5" style={{ color: subClr }}>@{user.username}</p>}
            {user.upiId && <p className="text-xs mt-0.5" style={{ color: subClr }}>{user.upiId}</p>}

            {/* Stats row */}
            <div className="flex items-center gap-6 mt-4 mb-5">
              <div className="text-center">
                <p className="text-lg font-black" style={{ color: textClr }}>{groups.length}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest mt-0.5" style={{ color: subClr }}>Groups</p>
              </div>
              <div className="h-8 w-px" style={{ background: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }} />
              <div className="text-center cursor-pointer" onClick={() => navigate("/friends")}>
                <p className="text-lg font-black" style={{ color: friendRequests.length > 0 ? theme.gradFrom : textClr }}>
                  {friendRequests.length > 0 ? `+${friendRequests.length}` : "–"}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-widest mt-0.5" style={{ color: subClr }}>Requests</p>
              </div>
              <div className="h-8 w-px" style={{ background: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }} />
              <div className="text-center">
                <p className="text-lg font-black">{categoryData.length > 0 ? (categoryData[0].icon || "💰") : "✦"}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest mt-0.5" style={{ color: subClr }}>Top Spend</p>
              </div>
            </div>

            {/* QR code */}
            <button onClick={() => setShowQR((v) => !v)}
              className="w-full py-2.5 rounded-2xl text-sm font-black tracking-wide active:scale-95 transition-all"
              style={{ background: isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.06)", color: textClr }}>
              {showQR ? "Hide QR Code" : "Share QR Code"}
            </button>
            {showQR && (
              <div className="mt-4 flex flex-col items-center gap-2">
                <div className="bg-white p-3.5 rounded-2xl shadow-2xl">
                  <QRCodeSVG value={`${APP_URL}/add-friend/${user.id}`} size={128} />
                </div>
                <p className="text-xs font-medium" style={{ color: subClr }}>Scan to add as friend</p>
              </div>
            )}
          </div>
        </div>

        {/* ── TAB BAR ─────────────────────────────────────── */}
        <div className="flex rounded-2xl overflow-hidden mb-5" style={ss}>
          {[
            { key: "account", label: "Account", icon: <FiUser size={13} /> },
            { key: "goals", label: "Goals", icon: <FiTarget size={13} /> },
            { key: "subscriptions", label: "Subs", icon: <FiRepeat size={13} /> },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setProfileTab(tab.key)}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold uppercase tracking-wide transition-all"
              style={{
                background: profileTab === tab.key
                  ? `linear-gradient(135deg, ${theme.gradFrom}22, ${theme.gradTo}18)`
                  : "transparent",
                color: profileTab === tab.key ? theme.gradFrom : subClr,
                borderBottom: profileTab === tab.key ? `2px solid ${theme.gradFrom}` : "2px solid transparent",
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* ── ACCOUNT TAB ────────────────────────────────────── */}
        {profileTab === "account" && (
          <>
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] mb-2 px-1" style={{ color: labelClr }}>Account</p>
            <div className="rounded-2xl overflow-hidden mb-5" style={ss}>
              <SettingsRow first icon={<FiEdit2 size={13} />} label="Edit Profile"
                sub="Name, username, UPI, password"
                onClick={() => { setEditing(true); }} />
              <SettingsRow icon={<FiUsers size={13} />} label="Add a Friend"
                sub={`${APP_URL}/add-friend/${user.id}`}
                onClick={() => {
                  const link = `${APP_URL}/add-friend/${user.id}`;
                  navigator.clipboard.writeText(link).then(() => showToast("Share link copied!"));
                }}
                right={
                  <span style={{ color: copied ? "#10b981" : labelClr }}>
                    {copied ? <FiCheck size={14} /> : <FiCopy size={14} />}
                  </span>
                } />
            </div>

            {(friendRequests.length > 0 || frLoading) && (
              <>
                <p className="text-[11px] font-bold uppercase tracking-[0.15em] mb-2 px-1 flex items-center gap-2" style={{ color: labelClr }}>
                  Friend Requests
                  <span className="px-1.5 py-0.5 rounded-full text-white text-[9px] font-black" style={getGradientStyle(theme)}>{friendRequests.length}</span>
                </p>
                <div className="rounded-2xl overflow-hidden mb-5" style={ss}>
                  {frLoading ? (
                    <div className="flex justify-center py-6">
                      <div className={`animate-spin rounded-full h-5 w-5 border-b-2 ${theme.spinner}`} />
                    </div>
                  ) : (
                    friendRequests.map((r, i) => (
                      <div key={r._id} className="flex items-center gap-3 px-4 py-3.5" style={i > 0 ? sep : {}}>
                        <div className="h-10 w-10 rounded-xl flex items-center justify-center text-white font-black flex-shrink-0" style={getGradientStyle(theme)}>
                          {r.requester?.name?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate" style={{ color: textClr }}>{r.requester?.name}</p>
                          <p className="text-xs truncate" style={{ color: subClr }}>{r.requester?.email}</p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button onClick={() => handleAcceptFR(r._id)} disabled={frAction === r._id}
                            className="h-9 w-9 rounded-xl flex items-center justify-center text-white shadow active:scale-90 transition" style={getGradientStyle(theme)}>
                            <FiCheck size={14} />
                          </button>
                          <button onClick={() => handleRejectFR(r._id)} disabled={frAction === r._id}
                            className="h-9 w-9 rounded-xl flex items-center justify-center active:scale-90 transition"
                            style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.4)" }}>
                            <FiX size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            <p className="text-[11px] font-bold uppercase tracking-[0.15em] mb-2 px-1" style={{ color: labelClr }}>Preferences</p>
            <div className="rounded-2xl overflow-hidden mb-5" style={ss}>
              <SettingsRow first
                icon={isDark ? <FiMoon size={13} style={{ color: "white" }} /> : <FiSun size={13} style={{ color: "white" }} />}
                label={isDark ? "Dark Mode" : "Light Mode"}
                sub="Switch appearance"
                onClick={toggleDarkMode}
                right={
                  <div className="relative h-[26px] w-[46px] rounded-full flex-shrink-0 transition-all duration-300"
                    style={{ background: isDark ? `linear-gradient(to right, ${theme.gradFrom}, ${theme.gradTo})` : "rgba(0,0,0,0.12)" }}>
                    <div className="absolute top-[3px] h-5 w-5 rounded-full bg-white shadow-md transition-all duration-300"
                      style={{ left: isDark ? "calc(100% - 23px)" : "3px" }} />
                  </div>
                }
              />
              <div className="px-4 py-4" style={sep}>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] mb-3" style={{ color: labelClr }}>Accent Color</p>
                <div className="flex gap-3 flex-wrap">
                  {Object.values(ACCENT_PRESETS).map((preset) => (
                    <button key={preset.key} onClick={() => saveAccent(preset.key)} title={preset.label}
                      className="relative h-9 w-9 rounded-full transition-all duration-200 active:scale-90"
                      style={{
                        background: `linear-gradient(135deg, ${preset.gradFrom}, ${preset.gradTo})`,
                        boxShadow: localAccent === preset.key ? `0 0 0 2.5px ${isDark ? "#ffffff" : "#000000"}, 0 0 0 4.5px ${preset.gradFrom}` : "none",
                        transform: localAccent === preset.key ? "scale(1.18)" : "scale(1)",
                      }}>
                      {localAccent === preset.key && <FiCheck size={12} className="absolute inset-0 m-auto text-white" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden mb-2"
              style={{ ...ss, border: isDark ? "1px solid rgba(239,68,68,0.18)" : "1px solid rgba(239,68,68,0.15)" }}>
              <SettingsRow first danger icon={<FiLogOut size={13} />} label="Sign Out" onClick={() => setShowLogoutConfirm(true)} right={null} />
            </div>
          </>
        )}

        {/* ── GOALS TAB ──────────────────────────────────────── */}
        {profileTab === "goals" && (
          <>
            <div className="flex items-center justify-between mb-3 px-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.15em]" style={{ color: labelClr }}>Savings Goals</p>
              <button onClick={() => setShowGoalForm(v => !v)}
                className="h-8 w-8 rounded-xl flex items-center justify-center text-white active:scale-90 transition"
                style={getGradientStyle(theme)}>
                <FiPlus size={14} />
              </button>
            </div>

            {/* New goal form */}
            <AnimatePresence>
              {showGoalForm && (
                <motion.form
                  onSubmit={handleCreateGoal}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="rounded-2xl overflow-hidden mb-4"
                  style={ss}
                >
                  <div className="p-3.5 space-y-2.5">
                    <input type="text" placeholder="Goal title (e.g. iPhone 17 Pro)" required
                      value={goalForm.title} onChange={e => setGoalForm({ ...goalForm, title: e.target.value })}
                      className={`w-full px-3 py-2.5 rounded-xl text-[13px] font-semibold outline-none ${isDark ? "text-white" : "text-gray-900"}`}
                      style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)" }} />
                    <div className="grid grid-cols-2 gap-2">
                      <input type="number" placeholder="Target ₹" required min="1"
                        value={goalForm.targetAmount} onChange={e => setGoalForm({ ...goalForm, targetAmount: e.target.value })}
                        className={`w-full px-3 py-2.5 rounded-xl text-[13px] font-semibold outline-none ${isDark ? "text-white" : "text-gray-900"}`}
                        style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)" }} />
                      <input type="number" placeholder="Budget/mo ₹" required min="1"
                        value={goalForm.monthlyBudget} onChange={e => setGoalForm({ ...goalForm, monthlyBudget: e.target.value })}
                        className={`w-full px-3 py-2.5 rounded-xl text-[13px] font-semibold outline-none ${isDark ? "text-white" : "text-gray-900"}`}
                        style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)" }} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.12em] mb-1.5 px-0.5" style={{ color: labelClr }}>Start &amp; End Date</p>
                      <BillingCalendar
                        selectedDate={goalForm.startDate}
                        rangeEnd={goalForm.deadline}
                        onSelectDate={(d) => {
                          const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                          if (!goalForm.startDate || (goalForm.startDate && goalForm.deadline)) {
                            setGoalForm({ ...goalForm, startDate: iso, deadline: "" });
                          } else {
                            const start = new Date(goalForm.startDate);
                            if (d >= start) {
                              setGoalForm({ ...goalForm, deadline: iso });
                            } else {
                              setGoalForm({ ...goalForm, startDate: iso, deadline: "" });
                            }
                          }
                        }}
                        mode="range"
                        theme={theme}
                        isDark={isDark}
                      />
                      {goalForm.startDate && (
                        <p className="text-[10px] mt-1.5 px-0.5 font-semibold" style={{ color: subClr }}>
                          {new Date(goalForm.startDate + "T00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          {goalForm.deadline ? ` → ${new Date(goalForm.deadline + "T00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}` : " — tap end date"}
                        </p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-0.5">
                      <button type="button" onClick={() => setShowGoalForm(false)}
                        className="py-2.5 rounded-xl text-[13px] font-bold transition active:scale-95"
                        style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", color: subClr }}>
                        Cancel
                      </button>
                      <button type="submit" disabled={goalSubmitting}
                        className="py-2.5 rounded-xl text-[13px] font-bold text-white transition active:scale-95"
                        style={{ ...getGradientStyle(theme), opacity: goalSubmitting ? 0.6 : 1 }}>
                        {goalSubmitting ? "Creating..." : "Create Goal"}
                      </button>
                    </div>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {goalsLoading ? (
              <div className="flex justify-center py-10">
                <div className={`animate-spin rounded-full h-6 w-6 border-b-2 ${theme.spinner}`} />
              </div>
            ) : goals.length === 0 ? (
              <div className="rounded-2xl py-12 flex flex-col items-center gap-2" style={ss}>
                <FiTarget size={28} style={{ color: subClr }} />
                <p className="text-sm font-semibold" style={{ color: subClr }}>No goals yet</p>
                <p className="text-xs" style={{ color: labelClr }}>Set a monthly budget and track your savings</p>
              </div>
            ) : (
              <div className="space-y-3">
                {goals.map((goal) => {
                  const progress = goal.targetAmount > 0 ? Math.min(1, (goal.savedAmount || 0) / goal.targetAmount) : 0;
                  const monthlySaved = Math.max(0, goal.monthlyBudget - totalSpent);
                  const daysLeft = goal.deadline ? Math.max(0, Math.ceil((new Date(goal.deadline) - new Date()) / 86400000)) : null;
                  const pct = Math.round(progress * 100);
                  // SVG ring values
                  const ringR = 34, ringC = 2 * Math.PI * ringR;
                  const ringGap = ringC * (1 - progress);
                  return (
                    <div key={goal._id} className="rounded-2xl overflow-hidden" style={ss}>
                      <div className="flex items-center gap-3.5 p-3.5">
                        {/* Circular progress ring */}
                        <div className="relative flex-shrink-0" style={{ width: 78, height: 78 }}>
                          <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                            {/* Track */}
                            <circle cx="40" cy="40" r={ringR} fill="none"
                              stroke={isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"} strokeWidth="5" />
                            {/* Progress arc */}
                            <motion.circle cx="40" cy="40" r={ringR} fill="none"
                              stroke={`url(#goalGrad-${goal._id})`} strokeWidth="5" strokeLinecap="round"
                              strokeDasharray={ringC}
                              initial={{ strokeDashoffset: ringC }}
                              animate={{ strokeDashoffset: ringGap }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                            />
                            <defs>
                              <linearGradient id={`goalGrad-${goal._id}`} x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor={theme.gradFrom} />
                                <stop offset="100%" stopColor={theme.gradTo} />
                              </linearGradient>
                            </defs>
                          </svg>
                          {/* Center text */}
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-[14px] font-black leading-none" style={{ color: theme.gradFrom }}>{pct}%</span>
                          </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1.5">
                            <p className="text-[13px] font-bold truncate" style={{ color: textClr }}>{goal.title}</p>
                            <button onClick={() => handleDeleteGoal(goal._id)}
                              className="h-6 w-6 rounded-md flex items-center justify-center flex-shrink-0 active:scale-90 transition"
                              style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)", color: "#ef4444" }}>
                              <FiTrash2 size={10} />
                            </button>
                          </div>
                          <p className="text-[10.5px] mt-0.5" style={{ color: subClr }}>
                            Required: {fmt(goal.targetAmount)}
                          </p>
                          <p className="text-[10.5px]" style={{ color: subClr }}>
                            Collect: <span style={{ color: theme.gradFrom, fontWeight: 700 }}>{fmt(goal.savedAmount || 0)}</span>
                          </p>
                          {daysLeft !== null && (
                            <p className="text-[10px] mt-0.5" style={{ color: labelClr }}>
                              {daysLeft}d remaining · {fmt(goal.monthlyBudget)}/mo
                            </p>
                          )}
                          <button onClick={() => handleUpdateSaved(goal)}
                            className="mt-1.5 px-3 py-1 rounded-lg text-[10px] font-bold text-white active:scale-95 transition"
                            style={getGradientStyle(theme)}>
                            +₹{Math.round(monthlySaved)} saved
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Monthly budget overview */}
            {goals.length > 0 && (
              <div className="rounded-2xl px-4 py-3.5 mt-3" style={ss}>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] mb-2" style={{ color: labelClr }}>This Month</p>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px]" style={{ color: subClr }}>Spent</p>
                    <p className="text-[15px] font-black" style={{ color: textClr }}>{fmt(totalSpent)}</p>
                  </div>
                  <div className="text-right min-w-0">
                    <p className="text-[11px]" style={{ color: subClr }}>Saved</p>
                    <p className="text-[15px] font-black" style={{ color: goals[0] ? (goals[0].monthlyBudget - totalSpent > 0 ? "#10b981" : "#ef4444") : textClr }}>
                      {fmt(Math.max(0, (goals[0]?.monthlyBudget || 0) - totalSpent))}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── SUBSCRIPTIONS TAB ──────────────────────────────── */}
        {profileTab === "subscriptions" && (
          <>
            <div className="flex items-center justify-between mb-3 px-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.15em]" style={{ color: labelClr }}>Subscriptions</p>
              <button onClick={() => { setSubStep("pick"); setSubSearch(""); setShowSubForm(v => !v); }}
                className="h-8 w-8 rounded-xl flex items-center justify-center text-white active:scale-90 transition"
                style={getGradientStyle(theme)}>
                <FiPlus size={14} />
              </button>
            </div>

            {/* New subscription — step 1: preset picker */}
            <AnimatePresence>
              {showSubForm && subStep === "pick" && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="rounded-2xl overflow-hidden mb-4"
                  style={ss}
                >
                  <div className="p-4 space-y-3">
                    <p className="text-xs font-bold" style={{ color: labelClr }}>Choose a service</p>
                    {/* Search */}
                    <input
                      type="text"
                      placeholder="Search…"
                      value={subSearch}
                      onChange={e => setSubSearch(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl text-sm font-semibold outline-none ${isDark ? "text-white" : "text-gray-900"}`}
                      style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)" }}
                    />
                    {/* Preset grid */}
                    <div className="grid grid-cols-3 gap-2">
                      {PRESET_SUBSCRIPTIONS
                        .filter(p => p.name.toLowerCase().includes(subSearch.toLowerCase()))
                        .map(preset => (
                          <button
                            key={preset.name}
                            type="button"
                            onClick={() => {
                              if (preset.name === "Custom") {
                                setSubForm({ name: "", amount: "", billingCycle: "monthly", nextBillingDate: "", color: "#6b7280", icon: "" });
                              } else {
                                setSubForm({ name: preset.name, amount: "", billingCycle: "monthly", nextBillingDate: "", color: preset.color, icon: preset.logo || preset.emoji || "" });
                              }
                              setSubStep("form");
                            }}
                            className="flex flex-col items-center gap-1.5 p-3 rounded-xl active:scale-95 transition"
                            style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)" }}
                          >
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                              style={{ background: preset.color }}>
                              {preset.logo
                                ? <img src={preset.logo} className="w-6 h-6 object-contain" alt={preset.label} />
                                : <span className="text-xl">{preset.emoji}</span>}
                            </div>
                            <span className="text-[10px] font-semibold text-center leading-tight" style={{ color: textClr }}>
                              {preset.label}
                            </span>
                          </button>
                        ))}
                    </div>
                    <button type="button" onClick={() => setShowSubForm(false)}
                      className="w-full py-2.5 rounded-xl text-sm font-bold transition active:scale-95 mt-1"
                      style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", color: subClr }}>
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* New subscription — step 2: fill in details */}
            <AnimatePresence>
              {showSubForm && subStep === "form" && (
                <motion.form
                  onSubmit={handleCreateSub}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="rounded-2xl overflow-hidden mb-4"
                  style={ss}
                >
                  <div className="p-4 space-y-3">
                    {/* Back button + service name */}
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => setSubStep("pick")}
                        className="h-8 w-8 rounded-lg flex items-center justify-center active:scale-90 transition"
                        style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", color: subClr }}>
                        <FiArrowLeft size={13} />
                      </button>
                      {subForm.icon?.startsWith('http')
                        ? <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: subForm.color }}>
                            <img src={subForm.icon} className="w-5 h-5 object-contain" alt={subForm.name} />
                          </div>
                        : <span className="text-xl">{subForm.icon || "💳"}</span>}
                      <span className="text-sm font-bold" style={{ color: textClr }}>{subForm.name || "Custom"}</span>
                    </div>
                    <input type="text" placeholder="Name" required
                      value={subForm.name} onChange={e => setSubForm({ ...subForm, name: e.target.value })}
                      className={`w-full px-3 py-2.5 rounded-xl text-sm font-semibold outline-none ${isDark ? "text-white" : "text-gray-900"}`}
                      style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)" }} />
                    <div className="flex gap-2">
                      <input type="number" placeholder="Amount ₹" required min="1"
                        value={subForm.amount} onChange={e => setSubForm({ ...subForm, amount: e.target.value })}
                        className={`flex-1 px-3 py-2.5 rounded-xl text-sm font-semibold outline-none ${isDark ? "text-white" : "text-gray-900"}`}
                        style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)" }} />
                      <select value={subForm.billingCycle} onChange={e => setSubForm({ ...subForm, billingCycle: e.target.value })}
                        className={`flex-1 px-3 py-2.5 rounded-xl text-sm font-semibold outline-none ${isDark ? "text-white" : "text-gray-900"}`}
                        style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)" }}>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </div>
                    <p className="text-[11px] font-semibold" style={{ color: subClr }}>
                      {subForm.nextBillingDate ? new Date(subForm.nextBillingDate + "T00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Pick date below ↓"}
                    </p>
                    <BillingCalendar
                      selectedDate={subForm.nextBillingDate}
                      onSelectDate={(d) => {
                        const yyyy = d.getFullYear();
                        const mm = String(d.getMonth() + 1).padStart(2, "0");
                        const dd = String(d.getDate()).padStart(2, "0");
                        setSubForm({ ...subForm, nextBillingDate: `${yyyy}-${mm}-${dd}` });
                      }}
                      billingCycle={subForm.billingCycle}
                      theme={theme}
                      isDark={isDark}
                      existingSubs={subscriptions}
                    />
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setShowSubForm(false)}
                        className="flex-1 py-2.5 rounded-xl text-sm font-bold transition active:scale-95"
                        style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", color: subClr }}>
                        Cancel
                      </button>
                      <button type="submit"
                        className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition active:scale-95"
                        style={getGradientStyle(theme)}>
                        Add Subscription
                      </button>
                    </div>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Monthly total */}
            {subscriptions.length > 0 && (
              <div className="rounded-2xl p-4 mb-4" style={ss}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: labelClr }}>Monthly Cost</p>
                    <p className="text-xl font-black mt-0.5" style={{ color: textClr }}>
                      {fmt(subscriptions.filter(s => s.active).reduce((sum, s) => {
                        const amt = s.amount || 0;
                        if (s.billingCycle === "weekly") return sum + amt * 4.33;
                        if (s.billingCycle === "quarterly") return sum + amt / 3;
                        if (s.billingCycle === "yearly") return sum + amt / 12;
                        return sum + amt;
                      }, 0))}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: labelClr }}>Active</p>
                    <p className="text-xl font-black mt-0.5" style={{ color: theme.gradFrom }}>
                      {subscriptions.filter(s => s.active).length}/{subscriptions.length}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {subsLoading ? (
              <div className="flex justify-center py-10">
                <div className={`animate-spin rounded-full h-6 w-6 border-b-2 ${theme.spinner}`} />
              </div>
            ) : subscriptions.length === 0 ? (
              <div className="rounded-2xl py-12 flex flex-col items-center gap-2" style={ss}>
                <FiRepeat size={28} style={{ color: subClr }} />
                <p className="text-sm font-semibold" style={{ color: subClr }}>No subscriptions</p>
                <p className="text-xs text-center px-8" style={{ color: labelClr }}>
                  Track your recurring payments — Netflix, Spotify, iCloud, etc.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {subscriptions.map((sub) => {
                  const nextDate = new Date(sub.nextBillingDate);
                  const daysUntil = Math.ceil((nextDate - new Date()) / 86400000);
                  const isOverdue = daysUntil < 0;
                  const isSoon = daysUntil >= 0 && daysUntil <= 3;
                  return (
                    <div key={sub._id} className="rounded-2xl overflow-hidden" style={{ ...ss, opacity: sub.active ? 1 : 0.5 }}>
                      <div className="flex items-center gap-3 p-4">
                        <div className="h-11 w-11 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                          style={{ background: sub.icon?.startsWith('http') ? (sub.color || '#444') : (isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)") }}>
                          {sub.icon?.startsWith('http')
                            ? <img src={sub.icon} className="w-6 h-6 object-contain" alt={sub.name} />
                            : (sub.icon || "💳")}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold truncate" style={{ color: textClr }}>{sub.name}</p>
                            {!sub.active && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                              style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", color: subClr }}>PAUSED</span>}
                          </div>
                          <p className="text-xs mt-0.5" style={{ color: isOverdue ? "#ef4444" : isSoon ? "#f59e0b" : subClr }}>
                            {sub.billingCycle} · {isOverdue ? `${Math.abs(daysUntil)}d overdue` : daysUntil === 0 ? "Due today" : `in ${daysUntil}d`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <p className="text-sm font-black" style={{ color: textClr }}>{fmt(sub.amount)}</p>
                          <div className="flex gap-1">
                            <button onClick={() => handleToggleSub(sub)}
                              className="h-8 w-8 rounded-lg flex items-center justify-center active:scale-90 transition"
                              style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)", color: sub.active ? "#10b981" : subClr }}>
                              {sub.active ? <FiCheck size={12} /> : <FiRepeat size={12} />}
                            </button>
                            <button onClick={() => handleDeleteSub(sub._id)}
                              className="h-8 w-8 rounded-lg flex items-center justify-center active:scale-90 transition"
                              style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)", color: "#ef4444" }}>
                              <FiTrash2 size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

      </div>

      {/* ── Logout confirmation modal ─────────────────────── */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div
            className="fixed inset-0 z-[9999] flex items-end justify-center pb-8 px-4"
            style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
            onClick={() => setShowLogoutConfirm(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
          >
            <motion.div
              className="w-full max-w-sm rounded-3xl overflow-hidden"
              style={{
                background: isDark ? "#1a1a24" : "#ffffff",
                border: isDark ? "1px solid rgba(255,255,255,0.10)" : "1px solid rgba(0,0,0,0.08)",
                boxShadow: "0 20px 60px rgba(0,0,0,0.40)",
              }}
              onClick={e => e.stopPropagation()}
              initial={{ opacity: 0, y: 60, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 340, damping: 28 }}
            >
            <div className="px-6 pt-6 pb-5">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: "rgba(239,68,68,0.12)" }}
              >
                <FiLogOut size={22} style={{ color: "#ef4444" }} />
              </div>
              <h3 className="text-base font-bold mb-1" style={{ color: isDark ? "#fff" : "#111" }}>
                Sign out?
              </h3>
              <p className="text-sm" style={{ color: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)" }}>
                You'll need to log in again to access your account.
              </p>
            </div>
            <div
              className="flex"
              style={{ borderTop: isDark ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(0,0,0,0.06)" }}
            >
              <button
                className="flex-1 py-4 text-sm font-semibold transition-colors"
                style={{ color: isDark ? "rgba(255,255,255,0.50)" : "rgba(0,0,0,0.45)" }}
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancel
              </button>
              <div style={{ width: 1, background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)" }} />
              <button
                className="flex-1 py-4 text-sm font-bold"
                style={{ color: "#ef4444" }}
                onClick={handleLogout}
              >
                Sign Out
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {toast && (
        <div className={`fixed bottom-24 left-4 right-4 max-w-sm mx-auto z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl text-white text-sm font-bold pointer-events-none ${toast.type === "error" ? "bg-red-500" : "bg-green-500"}`}>
          {toast.type === "error" ? <FiX size={15} /> : <FiCheck size={15} />}
          {toast.msg}
        </div>
      )}
    </DesktopLayout>
    </motion.div>
  );
}
