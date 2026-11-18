import { useEffect, useState } from "react";
import { useGame } from "../state/GameProvider";
import PickaxeIcon from "../game/PickaxeIcon";
import { Avatar, Card, Chip, PlannedBadge, SectionTitle } from "../ui/kit";
import { IconChevron, IconShield, IconUsers } from "../ui/icons";
import { glx, monthYear } from "../lib/format";
import { tierInfo, MAX_PICKAXE_LEVEL } from "../data/economy";
import { telegramUser, platform } from "../lib/telegram";
import { getPref, setPref, subscribePrefs } from "../lib/prefs";
import { sfx, unlockAudio } from "../game/sound";

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
  const read = (p) => ({ haptics: p.haptics !== false, motion: p.motion !== "reduced", sound: p.sound === true });
  const [prefs, setPrefs] = useState(read({ haptics: getPref("haptics"), motion: getPref("motion"), sound: getPref("sound") }));
  useEffect(() => subscribePrefs((p) => setPrefs(read(p))), []);

  return (
    <div className="screen profile">
      <Card className="id-card">
        <div className="id-card__glow" aria-hidden="true" />
        <Avatar name={name} photo={tu?.photo_url} size={72} />
        <div className="id-card__name">{name}</div>
        {handle && <div className="id-card__handle">@{handle}</div>}
        <div className="id-card__chips">
          <Chip tone="glaxite">Tier {rig.level} · {rig.name} pickaxe</Chip>
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
          <PickaxeIcon tier={rig.level} size={52} />
          <div>
            <div className="tile__label">Pickaxe tier</div>
            <div className="tile__value">{rig.level}/{MAX_PICKAXE_LEVEL}</div>
          </div>
        </div>
      </div>

      <Card>
        <SectionTitle aside={<PlannedBadge />}>Badges and levels</SectionTitle>
        <p className="teaser__text">Player levels, XP and badges arrive with contracts. Your pickaxe tier is your progress for now.</p>
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
        <Toggle
          label="Sound effects"
          hint="Pickaxe swings, impacts, forging"
          checked={prefs.sound}
          onChange={(v) => {
            setPref("sound", v);
            if (v) {
              unlockAudio();
              setTimeout(() => sfx.impact(1), 60);
            }
          }}
        />
        <Toggle label="Haptic feedback" hint="Vibration on strikes, claims and upgrades" checked={prefs.haptics} onChange={(v) => setPref("haptics", v)} />
        <Toggle label="Motion" hint="Turn off for a still mining scene and less battery use" checked={prefs.motion} onChange={(v) => setPref("motion", v ? "full" : "reduced")} />
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
