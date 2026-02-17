import { useState, useEffect, useCallback } from "react";
import api from "../services/api";

const APP_URL = import.meta.env.VITE_APP_URL || "https://fightforcrypto.com";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [balances, setBalances] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check for token in URL (passed from main site) or localStorage
  useEffect(() => {
    // Check URL for token first
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    
    if (urlToken) {
      console.log("[Auth] Token from URL, saving...");
      localStorage.setItem("ffc_token", urlToken);
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    }
    
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem("ffc_token");
    console.log("[Auth] Token exists:", !!token);
    
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      console.log("[Auth] Checking profile...");
      const data = await api.getProfile();
      console.log("[Auth] Profile data:", data);
      setUser(data.user);
      setIsAuthenticated(true);
      await fetchBalances();
    } catch (err) {
      console.error("[Auth] Check failed:", err);
      // Don't clear token on network errors, only on 401
      if (err.message?.includes("401") || err.message?.includes("Invalid")) {
        localStorage.removeItem("ffc_token");
      }
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
