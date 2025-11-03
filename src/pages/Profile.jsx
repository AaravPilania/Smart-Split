import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import {
  FiUser,
  FiMail,
  FiEdit2,
  FiUsers,
  FiCheck,
  FiX,
  FiClock,
} from "react-icons/fi";

const API_URL = "http://localhost:5000/api";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [groups, setGroups] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const navigate = useNavigate();

  useEffect(() => {
    const userIdStr = localStorage.getItem("userId");
    if (!userIdStr) {
      navigate("/");
      return;
    }
    fetchProfile(parseInt(userIdStr));
    fetchGroups(parseInt(userIdStr));
    fetchPendingRequests(parseInt(userIdStr));
  }, [navigate]);

  const fetchProfile = async (userId) => {
    try {
      const response = await fetch(`${API_URL}/auth/profile/${userId}`);
      if (!response.ok) throw new Error("Failed to fetch profile");
      const data = await response.json();
      setUser(data.user);
      setFormData({
        name: data.user.name || "",
        email: data.user.email || "",
        password: "",
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async (userId) => {
    try {
      const response = await fetch(`${API_URL}/groups?userId=${userId}`);
      if (!response.ok) throw new Error("Failed to fetch groups");
      const data = await response.json();
      setGroups(data.groups || []);
    } catch (error) {
      console.error("Error fetching groups:", error);
    }
  };

  const fetchPendingRequests = async (userId) => {
    try {
      const response = await fetch(`${API_URL}/requests/user/${userId}/requests`);
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
    const userId = parseInt(localStorage.getItem("userId"));

    try {
      const updates = {};
      if (formData.name !== user.name) updates.name = formData.name;
      if (formData.email !== user.email) updates.email = formData.email;
      if (formData.password) updates.password = formData.password;

      if (Object.keys(updates).length === 0) {
        setEditing(false);
        return;
      }

      const response = await fetch(`${API_URL}/auth/profile/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
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
      const response = await fetch(
        `${API_URL}/requests/request/${requestId}/approve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to approve");

      const userId = parseInt(localStorage.getItem("userId"));
      fetchPendingRequests(userId);
      fetchGroups(userId);
      alert("Request approved! You've been added to the group.");
    } catch (error) {
      alert(error.message || "Failed to approve request");
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      const response = await fetch(
        `${API_URL}/requests/request/${requestId}/reject`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to reject");

      const userId = parseInt(localStorage.getItem("userId"));
      fetchPendingRequests(userId);
      alert("Request rejected");
    } catch (error) {
      alert(error.message || "Failed to reject request");
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto py-10 px-6">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-2">Profile Settings</h2>
          <p className="text-gray-600">Manage your account and group memberships</p>
        </div>

        {/* User ID Display */}
        <div className="bg-gradient-to-r from-pink-500 to-orange-400 rounded-xl shadow-lg p-6 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90 mb-1">Your User ID</p>
              <p className="text-3xl font-bold">{user.id}</p>
              <p className="text-sm opacity-80 mt-2">
                Share this ID with others so they can add you to groups or send requests
              </p>
            </div>
            <div className="bg-white/20 rounded-full p-4">
              <FiUser className="text-4xl" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profile Information */}
          <div className="bg-white rounded-xl shadow-md p-6 border">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">Profile Information</h3>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      New Password (leave blank to keep current)
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
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
                          password: "",
                        });
                      }}
                      className="flex-1 px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
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
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-semibold text-gray-800">{user.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <FiMail className="text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-semibold text-gray-800">{user.email}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Group Memberships */}
          <div className="bg-white rounded-xl shadow-md p-6 border">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FiUsers /> Your Groups ({groups.length})
            </h3>

            {groups.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                You're not a member of any groups yet
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {groups.map((group) => (
                  <div
                    key={group.id}
                    className="p-3 bg-gray-50 rounded-lg border hover:bg-gray-100 transition cursor-pointer"
                    onClick={() => navigate(`/groups`)}
                  >
                    <p className="font-semibold text-gray-800">{group.name}</p>
                    <p className="text-xs text-gray-500">
                      {group.members?.length || 0} members
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6 border mt-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FiClock /> Pending Group Requests ({pendingRequests.length})
            </h3>
            <p className="text-sm text-gray-600 mb-4">
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
                      <p className="font-semibold text-gray-800">
                        {request.group_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        Created by {request.creator_name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
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
        <div className="bg-white rounded-xl shadow-md p-6 border mt-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FiUsers /> Incoming Requests
          </h3>
          <IncomingRequestsComponent userId={user.id} />
        </div>
      </div>
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
      <p className="text-gray-500 text-center py-4">
        No pending requests for your groups
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((request) => (
        <div
          key={request.id}
          className="p-4 bg-blue-50 border border-blue-200 rounded-lg"
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <p className="font-semibold text-gray-800">{request.name}</p>
              <p className="text-sm text-gray-600">{request.email}</p>
              <p className="text-xs text-gray-500 mt-1">
                Wants to join: <strong>{request.group_name}</strong>
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleApprove(request.id)}
                className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition flex items-center gap-1"
              >
                <FiCheck /> Approve
              </button>
              <button
                onClick={() => handleReject(request.id)}
                className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition flex items-center gap-1"
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

