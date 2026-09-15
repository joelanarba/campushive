const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

/**
 * Common API request helper.
 * Handles base URL configuration, headers, JSON serialization, and error extraction.
 */
export async function apiRequest(endpoint, options = {}) {
  const { method = "GET", body, headers = {}, ...customConfig } = options;

  const config = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
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

export default api;
