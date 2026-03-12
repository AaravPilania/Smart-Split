import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import BottomNav from "../components/BottomNav";
import {
  FiUser,
  FiMail,
  FiEdit2,
  FiUsers,
  FiCheck,
  FiX,
  FiClock,
  FiUpload,
  FiCopy,
  FiChevronDown,
  FiChevronUp,
  FiSun,
  FiMoon,
} from "react-icons/fi";
import { QRCodeSVG } from "qrcode.react";
import { API_URL, apiFetch, getUserId } from "../utils/api";
import { ACCENT_PRESETS, getGradientStyle, useTheme, toggleDarkMode } from "../utils/theme";

const APP_URL = import.meta.env.VITE_APP_URL || "https://thesmartsplit.netlify.app";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [groups, setGroups] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
  });
  const [avatar, setAvatar] = useState(localStorage.getItem("selectedAvatar") || "");
  const { theme, accentKey, isDark } = useTheme();
  const [localAccentKey, setLocalAccentKey] = useState(localStorage.getItem("accentColor") || "pink");
  const [idExpanded, setIdExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const navigate = useNavigate();

  const saveAccent = (key) => {
    setLocalAccentKey(key);
    localStorage.setItem("accentColor", key);
    window.dispatchEvent(new Event("theme-changed"));
  };

  const truncateId = (id) => {
    if (!id || id.length <= 12) return id;
    return `${id.slice(0, 6)}...${id.slice(-4)}`;
  };

  const copyId = () => {
    navigator.clipboard.writeText(user.id).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (ev) => saveAvatar(ev.target.result);
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const userIdStr = getUserId();
    if (!userIdStr) {
      navigate("/");
      return;
    }
    fetchProfile(userIdStr);
    fetchGroups(userIdStr);
    fetchPendingRequests(userIdStr);
  }, [navigate]);

  const fetchProfile = async (userId) => {
    try {
    const response = await apiFetch(`${API_URL}/auth/profile/${userId}`);
      if (!response.ok) throw new Error("Failed to fetch profile");
      const data = await response.json();
      setUser(data.user);
      setFormData({
        name: data.user.name || "",
        email: data.user.email || "",
        username: data.user.username || "",
        password: "",
      });
      const saved = localStorage.getItem("selectedAvatar");
      if (saved) setAvatar(saved);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const avatarOptions = [
    // Simple abstract SVG data URLs (tiny, inline)
    `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'><defs><linearGradient id='g' x1='0' x2='1' y1='0' y2='1'><stop stop-color='%23ec4899'/><stop offset='1' stop-color='%23f59e0b'/></linearGradient></defs><rect width='80' height='80' rx='16' fill='url(%23g)'/><circle cx='24' cy='24' r='10' fill='white' opacity='.2'/><circle cx='56' cy='56' r='14' fill='white' opacity='.2'/></svg>`,
    `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'><defs><radialGradient id='r' cx='.3' cy='.3'><stop offset='0' stop-color='%2363b3ed'/><stop offset='1' stop-color='%238b5cf6'/></radialGradient></defs><rect width='80' height='80' rx='16' fill='url(%23r)'/><path d='M0,50 C20,30 60,70 80,40 L80,80 L0,80 Z' fill='white' opacity='.15'/></svg>`,
    `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'><defs><linearGradient id='g2' x1='0' x2='1'><stop stop-color='%230ea5e9'/><stop offset='1' stop-color='%2322c55e'/></linearGradient></defs><rect width='80' height='80' rx='16' fill='url(%23g2)'/><g fill='white' opacity='.2'><rect x='10' y='10' width='12' height='12' rx='3'/><rect x='30' y='26' width='16' height='16' rx='4'/><rect x='54' y='12' width='10' height='10' rx='3'/><rect x='16' y='50' width='20' height='20' rx='6'/></g></svg>`,
    `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'><defs><linearGradient id='g3' x1='0' x2='1' y1='1' y2='0'><stop stop-color='%23ef4444'/><stop offset='1' stop-color='%233b82f6'/></linearGradient></defs><rect width='80' height='80' rx='16' fill='url(%23g3)'/><circle cx='40' cy='40' r='26' fill='white' opacity='.12'/><circle cx='40' cy='40' r='18' fill='white' opacity='.12'/></svg>`
  ];

  const saveAvatar = (value) => {
    setAvatar(value);
    if (value) localStorage.setItem("selectedAvatar", value);
    else localStorage.removeItem("selectedAvatar");
    // Notify other parts of the app (e.g., Navbar) to update immediately
    try {
      window.dispatchEvent(new Event("avatar-changed"));
    } catch {}
  };

  const fetchGroups = async (userId) => {
    try {
      const response = await apiFetch(`${API_URL}/groups?userId=${userId}`);
      if (!response.ok) throw new Error("Failed to fetch groups");
      const data = await response.json();
      setGroups(data.groups || []);
    } catch (error) {
      console.error("Error fetching groups:", error);
    }
  };

  const fetchPendingRequests = async (userId) => {
    try {
      const response = await apiFetch(`${API_URL}/requests/user/${userId}/requests`);
      if (!response.ok) throw new Error("Failed to fetch requests");
      const data = await response.json();
      // Filter only pending requests
      setPendingRequests(
        (data.requests || []).filter((r) => r.status === "pending")
      );
    } catch (error) {
      console.error("Error fetching requests:", error);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const userId = localStorage.getItem("userId");

    try {
      const updates = {};
      if (formData.name !== user.name) updates.name = formData.name;
      if (formData.email !== user.email) updates.email = formData.email;
      if (formData.username && formData.username !== user.username) updates.username = formData.username;
      if (formData.password) updates.password = formData.password;

      if (Object.keys(updates).length === 0) {
        setEditing(false);
        return;
      }

      const response = await apiFetch(`${API_URL}/auth/profile/${userId}`, {
        method: "PUT",
        body: JSON.stringify(updates),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to update");

      setUser(data.user);
      localStorage.setItem("user", JSON.stringify(data.user));
      setEditing(false);
      setFormData({ ...formData, password: "" });
      alert("Profile updated successfully!");
    } catch (error) {
      alert(error.message || "Failed to update profile");
    }
  };

  const handleApproveRequest = async (requestId) => {
    try {
      const response = await apiFetch(
        `${API_URL}/requests/request/${requestId}/approve`,
        { method: "POST" }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to approve");

      const userId = localStorage.getItem("userId");
      fetchPendingRequests(userId);
      fetchGroups(userId);
      alert("Request approved! You've been added to the group.");
    } catch (error) {
      alert(error.message || "Failed to approve request");
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      const response = await apiFetch(
        `${API_URL}/requests/request/${requestId}/reject`,
        { method: "POST" }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to reject");

      const userId = localStorage.getItem("userId");
      fetchPendingRequests(userId);
      alert("Request rejected");
    } catch (error) {
      alert(error.message || "Failed to reject request");
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />

      <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 pb-10">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            {avatar ? (
              <img src={avatar} alt="avatar" className="h-10 w-10 sm:h-12 sm:w-12 rounded-full border flex-shrink-0" />
            ) : (
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-xl flex-shrink-0">{user.name?.[0] || <FiUser />}</div>
            )}
            <div className="min-w-0">
              <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-1">Profile Settings</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Manage your account and group memberships</p>
            </div>
          </div>
        </div>

        {/* User ID / Username Display */}
        <div
          className="rounded-xl shadow-lg p-4 sm:p-6 mb-6 text-white"
          style={getGradientStyle(theme)}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              {user.username && (
                <p className="text-xl font-bold tracking-tight mb-1">@{user.username}</p>
              )}
              <p className="text-sm opacity-90 mb-2">Your User ID</p>
              {/* Truncated / expanded ID */}
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-bold font-mono text-base sm:text-lg break-all">
                  {idExpanded ? user.id : truncateId(user.id)}
                </p>
                <button
                  onClick={() => setIdExpanded((v) => !v)}
                  className="opacity-70 hover:opacity-100 transition"
                  title={idExpanded ? "Collapse" : "Show full ID"}
                >
                  {idExpanded ? <FiChevronUp /> : <FiChevronDown />}
                </button>
              </div>
              <p className="text-xs opacity-70 mt-1">
                Share this ID so others can add you to groups
              </p>
              {/* Actions */}
              <div className="flex gap-2 mt-3 flex-wrap">
                <button
                  onClick={copyId}
                  className="flex items-center gap-1.5 text-xs font-semibold bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition"
                >
                  {copied ? <FiCheck className="text-green-300" /> : <FiCopy />}
                  {copied ? "Copied!" : "Copy ID"}
                </button>
                <button
                  onClick={() => setShowQR((v) => !v)}
                  className="flex items-center gap-1.5 text-xs font-semibold bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition"
                >
                  {showQR ? "Hide QR" : "Show QR"}
                </button>
              </div>
              {/* QR Code */}
              {showQR && (
                <div className="mt-4 inline-block bg-white p-3 rounded-xl shadow">
                  <QRCodeSVG value={`${APP_URL}/add-friend/${user.id}`} size={120} />
                  <p className="text-center text-xs text-gray-500 mt-1">Scan to add as friend</p>
                </div>
              )}
            </div>
            <div className="bg-white/20 rounded-full p-3 flex-shrink-0">
              <FiUser className="text-2xl sm:text-4xl" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profile Information */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 sm:p-6 border dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">Profile Information</h3>
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="text-pink-500 hover:text-pink-600 flex items-center gap-1"
                >
                  <FiEdit2 /> Edit
                </button>
              )}
            </div>

            {editing ? (
              <form onSubmit={handleUpdateProfile}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Username
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">@</span>
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) =>
                          setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })
                        }
                        className="w-full pl-7 pr-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                        placeholder="your_username"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      New Password (leave blank to keep current)
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                      placeholder="••••••••"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(false);
                        setFormData({
                          name: user.name,
                          email: user.email,
                          username: user.username || "",
                          password: "",
                        });
                      }}
                      className="flex-1 px-4 py-2 border dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-pink-500 to-orange-400 text-white rounded-lg hover:opacity-90"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <FiUser className="text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                    <p className="font-semibold text-gray-800 dark:text-white">{user.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <FiMail className="text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                    <p className="font-semibold text-gray-800 dark:text-white">{user.email}</p>
                  </div>
                </div>

                {user.username && (
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 font-bold text-base leading-none">@</span>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Username</p>
                      <p className="font-semibold text-gray-800 dark:text-white">@{user.username}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Group Memberships */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 sm:p-6 border dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <FiUsers /> Your Groups ({groups.length})
            </h3>

            {groups.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                You're not a member of any groups yet
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {groups.map((group) => (
                  <div
                    key={group.id}
                    className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition cursor-pointer"
                    onClick={() => navigate(`/groups`)}
                  >
                    <p className="font-semibold text-gray-800 dark:text-white">{group.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {group.members?.length || 0} members
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Avatar Selection */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 sm:p-6 border dark:border-gray-700 mt-6">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-1">Profile Picture</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Choose an abstract avatar or upload your own photo</p>

          {/* Upload button */}
          <label className="inline-flex items-center gap-2 cursor-pointer text-white text-sm font-semibold px-4 py-2 rounded-lg shadow hover:opacity-90 transition mb-4" style={getGradientStyle(theme)}>
            <FiUpload />
            Upload Photo
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />
          </label>

          {/* Abstract presets */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {avatarOptions.map((opt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => saveAvatar(opt)}
                className={`p-1 rounded-xl border-2 transition ${avatar === opt ? "border-pink-500 scale-105" : "border-transparent hover:border-pink-300"}`}
                title="Select avatar"
              >
                <img src={opt} alt={`avatar ${idx+1}`} className="h-16 w-16 rounded-lg object-cover" />
              </button>
            ))}
            <button
              type="button"
              onClick={() => saveAvatar("")}
              className="p-1 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-red-400 dark:hover:border-red-500 transition group"
              title="Remove avatar"
            >
              <div className="h-16 w-16 rounded-lg flex flex-col items-center justify-center gap-1 text-gray-400 dark:text-gray-500 group-hover:text-red-500 dark:group-hover:text-red-400 transition-colors">
                <FiX className="text-xl group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-medium tracking-wide">Remove</span>
              </div>
            </button>
          </div>
        </div>

        {/* Display Settings — dark mode is in the top navbar */}
        {/* Accent Color */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 sm:p-6 border dark:border-gray-700 mt-6">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-1">Accent Color</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Changes the accent color throughout the entire app</p>
          <div className="flex gap-3 flex-wrap">
            {Object.values(ACCENT_PRESETS).map((preset) => (
              <button
                key={preset.key}
                type="button"
                onClick={() => saveAccent(preset.key)}
                title={preset.label}
                className={`h-10 w-10 rounded-full border-4 transition ${localAccentKey === preset.key ? "border-gray-800 dark:border-white scale-110" : "border-transparent hover:scale-105"}`}
                style={{ background: `linear-gradient(135deg, ${preset.gradFrom}, ${preset.gradTo})` }}
              />
            ))}
          </div>
        </div>

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 sm:p-6 border dark:border-gray-700 mt-6">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <FiClock /> Pending Group Requests ({pendingRequests.length})
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              You've requested to join these groups. Wait for approval.
            </p>
            <div className="space-y-3">
              {pendingRequests.map((request) => (
                <div
                  key={request.id}
                  className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-white">
                        {request.group_name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Created by {request.creator_name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Requested{" "}
                        {new Date(request.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-yellow-200 text-yellow-800 rounded-full text-xs font-semibold">
                      Pending
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Incoming Requests (requests to join groups you're admin of) */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 sm:p-6 border dark:border-gray-700 mt-6">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <FiUsers /> Incoming Requests
          </h3>
          <IncomingRequestsComponent userId={user.id} />
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

// Component for incoming requests (requests to groups where user is admin)
function IncomingRequestsComponent({ userId }) {
  const [requests, setRequests] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserGroups();
  }, [userId]);

  const fetchUserGroups = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/groups?userId=${userId}`);
      if (!response.ok) return;
      const data = await response.json();
      setGroups(data.groups || []);

      // Fetch requests for all groups where user is creator
      const allRequests = [];
      for (const group of data.groups || []) {
        if (group.createdBy?.id === userId) {
          try {
            const reqResponse = await fetch(
              `${API_URL}/requests/group/${group.id}/requests`
            );
            if (reqResponse.ok) {
              const reqData = await reqResponse.json();
              allRequests.push(
                ...(reqData.requests || []).map((r) => ({
                  ...r,
                  groupName: group.name,
                }))
              );
            }
          } catch (err) {
            console.error(`Error fetching requests for group ${group.id}:`, err);
          }
        }
      }
      setRequests(allRequests);
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    try {
      const response = await fetch(
        `${API_URL}/requests/request/${requestId}/approve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to approve");
      }
      fetchUserGroups();
      alert("Request approved!");
    } catch (error) {
      alert(error.message || "Failed to approve request");
    }
  };

  const handleReject = async (requestId) => {
    try {
      const response = await fetch(
        `${API_URL}/requests/request/${requestId}/reject`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to reject");
      }
      fetchUserGroups();
      alert("Request rejected");
    } catch (error) {
      alert(error.message || "Failed to reject request");
    }
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500 mx-auto"></div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
        <svg className="h-16 w-16 text-gray-200" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="32" cy="32" r="30" fill="currentColor" />
          <path d="M20 32h24M32 20v24" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
          <circle cx="32" cy="22" r="4" fill="white" opacity="0.6" />
          <circle cx="22" cy="38" r="4" fill="white" opacity="0.6" />
          <circle cx="42" cy="38" r="4" fill="white" opacity="0.6" />
        </svg>
        <p className="text-gray-600 font-medium">All caught up!</p>
        <p className="text-gray-400 text-sm max-w-xs">No pending join requests for your groups. When someone requests to join, you'll see it here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((request) => (
        <div
          key={request.id}
          className="p-4 bg-blue-50 border border-blue-200 rounded-lg"
        >
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-800">{request.name}</p>
              <p className="text-sm text-gray-600">{request.email}</p>
              <p className="text-xs text-gray-500 mt-1">
                Wants to join: <strong>{request.group_name}</strong>
              </p>
            </div>
            <div className="flex w-full sm:w-auto gap-2">
              <button
                onClick={() => handleApprove(request.id)}
                className="flex-1 sm:flex-none px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition flex items-center justify-center gap-1"
              >
                <FiCheck /> Approve
              </button>
              <button
                onClick={() => handleReject(request.id)}
                className="flex-1 sm:flex-none px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition flex items-center justify-center gap-1"
              >
                <FiX /> Reject
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

