import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import api, { subscribeSession } from "../services/api";

import { useCategoryOptions } from "../hooks/useCategoryOptions";

const AppContext = createContext(null);
export const AppProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [logoutError, setLogoutError] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [services, setServices] = useState([]);
  const [servicesError, setServicesError] = useState(null);
  const [servicesLoading, setServicesLoading] = useState(true);
  const categoryOptions = useCategoryOptions();
  const previewSequence = useRef(0);

  useEffect(() => {
    let active = true;
    const unsubscribe = subscribeSession(setCurrentUser);
    api.restore().finally(() => { if (active) setBootstrapping(false); });
    return () => { active = false; unsubscribe(); };
  }, []);

  const loadServicesPreview = useCallback(async () => {
    const ticket = ++previewSequence.current;
    setServicesLoading(true);
    setServicesError(null);
    const res = await api.listServices({ page: 1, limit: 20 });
    if (ticket !== previewSequence.current) return;
    if (res.ok) setServices(res.data.data.services);
    else setServicesError(res.error);
    setServicesLoading(false);
  }, []);

  useEffect(() => { loadServicesPreview(); }, [loadServicesPreview]);
  const login = async (email, password) => {
    setLogoutError(null);
    const res = await api.login({ email, password });
    return res.ok ? { ok: true, user: res.data.data.user } : res;
  };
  const register = async (form) => {
    setLogoutError(null);
    const payload = { account_type: form.role, full_name: form.fullName, email: form.email,
      password: form.password, confirm_password: form.confirmPassword };
    if (form.role === "entrepreneur") Object.assign(payload, { business_name: form.businessName,
      description: form.description, phone_number: form.phoneNumber, location: form.location });
    const res = await api.register(payload);
    return res.ok ? { ok: true, user: res.data.data.user } : res;
  };
  const logout = async () => {
    setLoggingOut(true);
    setLogoutError(null);
    const res = await api.logout();
    if (!res.ok) setLogoutError("Signed out locally, but the server session could not be revoked. " + res.error);
    setLoggingOut(false);
    return res;
  };
  const updateMyProfile = async (updates) => {
    const res = await api.updateEntrepreneurProfile(updates);
    if (res.ok) return api.me();
    return res;
  };

  return <AppContext.Provider value={{ currentUser, bootstrapping, login, register, logout, logoutError, loggingOut,
    updateMyProfile, services, servicesLoading, servicesError, loadServicesPreview, ...categoryOptions }}>{children}</AppContext.Provider>;
};
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};
