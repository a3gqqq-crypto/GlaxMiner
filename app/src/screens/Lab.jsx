import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useGame } from "../state/GameProvider";
import MiningStage from "../game/MiningStage";
import PickaxeIcon from "../game/PickaxeIcon";
import { pickaxe } from "../game/pickaxes";
import { sfx, unlockAudio } from "../game/sound";
import { Button, Chip, Meter, ScreenHeader, SectionTitle, Sheet } from "../ui/kit";
import { IconArrowUp, IconCheck, IconLock } from "../ui/icons";
import { glx } from "../lib/format";
import { MAX_PICKAXE_LEVEL, MINING_DURATION, PICKAXE_LEVELS, tierInfo } from "../data/economy";

const rateOf = (t) => PICKAXE_LEVELS[t].reward / MINING_DURATION;

export default function Lab() {
  const { balance, level, busy, upgrade, session } = useGame();
  const rig = tierInfo(level);
  const [sel, setSel] = useState(level);
  const [confirm, setConfirm] = useState(false);
  const [forged, setForged] = useState(null);
  const rail = useRef(null);

  useEffect(() => setSel(level), [level]);
  useEffect(() => {
    const el = rail.current?.querySelector(`[data-tier="${sel}"]`);
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [sel]);

  const selPk = pickaxe(sel);
  const owned = sel <= level;
  const isNext = sel === rig.next;
  const affordable = rig.nextCost != null && balance >= rig.nextCost;
  const short = rig.nextCost != null ? Math.max(0, rig.nextCost - balance) : 0;
  const sessionsNeeded = short > 0 ? Math.ceil(short / rig.reward) : 0;

  async function doUpgrade() {
    unlockAudio();
    const r = await upgrade();
    setConfirm(false);
    if (r) {
      sfx.upgrade();
      setForged(r.level);
    }
  }

  return (
    <div className="screen lab">
      <ScreenHeader kicker="Equipment" title="Workshop" aside={<Chip tone="glaxite">Tier {level}/{MAX_PICKAXE_LEVEL}</Chip>} />

      <section className="bench" aria-label={`Pickaxe preview: ${selPk.name}`}>
        <MiningStage mode="preview" tier={sel} charge={0.6} label={`Preview of the ${selPk.name} pickaxe mining`} />
        <div className="bench__hud">
          <span className={`bench__tag ${owned ? "" : "is-locked"}`}>
            {sel === level ? "Equipped" : owned ? "Owned" : isNext ? "Next upgrade" : "Locked"}
          </span>
          <AnimatePresence mode="wait">
            <motion.div key={sel} className="bench__name" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
              <span className="bench__tier">Tier {sel}</span>
              {selPk.name}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      <div className="rail" ref={rail} role="listbox" aria-label="Pickaxe tiers">
        {Array.from({ length: MAX_PICKAXE_LEVEL }, (_, i) => {
          const t = i + 1;
          const state = t <= level ? "owned" : t === rig.next ? "next" : "locked";
          return (
            <button
              key={t}
              type="button"
              role="option"
              aria-selected={t === sel}
              data-tier={t}
              className={`rail__item is-${state} ${t === sel ? "is-sel" : ""}`}
              onClick={() => setSel(t)}
            >
              <PickaxeIcon tier={t} size={46} dim={state === "locked"} />
              <span className="rail__t">T{t}</span>
              {state === "owned" && t === level && <span className="rail__badge">On</span>}
              {state === "locked" && <IconLock size={11} className="rail__lock" />}
            </button>
          );
        })}
      </div>

      <div className="spec">
        <div className="spec__cell">
          <span>Per session</span>
          <strong>{glx(PICKAXE_LEVELS[sel].reward)} GLX</strong>
        </div>
        <div className="spec__cell">
          <span>Rate</span>
          <strong className="mono">{rateOf(sel).toFixed(6)}</strong>
          <small>GLX / sec</small>
        </div>
        <div className="spec__cell">
          <span>{owned ? "Status" : "Price"}</span>
          <strong>{owned ? (sel === level ? "Equipped" : "Owned") : `${glx(PICKAXE_LEVELS[sel].upgradeCost)} GLX`}</strong>
        </div>
      </div>
      {sel > level && sel !== rig.next && (
        <p className="fineprint center">Tiers unlock in order. Forge Tier {rig.next} ({rig.nextName}) first.</p>
      )}

      {rig.next ? (
        <section className="card forge">
          <SectionTitle aside={<span className="forge__delta">+{glx(rig.nextReward - rig.reward)} GLX / session</span>}>Forge {rig.nextName}</SectionTitle>
          <div className="forge__row">
            <div className="forge__side">
              <PickaxeIcon tier={level} size={40} />
              <div>
                <div className="forge__label">Now</div>
                <div className="forge__val">{glx(rig.reward)}</div>
              </div>
            </div>
            <IconArrowUp size={20} className="forge__arrow" />
            <div className="forge__side">
              <PickaxeIcon tier={rig.next} size={40} />
              <div>
                <div className="forge__label">Tier {rig.next}</div>
                <div className="forge__val tone-glaxite">{glx(rig.nextReward)}</div>
              </div>
            </div>
          </div>
          <Meter value={balance / rig.nextCost} tone={affordable ? "ok" : "glaxite"} label="Balance toward the forge price" />
          <div className="forge__progress">
            <span>{glx(balance)} / {glx(rig.nextCost)} GLX</span>
            <span>{affordable ? "Ready to forge" : `${glx(short)} short · ~${sessionsNeeded} session${sessionsNeeded === 1 ? "" : "s"}`}</span>
          </div>
          <Button variant="primary" disabled={!affordable} onClick={() => setConfirm(true)} icon={affordable ? <IconArrowUp size={18} /> : <IconLock size={18} />} className={affordable ? "btn--cta" : ""}>
            {affordable ? `Forge for ${glx(rig.nextCost)} GLX` : "Not enough GLX yet"}
          </Button>
          {session.state !== "idle" && <p className="fineprint">A claim pays the rate of the pickaxe you hold when you claim.</p>}
        </section>
      ) : (
        <section className="card forge">
          <SectionTitle>Fully forged</SectionTitle>
          <p className="fineprint">Your Singularity pickaxe is the top tier: {glx(rig.reward)} GLX per session.</p>
        </section>
      )}

      <SectionTitle>All tiers</SectionTitle>
      <ol className="track">
        {Array.from({ length: MAX_PICKAXE_LEVEL }, (_, i) => {
          const t = i + 1;
          const own = t <= level;
          return (
            <li key={t} className={`track__row ${own ? "is-owned" : ""} ${t === rig.next ? "is-next" : ""} ${t === level ? "is-current" : ""}`}>
              <button type="button" className="track__btn" onClick={() => setSel(t)} aria-label={`Preview tier ${t}, ${pickaxe(t).name}`}>
                <span className="track__art"><PickaxeIcon tier={t} size={40} dim={!own && t !== rig.next} /></span>
                <span className="track__name"><span className="track__tier">Tier {t}</span>{pickaxe(t).name}</span>
                <span className="track__reward">{glx(PICKAXE_LEVELS[t].reward)}<small> GLX</small></span>
                <span className="track__cost">
                  {own ? <span className="track__owned"><IconCheck size={14} /> {t === level ? "Equipped" : "Owned"}</span> : `${glx(PICKAXE_LEVELS[t].upgradeCost)} GLX`}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <p className="fineprint">Prices and payouts are set by the server and checked again when you confirm.</p>

      <Sheet open={confirm} onClose={() => setConfirm(false)} title="Confirm forge" labelledBy="confirm-upgrade">
        {rig.next && (
          <div className="confirm">
            <div className="confirm__art"><PickaxeIcon tier={rig.next} size={110} /></div>
            <div className="confirm__rows">
              <div><span>Pickaxe</span><strong>{rig.name} → {rig.nextName}</strong></div>
              <div><span>Per session</span><strong>{glx(rig.reward)} → {glx(rig.nextReward)} GLX</strong></div>
              <div><span>Rate</span><strong className="mono">{rateOf(rig.level).toFixed(6)} → {rateOf(rig.next).toFixed(6)}</strong></div>
              <div><span>Price</span><strong>{glx(rig.nextCost)} GLX</strong></div>
              <div><span>Vault after</span><strong>{glx(balance - rig.nextCost)} GLX</strong></div>
            </div>
            <Button variant="primary" busy={busy === "upgrade"} onClick={doUpgrade}>
              Pay {glx(rig.nextCost)} GLX and forge
            </Button>
          </div>
        )}
      </Sheet>

      <ForgeReveal tier={forged} onDone={() => setForged(null)} />
    </div>
  );
}

// Full-screen reveal after the server confirms an upgrade.
function ForgeReveal({ tier, onDone }) {
  if (typeof document === "undefined") return null;
  const pk = tier ? pickaxe(tier) : null;
  return createPortal(
    <AnimatePresence>
      {tier && (
        <motion.div className="reveal" role="dialog" aria-modal="true" aria-labelledby="reveal-title" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="reveal__rays" aria-hidden="true" initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1, rotate: 30 }} transition={{ duration: 1.6, ease: [0.2, 0.7, 0.2, 1] }} style={{ "--ray": pk.glow || pk.trail }} />
          <motion.div className="reveal__card" initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15, duration: 0.45 }}>
            <motion.div initial={{ rotate: -140, scale: 0.3 }} animate={{ rotate: 0, scale: 1 }} transition={{ duration: 0.8, ease: [0.2, 0.9, 0.25, 1.15] }}>
              <PickaxeIcon tier={tier} size={150} />
            </motion.div>
            <div className="reveal__kicker">Forged · Tier {tier}</div>
            <h2 id="reveal-title" className="reveal__name">{pk.name}</h2>
            <div className="reveal__stats">
              <div><span>Per session</span><strong>{glx(PICKAXE_LEVELS[tier].reward)} GLX</strong></div>
              <div><span>Rate</span><strong className="mono">{rateOf(tier).toFixed(6)}/s</strong></div>
            </div>
            <MiningStage mode="preview" tier={tier} charge={0.8} label={`${pk.name} mining preview`} className="reveal__stage" />
            <Button variant="primary" onClick={onDone}>Equip and continue</Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
