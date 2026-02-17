import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import anime from "animejs/lib/anime.es.js";
import { Gamepad2, Users, Coins, Zap, RefreshCw, LogOut, User, Loader2, AlertTriangle, X } from "lucide-react";
import { Button, Card, CardContent, Badge, Spinner } from "../components/ui";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../components/ui";
import { useAuth } from "../hooks/useAuth";
import { useSocket } from "../context/SocketContext";
import api from "../services/api";
import { formatETH } from "../lib/utils";

const APP_URL = import.meta.env.VITE_APP_URL || "https://fightforcrypto.com";

export default function Lobby() {
  const navigate = useNavigate();
  const { user, balances, isAuthenticated, isLoading: authLoading, refreshBalances } = useAuth();
  const { isConnected: socketConnected, on, emit } = useSocket();
  
  const [games, setGames] = useState([]);
  const [myGame, setMyGame] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [joiningGameId, setJoiningGameId] = useState(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  
  const titleRef = useRef(null);
  const particlesRef = useRef(null);

  // Check for active game and redirect
  useEffect(() => {
    if (authLoading) return;
    
    if (!isAuthenticated) {
      window.location.href = `${APP_URL}?redirect=${encodeURIComponent(window.location.href)}`;
      return;
    }

    checkActiveGame();
  }, [authLoading, isAuthenticated]);

  const checkActiveGame = async () => {
    try {
      const data = await api.getMyActiveGame();
      
      if (data.hasActiveGame && data.game) {
        // User has active game
        if (data.game.status === 'matched' || data.game.status === 'playing') {
          // Game started, go to game room
          navigate(`/game/${data.game.id}`);
          return;
        }
        // Waiting for opponent - show in lobby
        setMyGame(data.game);
      }
      
      fetchLobby();
    } catch (err) {
      console.error("Failed to check active game:", err);
      fetchLobby();
    }
  };

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
      const data = await api.getLobby();
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
      const interval = setInterval(fetchLobby, 10000); // Refresh every 10s
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

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
      // If someone joined my game, redirect to game room
      if (myGame && data.gameId === myGame.id) {
        navigate(`/game/${myGame.id}`);
      }
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
  }, [on, emit, socketConnected, user?.id, myGame]);

  const handleJoinGame = async (gameId) => {
    setJoiningGameId(gameId);
    try {
      const data = await api.joinGame(gameId);
      navigate(`/game/${data.game.id}`);
    } catch (err) {
      alert(err.message);
    } finally {
      setJoiningGameId(null);
    }
  };

  const handleLeaveGame = async () => {
    if (!myGame) return;
    
    setIsLeaving(true);
    try {
      await api.cancelGame(myGame.id);
      setMyGame(null);
      refreshBalances();
      window.location.href = APP_URL;
    } catch (err) {
      alert(err.message);
    } finally {
      setIsLeaving(false);
      setShowLeaveModal(false);
    }
  };

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

      {/* Leave Game Modal */}
      <Dialog open={showLeaveModal} onOpenChange={setShowLeaveModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="w-5 h-5" />
              Leave Game?
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to leave? Your bet of {formatETH(myGame?.betAmount)} {myGame?.currency} will be refunded and the game will be cancelled.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setShowLeaveModal(false)}>
              Stay
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleLeaveGame}
              disabled={isLeaving}
            >
              {isLeaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Leave & Refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => myGame ? setShowLeaveModal(true) : (window.location.href = APP_URL)}
                  title={myGame ? "Leave game" : "Back to site"}
                >
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
            {myGame ? "Waiting for an opponent..." : "Join a battle or wait for challengers"}
          </p>
        </div>

        {/* My Game (Waiting) */}
        {myGame && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card glow className="border-primary/50 bg-primary/5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">
                      {myGame.gameType === "pong" ? "🏓" : myGame.gameType === "rps" ? "✊" : "🐍"}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Your Game</h3>
                      <p className="text-muted-foreground flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Waiting for opponent...
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Your Bet</p>
                      <p className="text-2xl font-bold text-primary">
                        {formatETH(myGame.betAmount)} {myGame.currency}
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowLeaveModal(true)}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Refresh */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">
            {myGame ? "Other Players Looking for Match" : "Open Games"}
          </h2>
          <Button variant="ghost" size="icon" onClick={fetchLobby}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* Games Grid */}
        {isLoading && !games.length ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : games.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-border/50 rounded-xl">
            <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold mb-2">No other players waiting</h3>
            <p className="text-muted-foreground">
              {myGame ? "Sit tight, someone will join soon!" : "Check back later or create a game from the main site"}
            </p>
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
                        disabled={joiningGameId === game.id || !!myGame}
                      >
                        {joiningGameId === game.id ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <Gamepad2 className="w-4 h-4 mr-2" />
                        )}
                        {myGame ? "Cancel your game first" : "Join Battle"}
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
