import { useState } from "react";
import { motion } from "framer-motion";
import { useGame } from "../state/GameProvider";
import MiningStage from "../game/MiningStage";
import { sfx, unlockAudio } from "../game/sound";
import { pickaxe } from "../game/pickaxes";
import PickaxeIcon from "../game/PickaxeIcon";
import LiveCounter from "../ui/LiveCounter";
import { Button, Card, Chip, Meter, PlannedBadge, SectionTitle, Ticker } from "../ui/kit";
import { IconBolt, IconChevron, IconClock, IconContracts, IconArrowUp } from "../ui/icons";
import { clock, glx, hms, humanDuration } from "../lib/format";
import { tierInfo, MINING_DURATION } from "../data/economy";
import ClaimCeremony from "./ClaimCeremony";

export default function Outpost({ go }) {
  const { session, balance, level, busy, start, claim, serverNow, notify } = useGame();
  const [result, setResult] = useState(null);
  const rig = tierInfo(level);
  const pk = pickaxe(level);
  const payout = session.reward ?? rig.reward;
  const st = session.state;
  const rate = payout / MINING_DURATION;

  async function onStart() {
    unlockAudio();
    await start();
  }
  async function onClaim() {
    unlockAudio();
    const r = await claim();
    if (r) {
      sfx.claim();
      setResult(r);
    }
  }
  async function onStartNext() {
    await start();
    setResult(null);
  }

  const toNext = rig.nextCost != null ? Math.max(0, rig.nextCost - balance) : 0;
  const affordable = rig.nextCost != null && balance >= rig.nextCost;

  return (
    <div className="screen outpost">
      <section className={`mine mine--${st}`} aria-label="Mining site">
        <MiningStage
          mode={st}
          tier={level}
          charge={session.progress}
          label={st === "mining" ? `Your miner is working the Glaxite deposit, ${Math.floor(session.progress * 100)} percent of the session done` : st === "ready" ? "The deposit is fully charged" : "Your miner waits by the Glaxite deposit"}
          onIdleTap={() => st === "idle" && notify("Start a session to put your miner to work.")}
        />
        <div className="mine__hud">
          <div className="mine__hud-top">
            {st === "mining" && (
              <span className="mine__timer" aria-label={`Mining, ${humanDuration(session.left)} left`}>
                <span className="chip__dot" aria-hidden="true" />
                <span className="mono">{hms(session.left)}</span>
              </span>
            )}
            {st === "ready" && <Chip tone="ready">Charge complete</Chip>}
            {st === "idle" && <Chip tone="neutral">Miner resting</Chip>}
            <span className="mine__gear">
              <PickaxeIcon tier={level} size={22} />
              <span>{pk.name}</span>
            </span>
          </div>
          {st === "mining" && <div className="mine__hint">Tap the ore to swing · strikes are just for fun</div>}
        </div>
        <div className="mine__progress" aria-hidden="true">
          <span style={{ transform: `scaleX(${session.progress})` }} className={st === "ready" ? "is-ready" : ""} />
        </div>
      </section>

      {st === "idle" ? (
        <div className="idle-card">
          <div className="idle-card__label">Next session pays</div>
          <div className="idle-card__value">
            {glx(payout)} <span>GLX</span>
          </div>
          <div className="idle-card__rate">
            <span className="mono">{rate.toFixed(6)}</span> GLX / sec over {humanDuration(MINING_DURATION)}
          </div>
        </div>
      ) : (
        <LiveCounter start={session.start} duration={session.duration} reward={payout} serverNow={serverNow} ready={st === "ready"} />
      )}

      <div className="hero__action">
        {st === "idle" && (
          <Button variant="primary" busy={busy === "start"} onClick={onStart} icon={<IconBolt size={18} />} className="btn--cta">
            Start mining · {humanDuration(MINING_DURATION)}
          </Button>
        )}
        {st === "mining" && (
          <Button variant="secondary" disabled icon={<IconClock size={18} />}>
            Claim opens at {clock(session.end)}
          </Button>
        )}
        {st === "ready" && (
          <Button variant="reward" busy={busy === "claim"} onClick={onClaim} className="btn--glow">
            Claim {glx(payout)} GLX
          </Button>
        )}
        {st !== "idle" && <p className="fineprint center">Pending earnings are credited to your Vault only when the server accepts your claim.</p>}
      </div>

      <div className="stat-grid">
        <div className="tile">
          <div className="tile__label">Vault</div>
          <div className="tile__value">
            <Ticker value={balance} />
          </div>
          <div className="tile__hint">GLX credited</div>
        </div>
        <div className="tile">
          <div className="tile__label">Per session</div>
          <div className="tile__value">{glx(rig.reward)}</div>
          <div className="tile__hint">Tier {rig.level} pickaxe</div>
        </div>
        <div className="tile">
          <div className="tile__label">Session</div>
          <div className="tile__value">{humanDuration(MINING_DURATION)}</div>
          <div className="tile__hint">{st === "mining" ? `ends ${clock(session.end)}` : "fixed length"}</div>
        </div>
      </div>

      {rig.next ? (
        <motion.button type="button" className="card nudge" onClick={() => go("lab")} whileTap={{ scale: 0.985 }}>
          <span className="nudge__art">
            <PickaxeIcon tier={rig.next} size={52} />
          </span>
          <span className="nudge__body">
            <span className="nudge__title">
              Next pickaxe: {rig.nextName} <span className="tone-muted">· Tier {rig.next}</span>
            </span>
            <span className="nudge__text">
              {glx(rig.reward)} → <strong className="tone-glaxite">{glx(rig.nextReward)} GLX</strong> per session
            </span>
            <span className="nudge__meter">
              <Meter value={rig.nextCost ? balance / rig.nextCost : 1} tone={affordable ? "ok" : "glaxite"} label="Progress to next upgrade" />
              <span className="nudge__need">{affordable ? "Ready to forge" : `${glx(toNext)} GLX to go`}</span>
            </span>
          </span>
          <span className="nudge__go" aria-hidden="true">
            {affordable ? <IconArrowUp size={20} /> : <IconChevron size={20} />}
          </span>
        </motion.button>
      ) : (
        <Card className="nudge nudge--max">
          <span className="nudge__art">
            <PickaxeIcon tier={10} size={52} />
          </span>
          <span className="nudge__body">
            <span className="nudge__title">Singularity pickaxe</span>
            <span className="nudge__text">Maximum tier reached. {glx(rig.reward)} GLX per session.</span>
          </span>
        </Card>
      )}

      <Card className="teaser">
        <SectionTitle aside={<PlannedBadge />}>Daily contracts</SectionTitle>
        <p className="teaser__text">Short daily objectives with streaks. Rules and rewards are still being designed, so nothing here pays out yet.</p>
        <button type="button" className="link-row" onClick={() => go("contracts")}>
          <IconContracts size={18} />
          <span>Preview Contracts</span>
          <IconChevron size={18} />
        </button>
      </Card>

      <ClaimCeremony result={result} onClose={() => setResult(null)} onStartNext={onStartNext} startBusy={busy === "start"} />
    </div>
  );
}
