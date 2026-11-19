import { useEffect, useState } from "react";
import { useGame } from "../state/GameProvider";
import PickaxeIcon from "../game/PickaxeIcon";
import { Avatar, Card, ScreenHeader, SectionTitle } from "../ui/kit";
import { glx, monthYear } from "../lib/format";
import { tierInfo, MAX_PICKAXE_LEVEL } from "../data/economy";
import { telegramUser } from "../lib/telegram";
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

export default function Profile() {
  const { profile, balance, level } = useGame();
  const tu = telegramUser();
  const rig = tierInfo(level);
  const name = [tu?.first_name, tu?.last_name].filter(Boolean).join(" ") || profile?.username || "Miner";
  const handle = tu?.username || profile?.username;
  const read = (p) => ({ haptics: p.haptics !== false, motion: p.motion !== "reduced", sound: p.sound === true });
  const [prefs, setPrefs] = useState(read({ haptics: getPref("haptics"), motion: getPref("motion"), sound: getPref("sound") }));
  useEffect(() => subscribePrefs((p) => setPrefs(read(p))), []);

  return (
    <div className="screen profile">
      <ScreenHeader title="Profile" />

      <Card className="id-card">
        <Avatar name={name} photo={tu?.photo_url} size={72} />
        <div className="id-card__name">{name}</div>
        {handle && <div className="id-card__handle">@{handle}</div>}
        {profile?.created_at && <div className="id-card__since">Joined {monthYear(profile.created_at)}</div>}
      </Card>

      <div className="stat-grid stat-grid--2">
        <div className="tile">
          <div className="tile__label">Balance</div>
          <div className="tile__value">{glx(balance)}</div>
          <div className="tile__hint">GLX</div>
        </div>
        <div className="tile tile--rig">
          <PickaxeIcon tier={rig.level} size={44} />
          <div>
            <div className="tile__label">Pickaxe</div>
            <div className="tile__value">{rig.name}</div>
            <div className="tile__hint">Tier {rig.level}/{MAX_PICKAXE_LEVEL}</div>
          </div>
        </div>
      </div>

      <Card>
        <SectionTitle>Settings</SectionTitle>
        <Toggle
          label="Sound effects"
          hint="Mining and upgrade sounds"
          checked={prefs.sound}
          onChange={(v) => {
            setPref("sound", v);
            if (v) {
              unlockAudio();
              setTimeout(() => sfx.impact(1), 60);
            }
          }}
        />
        <Toggle label="Haptic feedback" hint="Vibration on claims and upgrades" checked={prefs.haptics} onChange={(v) => setPref("haptics", v)} />
        <Toggle label="Animation" hint="Turn off for a still mining scene and less battery use" checked={prefs.motion} onChange={(v) => setPref("motion", v ? "full" : "reduced")} />
      </Card>

      <p className="fineprint center">Signed in with Telegram. The server checks every claim and upgrade.</p>
    </div>
  );
}
