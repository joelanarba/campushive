// const API_BASE_URL =
//   import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// /**
//  * Common API request helper.
//  * Handles base URL configuration, headers, JSON serialization, and error extraction.
//  */
// export async function apiRequest(endpoint, options = {}) {
//   const { method = "GET", body, headers = {}, ...customConfig } = options;

//   const config = {
//     method,
//     headers: {
//       "Content-Type": "application/json",
//       ...headers,
//     },
//     ...customConfig,
//   };

//   if (body) {
//     config.body = typeof body === "string" ? body : JSON.stringify(body);
//   }

//   const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

//   const response = await fetch(url, config);

//   if (!response.ok) {
//     const errorData = await response.json().catch(() => ({}));
//     const error = new Error(
//       errorData.message || `Request failed with status ${response.status}`,
//     );
//     error.status = response.status;
//     error.data = errorData;
//     throw error;
//   }

//   // Handle 204 No Content
//   if (response.status === 204) {
//     return null;
//   }

//   return response.json();
// }

// export const api = {
//   get: (endpoint, options = {}) =>
//     apiRequest(endpoint, { ...options, method: "GET" }),
//   post: (endpoint, body, options = {}) =>
//     apiRequest(endpoint, { ...options, method: "POST", body }),
//   put: (endpoint, body, options = {}) =>
//     apiRequest(endpoint, { ...options, method: "PUT", body }),
//   patch: (endpoint, body, options = {}) =>
//     apiRequest(endpoint, { ...options, method: "PATCH", body }),
//   delete: (endpoint, options = {}) =>
//     apiRequest(endpoint, { ...options, method: "DELETE" }),
// };

// export default api;

const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

let accessToken = null;
export function setAccessToken(t) {
  accessToken = t;
}
export function getAccessToken() {
  return accessToken;
}

async function request(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`;

  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      credentials: "include",
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    return { ok: false, error: "Network error — is the backend running?" };
  }

  if (res.status === 204) return { ok: true };

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      error: data.message || data.error || `Request failed (${res.status})`,
    };
  }
  return { ok: true, data };
}

export const api = {
  register: (payload) =>
    request("/api/auth/register", {
      method: "POST",
      body: payload,
      auth: false,
    }),
  login: (payload) =>
    request("/api/auth/login", { method: "POST", body: payload, auth: false }),
  refresh: () => request("/api/auth/refresh", { method: "POST", auth: false }),
  me: () => request("/api/auth/me"),
  updateEntrepreneurProfile: (payload) =>
    request("/api/entrepreneurs/me", { method: "PATCH", body: payload }),
  listServices: () => request("/api/services", { auth: false }),
  getService: (id) => request(`/api/services/${id}`, { auth: false }),
  listCategories: () => request("/api/categories", { auth: false }),
};
