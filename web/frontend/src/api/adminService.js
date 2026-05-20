export const API_BASE = (import.meta.env.VITE_API_BASE_URL || "/api").trim();

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

  getLogs: async (token, username, options = {}) => {
    const params = new URLSearchParams();

    if (typeof options.limit === "number") params.set("limit", String(options.limit));
    if (typeof options.offset === "number") params.set("offset", String(options.offset));
    if (options.startDate) params.set("start_date", options.startDate);
    if (options.endDate) params.set("end_date", options.endDate);
    if (options.search) params.set("search", options.search);

    const query = params.toString();
    const data = await safeFetch(`${API_BASE}/admin/users/${username}/logs${query ? `?${query}` : ""}`, {
      headers: getAuthHeaders(token),
    });

    const logs = Array.isArray(data?.logs) ? data.logs : [];

    return {
      logs: logs.map((l) => ({
        activity: l.activity,
        timestamp: l.timestamp,
        template: l.template,
      })),
      total: Number.isFinite(data?.total) ? data.total : logs.length,
      hasMore: Boolean(data?.has_more),
    };
  }
};
