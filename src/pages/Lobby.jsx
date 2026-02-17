import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import anime from "animejs/lib/anime.es.js";
import { Gamepad2, Plus, Users, Coins, Zap, RefreshCw, LogIn, LogOut, User } from "lucide-react";
import { Button, Card, CardContent, Badge, Spinner } from "../components/ui";
import { useAuth } from "../hooks/useAuth";
import { useSocket } from "../context/SocketContext";
import api from "../services/api";
import { shortenAddress, formatETH } from "../lib/utils";
import CreateGameModal from "../components/CreateGameModal";
import GameCard from "../components/GameCard";

export default function Lobby() {
  const navigate = useNavigate();
  const { user, balances, isAuthenticated, login, logout, isLoading: authLoading } = useAuth();
  const { isConnected: socketConnected, on, emit } = useSocket();
  
  const [games, setGames] = useState([]);
  const [activeGame, setActiveGame] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState("all");
  
  const titleRef = useRef(null);
  const particlesRef = useRef(null);

  // Animate title on mount
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

    // Animate particles
    createParticles();
  }, []);

  // Create floating particles
  const createParticles = () => {
    if (!particlesRef.current) return;
    
    const container = particlesRef.current;
    container.innerHTML = "";
    
    for (let i = 0; i < 50; i++) {
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

  // Fetch lobby data
  const fetchLobby = async () => {
    setIsLoading(true);
    try {
      const [lobbyData, activeData] = await Promise.all([
        api.getLobby(filter === "all" ? null : filter),
        isAuthenticated ? api.getMyActiveGame() : Promise.resolve({ game: null }),
      ]);
      setGames(lobbyData.games || []);
      setActiveGame(activeData.game);
    } catch (err) {
      console.error("Failed to fetch lobby:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLobby();
  }, [filter, isAuthenticated]);

  // Join lobby room and listen for real-time updates
  useEffect(() => {
    // Join lobby room when socket connects
    if (socketConnected) {
      emit("join_lobby");
    }

    const unsubGameCreated = on("game_created", (game) => {
      setGames((prev) => [game, ...prev]);
    });

    const unsubGameJoined = on("game_joined", (data) => {
      setGames((prev) => prev.filter((g) => g.id !== data.gameId));
    });

    const unsubGameCancelled = on("game_cancelled", (data) => {
      setGames((prev) => prev.filter((g) => g.id !== data.gameId));
    });

    return () => {
      emit("leave_lobby");
      unsubGameCreated();
      unsubGameJoined();
      unsubGameCancelled();
    };
  }, [on, emit, socketConnected]);

  const handleJoinGame = async (gameId) => {
    if (!isAuthenticated) {
      await login();
      return;
    }

    try {
      await api.joinGame(gameId);
      navigate(`/game/${gameId}`);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCancelGame = async (gameId) => {
    try {
      await api.cancelGame(gameId);
      fetchLobby();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen animated-gradient relative overflow-hidden">
      {/* Particles */}
      <div ref={particlesRef} className="particles" />

      {/* Grid overlay */}
      <div className="fixed inset-0 cyber-grid opacity-30 pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 border-b border-border/50 glass">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="p-2 rounded-xl bg-primary/20 neon-border">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <span className="text-xl font-bold gradient-text">FFC Launch</span>
          </motion.div>

          <div className="flex items-center gap-4">
            {/* Connection status */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${socketConnected ? "bg-green-500" : "bg-red-500"} pulse-live`} />
              <span className="text-xs text-muted-foreground">
                {socketConnected ? "Live" : "Offline"}
              </span>
            </div>

            {/* Balance */}
            {isAuthenticated && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/50 border border-border"
              >
                <Coins className="w-4 h-4 text-primary" />
                <span className="font-mono font-semibold">
                  {formatETH(balances.ETH || 0)} ETH
                </span>
              </motion.div>
            )}

            {/* Auth button */}
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50">
                  <User className="w-4 h-4 text-primary" />
                  <span className="font-medium">{user?.username || "Player"}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={logout}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button variant="gradient" onClick={login} disabled={authLoading}>
                {authLoading ? <Spinner size="sm" /> : <LogIn className="w-4 h-4 mr-2" />}
                Login
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 container mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 ref={titleRef} className="text-5xl md:text-7xl font-bold mb-6">
            {"GAME LOBBY".split("").map((letter, i) => (
              <span key={i} className="letter inline-block" style={{ opacity: 0 }}>
                {letter === " " ? "\u00A0" : letter}
              </span>
            ))}
          </h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            Join a game or create your own arena. Bet, battle, and win crypto!
          </motion.p>
        </div>

        {/* Active game banner */}
        <AnimatePresence>
          {activeGame && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8"
            >
              <Card glow className="bg-primary/10 border-primary/50">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-primary/20">
                      <Gamepad2 className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">You have an active game</p>
                      <p className="text-sm text-muted-foreground">
                        {activeGame.betAmount} {activeGame.currency} • {activeGame.status}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {activeGame.status === "waiting" && (
                      <Button variant="destructive" onClick={() => handleCancelGame(activeGame.id)}>
                        Cancel
                      </Button>
                    )}
                    <Button variant="gradient">
                      {activeGame.status === "waiting" ? "Waiting..." : "Go to Game"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-2">
            {["all", "pong", "rps", "snake"].map((type) => (
              <Button
                key={type}
                variant={filter === type ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(type)}
              >
                {type === "all" ? "All Games" : type.toUpperCase()}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={fetchLobby}>
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
            <Button
              variant="gradient"
              onClick={() => setShowCreateModal(true)}
              disabled={!!activeGame || !isAuthenticated}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Game
            </Button>
          </div>
        </div>

        {/* Games grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : games.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-xl font-semibold mb-2">No games available</h3>
            <p className="text-muted-foreground mb-6">Be the first to create a game!</p>
            <Button variant="gradient" onClick={() => setShowCreateModal(true)} disabled={!isAuthenticated}>
              <Plus className="w-4 h-4 mr-2" />
              Create Game
            </Button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {games.map((game, index) => (
                <GameCard
                  key={game.id}
                  game={game}
                  index={index}
                  onJoin={handleJoinGame}
                  isOwner={game.creatorId === user?.id}
                  canJoin={!activeGame && isAuthenticated}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </main>

      {/* Create game modal */}
      <CreateGameModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onCreated={(gameId) => {
          setShowCreateModal(false);
          if (gameId) {
            navigate(`/game/${gameId}`);
          } else {
            fetchLobby();
          }
        }}
        balances={balances}
      />
    </div>
  );
}
