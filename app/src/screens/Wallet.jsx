import { useGame } from "../state/GameProvider";
import { FacetMark } from "../art/Facet";
import { Card, ScreenHeader, Ticker } from "../ui/kit";
import { IconShield } from "../ui/icons";
import { glx } from "../lib/format";
import { tierInfo } from "../data/economy";
import { PendingValue } from "../ui/LiveCounter";

// Balance is exactly what the server returned; pending is the current
// session's share of its server-set reward, not yet credited.
export default function Wallet() {
  const { balance, level, session, serverNow } = useGame();
  const st = session.state;
  const pending = st !== "idle" ? session.reward ?? tierInfo(level).reward : 0;

  return (
    <div className="screen wallet">
      <ScreenHeader title="Wallet" />

      <Card className="vault-card">
        <div className="vault-card__sheen" aria-hidden="true" />
        <div className="vault-card__top">
          <span className="vault-card__label">GLX balance</span>
          <FacetMark size={28} />
        </div>
        <div className="vault-card__amount">
          <Ticker value={balance} /> <span>GLX</span>
        </div>
        <div className="vault-card__split">
          <div>
            <span>Credited</span>
            <strong>{glx(balance)}</strong>
          </div>
          <div>
            <span>{st === "ready" ? "Ready to claim" : st === "mining" ? "Pending (not yet credited)" : "Pending"}</span>
            {pending ? (
              <PendingValue start={session.start} duration={session.duration} reward={pending} serverNow={serverNow} ready={st === "ready"} className={st === "ready" ? "tone-reward" : "tone-live"} />
            ) : (
              <strong>0</strong>
            )}
          </div>
        </div>
      </Card>

      <p className="notice">
        <IconShield size={16} />
        <span>Deposits and withdrawals are switched off. GLX is an in-app reward balance; it can't be bought, sold or cashed out here.</span>
      </p>
    </div>
  );
}
