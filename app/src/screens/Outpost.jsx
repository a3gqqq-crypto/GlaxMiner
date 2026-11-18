import { useState } from "react";
import { motion } from "framer-motion";
import { useGame } from "../state/GameProvider";
import EnergyCore from "../art/EnergyCore";
import RigArt from "../art/RigArt";
import { Button, Card, Chip, Meter, PlannedBadge, SectionTitle, Ticker } from "../ui/kit";
import { IconBolt, IconChevron, IconClock, IconContracts, IconArrowUp } from "../ui/icons";
import { clock, glx, hms, humanDuration } from "../lib/format";
import { tierInfo, MINING_DURATION } from "../data/economy";
import ClaimCeremony from "./ClaimCeremony";

export default function Outpost({ go }) {
  const { session, balance, level, busy, start, claim } = useGame();
  const [result, setResult] = useState(null);
  const rig = tierInfo(level);
  const payout = session.reward ?? rig.reward;
  const st = session.state;

  async function onClaim() {
    const r = await claim();
    if (r) setResult(r);
  }

  async function onStartNext() {
    await start();
    setResult(null);
  }

  const toNext = rig.nextCost != null ? Math.max(0, rig.nextCost - balance) : 0;
  const affordable = rig.nextCost != null && balance >= rig.nextCost;

  return (
    <div className="screen outpost">
      <section className={`hero hero--${st}`} aria-labelledby="core-status">
        <div className="hero__core">
          <EnergyCore state={st} progress={session.progress} level={level} />
        </div>

        <div className="hero__readout">
          {st === "idle" && (
            <>
              <Chip tone="neutral">Core idle</Chip>
              <div id="core-status" className="hero__big">
                {glx(payout)} <span>GLX</span>
              </div>
              <div className="hero__sub">pays out after a {humanDuration(MINING_DURATION)} session</div>
            </>
          )}
          {st === "mining" && (
            <>
              <Chip tone="live" pulse>
                Mining · {Math.floor(session.progress * 100)}% charged
              </Chip>
              <div id="core-status" className="hero__big hero__big--mono" aria-label={`${humanDuration(session.left)} left`}>
                {hms(session.left)}
              </div>
              <div className="hero__sub">
                until <strong className="tone-reward">{glx(payout)} GLX</strong> is ready to claim
              </div>
            </>
          )}
          {st === "ready" && (
            <>
              <Chip tone="ready">Charge complete</Chip>
              <div id="core-status" className="hero__big tone-reward">
                {glx(payout)} <span>GLX</span>
              </div>
              <div className="hero__sub">ready to claim</div>
            </>
          )}
        </div>

        <div className="hero__action">
          {st === "idle" && (
            <Button variant="primary" busy={busy === "start"} onClick={start} icon={<IconBolt size={18} />}>
              Start {humanDuration(MINING_DURATION)} session
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
        </div>
      </section>

      {st !== "idle" && (
        <Card className="timeline">
          <div className="timeline__row">
            <span>Started {clock(session.start)}</span>
            <span className={st === "ready" ? "tone-reward" : "tone-live"}>{st === "ready" ? "Complete" : "In progress"}</span>
            <span>Ends {clock(session.end)}</span>
          </div>
          <Meter value={session.progress} tone={st === "ready" ? "reward" : "live"} label="Session progress" />
        </Card>
      )}

      <div className="stat-grid">
        <div className="tile">
          <div className="tile__label">Balance</div>
          <div className="tile__value">
            <Ticker value={balance} />
          </div>
          <div className="tile__hint">GLX</div>
        </div>
        <div className="tile">
          <div className="tile__label">Per session</div>
          <div className="tile__value">{glx(rig.reward)}</div>
          <div className="tile__hint">GLX · Rig {rig.level}</div>
        </div>
        <div className="tile">
          <div className="tile__label">Session</div>
          <div className="tile__value">{humanDuration(MINING_DURATION)}</div>
          <div className="tile__hint">fixed length</div>
        </div>
      </div>

      {rig.next ? (
        <motion.button type="button" className="card nudge" onClick={() => go("lab")} whileTap={{ scale: 0.985 }}>
          <span className="nudge__art">
            <RigArt tier={rig.next} size={64} />
          </span>
          <span className="nudge__body">
            <span className="nudge__title">
              Next rig: {rig.nextName} <span className="tone-muted">· Tier {rig.next}</span>
            </span>
            <span className="nudge__text">
              {glx(rig.reward)} → <strong className="tone-glaxite">{glx(rig.nextReward)} GLX</strong> per session
            </span>
            <span className="nudge__meter">
              <Meter value={rig.nextCost ? balance / rig.nextCost : 1} tone={affordable ? "ok" : "glaxite"} label="Progress to next upgrade" />
              <span className="nudge__need">{affordable ? "Ready to upgrade" : `${glx(toNext)} GLX to go`}</span>
            </span>
          </span>
          <span className="nudge__go" aria-hidden="true">
            {affordable ? <IconArrowUp size={20} /> : <IconChevron size={20} />}
          </span>
        </motion.button>
      ) : (
        <Card className="nudge nudge--max">
          <span className="nudge__art">
            <RigArt tier={10} size={64} />
          </span>
          <span className="nudge__body">
            <span className="nudge__title">Singularity rig</span>
            <span className="nudge__text">Maximum tier reached. {glx(rig.reward)} GLX per session.</span>
          </span>
        </Card>
      )}

      <Card className="teaser">
        <SectionTitle aside={<PlannedBadge />}>Daily contracts</SectionTitle>
        <p className="teaser__text">Short daily objectives with streaks. The rules and rewards are still being designed, so nothing here pays out yet.</p>
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
