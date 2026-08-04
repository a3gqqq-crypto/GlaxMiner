const MINING_DURATION = 5 * 60 * 60; // 5 hours

const MINING_POWER = {
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

module.exports = {
  MINING_DURATION,
  MINING_POWER,
};