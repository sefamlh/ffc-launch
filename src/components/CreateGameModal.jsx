import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gamepad2, Coins, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Input,
  Spinner,
} from "./ui";
import api from "../services/api";
import { formatETH } from "../lib/utils";

const gameTypes = [
  { id: "pong", name: "Pong", emoji: "🏓", description: "Classic arcade battle" },
  { id: "rps", name: "Rock Paper Scissors", emoji: "✊", description: "Quick showdown" },
  { id: "snake", name: "Snake", emoji: "🐍", description: "Grow to survive" },
];

const betPresets = [0.001, 0.005, 0.01, 0.05, 0.1];

export default function CreateGameModal({ open, onOpenChange, onCreated, balances }) {
  const [selectedGame, setSelectedGame] = useState(null);
  const [betAmount, setBetAmount] = useState("");
  const [currency, setCurrency] = useState("ETH");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setSelectedGame(null);
      setBetAmount("");
      setError("");
    }
  }, [open]);

  const handleCreate = async () => {
    if (!selectedGame) {
      setError("Please select a game type");
      return;
    }
    if (!betAmount || parseFloat(betAmount) <= 0) {
      setError("Please enter a valid bet amount");
      return;
    }
    if (parseFloat(betAmount) > (balances[currency] || 0)) {
      setError("Insufficient balance");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const result = await api.createGame(selectedGame, parseFloat(betAmount), currency);
      onCreated(result.game?.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-primary" />
            Create New Game
          </DialogTitle>
          <DialogDescription>
            Choose a game type and set your bet amount
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Game type selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Select Game</label>
            <div className="grid grid-cols-3 gap-3">
              {gameTypes.map((game) => (
                <motion.button
                  key={game.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedGame(game.id)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedGame === game.id
                      ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="text-3xl mb-2">{game.emoji}</div>
                  <div className="font-semibold text-sm">{game.name}</div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Bet amount */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Bet Amount</label>
              <span className="text-xs text-muted-foreground">
                Balance: {formatETH(balances[currency] || 0)} {currency}
              </span>
            </div>

            {/* Preset buttons */}
            <div className="flex gap-2 flex-wrap">
              {betPresets.map((preset) => (
                <Button
                  key={preset}
                  variant={parseFloat(betAmount) === preset ? "default" : "outline"}
                  size="sm"
                  onClick={() => setBetAmount(preset.toString())}
                  disabled={preset > (balances[currency] || 0)}
                >
                  {preset} {currency}
                </Button>
              ))}
            </div>

            {/* Custom input */}
            <div className="relative">
              <Input
                type="number"
                placeholder="Enter custom amount"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                icon={Coins}
                step="0.001"
                min="0"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                {currency}
              </span>
            </div>
          </div>

          {/* Prize info */}
          {betAmount && parseFloat(betAmount) > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-lg bg-primary/10 border border-primary/30"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm">Your bet</span>
                <span className="font-mono">{formatETH(betAmount)} {currency}</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm">Potential prize</span>
                <span className="font-mono text-green-400">
                  {formatETH(parseFloat(betAmount) * 2 * 0.95)} {currency}
                </span>
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                <span>Platform fee (5%)</span>
                <span>{formatETH(parseFloat(betAmount) * 2 * 0.05)} {currency}</span>
              </div>
            </motion.div>
          )}

          {/* Error message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive"
              >
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{error}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="gradient"
            onClick={handleCreate}
            disabled={isLoading || !selectedGame || !betAmount}
          >
            {isLoading ? (
              <>
                <Spinner size="sm" />
                Creating...
              </>
            ) : (
              <>
                <Gamepad2 className="w-4 h-4 mr-2" />
                Create Game
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
