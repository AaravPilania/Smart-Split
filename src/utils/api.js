// Use environment variable or fallback to Railway URL
export const API_URL = import.meta.env.VITE_API_URL || "https://smart-split-production.up.railway.app/api";

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      credentials: "include", // Include credentials for CORS
    });

    // Check if response is ok before trying to parse JSON
    if (!response.ok) {
      let errorMessage = "API request failed";
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        errorMessage = `Server error: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    // Parse JSON only if response is ok
    const data = await response.json();
    return data;
  } catch (error) {
    // Handle network errors
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      console.error(`Network Error (${endpoint}):`, error);
      throw new Error("Unable to connect to server. Please check your connection.");
    }
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

