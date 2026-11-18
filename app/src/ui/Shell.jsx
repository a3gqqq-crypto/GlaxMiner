import { motion } from "framer-motion";
import { useGame } from "../state/GameProvider";
import { telegramUser, haptic } from "../lib/telegram";
import { tierInfo } from "../data/economy";
import { glx } from "../lib/format";
import { FacetMark } from "../art/Facet";
import { Avatar } from "./kit";
import PickaxeIcon from "../game/PickaxeIcon";
import { IconOutpost, IconLab, IconContracts, IconRanks, IconVault } from "./icons";

export const TABS = [
  { id: "outpost", label: "Outpost", Icon: IconOutpost },
  { id: "lab", label: "Forge", Icon: IconLab },
  { id: "contracts", label: "Contracts", Icon: IconContracts },
  { id: "ranks", label: "Ranks", Icon: IconRanks },
  { id: "vault", label: "Vault", Icon: IconVault },
];

export function TabBar({ active, onSelect, badges = {} }) {
  return (
    <nav className="tabbar" aria-label="Main">
      {TABS.map(({ id, label, Icon }) => {
        const on = id === active;
        return (
          <button
            key={id}
            type="button"
            className={`tabbar__item ${on ? "is-active" : ""}`}
            aria-current={on ? "page" : undefined}
            onClick={() => {
              if (!on) haptic.tap();
              onSelect(id);
            }}
          >
            {on && <motion.span layoutId="tab-indicator" className="tabbar__indicator" transition={{ type: "tween", duration: 0.24, ease: [0.65, 0, 0.35, 1] }} />}
            <span className="tabbar__icon">
              <Icon size={23} />
              {badges[id] && <span className={`tabbar__badge tabbar__badge--${badges[id]}`} aria-hidden="true" />}
            </span>
            <span className="tabbar__label">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export function TopBar({ onProfile }) {
  const { profile, level, balance } = useGame();
  const tu = telegramUser();
  const name = tu?.first_name || profile?.username || "Prospector";
  const rig = tierInfo(level);
  return (
    <header className="topbar">
      <button type="button" className="topbar__me" onClick={onProfile} aria-label={`Open profile, ${name}`}>
        <Avatar name={name} photo={tu?.photo_url} size={36} />
        <span className="topbar__who">
          <span className="topbar__name">{name}</span>
          <span className="topbar__rank">
            <PickaxeIcon tier={rig.level} size={16} /> Tier {rig.level} · {rig.name}
          </span>
        </span>
      </button>
      <div className="topbar__balance" aria-label={`Balance ${glx(balance)} GLX`}>
        <FacetMark size={16} />
        <span className="topbar__amount">{glx(balance)}</span>
        <span className="topbar__unit">GLX</span>
      </div>
    </header>
  );
}
