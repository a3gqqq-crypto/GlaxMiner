import { useCallback, useEffect, useRef, useState } from "react";
import { MotionConfig, motion } from "framer-motion";
import { useGame } from "./state/GameProvider";
import { TabBar, TopBar, TABS } from "./ui/Shell";
import { Toast } from "./ui/kit";
import Belt from "./art/Belt";
import { BootScreen, NotInTelegram, SignInError } from "./screens/Status";
import Mine from "./screens/Mine";
import Upgrades from "./screens/Upgrades";
import Wallet from "./screens/Wallet";
import Profile from "./screens/Profile";
import { prefersReducedMotion, subscribePrefs } from "./lib/prefs";
import { tierInfo } from "./data/economy";

const SCREENS = { mine: Mine, upgrades: Upgrades, wallet: Wallet, profile: Profile };
const ORDER = TABS.map((t) => t.id);

export default function App() {
  const game = useGame();
  const [tab, setTab] = useState("mine");
  const [dir, setDir] = useState(1);
  const [reduced, setReduced] = useState(prefersReducedMotion());
  const scroller = useRef(null);

  useEffect(() => subscribePrefs(() => setReduced(prefersReducedMotion())), []);
  useEffect(() => {
    document.documentElement.dataset.motion = reduced ? "reduced" : "full";
  }, [reduced]);

  const go = useCallback(
    (next) => {
      if (next === tab) return;
      setDir(ORDER.indexOf(next) >= ORDER.indexOf(tab) ? 1 : -1);
      setTab(next);
      scroller.current?.scrollTo({ top: 0 });
    },
    [tab]
  );

  if (game.phase === "boot") return <Frame><BootScreen /></Frame>;
  if (game.phase === "gate") return <Frame><NotInTelegram /></Frame>;
  if (game.phase === "error") return <Frame><SignInError onRetry={game.boot} /></Frame>;

  const Screen = SCREENS[tab];
  const rig = tierInfo(game.level);
  const badges = {
    mine: game.session.state === "ready" ? "reward" : null,
    upgrades: rig.nextCost != null && game.balance >= rig.nextCost ? "glaxite" : null,
  };

  return (
    <MotionConfig reducedMotion={reduced ? "always" : "never"}>
      <Frame>
        <TopBar onProfile={() => go("profile")} />
        <main className="viewport" ref={scroller}>
          {/* No exit animation: the new tab replaces the old one at once, so a
              quick tab switch can never leave a stale screen on display. */}
          <motion.div
            key={tab}
            initial={{ opacity: 0, x: 14 * dir }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.18, ease: [0.2, 0.7, 0.2, 1] }}
          >
            <Screen />
          </motion.div>
        </main>
        <TabBar active={tab} onSelect={go} badges={badges} />
        <Toast toast={game.toast} onDismiss={game.dismissToast} />
      </Frame>
    </MotionConfig>
  );
}

function Frame({ children }) {
  return (
    <div className="stage">
      <Belt />
      <div className="app">{children}</div>
    </div>
  );
}
