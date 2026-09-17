import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../services/api";
// import { api, setAccessToken } from "../lib/api";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);

  // On mount: try to restore the session from the refresh cookie.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const refreshed = await api.refresh();
      if (!cancelled && refreshed.ok) {
        setAccessToken(refreshed.data.access_token);
        const me = await api.me();
        if (!cancelled && me.ok) setCurrentUser(me.data);
      }
      if (!cancelled) setBootstrapping(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Public catalogue — fetch once.
  useEffect(() => {
    (async () => {
      const [s, c] = await Promise.all([
        api.listServices(),
        api.listCategories(),
      ]);
      if (s.ok) setServices(s.data);
      if (c.ok) setCategories(c.data);
    })();
  }, []);

  async function login(email, password) {
    const res = await api.login({ email, password });
    if (!res.ok) return { ok: false, error: res.error };

    setAccessToken(res.data.access_token);
    const me = await api.me();
    const user = me.ok ? me.data : null;
    setCurrentUser(user);
    return { ok: true, user };
  }

  async function register(form) {
    const payload = {
      account_type: form.role, // role → account_type
      full_name: form.fullName, // fullName → full_name
      email: form.email,
      password: form.password,
      confirm_password: form.confirmPassword,
    };

    if (form.role === "entrepreneur") {
      payload.business_name = form.businessName;
      payload.description = form.description;
      payload.phone_number = form.phoneNumber;
      payload.location = form.location;
    }

    const res = await api.register(payload);
    if (!res.ok) return { ok: false, error: res.error };

    // If the backend returns a token on register, use it; otherwise log in.
    if (res.data?.access_token) {
      setAccessToken(res.data.access_token);
    } else {
      const loginRes = await api.login({
        email: form.email,
        password: form.password,
      });
      if (loginRes.ok) setAccessToken(loginRes.data.access_token);
    }

    const me = await api.me();
    const user = me.ok ? me.data : null;
    setCurrentUser(user);
    return { ok: true, user };
  }

  async function logout() {
    setAccessToken(null);
    setCurrentUser(null);
    // No /logout endpoint listed — the refresh cookie stays valid until it
    // expires, or the backend adds a logout route. Fine for now.
  }

  async function updateMyProfile(updates) {
    const res = await api.updateEntrepreneurProfile(updates);
    if (res.ok) {
      const me = await api.me();
      if (me.ok) setCurrentUser(me.data);
    }
    return res;
  }

  const value = useMemo(
    () => ({
      currentUser,
      bootstrapping,
      login,
      register,
      logout,
      updateMyProfile,
      services,
      categories,
    }),
    [currentUser, bootstrapping, services, categories],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
