import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiUserPlus, FiCheck, FiArrowLeft } from "react-icons/fi";
import { API_URL, apiFetch, getToken, getUserId } from "../utils/api";
import { useTheme, getGradientStyle } from "../utils/theme";

export default function AddFriend() {
  const { userId: recipientId } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const isLoggedIn = !!getToken();
  const myId = getUserId();

  useEffect(() => {
    if (!recipientId) return;
    // Fetch the target user's public profile
    fetch(`${API_URL}/auth/profile/${recipientId}`)
      .then((r) => r.json())
      .then((d) => setProfile(d.user || null))
      .catch(() => setError("User not found"))
      .finally(() => setLoading(false));
  }, [recipientId]);

  const handleSendRequest = async () => {
    if (!isLoggedIn) {
      navigate(`/?redirect=/add-friend/${recipientId}`);
      return;
    }
    if (myId === recipientId) {
      setError("That's your own QR code!");
      return;
    }
    setSending(true);
    setError("");
    try {
      const res = await apiFetch(`${API_URL}/friends/request/${recipientId}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setError(data.message); return; }
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#030712" }}>
      <div className="w-full max-w-sm">
        <button
          onClick={() => navigate(isLoggedIn ? "/friends" : "/")}
          className="flex items-center gap-1.5 text-sm text-gray-400 mb-6 hover:text-gray-200 transition"
        >
          <FiArrowLeft size={14} /> Back
        </button>

        <div className="rounded-3xl border border-gray-800 shadow-2xl p-8 text-center" style={{ background: "#111827" }}>
          {loading ? (
            <div className="py-8">
              <div className="h-8 w-8 rounded-full border-2 border-t-transparent animate-spin mx-auto" style={{ borderColor: theme.gradFrom, borderTopColor: "transparent" }} />
            </div>
          ) : !profile ? (
            <div className="py-4 text-gray-400">User not found.</div>
          ) : sent ? (
            <>
              <div className="h-16 w-16 rounded-full flex items-center justify-center text-white mx-auto mb-4 shadow-lg" style={getGradientStyle(theme)}>
                <FiCheck size={28} />
              </div>
              <h2 className="text-xl font-bold text-white mb-1">Request Sent!</h2>
              <p className="text-sm text-gray-400 mb-5">
                Once {profile.name} accepts, you'll be friends and can add each other to groups.
              </p>
              <button onClick={() => navigate(isLoggedIn ? "/friends" : "/")} className="px-6 py-2.5 rounded-xl text-white font-semibold text-sm shadow" style={getGradientStyle(theme)}>
                {isLoggedIn ? "Go to Friends" : "Open App"}
              </button>
            </>
          ) : (
            <>
              <div className="h-20 w-20 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4 shadow-lg" style={getGradientStyle(theme)}>
                {profile.name?.[0]?.toUpperCase() || "?"}
              </div>
              <h2 className="text-xl font-bold text-white mb-1">{profile.name}</h2>
              <p className="text-sm text-gray-500 mb-1">{profile.email}</p>
              <p className="text-xs text-gray-500 mb-6">wants to connect on Smart Split</p>

              {error && (
                <div className="mb-4 p-3 rounded-xl text-red-400 text-sm" style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)" }}>
                  {error}
                </div>
              )}

              <button
                onClick={handleSendRequest}
                disabled={sending}
                className="w-full py-3 rounded-xl text-white font-bold shadow-lg hover:shadow-xl hover:opacity-95 transition flex items-center justify-center gap-2 disabled:opacity-70"
                style={getGradientStyle(theme)}
              >
                {sending ? (
                  <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                ) : (
                  <FiUserPlus size={16} />
                )}
                {sending ? 'Sending…' : isLoggedIn ? "Send Friend Request" : "Sign in to Add Friend"}
              </button>

              {!isLoggedIn && (
                <p className="text-xs text-gray-500 mt-3">
                  You need a Smart Split account to add friends.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
