import { motion } from "framer-motion";
import { Gamepad2, User, Coins, Clock } from "lucide-react";
import { Card, CardContent, Button, Badge } from "./ui";
import { shortenAddress, formatETH } from "../lib/utils";

const gameTypeIcons = {
  pong: "🏓",
  rps: "✊",
  snake: "🐍",
};

const gameTypeColors = {
  pong: "from-blue-500 to-cyan-500",
  rps: "from-orange-500 to-red-500",
  snake: "from-green-500 to-emerald-500",
};

export default function GameCard({ game, index, onJoin, isOwner, canJoin }) {
  const timeSince = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ scale: 1.02 }}
    >
      <Card glow className="overflow-hidden hover-lift">
        {/* Game type header */}
        <div className={`h-2 bg-gradient-to-r ${gameTypeColors[game.gameType] || "from-primary to-accent"}`} />
        
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="text-3xl">{gameTypeIcons[game.gameType] || "🎮"}</div>
              <div>
                <h3 className="font-bold text-lg">
                  {game.gameTypeDisplay || game.gameType?.toUpperCase()}
                </h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {timeSince(game.createdAt)}
                </p>
              </div>
            </div>
            <Badge variant={isOwner ? "success" : "default"}>
              {isOwner ? "Your Game" : "Open"}
            </Badge>
          </div>

          {/* Creator info */}
          <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-secondary/50">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium">
                {game.player1?.username || `Player_${game.player1?.wallet?.substring(0, 6)}`}
              </p>
              <p className="text-xs text-muted-foreground">
                {shortenAddress(game.player1?.wallet)}
              </p>
            </div>
          </div>

          {/* Bet info */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-primary/10 border border-primary/20 mb-4">
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">Bet Amount</span>
            </div>
            <span className="text-xl font-bold font-mono text-primary">
              {formatETH(game.betAmount)} {game.currency}
            </span>
          </div>

          {/* Prize pool */}
          <div className="text-center mb-4">
            <p className="text-xs text-muted-foreground mb-1">Prize Pool</p>
            <p className="text-2xl font-bold gradient-text">
              {formatETH(game.betAmount * 2)} {game.currency}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Winner takes 95%</p>
          </div>

          {/* Action button */}
          {isOwner ? (
            <Button variant="outline" className="w-full" disabled>
              <Gamepad2 className="w-4 h-4 mr-2" />
              Waiting for opponent...
            </Button>
          ) : (
            <Button
              variant="gradient"
              className="w-full"
              onClick={() => onJoin(game.id)}
              disabled={!canJoin}
            >
              <Gamepad2 className="w-4 h-4 mr-2" />
              {canJoin ? "Join Game" : "Connect Wallet"}
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
