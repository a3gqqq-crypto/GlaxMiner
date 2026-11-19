import { useState } from "react";
import { useGame } from "../state/GameProvider";
import MiningStage from "../game/MiningStage";
import { sfx, unlockAudio } from "../game/sound";
import { pickaxe } from "../game/pickaxes";
import LiveCounter from "../ui/LiveCounter";
import { Button } from "../ui/kit";
import { IconBolt, IconClock } from "../ui/icons";
import { clock, glx, hms, humanDuration } from "../lib/format";
import { tierInfo, MINING_DURATION } from "../data/economy";
import ClaimCeremony from "./ClaimCeremony";

// Main screen: the earning session. Everything shown here comes from the
// server (session start, duration, reward, balance); the scene is decoration.
export default function Mine() {
  const { session, level, busy, start, claim, serverNow } = useGame();
  const [result, setResult] = useState(null);
  const rig = tierInfo(level);
  const st = session.state;
  const reward = session.reward ?? rig.reward;
  const duration = session.duration || MINING_DURATION;
  const pct = Math.floor((st === "ready" ? 1 : session.progress) * 100);

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

  const status = st === "mining" ? "Mining" : st === "ready" ? "Ready to claim" : "Not mining";

  return (
    <div className="screen mine-screen">
      <section className={`mine mine--${st}`} aria-label="Mining">
        <MiningStage
          mode={st}
          tier={level}
          charge={session.progress}
          interactive={false}
          label={st === "mining" ? `Mining session in progress, ${pct} percent done` : st === "ready" ? "Mining session complete" : "Miner waiting for a session to start"}
        />
        <div className="mine__hud">
          <div className="mine__hud-top">
            <span className={`mine__status mine__status--${st}`}>
              <span className="chip__dot" aria-hidden="true" />
              {status}
            </span>
            <span className="mine__gear">{pickaxe(level).name} · Tier {level}</span>
          </div>
        </div>
      </section>

      <section className="earn" aria-label="Session earnings">
        <LiveCounter state={st} start={session.start} duration={duration} reward={reward} serverNow={serverNow} />

        <div className="earn__progress">
          <div className="earn__bar" role="progressbar" aria-label="Session progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
            <span className={st === "ready" ? "is-ready" : ""} style={{ transform: `scaleX(${st === "idle" ? 0 : st === "ready" ? 1 : session.progress})` }} />
          </div>
          <div className="earn__meta">
            <span>{st === "idle" ? "0%" : `${pct}%`}</span>
            <span className="mono">
              {st === "mining" ? `${hms(session.left)} left` : st === "ready" ? "Session complete" : `${humanDuration(duration)} session`}
            </span>
          </div>
        </div>

        <div className="earn__action">
          {st === "idle" && (
            <Button variant="primary" busy={busy === "start"} onClick={onStart} icon={<IconBolt size={18} />} className="btn--cta">
              Start mining
            </Button>
          )}
          {st === "mining" && (
            <Button variant="secondary" disabled icon={<IconClock size={18} />}>
              Claim at {clock(session.end)}
            </Button>
          )}
          {st === "ready" && (
            <Button variant="reward" busy={busy === "claim"} onClick={onClaim} className="btn--glow">
              Claim {glx(reward)} GLX
            </Button>
          )}
        </div>
        <p className="fineprint center">
          {st === "idle"
            ? `A session lasts ${humanDuration(duration)} and pays ${glx(reward)} GLX with your current pickaxe.`
            : "Pending GLX is added to your wallet when the server accepts your claim."}
        </p>
      </section>

      <ClaimCeremony result={result} onClose={() => setResult(null)} onStartNext={onStartNext} startBusy={busy === "start"} />
    </div>
  );
}
