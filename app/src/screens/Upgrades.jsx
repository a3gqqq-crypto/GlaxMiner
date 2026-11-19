import { useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useGame } from "../state/GameProvider";
import PickaxeIcon from "../game/PickaxeIcon";
import { pickaxe } from "../game/pickaxes";
import { sfx, unlockAudio } from "../game/sound";
import { Button, Meter, ScreenHeader, SectionTitle, Sheet } from "../ui/kit";
import { IconArrowUp, IconCheck, IconLock } from "../ui/icons";
import { glx, humanDuration } from "../lib/format";
import { MAX_PICKAXE_LEVEL, MINING_DURATION, PICKAXE_LEVELS, tierInfo } from "../data/economy";

// Prices and rewards mirror the server's table (server/config/mining.js);
// the server charges and checks the real price when you confirm.
const rateOf = (t) => PICKAXE_LEVELS[t].reward / MINING_DURATION;

export default function Upgrades() {
  const { balance, level, busy, upgrade, session } = useGame();
  const rig = tierInfo(level);
  const [confirm, setConfirm] = useState(false);
  const [done, setDone] = useState(null);

  const affordable = rig.nextCost != null && balance >= rig.nextCost;
  const short = rig.nextCost != null ? Math.max(0, rig.nextCost - balance) : 0;

  async function doUpgrade() {
    unlockAudio();
    const r = await upgrade();
    setConfirm(false);
    if (r) {
      sfx.upgrade();
      setDone(r.level);
    }
  }

  return (
    <div className="screen upgrades">
      <ScreenHeader title="Upgrades" />

      <section className="card pick-card" aria-label="Current pickaxe">
        <PickaxeIcon tier={level} size={64} />
        <div className="pick-card__body">
          <div className="pick-card__label">Your pickaxe</div>
          <div className="pick-card__name">{rig.name} <span>· Tier {level}/{MAX_PICKAXE_LEVEL}</span></div>
          <div className="pick-card__stats">
            <span><strong>{glx(rig.reward)} GLX</strong> per {humanDuration(MINING_DURATION)}</span>
            <span className="mono">{rateOf(level).toFixed(6)} GLX/sec</span>
          </div>
        </div>
      </section>

      {rig.next ? (
        <section className="card next-card" aria-label="Next upgrade">
          <SectionTitle>Next: {rig.nextName} · Tier {rig.next}</SectionTitle>
          <div className="next-card__grid">
            <div><span>Per session</span><strong>{glx(rig.reward)} → {glx(rig.nextReward)} GLX</strong></div>
            <div><span>Extra per session</span><strong className="tone-live">+{glx(rig.nextReward - rig.reward)} GLX</strong></div>
            <div><span>Cost</span><strong>{glx(rig.nextCost)} GLX</strong></div>
            <div><span>Your balance</span><strong>{glx(balance)} GLX</strong></div>
          </div>
          <Meter value={balance / rig.nextCost} tone={affordable ? "ok" : "glaxite"} label="Balance toward the upgrade cost" />
          <Button variant="primary" disabled={!affordable} onClick={() => setConfirm(true)} icon={affordable ? <IconArrowUp size={18} /> : <IconLock size={18} />} className={affordable ? "btn--cta" : ""}>
            {affordable ? `Upgrade for ${glx(rig.nextCost)} GLX` : `Need ${glx(short)} more GLX`}
          </Button>
          {session.state !== "idle" && <p className="fineprint">A claim pays the reward of the pickaxe you hold when you claim.</p>}
        </section>
      ) : (
        <section className="card next-card">
          <SectionTitle>Top tier reached</SectionTitle>
          <p className="fineprint">{rig.name} is the highest pickaxe: {glx(rig.reward)} GLX per session.</p>
        </section>
      )}

      <SectionTitle>All pickaxes</SectionTitle>
      <div className="tiers" role="table" aria-label="Pickaxe rewards and costs">
        <div className="tiers__head" role="row">
          <span role="columnheader">Pickaxe</span>
          <span role="columnheader">Per session</span>
          <span role="columnheader">Cost</span>
        </div>
        {Array.from({ length: MAX_PICKAXE_LEVEL }, (_, i) => {
          const t = i + 1;
          const own = t <= level;
          return (
            <div key={t} role="row" className={`tiers__row ${t === level ? "is-current" : ""} ${t === rig.next ? "is-next" : ""}`}>
              <span role="cell" className="tiers__name">
                <PickaxeIcon tier={t} size={32} dim={!own && t !== rig.next} />
                <span><small>Tier {t}</small>{pickaxe(t).name}</span>
              </span>
              <span role="cell" className="tiers__reward">{glx(PICKAXE_LEVELS[t].reward)} GLX</span>
              <span role="cell" className="tiers__cost">
                {own ? <span className="tiers__owned"><IconCheck size={14} /> {t === level ? "Current" : "Owned"}</span> : `${glx(PICKAXE_LEVELS[t].upgradeCost)} GLX`}
              </span>
            </div>
          );
        })}
      </div>
      <p className="fineprint">Upgrades unlock in order. The server checks the price and your balance when you confirm.</p>

      <Sheet open={confirm} onClose={() => setConfirm(false)} title="Confirm upgrade" labelledBy="confirm-upgrade">
        {rig.next && (
          <div className="confirm">
            <div className="confirm__art"><PickaxeIcon tier={rig.next} size={96} /></div>
            <div className="confirm__rows">
              <div><span>Pickaxe</span><strong>{rig.name} → {rig.nextName}</strong></div>
              <div><span>Per session</span><strong>{glx(rig.reward)} → {glx(rig.nextReward)} GLX</strong></div>
              <div><span>Cost</span><strong>{glx(rig.nextCost)} GLX</strong></div>
              <div><span>Balance after</span><strong>{glx(balance - rig.nextCost)} GLX</strong></div>
            </div>
            <Button variant="primary" busy={busy === "upgrade"} onClick={doUpgrade}>
              Pay {glx(rig.nextCost)} GLX and upgrade
            </Button>
          </div>
        )}
      </Sheet>

      <UpgradeDone tier={done} onDone={() => setDone(null)} />
    </div>
  );
}

// Shown after the server confirms an upgrade.
function UpgradeDone({ tier, onDone }) {
  if (typeof document === "undefined") return null;
  const pk = tier ? pickaxe(tier) : null;
  return createPortal(
    <AnimatePresence>
      {tier && (
        <motion.div className="reveal" role="dialog" aria-modal="true" aria-labelledby="reveal-title" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="reveal__rays" aria-hidden="true" initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1, rotate: 30 }} transition={{ duration: 1.6, ease: [0.2, 0.7, 0.2, 1] }} style={{ "--ray": pk.glow || pk.trail }} />
          <motion.div className="reveal__card" initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15, duration: 0.45 }}>
            <motion.div initial={{ rotate: -140, scale: 0.3 }} animate={{ rotate: 0, scale: 1 }} transition={{ duration: 0.8, ease: [0.2, 0.9, 0.25, 1.15] }}>
              <PickaxeIcon tier={tier} size={140} />
            </motion.div>
            <div className="reveal__kicker">Upgraded · Tier {tier}</div>
            <h2 id="reveal-title" className="reveal__name">{pk.name}</h2>
            <div className="reveal__stats">
              <div><span>Per session</span><strong>{glx(PICKAXE_LEVELS[tier].reward)} GLX</strong></div>
              <div><span>Rate</span><strong className="mono">{rateOf(tier).toFixed(6)}/s</strong></div>
            </div>
            <Button variant="primary" onClick={onDone}>Continue</Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
