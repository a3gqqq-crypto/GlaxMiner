import { useGame } from "../state/GameProvider";
import { FacetMark } from "../art/Facet";
import { Card, Chip, PlannedBadge, ScreenHeader, SectionTitle, Ticker } from "../ui/kit";
import { IconDown, IconLock, IconShield, IconArrowUp } from "../ui/icons";
import { glx } from "../lib/format";
import { tierInfo } from "../data/economy";
import { PendingValue } from "../ui/LiveCounter";

export default function Vault() {
  const { balance, level, session, serverNow } = useGame();
  const rig = tierInfo(level);
  const pending = session.state !== "idle" ? session.reward ?? rig.reward : 0;

  return (
    <div className="screen vault">
      <ScreenHeader kicker="Wallet" title="Vault" />

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
            <span>Available</span>
            <strong>{glx(balance)}</strong>
          </div>
          <div>
            <span>{session.state === "ready" ? "Ready to claim" : session.state === "mining" ? "Pending this session" : "No active session"}</span>
            {pending ? (
              <PendingValue start={session.start} duration={session.duration} reward={pending} serverNow={serverNow} ready={session.state === "ready"} className={session.state === "ready" ? "tone-reward" : "tone-live"} />
            ) : (
              <strong>—</strong>
            )}
          </div>
        </div>
      </Card>

      <div className="vault-actions" role="group" aria-label="Transfers">
        <button type="button" className="vault-action" disabled aria-describedby="transfers-off">
          <span className="vault-action__icon"><IconDown size={20} /></span>
          <span>Deposit</span>
          <IconLock size={14} className="vault-action__lock" />
        </button>
        <button type="button" className="vault-action" disabled aria-describedby="transfers-off">
          <span className="vault-action__icon"><IconArrowUp size={20} /></span>
          <span>Withdraw</span>
          <IconLock size={14} className="vault-action__lock" />
        </button>
      </div>
      <p id="transfers-off" className="notice">
        <IconShield size={16} />
        <span>Deposits and withdrawals are switched off. GLX is an in-game resource and can't be bought, sold or cashed out in this app.</span>
      </p>

      <Card className="ledger">
        <SectionTitle aside={<PlannedBadge />}>History</SectionTitle>
        <p className="teaser__text">
          A full record of every session, upgrade and contract is being built on the server. Until it's live, your balance above is the only figure we show, so nothing here is guessed.
        </p>
        <ul className="ledger__ghost" aria-hidden="true">
          {["Mining session", "Pickaxe forge", "Mining session"].map((t, i) => (
            <li key={i}>
              <span className={`ledger__dot ledger__dot--${i === 1 ? "glaxite" : "live"}`} />
              <span className="ledger__t">{t}</span>
              <span className="ledger__bar" />
            </li>
          ))}
        </ul>
      </Card>

      <Card className="vault-facts">
        <SectionTitle>How GLX moves</SectionTitle>
        <ul className="facts">
          <li><Chip tone="live">Earn</Chip><span>Claim a completed 5-hour session: {glx(rig.reward)} GLX with your current pickaxe.</span></li>
          <li><Chip tone="glaxite">Spend</Chip><span>Forge a better pickaxe in the Workshop. The server deducts the exact listed price.</span></li>
          <li><Chip tone="neutral">Off</Chip><span>No deposits, withdrawals, purchases or payouts.</span></li>
        </ul>
      </Card>
    </div>
  );
}
