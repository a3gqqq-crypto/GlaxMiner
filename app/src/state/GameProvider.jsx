import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { getInitData, ApiError } from "../api/api";
import { login, loadLeaderboard } from "../api/userApi";
import { getMiningStatus, startMining, claimMining } from "../api/miningApi";
import { upgradePickaxe } from "../api/upgradeApi";
import { haptic } from "../lib/telegram";

// One store for everything the server owns. The client never computes a
// balance or a reward: it shows what the API returned and refreshes after
// every action. The only local arithmetic is the countdown display, which
// uses the server clock (serverTime) so a wrong phone clock can't skew it.

const GameContext = createContext(null);
const REFRESH_MS = 30_000;

export function GameProvider({ children }) {
  const [phase, setPhase] = useState("boot"); // boot | gate | error | ready
  const [profile, setProfile] = useState(null);
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(null); // null | "start" | "claim" | "upgrade"
  const [toast, setToast] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [board, setBoard] = useState({ state: "idle", rows: [], at: 0 });
  const offset = useRef(0);
  const toastTimer = useRef(null);

  const notify = useCallback((message, tone = "info") => {
    clearTimeout(toastTimer.current);
    setToast({ message, tone, id: Date.now() });
    toastTimer.current = setTimeout(() => setToast(null), 3600);
  }, []);

  const applyStatus = useCallback((data) => {
    if (!data?.success) return false;
    if (Number.isFinite(Number(data.serverTime))) {
      offset.current = Number(data.serverTime) - Date.now();
    }
    setStatus(data);
    return true;
  }, []);

  const refresh = useCallback(async () => {
    try {
      const data = await getMiningStatus();
      applyStatus(data);
      return data;
    } catch (e) {
      if (e instanceof ApiError) notify(e.message, "error");
      return null;
    }
  }, [applyStatus, notify]);

  const booting = useRef(false);
  const boot = useCallback(async () => {
    if (booting.current) return;
    booting.current = true;
    setPhase("boot");
    if (!getInitData()) {
      setPhase("gate");
      booting.current = false;
      return;
    }
    try {
      // login creates the player on first open (never changes an existing
      // one). If it's rate-limited (quick reopen), a returning player can
      // still load from the read-only status call.
      const res = await login();
      if (res.success) setProfile(res.user);
      else if (res.status !== 429) {
        setPhase("error");
        return;
      }
      let st = await getMiningStatus();
      if (!st.success && st.status === 429) {
        await new Promise((r) => setTimeout(r, 1500));
        st = await getMiningStatus();
      }
      if (!applyStatus(st)) {
        setPhase("error");
        return;
      }
      setPhase("ready");
    } catch {
      setPhase("error");
    } finally {
      booting.current = false;
    }
  }, [applyStatus]);

  useEffect(() => {
    boot();
  }, [boot]);

  // 1 s display tick (server-clock based)
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now() + offset.current), 1000);
    return () => clearInterval(id);
  }, []);

  // keep in sync with the server while mining, and when the app comes back
  useEffect(() => {
    if (phase !== "ready") return undefined;
    const id = status?.mining ? setInterval(refresh, REFRESH_MS) : null;
    const onVisible = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      if (id) clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [phase, status?.mining, refresh]);

  const session = useMemo(() => {
    const duration = Number(status?.duration) || 0;
    const mining = Boolean(status?.mining);
    const start = mining ? Number(status.startTime) : 0;
    const t = now + 0; // now already includes the server offset
    const elapsed = mining ? Math.max(0, (t - start) / 1000) : 0;
    const left = mining ? Math.max(0, duration - elapsed) : 0;
    const progress = mining && duration ? Math.min(1, elapsed / duration) : 0;
    const ready = mining && (left <= 0 || Boolean(status?.canClaim));
    return {
      state: !mining ? "idle" : ready ? "ready" : "mining",
      duration,
      start,
      end: start ? start + duration * 1000 : 0,
      left,
      progress: ready ? 1 : progress,
      reward: status?.reward ?? null,
    };
  }, [status, now]);

  const start = useCallback(async () => {
    if (busy) return;
    setBusy("start");
    haptic.impact("medium");
    try {
      const res = await startMining();
      if (!res.success) {
        haptic.error();
        notify(res.message || "Could not start the session.", "error");
      }
      await refresh();
    } catch (e) {
      notify(e.message, "error");
    } finally {
      setBusy(null);
    }
  }, [busy, refresh, notify]);

  // Resolves with the server's { reward, balance } on success.
  const claim = useCallback(async () => {
    if (busy) return null;
    setBusy("claim");
    try {
      const res = await claimMining();
      if (!res.success) {
        haptic.error();
        notify(res.message || "Could not claim yet.", "error");
        await refresh();
        return null;
      }
      haptic.success();
      await refresh();
      return { reward: Number(res.reward), balance: Number(res.balance) };
    } catch (e) {
      notify(e.message, "error");
      return null;
    } finally {
      setBusy(null);
    }
  }, [busy, refresh, notify]);

  const upgrade = useCallback(async () => {
    if (busy) return null;
    setBusy("upgrade");
    try {
      const res = await upgradePickaxe();
      if (!res.success) {
        haptic.error();
        notify(res.message || "Upgrade refused.", "error");
        await refresh();
        return null;
      }
      haptic.success();
      await refresh();
      return { level: Number(res.pickaxeLevel), balance: Number(res.balance) };
    } catch (e) {
      notify(e.message, "error");
      return null;
    } finally {
      setBusy(null);
    }
  }, [busy, refresh, notify]);

  const fetchBoard = useCallback(async () => {
    setBoard((b) => ({ ...b, state: b.rows.length ? "refreshing" : "loading" }));
    try {
      const res = await loadLeaderboard();
      if (!res.success) throw new Error(res.message || "Leaderboard unavailable");
      setBoard({ state: "ready", rows: res.leaderboard || res.users || res.rows || [], at: Date.now() });
    } catch (e) {
      setBoard((b) => ({ ...b, state: "error", error: e.message }));
    }
  }, []);

  const value = {
    phase,
    boot,
    profile,
    balance: Number(status?.balance ?? profile?.balance ?? 0),
    level: Number(status?.pickaxeLevel ?? profile?.pickaxe_level ?? 1),
    session,
    busy,
    start,
    claim,
    upgrade,
    refresh,
    board,
    fetchBoard,
    toast,
    notify,
    dismissToast: () => setToast(null),
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame outside GameProvider");
  return ctx;
}
