export const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000/api").trim();

const getAuthHeaders = (token) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

export const safeFetch = async (url, options) => {
  const res = await fetch(url, options);
  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error("Server error");
  }
  if (!res.ok) {
    throw new Error(data?.error || "Request failed");
  }
  return data;
};

export const adminService = {
  login: async (username, password) => {
    return await safeFetch(`${API_BASE}/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
  },
  
  register: async (username, password, companyName) => {
    return await safeFetch(`${API_BASE}/admin/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, companyName }),
    });
  },

  getUsers: async (token) => {
    const data = await safeFetch(`${API_BASE}/admin/users`, {
      headers: getAuthHeaders(token),
    });
    if (!Array.isArray(data)) return [];
    return data.map((u) => ({
      username: u.username,
      createdBy: u.created_by || "admin",
    }));
  },

  createUser: async (token, username, password) => {
    return await safeFetch(`${API_BASE}/admin/users`, {
      method: "POST",
      headers: getAuthHeaders(token),
      body: JSON.stringify({ username, password }),
    });
  },

  getLogs: async (token, username) => {
    const data = await safeFetch(`${API_BASE}/admin/users/${username}/logs`, {
      headers: getAuthHeaders(token),
    });
    if (!Array.isArray(data)) return [];
    return data.map((l) => ({
      activity: l.activity,
      timestamp: l.timestamp,
    }));
  }
};
