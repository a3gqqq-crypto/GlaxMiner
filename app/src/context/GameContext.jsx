import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { loadUser } from "../api/userApi";

const GameContext = createContext();

export function GameProvider({ children }) {
  const { user, loading } = useAuth();

  const [game, setGame] = useState({
    balance: 0,
    pickaxeLevel: 1,
    mining: false,
    miningStart: 0,
    canClaim: false,
  });

  const [gameLoading, setGameLoading] = useState(true);

  useEffect(() => {
    // Auth is still loading
    if (loading) {
      setGameLoading(true);
      return;
    }

    // No logged-in user
    if (!user) {
      setGameLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchGame() {
      // Keep the UI hidden while getting the real game state
      setGameLoading(true);

      try {
        const data = await loadUser(user.telegram_id);

        if (cancelled) return;

        if (data.success) {
          setGame({
            balance: data.user.balance,
            pickaxeLevel: data.user.pickaxe_level,
            mining: data.user.mining,
            miningStart: data.user.mining_start,
            canClaim: data.user.can_claim,
          });
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load game data:", err);
        }
      } finally {
        if (!cancelled) {
          setGameLoading(false);
        }
      }
    }

    fetchGame();

    return () => {
      cancelled = true;
    };
  }, [user, loading]);

  return (
    <GameContext.Provider
      value={{
        game,
        setGame,
        gameLoading,
        user,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  return useContext(GameContext);
}