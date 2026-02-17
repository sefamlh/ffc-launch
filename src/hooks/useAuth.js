import { useState, useEffect, useCallback } from "react";
import { useWeb3 } from "../context/Web3Context";
import api from "../services/api";

export function useAuth() {
  const { account, isConnected, connectWallet, disconnect: disconnectWallet } = useWeb3();
  const [user, setUser] = useState(null);
  const [balances, setBalances] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check existing token on mount
  useEffect(() => {
    const token = localStorage.getItem("ffc_token");
    if (token && !user) {
      fetchProfile();
    }
  }, []);

  // Auto-login when wallet connects
  useEffect(() => {
    if (account && !user && !isLoading) {
      login();
    }
  }, [account]);

  const fetchProfile = async () => {
    try {
      const data = await api.getProfile();
      setUser(data.user);
      setIsAuthenticated(true);
      fetchBalances();
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      api.setToken(null);
      setUser(null);
      setIsAuthenticated(false);
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

  const login = useCallback(async () => {
    if (!account) {
      const connected = await connectWallet();
      if (!connected) return null;
    }

    setIsLoading(true);
    try {
      const data = await api.login(account);
      setUser(data.user);
      setIsAuthenticated(true);
      await fetchBalances();
      return data.user;
    } catch (err) {
      console.error("Login failed:", err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [account, connectWallet]);

  const logout = useCallback(() => {
    api.logout();
    setUser(null);
    setBalances({});
    setIsAuthenticated(false);
    disconnectWallet();
  }, [disconnectWallet]);

  return {
    user,
    balances,
    isLoading,
    isAuthenticated,
    isConnected,
    account,
    login,
    logout,
    refreshBalances: fetchBalances,
  };
}
