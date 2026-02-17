import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import anime from "animejs/lib/anime.es.js";
import { 
  Gamepad2, User, Trophy, Clock, Zap, ArrowLeft, 
  CheckCircle, XCircle, Loader2 
} from "lucide-react";
import { Button, Card, CardContent, Badge, Spinner } from "../components/ui";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../hooks/useAuth";
import { formatETH } from "../lib/utils";

const GAME_STATES = {
  WAITING: "waiting",      // Waiting for opponent
  READY_CHECK: "ready",    // Both players, ready check
  COUNTDOWN: "countdown",  // 3-2-1 countdown
  PLAYING: "playing",      // Game in progress
  FINISHED: "finished",    // Game ended
};

export default function GameRoom({ gameId, onLeave }) {
  const { user } = useAuth();
  const { on, emit, isConnected } = useSocket();
  
  const [gameState, setGameState] = useState(GAME_STATES.WAITING);
  const [game, setGame] = useState(null);
  const [opponent, setOpponent] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [opponentReady, setOpponentReady] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [winner, setWinner] = useState(null);
  const [scores, setScores] = useState({ player1: 0, player2: 0 });
  
  const containerRef = useRef(null);

  // Join game room on mount
  useEffect(() => {
    if (gameId && isConnected) {
      emit("join_room", { gameId });
      
      // Fetch game details
      fetchGameDetails();
    }

    return () => {
      if (gameId) {
        emit("leave_room", { gameId });
      }
    };
  }, [gameId, isConnected]);

  // Animate entrance
  useEffect(() => {
    if (containerRef.current) {
      anime({
        targets: containerRef.current.querySelectorAll(".animate-in"),
        opacity: [0, 1],
        translateY: [30, 0],
        duration: 800,
        delay: anime.stagger(100),
        easing: "easeOutExpo",
      });
    }
  }, [gameState]);

  // Socket event listeners
  useEffect(() => {
    const unsubMatchFound = on("match_found", (data) => {
      console.log("Match found!", data);
      setGameState(GAME_STATES.READY_CHECK);
      fetchGameDetails();
    });

    const unsubOpponentReady = on("opponent_ready", () => {
      setOpponentReady(true);
      checkBothReady();
    });

    const unsubGameStart = on("game_start", () => {
      startCountdown();
    });

    const unsubOpponentAction = on("opponent_action", (data) => {
      // Handle opponent's game actions
      console.log("Opponent action:", data);
    });

    const unsubGameEnd = on("game_end", (data) => {
      setWinner(data.winnerId);
      setScores(data.scores || scores);
      setGameState(GAME_STATES.FINISHED);
    });

    return () => {
      unsubMatchFound();
      unsubOpponentReady();
      unsubGameStart();
      unsubOpponentAction();
      unsubGameEnd();
    };
  }, [on, isReady]);

  const fetchGameDetails = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/games/${gameId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("ffc_token")}`,
          },
        }
      );
      const data = await response.json();
      if (data.game) {
        setGame(data.game);
        if (data.game.status === "matched" || data.game.status === "playing") {
          setGameState(GAME_STATES.READY_CHECK);
        }
      }
    } catch (err) {
      console.error("Failed to fetch game:", err);
    }
  };

  const handleReady = () => {
    setIsReady(true);
    emit("player_ready", { gameId });
    checkBothReady();
  };

  const checkBothReady = useCallback(() => {
    if (isReady && opponentReady) {
      emit("both_ready", { gameId });
      startCountdown();
    }
  }, [isReady, opponentReady, gameId]);

  useEffect(() => {
    checkBothReady();
  }, [isReady, opponentReady, checkBothReady]);

  const startCountdown = () => {
    setGameState(GAME_STATES.COUNTDOWN);
    setCountdown(3);

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setGameState(GAME_STATES.PLAYING);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const isPlayer1 = game?.player1_id === user?.id;

  return (
    <div className="min-h-screen animated-gradient relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 cyber-grid opacity-20 pointer-events-none" />
      
      {/* Floating orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -80, 0],
            y: [0, 80, 0],
          }}
          transition={{ duration: 15, repeat: Infinity }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl"
        />
      </div>

      <div ref={containerRef} className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-in">
          <Button variant="ghost" onClick={onLeave}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Leave Room
          </Button>
          
          <div className="flex items-center gap-2">
            <Badge variant={isConnected ? "success" : "destructive"}>
              {isConnected ? "Connected" : "Disconnected"}
            </Badge>
            <Badge variant="outline">
              Room: {gameId?.substring(0, 8)}...
            </Badge>
          </div>
        </div>

        {/* Game Info Bar */}
        {game && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 animate-in"
          >
            <Card glow className="bg-black/40">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-3xl">
                    {game.game_type_name === "pong" ? "🏓" : 
                     game.game_type_name === "rps" ? "✊" : "🐍"}
                  </div>
                  <div>
                    <h2 className="font-bold text-lg">
                      {game.game_type_display || game.game_type_name?.toUpperCase()}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      First to 5 points wins
                    </p>
                  </div>
                </div>
                
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Prize Pool</p>
                  <p className="text-2xl font-bold gradient-text">
                    {formatETH(game.total_pot)} {game.currency}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Main Game Area */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Player 1 */}
          <div className="lg:col-span-1 animate-in">
            <PlayerCard
              player={{
                username: game?.player1_username || "Player 1",
                wallet: game?.player1_wallet,
                id: game?.player1_id,
              }}
              isYou={isPlayer1}
              isReady={isPlayer1 ? isReady : opponentReady}
              score={scores.player1}
              isWinner={winner === game?.player1_id}
              gameState={gameState}
            />
          </div>

          {/* Center Game Area */}
          <div className="lg:col-span-2 animate-in">
            <Card glow className="aspect-video relative overflow-hidden">
              <AnimatePresence mode="wait">
                {/* Waiting State */}
                {gameState === GAME_STATES.WAITING && (
                  <motion.div
                    key="waiting"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex flex-col items-center justify-center"
                  >
                    <Loader2 className="w-16 h-16 text-primary animate-spin mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Waiting for opponent...</h3>
                    <p className="text-muted-foreground">Share this room to invite someone</p>
                  </motion.div>
                )}

                {/* Ready Check State */}
                {gameState === GAME_STATES.READY_CHECK && (
                  <motion.div
                    key="ready"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="absolute inset-0 flex flex-col items-center justify-center p-8"
                  >
                    <Zap className="w-16 h-16 text-primary mb-4" />
                    <h3 className="text-2xl font-bold mb-4">Opponent Found!</h3>
                    <p className="text-muted-foreground mb-8 text-center">
                      Both players must be ready to start
                    </p>
                    
                    {!isReady ? (
                      <Button
                        variant="gradient"
                        size="xl"
                        onClick={handleReady}
                        className="animate-pulse"
                      >
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Ready!
                      </Button>
                    ) : (
                      <div className="text-center">
                        <Badge variant="success" className="text-lg px-4 py-2">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          You're Ready!
                        </Badge>
                        {!opponentReady && (
                          <p className="text-sm text-muted-foreground mt-4">
                            Waiting for opponent...
                          </p>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Countdown State */}
                {gameState === GAME_STATES.COUNTDOWN && (
                  <motion.div
                    key="countdown"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <motion.span
                      key={countdown}
                      initial={{ scale: 2, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      className="text-9xl font-black gradient-text"
                    >
                      {countdown}
                    </motion.span>
                  </motion.div>
                )}

                {/* Playing State */}
                {gameState === GAME_STATES.PLAYING && (
                  <motion.div
                    key="playing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0"
                  >
                    <GameCanvas 
                      gameType={game?.game_type_name} 
                      isPlayer1={isPlayer1}
                      onAction={(action, data) => {
                        emit("game_action", { gameId, action, data });
                      }}
                    />
                  </motion.div>
                )}

                {/* Finished State */}
                {gameState === GAME_STATES.FINISHED && (
                  <motion.div
                    key="finished"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex flex-col items-center justify-center"
                  >
                    <Trophy className={`w-24 h-24 mb-4 ${
                      winner === user?.id ? "text-yellow-400" : "text-muted-foreground"
                    }`} />
                    <h2 className="text-4xl font-black mb-2">
                      {winner === user?.id ? "YOU WIN!" : "YOU LOSE"}
                    </h2>
                    <p className="text-xl text-muted-foreground mb-6">
                      {winner === user?.id 
                        ? `+${formatETH((game?.total_pot || 0) * 0.95)} ${game?.currency}`
                        : "Better luck next time!"}
                    </p>
                    <div className="flex gap-4">
                      <Button variant="outline" onClick={onLeave}>
                        Back to Lobby
                      </Button>
                      <Button variant="gradient">
                        Play Again
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>

            {/* Score Display */}
            {gameState === GAME_STATES.PLAYING && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center gap-8 mt-6"
              >
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    {isPlayer1 ? "You" : "Opponent"}
                  </p>
                  <p className="text-5xl font-black text-primary">{scores.player1}</p>
                </div>
                <div className="text-3xl text-muted-foreground">VS</div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    {isPlayer1 ? "Opponent" : "You"}
                  </p>
                  <p className="text-5xl font-black text-pink-500">{scores.player2}</p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Player 2 */}
          <div className="lg:col-span-1 animate-in">
            <PlayerCard
              player={{
                username: game?.player2_username || "Waiting...",
                wallet: game?.player2_wallet,
                id: game?.player2_id,
              }}
              isYou={!isPlayer1 && !!game?.player2_id}
              isReady={isPlayer1 ? opponentReady : isReady}
              score={scores.player2}
              isWinner={winner === game?.player2_id}
              gameState={gameState}
              isWaiting={!game?.player2_id}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Player Card Component
function PlayerCard({ player, isYou, isReady, score, isWinner, gameState, isWaiting }) {
  return (
    <Card glow={isYou} className={`h-full ${isWinner ? "border-yellow-400" : ""}`}>
      <CardContent className="p-6 flex flex-col items-center text-center">
        {isWaiting ? (
          <>
            <div className="w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center mb-4">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-1">Waiting...</h3>
            <p className="text-sm text-muted-foreground">for opponent</p>
          </>
        ) : (
          <>
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
              isYou 
                ? "bg-gradient-to-br from-primary to-pink-500" 
                : "bg-gradient-to-br from-blue-500 to-cyan-500"
            }`}>
              <User className="w-10 h-10 text-white" />
            </div>
            
            <h3 className="font-semibold text-lg mb-1">
              {player.username}
              {isYou && <span className="text-primary ml-1">(You)</span>}
            </h3>
            
            <p className="text-xs text-muted-foreground mb-4">
              {shortenAddress(player.wallet)}
            </p>

            {gameState === GAME_STATES.READY_CHECK && (
              <Badge variant={isReady ? "success" : "outline"} className="mb-4">
                {isReady ? (
                  <>
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Ready
                  </>
                ) : (
                  <>
                    <Clock className="w-3 h-3 mr-1" />
                    Not Ready
                  </>
                )}
              </Badge>
            )}

            {gameState === GAME_STATES.PLAYING && (
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Score</p>
                <p className="text-4xl font-black">{score}</p>
              </div>
            )}

            {isWinner && (
              <Badge variant="warning" className="mt-4">
                <Trophy className="w-3 h-3 mr-1" />
                Winner!
              </Badge>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Game Canvas Component (Placeholder)
function GameCanvas({ gameType, isPlayer1, onAction }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    // TODO: Implement actual game logic based on gameType
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    
    // Simple placeholder animation
    let animationId;
    let x = canvas.width / 2;
    let y = canvas.height / 2;
    let dx = 3;
    let dy = 3;

    const draw = () => {
      ctx.fillStyle = "rgba(10, 10, 15, 0.3)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw center line
      ctx.setLineDash([10, 10]);
      ctx.strokeStyle = "rgba(168, 85, 247, 0.3)";
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, 0);
      ctx.lineTo(canvas.width / 2, canvas.height);
      ctx.stroke();

      // Draw ball
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.fillStyle = "#a855f7";
      ctx.shadowColor = "#a855f7";
      ctx.shadowBlur = 20;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Move ball
      x += dx;
      y += dy;

      // Bounce
      if (x < 10 || x > canvas.width - 10) dx = -dx;
      if (y < 10 || y > canvas.height - 10) dy = -dy;

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [gameType]);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={450}
      className="w-full h-full bg-black/50 rounded-xl"
    />
  );
}
