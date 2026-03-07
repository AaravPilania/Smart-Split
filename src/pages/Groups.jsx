import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { FiUsers, FiPlus, FiX, FiUserPlus, FiDollarSign } from "react-icons/fi";
import { groupAPI } from "../utils/api";

const API_URL = "http://localhost:5000/api";

export default function Groups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(null);
  const [userId, setUserId] = useState(null);
  const navigate = useNavigate();

  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
  });

  const [addMemberForm, setAddMemberForm] = useState({
    memberEmail: "",
  });

  useEffect(() => {
    const userIdStr = localStorage.getItem("userId");
    if (!userIdStr) {
      navigate("/");
      return;
    }
    setUserId(parseInt(userIdStr));
    fetchGroups(parseInt(userIdStr));
  }, [navigate]);

  const fetchGroups = async (userId) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/groups?userId=${userId}`);
      if (!response.ok) throw new Error("Failed to fetch groups");
      const data = await response.json();
      setGroups(data.groups || []);
    } catch (error) {
      console.error("Error fetching groups:", error);
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
      const response = await fetch(`${API_URL}/groups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      const response = await fetch(`${API_URL}/groups/${groupId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberIds: [parseInt(memberId)] }),
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

  const handleRequestToJoin = async (groupId) => {
    try {
      const response = await fetch(`${API_URL}/requests/group/${groupId}/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to send request");

      alert("Request sent successfully! Wait for group admin to approve.");
      fetchGroups(userId);
    } catch (error) {
      alert(error.message || "Failed to send request");
    }
  };

  if (loading) {
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

      <div className="max-w-6xl mx-auto py-10 px-6">
        {/* Page Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">Your Groups</h2>
            <p className="text-gray-500">Manage your expense groups</p>
          </div>

          {/* Create Group Button */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-pink-500 to-orange-400 text-white px-5 py-2.5 rounded-lg shadow-md flex items-center gap-2 hover:shadow-lg transition"
          >
            <FiPlus /> Create Group
          </button>
        </div>

        {/* Groups List */}
        {groups.length === 0 ? (
          <div className="bg-white rounded-2xl border shadow-sm p-14 flex flex-col items-center justify-center">
            <div className="text-gray-400 text-5xl mb-3">
              <FiUsers />
            </div>
            <h3 className="text-gray-700 font-semibold text-lg mb-1">
              No groups yet
            </h3>
            <p className="text-gray-500 text-sm">
              Create your first group to start splitting expenses
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => (
              <div
                key={group.id}
                className="bg-white rounded-xl shadow-md p-6 border hover:shadow-lg transition"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800 mb-1">
                      {group.name}
                    </h3>
                    <p className="text-sm text-gray-500 mb-2">
                      {group.description || "No description"}
                    </p>
                    <p className="text-xs text-gray-400">
                      Created by {group.createdBy?.name || "Unknown"}
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <FiUsers className="text-pink-500" />
                    <span>{group.members?.length || 0} members</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {group.members?.slice(0, 3).map((member) => (
                      <span
                        key={member.id}
                        className="px-2 py-1 bg-pink-100 text-pink-700 rounded-full text-xs"
                        title={`ID: ${member.id}`}
                      >
                        {member.name} (ID: {member.id})
                      </span>
                    ))}
                    {group.members?.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                        +{group.members.length - 3}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/expenses?group=${group.id}`)}
                    className="flex-1 bg-gradient-to-r from-pink-500 to-orange-400 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition flex items-center justify-center gap-1"
                  >
                    <FiDollarSign /> Expenses
                  </button>
                  {group.createdBy?.id === userId ? (
                    <button
                      onClick={() => setShowAddMemberModal(group.id)}
                      className="flex-1 bg-white border border-pink-500 text-pink-500 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-pink-50 transition flex items-center justify-center gap-1"
                    >
                      <FiUserPlus /> Add Member
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRequestToJoin(group.id)}
                      className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-600 transition flex items-center justify-center gap-1"
                    >
                      <FiUserPlus /> Request to Join
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* All Groups Section */}
        <AllGroupsSection userId={userId} onJoinRequest={fetchGroups} />
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">Create Group</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            <form onSubmit={handleCreateGroup}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Group Name *
                </label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="e.g., Roommates, Trip to Goa"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="Optional description"
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-pink-500 to-orange-400 text-white rounded-lg hover:opacity-90"
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
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">Add Member</h3>
              <button
                onClick={() => setShowAddMemberModal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            <form onSubmit={(e) => handleAddMember(showAddMemberModal, e)}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Member User ID
                </label>
                <input
                  type="number"
                  value={addMemberForm.memberEmail}
                  onChange={(e) =>
                    setAddMemberForm({ memberEmail: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="Enter user ID"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ask the person for their user ID. They can find it in their Profile page or Dashboard
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(null)}
                  className="flex-1 px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-pink-500 to-orange-400 text-white rounded-lg hover:opacity-90"
                >
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Component to show all groups for discovery
function AllGroupsSection({ userId, onJoinRequest }) {
  const [allGroups, setAllGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const fetchAllGroups = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/groups?all=true`);
      if (!response.ok) throw new Error("Failed to fetch groups");
      const data = await response.json();
      
      // Filter out groups where user is already a member
      const userGroupsResponse = await fetch(`${API_URL}/groups?userId=${userId}`);
      if (userGroupsResponse.ok) {
        const userGroupsData = await userGroupsResponse.json();
        const userGroupIds = new Set((userGroupsData.groups || []).map(g => g.id));
        const availableGroups = (data.groups || []).filter(g => !userGroupIds.has(g.id));
        setAllGroups(availableGroups);
      } else {
        setAllGroups(data.groups || []);
      }
    } catch (error) {
      console.error("Error fetching all groups:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestToJoin = async (groupId) => {
    try {
      const response = await fetch(`${API_URL}/requests/group/${groupId}/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to send request");

      alert("Request sent successfully! Wait for group admin to approve.");
      fetchAllGroups(); // Refresh list
      if (onJoinRequest) onJoinRequest(userId);
    } catch (error) {
      alert(error.message || "Failed to send request");
    }
  };

  if (!showAll) {
    return (
      <div className="mt-8 text-center">
        <button
          onClick={() => {
            setShowAll(true);
            fetchAllGroups();
          }}
          className="text-pink-600 hover:text-pink-700 font-semibold"
        >
          Browse All Groups to Join →
        </button>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-2xl font-bold text-gray-800">All Groups</h3>
        <button
          onClick={() => setShowAll(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          Hide
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto"></div>
        </div>
      ) : allGroups.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center text-gray-500">
          No other groups available to join
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allGroups.map((group) => (
            <div
              key={group.id}
              className="bg-white rounded-xl shadow-md p-6 border hover:shadow-lg transition"
            >
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                {group.name}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {group.description || "No description"}
              </p>
              <p className="text-xs text-gray-400 mb-4">
                Created by {group.createdBy?.name || "Unknown"}
                <br />
                {group.members?.length || 0} members
              </p>
              <button
                onClick={() => handleRequestToJoin(group.id)}
                className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-600 transition"
              >
                Request to Join
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
