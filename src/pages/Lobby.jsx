import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import anime from "animejs/lib/anime.es.js";
import { Gamepad2, Plus, Users, Coins, Zap, RefreshCw, LogOut, User, Loader2 } from "lucide-react";
import { Button, Card, CardContent, Badge, Spinner } from "../components/ui";
import { useAuth } from "../hooks/useAuth";
import { useSocket } from "../context/SocketContext";
import { formatETH } from "../lib/utils";

const API_URL = import.meta.env.VITE_API_URL || "https://api.fightforcrypto.com";
const APP_URL = import.meta.env.VITE_APP_URL || "https://fightforcrypto.com";

export default function Lobby() {
  const navigate = useNavigate();
  const { user, balances, isAuthenticated, isLoading: authLoading, logout, refreshBalances } = useAuth();
  const { isConnected: socketConnected, on, emit } = useSocket();
  
  const [games, setGames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [joiningGameId, setJoiningGameId] = useState(null);
  
  const titleRef = useRef(null);
  const particlesRef = useRef(null);

  // Check for active game and redirect
  useEffect(() => {
    if (authLoading) return;
    
    if (!isAuthenticated) {
      // Redirect to main site for login
      window.location.href = `${APP_URL}?redirect=${encodeURIComponent(window.location.href)}`;
      return;
    }

    // Check if user has active game
    checkActiveGame();
  }, [authLoading, isAuthenticated]);

  const checkActiveGame = async () => {
    try {
      const response = await fetch(`${API_URL}/api/games/my-active`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("ffc_token")}` }
      });
      const data = await response.json();
      
      if (data.hasActiveGame && data.game) {
        // User has active game, redirect to it
        if (data.game.status === 'matched' || data.game.status === 'playing') {
          navigate(`/game/${data.game.id}`);
          return;
        }
      }
      
      // No active game or waiting, show lobby
      fetchLobby();
    } catch (err) {
      console.error("Failed to check active game:", err);
      fetchLobby();
    }
  };

  // Animate on mount
  useEffect(() => {
    if (titleRef.current) {
      anime({
        targets: titleRef.current.querySelectorAll(".letter"),
        opacity: [0, 1],
        translateY: [50, 0],
        rotateX: [-90, 0],
        duration: 1500,
        delay: anime.stagger(100),
        easing: "easeOutExpo",
      });
    }
    createParticles();
  }, []);

  const createParticles = () => {
    if (!particlesRef.current) return;
    const container = particlesRef.current;
    container.innerHTML = "";
    
    for (let i = 0; i < 30; i++) {
      const particle = document.createElement("div");
      particle.className = "absolute rounded-full bg-primary/20";
      particle.style.width = `${Math.random() * 6 + 2}px`;
      particle.style.height = particle.style.width;
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.top = `${Math.random() * 100}%`;
      container.appendChild(particle);

      anime({
        targets: particle,
        translateY: [0, -100 - Math.random() * 200],
        translateX: () => anime.random(-50, 50),
        opacity: [0.5, 0],
        scale: [1, 0],
        duration: 3000 + Math.random() * 2000,
        delay: Math.random() * 2000,
        loop: true,
        easing: "easeOutQuad",
      });
    }
  };

  const fetchLobby = async () => {
    setIsLoading(true);
    try {
      const params = filter === "all" ? "" : `?gameType=${filter}`;
      const response = await fetch(`${API_URL}/api/games/lobby${params}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("ffc_token")}` }
      });
      const data = await response.json();
      // Filter out user's own games
      const otherGames = (data.games || []).filter(g => g.creatorId !== user?.id);
      setGames(otherGames);
    } catch (err) {
      console.error("Failed to fetch lobby:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchLobby();
    }
  }, [filter, isAuthenticated]);

  // Socket listeners
  useEffect(() => {
    if (socketConnected) {
      emit("join_lobby");
    }

    const unsubCreated = on("game_created", (game) => {
      if (game.creatorId !== user?.id) {
        setGames(prev => [game, ...prev]);
      }
    });

    const unsubJoined = on("game_joined", (data) => {
      setGames(prev => prev.filter(g => g.id !== data.gameId));
    });

    const unsubCancelled = on("game_cancelled", (data) => {
      setGames(prev => prev.filter(g => g.id !== data.gameId));
    });

    return () => {
      emit("leave_lobby");
      unsubCreated();
      unsubJoined();
      unsubCancelled();
    };
  }, [on, emit, socketConnected, user?.id]);

  const handleJoinGame = async (gameId) => {
    setJoiningGameId(gameId);
    try {
      const response = await fetch(`${API_URL}/api/games/${gameId}/join`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem("ffc_token")}` 
        }
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to join');
      }
      
      // Redirect to game
      navigate(`/game/${data.game.id}`);
    } catch (err) {
      alert(err.message);
    } finally {
      setJoiningGameId(null);
    }
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen animated-gradient flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen animated-gradient relative overflow-hidden">
      <div ref={particlesRef} className="particles" />
      <div className="fixed inset-0 cyber-grid opacity-30 pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 border-b border-border/50 glass">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/20 neon-border">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <span className="text-xl font-bold gradient-text">FFC Arena</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${socketConnected ? "bg-green-500" : "bg-red-500"} pulse-live`} />
              <span className="text-xs text-muted-foreground">
                {socketConnected ? "Live" : "Offline"}
              </span>
            </div>

            {isAuthenticated && (
              <>
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/50 border border-border">
                  <Coins className="w-4 h-4 text-primary" />
                  <span className="font-mono font-semibold">
                    {formatETH(balances.ETH || 0)} ETH
                  </span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50">
                  <User className="w-4 h-4 text-primary" />
                  <span className="font-medium">{user?.username || "Player"}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => { logout(); window.location.href = APP_URL; }}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 container mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 ref={titleRef} className="text-5xl md:text-7xl font-bold mb-4">
            {"ARENA".split("").map((letter, i) => (
              <span key={i} className="letter inline-block" style={{ opacity: 0 }}>
                {letter}
              </span>
            ))}
          </h1>
          <p className="text-xl text-muted-foreground">
            Join a battle or wait for challengers
          </p>
        </div>

        {/* Filter & Refresh */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex gap-2">
            {["all", "pong", "rps", "snake"].map((type) => (
              <Button
                key={type}
                variant={filter === type ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(type)}
              >
                {type === "all" ? "All" : type.toUpperCase()}
              </Button>
            ))}
          </div>
          <Button variant="ghost" size="icon" onClick={fetchLobby}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* Games Grid */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : games.length === 0 ? (
          <div className="text-center py-20">
            <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-xl font-semibold mb-2">No open games</h3>
            <p className="text-muted-foreground mb-6">
              Create a game from the main site or wait for others
            </p>
            <Button variant="gradient" onClick={() => window.location.href = `${APP_URL}/arena`}>
              Create Game
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {games.map((game, index) => (
                <motion.div
                  key={game.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card glow className="hover-lift overflow-hidden">
                    <div className={`h-1 bg-gradient-to-r ${
                      game.gameType === "pong" ? "from-blue-500 to-cyan-500" :
                      game.gameType === "rps" ? "from-orange-500 to-red-500" :
                      "from-green-500 to-emerald-500"
                    }`} />
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-3xl">
                          {game.gameType === "pong" ? "🏓" : game.gameType === "rps" ? "✊" : "🐍"}
                        </span>
                        <div>
                          <h3 className="font-bold">{game.gameType?.toUpperCase()}</h3>
                          <p className="text-sm text-muted-foreground">
                            by {game.player1?.username || "Anonymous"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 mb-4">
                        <span className="text-sm text-muted-foreground">Bet</span>
                        <span className="font-bold text-primary">
                          {formatETH(game.betAmount)} {game.currency}
                        </span>
                      </div>

                      <div className="text-center mb-4">
                        <p className="text-xs text-muted-foreground">Prize Pool</p>
                        <p className="text-xl font-bold gradient-text">
                          {formatETH(game.betAmount * 2)} {game.currency}
                        </p>
                      </div>

                      <Button
                        variant="gradient"
                        className="w-full"
                        onClick={() => handleJoinGame(game.id)}
                        disabled={joiningGameId === game.id}
                      >
                        {joiningGameId === game.id ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <Gamepad2 className="w-4 h-4 mr-2" />
                        )}
                        Join Battle
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}
