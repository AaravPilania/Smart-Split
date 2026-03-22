import { useState, useEffect, useRef } from "react";
import Navbar from "../components/Navbar";
import BottomNav from "../components/BottomNav";
import {
  FiUserPlus, FiUserCheck, FiUserX, FiSearch, FiUsers,
  FiCheck, FiX, FiTrash2, FiMail, FiGrid,
} from "react-icons/fi";
import { QRCodeSVG } from "qrcode.react";
import { API_URL, apiFetch, getUserId } from "../utils/api";
import { useTheme, getGradientStyle } from "../utils/theme";

const APP_URL = import.meta.env.VITE_APP_URL || "https://thesmartsplit.pages.dev";

export default function Friends() {
  const { theme } = useTheme();
  const userId = getUserId();
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [searchEmail, setSearchEmail] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchWasUsername, setSearchWasUsername] = useState(false);
  const [activeTab, setActiveTab] = useState("friends"); // friends | requests | add
  const [loading, setLoading] = useState(true);
  const [showMyQR, setShowMyQR] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const debounceRef = useRef(null);

  const myQRValue = `${APP_URL}/add-friend/${userId}`;

  useEffect(() => {
    fetchAll();
  }, []);

  // Live debounced search — fires 400ms after user stops typing (min 2 chars)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = searchEmail.trim();
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    debounceRef.current = setTimeout(() => runSearch(q), 400);
    return () => clearTimeout(debounceRef.current);
  }, [searchEmail]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchFriends(), fetchRequests()]);
    setLoading(false);
  };

  const fetchFriends = async () => {
    try {
      const res = await apiFetch(`${API_URL}/friends`);
      if (res.ok) {
        const data = await res.json();
        setFriends(data.friends || []);
      }
    } catch {}
  };

  const fetchRequests = async () => {
    try {
      const res = await apiFetch(`${API_URL}/friends/requests`);
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
    } catch {}
  };

  const runSearch = async (q) => {
    const isUsername = q.startsWith('@');
    setSearchWasUsername(isUsername);
    setSearching(true);
    try {
      const param = isUsername
        ? `q=${encodeURIComponent(q)}`
        : `email=${encodeURIComponent(q)}`;
      const res = await apiFetch(`${API_URL}/users/search?${param}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults((data.users || []).filter((u) => u._id !== userId && u.id !== userId));
      }
    } finally {
      setSearching(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchEmail.trim()) return;
    runSearch(searchEmail.trim());
  };

  const sendRequest = async (recipientId) => {
    setActionLoading(recipientId);
    try {
      const res = await apiFetch(`${API_URL}/friends/request/${recipientId}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) { alert(data.message); return; }
      alert("Friend request sent!");
      setSearchResults((prev) => prev.filter((u) => (u._id || u.id) !== recipientId));
    } finally {
      setActionLoading(null);
    }
  };

  const acceptRequest = async (friendshipId) => {
    setActionLoading(friendshipId);
    try {
      const res = await apiFetch(`${API_URL}/friends/accept/${friendshipId}`, { method: "PATCH" });
      if (res.ok) { await fetchAll(); }
    } finally {
      setActionLoading(null);
    }
  };

  const rejectRequest = async (friendshipId) => {
    setActionLoading(friendshipId);
    try {
      const res = await apiFetch(`${API_URL}/friends/reject/${friendshipId}`, { method: "PATCH" });
      if (res.ok) { await fetchRequests(); }
    } finally {
      setActionLoading(null);
    }
  };

  const removeFriend = async (friendId) => {
    if (!confirm("Remove this friend?")) return;
    try {
      await apiFetch(`${API_URL}/friends/${friendId}`, { method: "DELETE" });
      setFriends((prev) => prev.filter((f) => f.id !== friendId));
    } catch {}
  };

  const tabs = [
    { id: "friends", label: "Friends", count: friends.length, icon: <FiUsers size={15} /> },
    { id: "requests", label: "Requests", count: requests.length, icon: <FiUserPlus size={15} /> },
    { id: "add", label: "Add", icon: <FiSearch size={15} /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <BottomNav />

      <div className="max-w-2xl mx-auto px-4 py-6 pb-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Friends</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Add friends and split expenses together</p>
          </div>
          <button
            onClick={() => setShowMyQR((v) => !v)}
            className="h-10 w-10 rounded-xl flex items-center justify-center text-white shadow-md hover:shadow-lg transition"
            style={getGradientStyle(theme)}
            title="My QR Code"
          >
            <FiGrid size={18} />
          </button>
        </div>

        {/* My QR panel */}
        {showMyQR && userId && (
          <div className="mb-5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm flex flex-col sm:flex-row items-center gap-5">
            <div className="bg-white p-3 rounded-2xl shadow border border-gray-100">
              <QRCodeSVG value={myQRValue} size={140} />
            </div>
            <div>
              <p className="font-semibold text-gray-800 dark:text-white text-sm mb-1">Your Friend QR</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-[220px]">
                Others scan this to send you a friend request. Works with any QR scanner — it opens smartsplit directly.
              </p>
              <button
                onClick={() => navigator.clipboard.writeText(myQRValue).then(() => alert("Link copied!"))}
                className="mt-3 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-white"
                style={getGradientStyle(theme)}
              >
                Copy Link
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-2xl p-1 mb-5 gap-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === t.id
                  ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              {t.icon}
              {t.label}
              {t.count > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white" style={getGradientStyle(theme)}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: theme.gradFrom, borderTopColor: "transparent" }} />
          </div>
        ) : (
          <>
            {/* Friends tab */}
            {activeTab === "friends" && (
              <div className="space-y-2">
                {friends.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 dark:text-gray-500">
                    <FiUsers size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No friends yet</p>
                    <p className="text-sm mt-1">Search by email or share your QR to connect</p>
                  </div>
                ) : (
                  friends.map((f) => (
                    <div key={f.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0" style={getGradientStyle(theme)}>
                        {f.name?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 dark:text-white text-sm truncate">{f.name}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{f.email}</p>
                      </div>
                      <button
                        onClick={() => removeFriend(f.id)}
                        className="h-8 w-8 rounded-xl flex items-center justify-center text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                        title="Remove friend"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Requests tab */}
            {activeTab === "requests" && (
              <div className="space-y-2">
                {requests.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 dark:text-gray-500">
                    <FiUserPlus size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No pending requests</p>
                  </div>
                ) : (
                  requests.map((r) => (
                    <div key={r._id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0" style={getGradientStyle(theme)}>
                        {r.requester?.name?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 dark:text-white text-sm truncate">{r.requester?.name}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{r.requester?.email}</p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => acceptRequest(r._id)}
                          disabled={actionLoading === r._id}
                          className="h-8 w-8 rounded-xl flex items-center justify-center text-white shadow transition"
                          style={getGradientStyle(theme)}
                          title="Accept"
                        >
                          <FiCheck size={14} />
                        </button>
                        <button
                          onClick={() => rejectRequest(r._id)}
                          disabled={actionLoading === r._id}
                          className="h-8 w-8 rounded-xl flex items-center justify-center text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                          title="Reject"
                        >
                          <FiX size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Add tab */}
            {activeTab === "add" && (
              <div>
                <form onSubmit={handleSearch} className="flex gap-2 mb-4">
                  <input
                    type="text"
                    placeholder="Search by email or @username..."
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-2 text-sm placeholder-gray-400"
                  />
                  <button
                    type="submit"
                    disabled={searching}
                    className="px-4 py-2.5 rounded-xl text-white font-semibold text-sm shadow hover:shadow-md transition"
                    style={getGradientStyle(theme)}
                  >
                    {searching ? "..." : "Search"}
                  </button>
                </form>

                {searchResults.length > 0 && (
                  <div className="space-y-2">
                    {searchResults.map((u) => {
                      const uid = u._id || u.id;
                      return (
                        <div key={uid} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0" style={getGradientStyle(theme)}>
                            {u.name?.[0]?.toUpperCase() || "?"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-800 dark:text-white text-sm truncate">{u.name}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{u.email}</p>
                          </div>
                          <button
                            onClick={() => sendRequest(uid)}
                            disabled={actionLoading === uid}
                            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl text-white shadow transition"
                            style={getGradientStyle(theme)}
                          >
                            <FiUserPlus size={12} />
                            Add
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {searchResults.length === 0 && searchEmail && !searching && (
                  <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                    <FiMail size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">
                      {searchWasUsername
                        ? `No user found with username "${searchEmail}"`
                        : `No user found with email "${searchEmail}"`}
                    </p>
                  </div>
                )}

                <div className="mt-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 text-center">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Or share your QR code</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">Anyone who scans it can send you a friend request</p>
                  <button
                    onClick={() => setShowMyQR((v) => !v)}
                    className="px-4 py-2 rounded-xl text-white font-semibold text-sm shadow"
                    style={getGradientStyle(theme)}
                  >
                    {showMyQR ? "Hide" : "Show"} My QR
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
