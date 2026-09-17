const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

/**
 * Common API request helper.
 * Handles base URL configuration, headers, JSON serialization, and error extraction.
 */
let currentAccessToken = null;

export function setAccessToken(token) {
  currentAccessToken = token;
}

export async function apiRequest(endpoint, options = {}) {
  const { method = "GET", body, headers = {}, ...customConfig } = options;

  const config = {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Csrf-Protection": "1",
      ...(currentAccessToken ? { Authorization: `Bearer ${currentAccessToken}` } : {}),
      ...headers,
    },
    credentials: "include",
    ...customConfig,
  };

  if (body) {
    config.body = typeof body === "string" ? body : JSON.stringify(body);
  }

  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const response = await fetch(url, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(
      errorData.message || `Request failed with status ${response.status}`,
    );
    error.status = response.status;
    error.data = errorData;
    throw error;
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const api = {
  get: (endpoint, options = {}) =>
    apiRequest(endpoint, { ...options, method: "GET" }),
  post: (endpoint, body, options = {}) =>
    apiRequest(endpoint, { ...options, method: "POST", body }),
  put: (endpoint, body, options = {}) =>
    apiRequest(endpoint, { ...options, method: "PUT", body }),
  patch: (endpoint, body, options = {}) =>
    apiRequest(endpoint, { ...options, method: "PATCH", body }),
  delete: (endpoint, options = {}) =>
    apiRequest(endpoint, { ...options, method: "DELETE" }),
};

// Helper for wrapping methods to return {ok, data, error} format used by AppContext
const wrap = async (promise) => {
  try {
    const data = await promise;
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: error.message, status: error.status, data: error.data };
  }
};

api.login = (credentials) => wrap(api.post("/auth/login", credentials));
api.register = (payload) => wrap(api.post("/auth/register", payload));
api.refresh = () => wrap(apiRequest("/auth/refresh", { method: "POST", credentials: "include" }));
api.me = () => wrap(api.get("/auth/me"));
api.listServices = () => wrap(api.get("/services"));
api.getService = (id) => wrap(api.get(`/services/${id}`));
api.listCategories = () => wrap(api.get("/categories"));
api.updateEntrepreneurProfile = (updates) => wrap(api.patch("/entrepreneurs/me", updates));

// Entrepreneur specific service management routes
api.listMyServices = () => wrap(api.get("/entrepreneurs/me/services"));
api.getMyService = (id) => wrap(api.get(`/entrepreneurs/me/services/${id}`));
api.createMyService = (data) => wrap(api.post("/entrepreneurs/me/services", data));
api.updateMyService = (id, data) => wrap(api.patch(`/entrepreneurs/me/services/${id}`, data));
api.deleteMyService = (id) => wrap(api.delete(`/entrepreneurs/me/services/${id}`));

export default api;
