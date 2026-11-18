import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGame } from "../state/GameProvider";
import RigArt from "../art/RigArt";
import { Button, Card, Meter, ScreenHeader, SectionTitle, Sheet } from "../ui/kit";
import { IconArrowUp, IconCheck, IconLock } from "../ui/icons";
import { glx } from "../lib/format";
import { MAX_PICKAXE_LEVEL, PICKAXE_LEVELS, RIG_NAMES, tierInfo } from "../data/economy";

export default function Lab() {
  const { balance, level, busy, upgrade, session } = useGame();
  const rig = tierInfo(level);
  const [confirm, setConfirm] = useState(false);
  const [justUpgraded, setJustUpgraded] = useState(null);
  const affordable = rig.nextCost != null && balance >= rig.nextCost;
  const short = rig.nextCost != null ? Math.max(0, rig.nextCost - balance) : 0;
  const sessionsNeeded = short > 0 ? Math.ceil(short / rig.reward) : 0;

  async function doUpgrade() {
    const r = await upgrade();
    setConfirm(false);
    if (r) {
      setJustUpgraded(r.level);
      setTimeout(() => setJustUpgraded(null), 2600);
    }
  }

  return (
    <div className="screen lab">
      <ScreenHeader kicker="Rig workshop" title="Lab" />

      <Card className="rig-hero">
        <div className="rig-hero__art">
          <AnimatePresence mode="wait">
            <motion.div
              key={rig.level}
              initial={{ opacity: 0, scale: 0.9, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }}
            >
              <RigArt tier={rig.level} size={176} />
            </motion.div>
          </AnimatePresence>
          {justUpgraded && <div className="rig-hero__flash" aria-live="polite">Installed · Tier {justUpgraded}</div>}
        </div>
        <div className="rig-hero__info">
          <div className="rig-hero__tier">Tier {rig.level} of {MAX_PICKAXE_LEVEL}</div>
          <div className="rig-hero__name">{rig.name}</div>
          <div className="rig-hero__yield">
            <strong>{glx(rig.reward)} GLX</strong> per 5h session
          </div>
        </div>
      </Card>

      {rig.next ? (
        <Card className="upgrade">
          <SectionTitle>Next upgrade</SectionTitle>
          <div className="upgrade__compare">
            <div>
              <div className="upgrade__label">Now · {rig.name}</div>
              <div className="upgrade__val">{glx(rig.reward)}</div>
            </div>
            <IconArrowUp size={22} className="upgrade__arrow" style={{ transform: "rotate(90deg)" }} />
            <div>
              <div className="upgrade__label">Tier {rig.next} · {rig.nextName}</div>
              <div className="upgrade__val tone-glaxite">{glx(rig.nextReward)}</div>
            </div>
            <div className="upgrade__delta">+{glx(rig.nextReward - rig.reward)} GLX / session</div>
          </div>
          <div className="upgrade__cost">
            <span>Price</span>
            <strong>{glx(rig.nextCost)} GLX</strong>
          </div>
          <Meter value={balance / rig.nextCost} tone={affordable ? "ok" : "glaxite"} label="Balance toward the upgrade price" />
          <div className="upgrade__progress">
            <span>
              You have {glx(balance)} GLX
            </span>
            <span>{affordable ? "Enough to upgrade" : `${glx(short)} short · about ${sessionsNeeded} session${sessionsNeeded === 1 ? "" : "s"}`}</span>
          </div>
          <Button variant="primary" disabled={!affordable} onClick={() => setConfirm(true)} icon={affordable ? <IconArrowUp size={18} /> : <IconLock size={18} />}>
            {affordable ? `Upgrade to ${rig.nextName}` : "Not enough GLX yet"}
          </Button>
          {session.state !== "idle" && <p className="fineprint">A claim pays the rate of your rig at the moment you claim.</p>}
        </Card>
      ) : (
        <Card className="upgrade upgrade--max">
          <SectionTitle>Maximum tier</SectionTitle>
          <p className="fineprint">Your rig is fully upgraded. Every session pays {glx(rig.reward)} GLX.</p>
        </Card>
      )}

      <SectionTitle>Upgrade track</SectionTitle>
      <ol className="track">
        {Array.from({ length: MAX_PICKAXE_LEVEL }, (_, i) => {
          const t = i + 1;
          const owned = t <= rig.level;
          const isNext = t === rig.next;
          return (
            <li key={t} className={`track__row ${owned ? "is-owned" : ""} ${isNext ? "is-next" : ""} ${t === rig.level ? "is-current" : ""}`}>
              <span className="track__art">
                <RigArt tier={t} size={44} dim={!owned && !isNext} />
              </span>
              <span className="track__name">
                <span className="track__tier">Tier {t}</span>
                {RIG_NAMES[t]}
              </span>
              <span className="track__reward">
                {glx(PICKAXE_LEVELS[t].reward)}
                <small> GLX</small>
              </span>
              <span className="track__cost">
                {owned ? (
                  <span className="track__owned">
                    <IconCheck size={14} /> {t === rig.level ? "Current" : "Owned"}
                  </span>
                ) : (
                  `${glx(PICKAXE_LEVELS[t].upgradeCost)} GLX`
                )}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="fineprint">Prices and payouts are set by the server and checked again when you confirm.</p>

      <Sheet open={confirm} onClose={() => setConfirm(false)} title="Confirm upgrade" labelledBy="confirm-upgrade">
        {rig.next && (
          <div className="confirm">
            <div className="confirm__art">
              <RigArt tier={rig.next} size={120} />
            </div>
            <div className="confirm__rows">
              <div><span>Upgrade</span><strong>{rig.name} → {rig.nextName}</strong></div>
              <div><span>Payout per session</span><strong>{glx(rig.reward)} → {glx(rig.nextReward)} GLX</strong></div>
              <div><span>Price</span><strong>{glx(rig.nextCost)} GLX</strong></div>
              <div><span>Balance after</span><strong>{glx(balance - rig.nextCost)} GLX</strong></div>
            </div>
            <Button variant="primary" busy={busy === "upgrade"} onClick={doUpgrade}>
              Pay {glx(rig.nextCost)} GLX and install
            </Button>
          </div>
        )}
      </Sheet>
    </div>
  );
}
