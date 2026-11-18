import { useEffect, useState } from "react";
import { useGame } from "../state/GameProvider";
import RigArt from "../art/RigArt";
import { Avatar, Card, Chip, PlannedBadge, SectionTitle } from "../ui/kit";
import { IconChevron, IconShield, IconUsers } from "../ui/icons";
import { glx, monthYear } from "../lib/format";
import { tierInfo, MAX_PICKAXE_LEVEL } from "../data/economy";
import { telegramUser, platform } from "../lib/telegram";
import { getPref, setPref, subscribePrefs } from "../lib/prefs";

function Toggle({ label, hint, checked, onChange }) {
  return (
    <label className="toggle">
      <span className="toggle__text">
        <span>{label}</span>
        {hint && <small>{hint}</small>}
      </span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle__track" aria-hidden="true"><span className="toggle__thumb" /></span>
    </label>
  );
}

export default function Profile({ open }) {
  const { profile, balance, level } = useGame();
  const tu = telegramUser();
  const rig = tierInfo(level);
  const name = [tu?.first_name, tu?.last_name].filter(Boolean).join(" ") || profile?.username || "Prospector";
  const handle = tu?.username || profile?.username;
  const [prefs, setPrefs] = useState({ haptics: getPref("haptics") !== false, motion: getPref("motion") !== "reduced" });
  useEffect(
    () =>
      subscribePrefs((p) => setPrefs({ haptics: p.haptics !== false, motion: p.motion !== "reduced" })),
    []
  );

  return (
    <div className="screen profile">
      <Card className="id-card">
        <div className="id-card__glow" aria-hidden="true" />
        <Avatar name={name} photo={tu?.photo_url} size={72} />
        <div className="id-card__name">{name}</div>
        {handle && <div className="id-card__handle">@{handle}</div>}
        <div className="id-card__chips">
          <Chip tone="glaxite">Rig {rig.level} · {rig.name}</Chip>
          {profile?.created_at && <Chip tone="neutral">Since {monthYear(profile.created_at)}</Chip>}
        </div>
      </Card>

      <div className="stat-grid stat-grid--2">
        <div className="tile">
          <div className="tile__label">Balance</div>
          <div className="tile__value">{glx(balance)}</div>
          <div className="tile__hint">GLX</div>
        </div>
        <div className="tile tile--rig">
          <RigArt tier={rig.level} size={52} />
          <div>
            <div className="tile__label">Rig progress</div>
            <div className="tile__value">{rig.level}/{MAX_PICKAXE_LEVEL}</div>
          </div>
        </div>
      </div>

      <Card>
        <SectionTitle aside={<PlannedBadge />}>Badges and levels</SectionTitle>
        <p className="teaser__text">Player levels, XP and badges arrive with contracts. Your rig tier is your progress for now.</p>
      </Card>

      <button type="button" className="card link-card" onClick={() => open("crew")}>
        <span className="link-card__icon"><IconUsers size={20} /></span>
        <span className="link-card__body">
          <span>Crew</span>
          <small>Invite friends to GlaxMiner</small>
        </span>
        <IconChevron size={18} />
      </button>

      <Card>
        <SectionTitle>Settings</SectionTitle>
        <Toggle label="Haptic feedback" hint="Vibration on taps and claims" checked={prefs.haptics} onChange={(v) => setPref("haptics", v)} />
        <Toggle label="Motion" hint="Turn off to stop ambient animation" checked={prefs.motion} onChange={(v) => setPref("motion", v ? "full" : "reduced")} />
      </Card>

      <Card className="about">
        <SectionTitle>Security</SectionTitle>
        <p className="notice notice--flat">
          <IconShield size={16} />
          <span>You sign in with Telegram's signed login. The server checks every action; no password is stored, and no wallet is connected.</span>
        </p>
        <div className="about__meta">
          <span>GlaxMiner · Belt edition</span>
          <span className="mono">{platform()}</span>
        </div>
      </Card>
    </div>
  );
}
