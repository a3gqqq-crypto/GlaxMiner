// DISPLAY MIRROR of server/config/mining.js (the original 92c29f4 economy).
// The server is the only authority: it decides session length, rewards,
// upgrade prices and balances. These numbers exist so the Lab can show the
// whole upgrade track before you buy. server/test checks they stay identical.

export const TOKEN = "GLX";

export const MINING_DURATION = 5 * 60 * 60; // 5 hours, in seconds

export const PICKAXE_LEVELS = {
  1: { reward: 100, upgradeCost: 0 },
  2: { reward: 125, upgradeCost: 500 },
  3: { reward: 155, upgradeCost: 1200 },
  4: { reward: 190, upgradeCost: 2500 },
  5: { reward: 230, upgradeCost: 5000 },
  6: { reward: 280, upgradeCost: 10000 },
  7: { reward: 340, upgradeCost: 18000 },
  8: { reward: 420, upgradeCost: 30000 },
  9: { reward: 520, upgradeCost: 50000 },
  10: { reward: 650, upgradeCost: 80000 },
};

export const MAX_PICKAXE_LEVEL = 10;

// Names for the rig at each tier (presentation only).
export const RIG_NAMES = {
  1: "Spark",
  2: "Ember",
  3: "Flux",
  4: "Pulse",
  5: "Arc",
  6: "Nova",
  7: "Quasar",
  8: "Pulsar",
  9: "Zenith",
  10: "Singularity",
};

export function tierInfo(level) {
  const l = Math.min(Math.max(Number(level) || 1, 1), MAX_PICKAXE_LEVEL);
  const next = l < MAX_PICKAXE_LEVEL ? l + 1 : null;
  return {
    level: l,
    name: RIG_NAMES[l],
    reward: PICKAXE_LEVELS[l].reward,
    next,
    nextName: next ? RIG_NAMES[next] : null,
    nextReward: next ? PICKAXE_LEVELS[next].reward : null,
    nextCost: next ? PICKAXE_LEVELS[next].upgradeCost : null,
  };
}
