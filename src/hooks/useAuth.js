import { useState, useEffect, useCallback } from "react";
import api from "../services/api";

const APP_URL = import.meta.env.VITE_APP_URL || "https://fightforcrypto.com";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [balances, setBalances] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check existing token on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem("ffc_token");
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const data = await api.getProfile();
      setUser(data.user);
      setIsAuthenticated(true);
      await fetchBalances();
    } catch (err) {
      console.error("Auth check failed:", err);
      // Token invalid, clear it
      localStorage.removeItem("ffc_token");
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBalances = async () => {
    try {
      const data = await api.getBalances();
      setBalances(data.balances || {});
    } catch (err) {
      console.error("Failed to fetch balances:", err);
    }
  };

  // Redirect to main app for login
  const login = useCallback(() => {
    // Redirect to main app with return URL
    const returnUrl = encodeURIComponent(window.location.href);
    window.location.href = `${APP_URL}/login?redirect=${returnUrl}`;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("ffc_token");
    setUser(null);
    setBalances({});
    setIsAuthenticated(false);
  }, []);

  return {
    user,
    balances,
    isLoading,
    isAuthenticated,
    login,
    logout,
    refreshBalances: fetchBalances,
  };
}
