import { Button, Card, Chip, PlannedBadge, ScreenHeader, SectionTitle } from "../ui/kit";
import { IconShare, IconUsers } from "../ui/icons";
import { openTelegramLink } from "../lib/telegram";

const BOT_LINK = "https://t.me/GlaxMinerBot";

// Sharing works today. Referral tracking and rewards don't exist on the
// server, so this screen promises none.
export default function Crew() {
  function share() {
    const text = "Run an outpost in the Glax Belt with me: mine Glaxite and upgrade your rig in GlaxMiner.";
    openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(BOT_LINK)}&text=${encodeURIComponent(text)}`);
  }
  return (
    <div className="screen crew">
      <ScreenHeader kicker="Profile" title="Crew" />

      <Card className="crew-hero">
        <div className="crew-hero__icon"><IconUsers size={28} /></div>
        <h2>Bring your crew to the Belt</h2>
        <p>Share GlaxMiner with friends in Telegram. Everyone mines on their own outpost.</p>
        <Button variant="primary" icon={<IconShare size={18} />} onClick={share}>
          Share in Telegram
        </Button>
        <div className="crew-hero__link mono">t.me/GlaxMinerBot</div>
      </Card>

      <Card>
        <SectionTitle aside={<PlannedBadge />}>Crew rewards</SectionTitle>
        <p className="teaser__text">
          Invite tracking, qualification rules and crew rewards aren't built yet. Invites today are just invites: they don't earn GLX for you or your friends.
        </p>
        <div className="crew-preview" aria-hidden="true">
          <div><span>Invited</span><strong>—</strong></div>
          <div><span>Qualified</span><strong>—</strong></div>
          <div><span>Rewards</span><Chip tone="neutral">TBA</Chip></div>
        </div>
      </Card>
    </div>
  );
}
