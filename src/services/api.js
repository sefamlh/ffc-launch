const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

class ApiService {
  constructor() {
    this.baseUrl = API_URL;
    this.token = localStorage.getItem("ffc_token");
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem("ffc_token", token);
    } else {
      localStorage.removeItem("ffc_token");
    }
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Request failed");
    }

    return data;
  }

  // Auth
  async login(walletAddress) {
    const data = await this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ walletAddress }),
    });
    if (data.token) {
      this.setToken(data.token);
    }
    return data;
  }

  logout() {
    this.setToken(null);
  }

  // User
  async getProfile() {
    return this.request("/auth/profile");
  }

  async getBalances() {
    return this.request("/wallet/balances");
  }

  // Games
  async getGameTypes() {
    return this.request("/games/types");
  }

  async getLobby(gameType = null) {
    const query = gameType ? `?gameType=${gameType}` : "";
    return this.request(`/games/lobby${query}`);
  }

  async getMyActiveGame() {
    return this.request("/games/my-active");
  }

  async createGame(gameType, betAmount, currency) {
    return this.request("/games/create", {
      method: "POST",
      body: JSON.stringify({ gameType, betAmount, currency }),
    });
  }

  async joinGame(gameId) {
    return this.request(`/games/${gameId}/join`, {
      method: "POST",
    });
  }

  async cancelGame(gameId) {
    return this.request(`/games/${gameId}/cancel`, {
      method: "POST",
    });
  }

  async getGame(gameId) {
    return this.request(`/games/${gameId}`);
  }

  async getLeaderboard(limit = 50) {
    return this.request(`/games/leaderboard?limit=${limit}`);
  }
}

export const api = new ApiService();
export default api;
