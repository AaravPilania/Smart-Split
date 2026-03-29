import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import BottomNav from "../components/BottomNav";
import InsightsPanel from "../components/InsightsPanel";
import {
  FiUser, FiMail, FiEdit2, FiUsers, FiCheck, FiX,
  FiUserPlus, FiUpload, FiCopy, FiChevronDown, FiChevronRight,
  FiSun, FiMoon, FiLogOut, FiCamera, FiLock,
} from "react-icons/fi";
import { QRCodeSVG } from "qrcode.react";
import { API_URL, apiFetch, getUserId } from "../utils/api";
import {
  ACCENT_PRESETS,
  getGradientStyle,
  getPageBgStyle,
  useTheme,
  toggleDarkMode,
} from "../utils/theme";
import { computeInsights } from "../utils/insights";
import { detectCategory, getCategoryInfo } from "../utils/categories";

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
  background: isDark ? "rgba(255,255,255,0.06)" : "#ffffff",
  border: isDark ? "1px solid rgba(255,255,255,0.085)" : "1px solid rgba(0,0,0,0.07)",
  boxShadow: isDark ? "0 4px 28px rgba(0,0,0,0.35)" : "0 2px 14px rgba(0,0,0,0.06)",
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

  const fetchProfile = async (uid) => {
    try {
      const res = await apiFetch(`${API_URL}/auth/profile/${uid}`);
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
      const res = await apiFetch(`${API_URL}/groups?userId=${uid}`);
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
    } catch {}
    setIFetched(true);
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
      setEditing(false);
      setForm((f) => ({ ...f, password: "", currentPassword: "" }));
      showToast("Profile updated!");
    } catch (err) {
      showToast(err.message || "Failed to update", "error");
    }
  };

  const handleLogout = () => { localStorage.clear(); navigate("/"); };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={getPageBgStyle(theme, isDark)}>
        <div className={`animate-spin rounded-full h-10 w-10 border-b-2 ${theme.spinner}`} />
      </div>
    );
  }

  const ss = sectionSty(isDark);
  const sep = sepSty(isDark);
  const labelClr = isDark ? "rgba(255,255,255,0.36)" : "rgba(0,0,0,0.38)";
  const textClr = isDark ? "#ffffff" : "#0f0f1a";
  const subClr = isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)";

  return (
    <div className="min-h-screen" style={getPageBgStyle(theme, isDark)}>
      <Navbar />
      <div className="max-w-lg mx-auto px-4 pt-3 pb-28">

        {/* HERO CARD */}
        <div className="rounded-3xl overflow-hidden mb-5 relative" style={ss}>
          <div className="absolute top-0 left-0 right-0 h-28" style={{ background: `linear-gradient(135deg, ${theme.gradFrom}55, ${theme.gradTo}40)` }} />
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
              <label className="absolute -bottom-0.5 -right-0.5 h-7 w-7 rounded-full flex items-center justify-center cursor-pointer shadow-lg text-white" style={getGradientStyle(theme)}>
                <FiCamera size={12} />
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </label>
            </div>

            {/* Name + handle */}
            <h1 className="text-xl font-black tracking-tight leading-tight" style={{ color: textClr }}>{user.name}</h1>
            {user.username && <p className="text-sm font-semibold mt-0.5" style={{ color: subClr }}>@{user.username}</p>}

            {/* Stats row */}
            <div className="flex items-center gap-5 mt-4 mb-5">
              <div className="text-center">
                <p className="text-lg font-black leading-tight" style={{ color: textClr }}>{groups.length}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest mt-0.5" style={{ color: subClr }}>Groups</p>
              </div>
              <div className="h-8 w-px" style={{ background: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }} />
              <div className="text-center cursor-pointer" onClick={() => navigate("/friends")}>
                <p className="text-lg font-black leading-tight" style={{ color: friendRequests.length > 0 ? theme.gradFrom : textClr }}>
                  {friendRequests.length > 0 ? `+${friendRequests.length}` : "–"}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-widest mt-0.5" style={{ color: subClr }}>Requests</p>
              </div>
              <div className="h-8 w-px" style={{ background: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }} />
              <div className="text-center">
                <p className="text-lg font-black leading-tight">{categoryData.length > 0 ? (categoryData[0].icon || "💰") : "✦"}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest mt-0.5" style={{ color: subClr }}>Top Spend</p>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-2.5 w-full">
              <button onClick={() => setEditing(true)} disabled={editing}
                className="flex-1 py-2.5 rounded-2xl text-sm font-black tracking-wide text-white active:scale-95 transition-all disabled:opacity-50"
                style={getGradientStyle(theme)}>
                Edit Profile
              </button>
              <button onClick={() => setShowQR((v) => !v)}
                className="px-5 py-2.5 rounded-2xl text-sm font-black tracking-wide active:scale-95 transition-all"
                style={{ background: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.07)", color: textClr }}>
                {showQR ? "Hide QR" : "QR Code"}
              </button>
            </div>

            {showQR && (
              <div className="mt-5 flex flex-col items-center gap-2">
                <div className="bg-white p-3.5 rounded-2xl shadow-2xl">
                  <QRCodeSVG value={`${APP_URL}/add-friend/${user.id}`} size={128} />
                </div>
                <p className="text-xs font-medium" style={{ color: subClr }}>Scan to add as friend</p>
              </div>
            )}
          </div>
        </div>

        {/* PERSONAL INFO */}
        <p className="text-[11px] font-bold uppercase tracking-[0.15em] mb-2 px-1" style={{ color: labelClr }}>Personal Info</p>
        <div className="rounded-2xl overflow-hidden mb-5" style={ss}>
          {!editing ? (
            <>
              {[
                { icon: <FiUser size={14} />, label: "Name", value: user.name },
                { icon: <FiMail size={14} />, label: "Email", value: user.email },
                ...(user.username ? [{ icon: <span className="font-bold text-sm leading-none">@</span>, label: "Username", value: `@${user.username}` }] : []),
                ...(user.upiId ? [{ icon: <span className="font-bold text-sm leading-none">₹</span>, label: "UPI ID", value: user.upiId }] : []),
              ].map((row, i) => (
                <div key={i} className="flex items-center px-4 py-3.5" style={i > 0 ? sep : {}}>
                  <span className="flex-shrink-0 mr-3.5 w-4 flex items-center justify-center" style={{ color: subClr }}>{row.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: labelClr }}>{row.label}</p>
                    <p className="text-sm font-semibold truncate" style={{ color: textClr }}>{row.value}</p>
                  </div>
                  {i === 0 && (
                    <button onClick={() => setEditing(true)} className="flex-shrink-0 ml-2 active:opacity-50" style={{ color: labelClr }}>
                      <FiEdit2 size={14} />
                    </button>
                  )}
                </div>
              ))}
              <div className="flex items-center px-4 py-3.5" style={sep}>
                <span className="flex-shrink-0 mr-3.5 w-4 font-mono text-xs text-center" style={{ color: subClr }}>#</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: labelClr }}>User ID</p>
                  <p className="text-xs font-mono truncate" style={{ color: subClr }}>{truncateId(user.id)}</p>
                </div>
                <button onClick={copyId} className="flex-shrink-0 ml-2 active:scale-90 transition" style={{ color: copied ? "#10b981" : labelClr }}>
                  {copied ? <FiCheck size={14} /> : <FiCopy size={14} />}
                </button>
              </div>
            </>
          ) : (
            <form onSubmit={handleUpdate} className="p-4 space-y-3.5">
              {[
                { key: "name", label: "Name", type: "text", ph: "" },
                { key: "email", label: "Email", type: "email", ph: "" },
              ].map(({ key, label, type }) => (
                <div key={key}>
                  <label className="block text-[10px] font-bold uppercase tracking-[0.14em] mb-1.5" style={{ color: labelClr }}>{label}</label>
                  <input type={type} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-medium outline-none ${isDark ? "text-white" : "text-gray-900"}`}
                    style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)" }} />
                </div>
              ))}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.14em] mb-1.5" style={{ color: labelClr }}>Username</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-sm" style={{ color: subClr }}>@</span>
                  <input type="text" value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") })}
                    className={`w-full py-2.5 rounded-xl text-sm font-medium outline-none ${isDark ? "text-white" : "text-gray-900"}`}
                    style={{ paddingLeft: "1.9rem", paddingRight: "0.875rem", background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)" }}
                    placeholder="your_handle" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.14em] mb-1.5" style={{ color: labelClr }}>UPI ID</label>
                <input type="text" value={form.upiId} onChange={(e) => setForm({ ...form, upiId: e.target.value.trim() })}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-medium outline-none ${isDark ? "text-white" : "text-gray-900"}`}
                  style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)" }} placeholder="name@upi" />
              </div>
              <div style={{ borderTop: isDark ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(0,0,0,0.05)", paddingTop: "0.5rem" }}>
                <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] mb-1.5 mt-1" style={{ color: labelClr }}>
                  <FiLock size={11} /> New Password
                </label>
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-medium outline-none ${isDark ? "text-white" : "text-gray-900"}`}
                  style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)" }} placeholder="Leave blank to keep current" />
              </div>
              {form.password && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[0.14em] mb-1.5" style={{ color: labelClr }}>
                    Current Password <span style={{ color: "#f87171" }}>*</span>
                  </label>
                  <input type="password" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-medium outline-none ${isDark ? "text-white" : "text-gray-900"}`}
                    style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)" }} placeholder="Required to change password" required />
                </div>
              )}
              <div className="flex gap-2.5 pt-1">
                <button type="button"
                  onClick={() => { setEditing(false); setForm({ name: user.name, email: user.email, username: user.username||"", upiId: user.upiId||"", password: "", currentPassword: "" }); }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold active:scale-95 transition-all"
                  style={{ background: isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.06)", color: textClr }}>
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl text-sm font-black text-white active:scale-95 transition-all" style={getGradientStyle(theme)}>
                  Save Changes
                </button>
              </div>
            </form>
          )}
        </div>

        {/* SPENDING INSIGHTS */}
        <p className="text-[11px] font-bold uppercase tracking-[0.15em] mb-2 px-1" style={{ color: labelClr }}>Spending Insights</p>
        <div className="rounded-2xl overflow-hidden mb-5" style={ss}>
          <button onClick={() => { fetchInsightsData(); setInsightsOpen((o) => !o); }} className="w-full flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-2.5">
              <span className="text-base leading-none">✦</span>
              <span className="text-sm font-bold" style={{ color: textClr }}>
                {categoryData.length > 0 ? `Top: ${categoryData[0].label}` : "View your spending patterns"}
              </span>
            </div>
            <FiChevronDown size={16} className="transition-transform duration-300"
              style={{ transform: insightsOpen ? "rotate(180deg)" : "rotate(0deg)", color: subClr }} />
          </button>
          {insightsOpen && (
            <div className="px-4 pb-5 space-y-4" style={sep}>
              {categoryData.length === 0 ? (
                <p className="text-sm text-center py-4" style={{ color: subClr }}>No expense data yet</p>
              ) : (
                <>
                  <div className="space-y-2.5 pt-3">
                    {categoryData.slice(0, 5).map((cat, i) => {
                      const total = categoryData.reduce((s, c) => s + c.amount, 0);
                      const pct = ((cat.amount / total) * 100).toFixed(0);
                      return (
                        <div key={cat.key} className="flex items-center gap-2.5">
                          <span className="text-sm flex-shrink-0 leading-none">{cat.icon || "💰"}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="font-semibold truncate" style={{ color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.65)" }}>{cat.label || cat.key}</span>
                              <span className="ml-2 flex-shrink-0" style={{ color: subClr }}>{pct}%</span>
                            </div>
                            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.07)" }}>
                              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: CAT_COLORS[i % CAT_COLORS.length] }} />
                            </div>
                          </div>
                          <span className="text-xs font-bold flex-shrink-0 ml-1 tabular-nums" style={{ color: isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.5)" }}>
                            {fmt(cat.amount)}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {monthlyData.some((m) => m.amount > 0) && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-2" style={{ color: labelClr }}>Monthly Trend</p>
                      <div className="flex items-end gap-1.5 h-14">
                        {monthlyData.map((m, i) => {
                          const max = Math.max(...monthlyData.map((d) => d.amount), 1);
                          return (
                            <div key={i} className="flex-1 flex flex-col items-center justify-end gap-0.5 h-full">
                              <div className="w-full rounded-sm transition-all duration-700" style={{
                                height: `${Math.max((m.amount / max) * 100, 4)}%`,
                                background: m.isCurrent ? `linear-gradient(to top, ${theme.gradFrom}, ${theme.gradTo})` : isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)",
                              }} />
                              <span className="text-[8px] font-bold" style={{ color: subClr }}>{m.label[0]}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {insights.length > 0 && (
                    <div className="pt-1">
                      <InsightsPanel insights={insights.slice(0, 3)} />
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* APPEARANCE */}
        <p className="text-[11px] font-bold uppercase tracking-[0.15em] mb-2 px-1" style={{ color: labelClr }}>Appearance</p>
        <div className="rounded-2xl overflow-hidden mb-5" style={ss}>
          <button onClick={toggleDarkMode} className="w-full flex items-center px-4 py-4 active:opacity-60 transition-opacity">
            {isDark ? <FiMoon size={16} className="mr-3.5 flex-shrink-0" style={{ color: "#818cf8" }} /> : <FiSun size={16} className="mr-3.5 flex-shrink-0" style={{ color: "#f59e0b" }} />}
            <span className="flex-1 text-sm font-semibold text-left" style={{ color: textClr }}>{isDark ? "Dark Mode" : "Light Mode"}</span>
            <div className="relative h-[26px] w-[46px] rounded-full flex-shrink-0 transition-all duration-300"
              style={{ background: isDark ? `linear-gradient(to right, ${theme.gradFrom}, ${theme.gradTo})` : "rgba(0,0,0,0.12)" }}>
              <div className="absolute top-[3px] h-5 w-5 rounded-full bg-white shadow-md transition-all duration-300"
                style={{ left: isDark ? "calc(100% - 23px)" : "3px" }} />
            </div>
          </button>
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

        {/* PROFILE PHOTO */}
        <p className="text-[11px] font-bold uppercase tracking-[0.15em] mb-2 px-1" style={{ color: labelClr }}>Profile Photo</p>
        <div className="rounded-2xl overflow-hidden mb-5 p-4" style={ss}>
          <label className="inline-flex items-center gap-2 cursor-pointer text-white text-xs font-black px-3.5 py-2 rounded-xl shadow-md transition active:scale-95 mb-4" style={getGradientStyle(theme)}>
            <FiUpload size={13} />
            Upload Photo
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
          </label>
          <div className="grid grid-cols-5 gap-2">
            {avatarOptions.map((opt, idx) => (
              <button key={idx} onClick={() => saveAvatar(opt)} className="rounded-xl overflow-hidden transition-all active:scale-90"
                style={{
                  padding: "2px",
                  background: avatar === opt ? `linear-gradient(135deg, ${theme.gradFrom}, ${theme.gradTo})` : "transparent",
                  boxShadow: avatar === opt ? `0 4px 16px ${theme.gradFrom}40` : "none",
                }}>
                <img src={opt} alt={`avatar ${idx + 1}`} className="h-12 w-12 rounded-lg object-cover" />
              </button>
            ))}
            <button onClick={() => saveAvatar("")}
              className="h-[52px] rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition active:scale-90"
              style={{ borderColor: isDark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.1)" }}>
              <FiX size={13} style={{ color: subClr }} />
              <span className="text-[8px] font-bold" style={{ color: subClr }}>Reset</span>
            </button>
          </div>
        </div>

        {/* YOUR GROUPS */}
        {groups.length > 0 && (
          <>
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] mb-2 px-1" style={{ color: labelClr }}>Your Groups</p>
            <div className="rounded-2xl overflow-hidden mb-5" style={ss}>
              <button onClick={() => setGroupsOpen((o) => !o)} className="w-full flex items-center px-4 py-4">
                <FiUsers size={15} className="mr-3.5 flex-shrink-0" style={{ color: subClr }} />
                <span className="flex-1 text-sm font-semibold text-left" style={{ color: textClr }}>
                  {groups.length} Group{groups.length !== 1 ? "s" : ""}
                </span>
                <FiChevronDown size={15} className="transition-transform duration-200"
                  style={{ transform: groupsOpen ? "rotate(180deg)" : "rotate(0deg)", color: subClr }} />
              </button>
              {groupsOpen && (
                <div style={sep}>
                  {groups.map((g, i) => (
                    <button key={g.id} onClick={() => navigate("/groups")}
                      className="w-full flex items-center px-4 py-3 active:opacity-60 transition-opacity" style={i > 0 ? sep : {}}>
                      <div className="h-8 w-8 rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0 mr-3" style={getGradientStyle(theme)}>
                        {g.name?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: textClr }}>{g.name}</p>
                        <p className="text-xs" style={{ color: subClr }}>{g.members?.length || 0} members</p>
                      </div>
                      <FiChevronRight size={14} style={{ color: isDark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.22)" }} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* FRIEND REQUESTS */}
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

        {/* SIGN OUT */}
        <div className="rounded-2xl overflow-hidden mb-2"
          style={{ ...ss, border: isDark ? "1px solid rgba(239,68,68,0.18)" : "1px solid rgba(239,68,68,0.15)" }}>
          <button onClick={handleLogout} className="w-full flex items-center px-4 py-4 active:opacity-60 transition-opacity">
            <FiLogOut size={16} className="mr-3.5 text-red-400 flex-shrink-0" />
            <span className="text-sm font-bold text-red-400">Sign Out</span>
          </button>
        </div>

      </div>

      <BottomNav />

      {toast && (
        <div className={`fixed bottom-24 left-4 right-4 max-w-sm mx-auto z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl text-white text-sm font-bold pointer-events-none ${toast.type === "error" ? "bg-red-500" : "bg-green-500"}`}>
          {toast.type === "error" ? <FiX size={15} /> : <FiCheck size={15} />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
