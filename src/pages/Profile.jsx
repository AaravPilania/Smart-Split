import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import BottomNav from "../components/BottomNav";
import {
  FiUser, FiMail, FiEdit2, FiCheck, FiX,
  FiCopy, FiChevronRight,
  FiSun, FiMoon, FiLogOut, FiCamera, FiLock, FiArrowLeft, FiUsers,
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
      <div className="min-h-screen" style={getPageBgStyle(theme, isDark)}>
        <Navbar />
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
        <BottomNav />
      </div>
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
      <div className="min-h-screen" style={getPageBgStyle(theme, isDark)}>
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

  // ── MAIN PROFILE VIEW ──────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={getPageBgStyle(theme, isDark)}>
      <Navbar />
      <div className="max-w-lg mx-auto px-4 pt-4 pb-28">

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

        {/* ── ACCOUNT SECTION ───────────────────────────────── */}
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

        {/* ── SOCIAL SECTION ────────────────────────────────── */}
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

        {/* ── PREFERENCES SECTION ───────────────────────────── */}
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

        {/* ── SIGN OUT ──────────────────────────────────────── */}
        <div className="rounded-2xl overflow-hidden mb-2"
          style={{ ...ss, border: isDark ? "1px solid rgba(239,68,68,0.18)" : "1px solid rgba(239,68,68,0.15)" }}>
          <SettingsRow first danger icon={<FiLogOut size={13} />} label="Sign Out" onClick={handleLogout} right={null} />
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
