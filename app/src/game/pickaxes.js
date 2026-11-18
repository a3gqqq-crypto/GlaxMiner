// Visual identity of each pickaxe tier. Presentation only: rewards and prices
// live in data/economy.js (mirror) and on the server (authority).
//   shape:  head silhouette drawer in draw.js
//   metal:  head body colour, edge: bright cutting edge, core: inlaid crystal
//   glow:   aura colour (null = none), trail: swing trail colour
//   sparks: particle palette on impact, power: effect intensity 1..3
export const PICKAXES = {
  1: { name: "Spark", shape: "classic", handle: "#5b4636", grip: "#2b2230", metal: "#8e96a8", edge: "#dfe5f1", core: null, glow: null, trail: "#b9a2ff", sparks: ["#ffd27a", "#fff2c9"], power: 1 },
  2: { name: "Ember", shape: "classic", handle: "#4a3a33", grip: "#3a1f1a", metal: "#9a7b6a", edge: "#ffb36b", core: "#ff7a3d", glow: "#ff7a3d", trail: "#ff9a5a", sparks: ["#ff9a5a", "#ffd27a"], power: 1.1 },
  3: { name: "Flux", shape: "crystal", handle: "#3a3f55", grip: "#1d2235", metal: "#5e6c8e", edge: "#bfe8ff", core: "#5bc8ff", glow: "#5bc8ff", trail: "#5bc8ff", sparks: ["#5bc8ff", "#e8f8ff"], power: 1.25 },
  4: { name: "Pulse", shape: "twin", handle: "#3b3552", grip: "#211c33", metal: "#6f6896", edge: "#e2d9ff", core: "#9b74ff", glow: "#9b74ff", trail: "#b9a2ff", sparks: ["#b9a2ff", "#ffffff"], power: 1.4 },
  5: { name: "Arc", shape: "arc", handle: "#2f3d4f", grip: "#16212e", metal: "#4f6680", edge: "#9ff3ff", core: "#3dd6f5", glow: "#3dd6f5", trail: "#3dd6f5", sparks: ["#3dd6f5", "#ffffff", "#b9a2ff"], power: 1.6 },
  6: { name: "Nova", shape: "crystal-large", handle: "#3a2c55", grip: "#1f1533", metal: "#5a3f8f", edge: "#f0e8ff", core: "#c49bff", glow: "#a77bff", trail: "#c49bff", sparks: ["#c49bff", "#ffffff", "#ffd27a"], power: 1.8 },
  7: { name: "Quasar", shape: "ring", handle: "#2a2f4a", grip: "#13162a", metal: "#3e4a7a", edge: "#ffffff", core: "#7c8cff", glow: "#7c8cff", trail: "#9fb0ff", sparks: ["#9fb0ff", "#3dd6f5", "#ffffff"], power: 2 },
  8: { name: "Pulsar", shape: "twin", handle: "#203a40", grip: "#0f1f24", metal: "#2f6b73", edge: "#c7fff5", core: "#3de0c8", glow: "#3de0c8", trail: "#3de0c8", sparks: ["#3de0c8", "#ffffff", "#3dd6f5"], power: 2.2 },
  9: { name: "Zenith", shape: "winged", handle: "#4a3a1f", grip: "#2a1f0e", metal: "#a8823a", edge: "#fff1c4", core: "#f5b544", glow: "#f5b544", trail: "#ffd27a", sparks: ["#ffd27a", "#ffffff", "#f5b544"], power: 2.5 },
  10: { name: "Singularity", shape: "singularity", handle: "#1b1630", grip: "#0b0914", metal: "#1d1a2e", edge: "#ffffff", core: "#0b0b0f", glow: "#b9a2ff", trail: "#ffd27a", sparks: ["#ffffff", "#ffd27a", "#b9a2ff", "#3dd6f5"], power: 3 },
};

export function pickaxe(tier) {
  return PICKAXES[Math.min(10, Math.max(1, Number(tier) || 1))];
}
