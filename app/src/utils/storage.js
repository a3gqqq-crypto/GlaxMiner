const KEY = "glaxminer_data";

export function loadData() {
  const saved = localStorage.getItem(KEY);

  if (!saved) {
    return {
      balance: 0,

      mining: false,
      startTime: null,
      canClaim: false,

      // Pickaxe
      pickaxeLevel: 1,

      // Mining Speed
      miningSpeedLevel: 1,

      // Auto Miner
      autoMiner: false,

      // Robot
      robot: null,

      // Stake
      staked: 0,

      // VIP
      vip: "FREE",
    };
  }

  return JSON.parse(saved);
}

export function saveData(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}