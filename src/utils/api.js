const API_URL = "http://localhost:5000/api";

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "API request failed");
    }

    return data;
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
}

// Auth APIs
export const authAPI = {
  login: (email, password) =>
    apiCall("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  signup: (email, password, name) =>
    apiCall("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    }),
};

// Group APIs
export const groupAPI = {
  getGroups: (userId) => apiCall(`/groups?userId=${userId}`),
  
  getGroup: (groupId) => apiCall(`/groups/${groupId}`),
  
  createGroup: (name, description, createdBy) =>
    apiCall("/groups", {
      method: "POST",
      body: JSON.stringify({ name, description, createdBy }),
    }),

  addMembers: (groupId, memberIds) =>
    apiCall(`/groups/${groupId}/members`, {
      method: "POST",
      body: JSON.stringify({ memberIds }),
    }),
};

// Expense APIs
export const expenseAPI = {
  getExpenses: (groupId) => apiCall(`/expenses/group/${groupId}`),
  
  getBalances: (groupId) => apiCall(`/expenses/group/${groupId}/balances`),
  
  getSettlements: (groupId) =>
    apiCall(`/expenses/group/${groupId}/settlements`),
  
  addExpense: (groupId, expenseData) =>
    apiCall(`/expenses/group/${groupId}`, {
      method: "POST",
      body: JSON.stringify(expenseData),
    }),
  
  settleExpense: (expenseId, settledBy, amount) =>
    apiCall(`/expenses/${expenseId}/settle`, {
      method: "POST",
      body: JSON.stringify({ settledBy, amount }),
    }),
};

export default { authAPI, groupAPI, expenseAPI };

