import { useGame } from "../state/GameProvider";
import { Card, Chip, PlannedBadge, ScreenHeader, SectionTitle } from "../ui/kit";
import { IconCalendar, IconFlame, IconMap, IconCheck } from "../ui/icons";

// Contracts (missions) are designed but not built on the server yet. This
// screen previews them honestly: no rewards, no progress, nothing claimable.
const DAILY = ["Complete a mining session", "Visit the Lab", "Start a session within an hour of claiming"];
const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

export default function Contracts() {
  const { session } = useGame();
  return (
    <div className="screen contracts">
      <ScreenHeader kicker="Missions" title="Contracts" aside={<PlannedBadge />} />

      <Card className="planned-hero">
        <div className="planned-hero__icon"><IconCalendar size={26} /></div>
        <h2>Daily contracts are coming</h2>
        <p>Three short objectives a day, a streak for showing up, and weekly goals. Rewards will be set with the economy update and paid by the server, so this preview shows no amounts.</p>
      </Card>

      <Card>
        <SectionTitle aside={<Chip tone="neutral">Preview</Chip>}>Daily</SectionTitle>
        <ul className="mission-list">
          {DAILY.map((m, i) => (
            <li key={m} className="mission">
              <span className={`mission__check ${i === 0 && session.state !== "idle" ? "is-hint" : ""}`}>
                <IconCheck size={14} />
              </span>
              <span className="mission__text">{m}</span>
              <span className="mission__reward">Reward TBA</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <SectionTitle aside={<Chip tone="neutral">Preview</Chip>}>Streak</SectionTitle>
        <div className="streak">
          <IconFlame size={22} />
          <div className="streak__days" aria-hidden="true">
            {DAYS.map((d, i) => (
              <span key={i} className="streak__day">{d}</span>
            ))}
          </div>
        </div>
        <p className="fineprint">Streaks will count days with a completed session. Tracking starts when contracts launch.</p>
      </Card>

      <Card className="expedition">
        <div className="expedition__art" aria-hidden="true" />
        <div className="expedition__body">
          <Chip tone="glaxite">Later</Chip>
          <h3><IconMap size={18} /> Expeditions</h3>
          <p>Time-limited sectors of the Belt with their own contracts and boards.</p>
        </div>
      </Card>
    </div>
  );
}
