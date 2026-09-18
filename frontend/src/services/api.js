const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
let currentAccessToken = null;
let currentUser = null;
let generation = 0;
let refreshPromise = null;
let restorePromise = null;
let authPromise = null;
let logoutPromise = null;
let refreshBlocked = false;
const listeners = new Set();

const sessionError = () =>
  Object.assign(new Error("Your session ended. Please log in again."), {
    status: 401,
  });
const publish = (user) => {
  currentUser = user;
  listeners.forEach((listener) => listener(user));
};
const clearSession = () => {
  generation += 1;
  currentAccessToken = null;
  publish(null);
};
export const subscribeSession = (listener) => {
  listeners.add(listener);
  listener(currentUser);
  return () => listeners.delete(listener);
};

export const apiRequest = async (endpoint, options = {}) => {
  const {
    method = "GET",
    body,
    headers = {},
    auth = false,
    retry = true,
    ...customConfig
  } = options;
  const requestGeneration = generation;
  const token = currentAccessToken;
  if (auth && refreshBlocked) throw sessionError();
  const response = await fetch(API_BASE_URL + endpoint, {
    ...customConfig,
    method,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-Csrf-Protection": "1",
      ...(auth && token ? { Authorization: "Bearer " + token } : {}),
      ...headers,
    },
    ...(body !== undefined
      ? { body: typeof body === "string" ? body : JSON.stringify(body) }
      : {}),
  });
  if (auth && requestGeneration !== generation) throw sessionError();
  if (response.status === 401 && auth && retry && !refreshBlocked) {
    // A late 401 may refer to the token that another request already replaced.
    if (!currentAccessToken || currentAccessToken === token)
      await refreshAccess();
    if (requestGeneration !== generation || refreshBlocked)
      throw sessionError();
    return apiRequest(endpoint, { ...options, retry: false });
  }
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    if (auth && response.status === 401) clearSession();
    throw Object.assign(
      new Error(
        data.message || "Request failed with status " + response.status,
      ),
      { status: response.status, data },
    );
  }
  const text = await response.text();
  if (auth && requestGeneration !== generation) throw sessionError();
  return text ? JSON.parse(text) : null;
};

const refreshAccess = () => {
  if (refreshBlocked) return Promise.reject(sessionError());
  if (refreshPromise) return refreshPromise;
  const started = generation;
  refreshPromise = (async () => {
    try {
      const response = await apiRequest("/auth/refresh", { method: "POST" });
      if (started !== generation || refreshBlocked) throw sessionError();
      currentAccessToken = response.data.access_token;
      publish(response.data.user);
      return response;
    } catch (error) {
      if (started === generation) clearSession();
      throw error;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
};

const wrap = async (promise) => {
  try {
    return { ok: true, data: await promise };
  } catch (error) {
    return {
      ok: false,
      error: error.message,
      status: error.status,
      data: error.data,
    };
  }
};
const startSession = (endpoint, body) => {
  if (authPromise || logoutPromise)
    return Promise.reject(
      new Error("A session change is already in progress. Please try again."),
    );
  clearSession();
  const started = generation;
  const pendingRefresh = refreshPromise;
  refreshBlocked = true;
  authPromise = (async () => {
    try {
      if (pendingRefresh) await pendingRefresh.catch(() => {});
      if (started !== generation) throw sessionError();
      const response = await apiRequest(endpoint, { method: "POST", body });
      if (started !== generation) throw sessionError();
      currentAccessToken = response.data.access_token;
      refreshBlocked = false;
      publish(response.data.user);
      return response;
    } finally {
      authPromise = null;
    }
  })();
  return authPromise;
};

const restoreSession = () => {
  if (restorePromise) return restorePromise;
  const started = generation;
  restorePromise = (async () => {
    try {
      await refreshAccess();
      const response = await apiRequest("/auth/me", { auth: true });
      if (started !== generation || refreshBlocked) throw sessionError();
      publish(response.data.user);
      return response;
    } catch (error) {
      if (started === generation) clearSession();
      throw error;
    } finally {
      restorePromise = null;
    }
  })();
  return restorePromise;
};

const endSession = () => {
  if (logoutPromise) return logoutPromise;
  refreshBlocked = true;
  clearSession();
  const pending = [refreshPromise, authPromise].filter(Boolean);
  logoutPromise = (async () => {
    try {
      // Let cookie-writing responses settle before revoking their current family.
      await Promise.allSettled(pending);
      return await apiRequest("/auth/logout", { method: "POST" });
    } finally {
      logoutPromise = null;
    }
  })();
  return logoutPromise;
};

export const api = {
  get: (endpoint, options = {}) =>
    apiRequest(endpoint, { ...options, method: "GET" }),
  post: (endpoint, body, options = {}) =>
    apiRequest(endpoint, { ...options, method: "POST", body }),
  patch: (endpoint, body, options = {}) =>
    apiRequest(endpoint, { ...options, method: "PATCH", body }),
  put: (endpoint, body, options = {}) =>
    apiRequest(endpoint, { ...options, method: "PUT", body }),
  delete: (endpoint, options = {}) =>
    apiRequest(endpoint, { ...options, method: "DELETE" }),
};
const query = (params = {}) => {
  const values = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "")
      values.set(key, String(value));
  });
  return values.size ? "?" + values.toString() : "";
};
const protectedOptions = { auth: true };
api.login = (body) => wrap(startSession("/auth/login", body));
api.register = (body) => wrap(startSession("/auth/register", body));
api.refresh = () => wrap(refreshAccess());
api.restore = () => wrap(restoreSession());
api.logout = () => wrap(endSession());
api.me = () =>
  wrap(
    (async () => {
      const started = generation;
      const response = await api.get("/auth/me", protectedOptions);
      if (started !== generation) throw sessionError();
      publish(response.data.user);
      return response;
    })(),
  );
api.listServices = (params) => wrap(api.get("/services" + query(params)));
api.getService = (id) => wrap(api.get("/services/" + id));
api.listCategories = (params) => wrap(api.get("/categories" + query(params)));
api.createCategory = (body) =>
  wrap(api.post("/admin/categories", body, protectedOptions));
api.updateCategory = (id, body) =>
  wrap(api.patch("/admin/categories/" + id, body, protectedOptions));
api.deleteCategory = (id) =>
  wrap(api.delete("/admin/categories/" + id, protectedOptions));
api.updateEntrepreneurProfile = (body) =>
  wrap(api.patch("/entrepreneurs/me", body, protectedOptions));
api.listEntrepreneurs = (params) =>
  wrap(api.get("/admin/entrepreneurs" + query(params), protectedOptions));
api.verifyEntrepreneur = (id, body) =>
  wrap(
    api.patch("/admin/entrepreneurs/" + id + "/verify", body, protectedOptions),
  );
api.listMyServices = (params) =>
  wrap(api.get("/entrepreneurs/me/services" + query(params), protectedOptions));
api.getMyService = (id) =>
  wrap(api.get("/entrepreneurs/me/services/" + id, protectedOptions));
api.createMyService = (body) =>
  wrap(api.post("/entrepreneurs/me/services", body, protectedOptions));
api.updateMyService = (id, body) =>
  wrap(api.patch("/entrepreneurs/me/services/" + id, body, protectedOptions));
api.deleteMyService = (id) =>
  wrap(api.delete("/entrepreneurs/me/services/" + id, protectedOptions));
api.listMyAvailability = (id, params) =>
  wrap(
    api.get(
      "/entrepreneurs/me/services/" + id + "/availability" + query(params),
      protectedOptions,
    ),
  );
api.createMyAvailability = (id, body) =>
  wrap(
    api.post(
      "/entrepreneurs/me/services/" + id + "/availability",
      body,
      protectedOptions,
    ),
  );
api.deleteMyAvailability = (id, slotId) =>
  wrap(
    api.delete(
      "/entrepreneurs/me/services/" + id + "/availability/" + slotId,
      protectedOptions,
    ),
  );
api.getAvailability = (id, from, to) =>
  wrap(
    api.get(
      "/services/" +
        id +
        "/availability" +
        query({ date_from: from, date_to: to }),
    ),
  );
api.createBooking = (body) =>
  wrap(api.post("/bookings", body, protectedOptions));
api.listStudentBookings = (params) =>
  wrap(api.get("/bookings/me" + query(params), protectedOptions));
api.listEntrepreneurBookings = (params) =>
  wrap(api.get("/bookings/provider" + query(params), protectedOptions));
api.updateBookingStatus = (id, status) =>
  wrap(api.patch("/bookings/" + id, { status }, protectedOptions));
export default api;
