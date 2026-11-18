import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { useGame } from "./state/GameProvider";
import { TabBar, TopBar } from "./ui/Shell";
import { Toast } from "./ui/kit";
import Belt from "./art/Belt";
import { BootScreen, NotInTelegram, SignInError } from "./screens/Gates";
import Outpost from "./screens/Outpost";
import Lab from "./screens/Lab";
import Contracts from "./screens/Contracts";
import Ranks from "./screens/Ranks";
import Vault from "./screens/Vault";
import Profile from "./screens/Profile";
import Crew from "./screens/Crew";
import { showBackButton } from "./lib/telegram";
import { prefersReducedMotion, subscribePrefs } from "./lib/prefs";
import { tierInfo } from "./data/economy";

const TAB_ORDER = ["outpost", "lab", "contracts", "ranks", "vault"];
const SUBSCREENS = { profile: Profile, crew: Crew };

export default function App() {
  const game = useGame();
  const [tab, setTab] = useState("outpost");
  const [stack, setStack] = useState([]); // sub-screens over the tabs
  const [dir, setDir] = useState(1);
  const [reduced, setReduced] = useState(prefersReducedMotion());
  const scroller = useRef(null);

  useEffect(() => subscribePrefs(() => setReduced(prefersReducedMotion())), []);
  useEffect(() => {
    document.documentElement.dataset.motion = reduced ? "reduced" : "full";
  }, [reduced]);

  const go = useCallback(
    (next) => {
      setStack([]);
      setDir(TAB_ORDER.indexOf(next) >= TAB_ORDER.indexOf(tab) ? 1 : -1);
      setTab(next);
      scroller.current?.scrollTo({ top: 0 });
    },
    [tab]
  );
  const open = useCallback((sub) => {
    setDir(1);
    setStack((s) => [...s, sub]);
    scroller.current?.scrollTo({ top: 0 });
  }, []);
  const back = useCallback(() => {
    setDir(-1);
    setStack((s) => s.slice(0, -1));
  }, []);

  // Telegram's native back button while a sub-screen is open
  useEffect(() => (stack.length ? showBackButton(back) : undefined), [stack.length, back]);

  if (game.phase === "boot") return <Frame><BootScreen /></Frame>;
  if (game.phase === "gate") return <Frame><NotInTelegram /></Frame>;
  if (game.phase === "error") return <Frame><SignInError onRetry={game.boot} /></Frame>;

  const sub = stack[stack.length - 1];
  const Screen = sub ? SUBSCREENS[sub] : { outpost: Outpost, lab: Lab, contracts: Contracts, ranks: Ranks, vault: Vault }[tab];
  const key = sub ? `sub-${sub}` : tab;
  const rig = tierInfo(game.level);
  const badges = {
    outpost: game.session.state === "ready" ? "reward" : game.session.state === "mining" ? "live" : null,
    lab: rig.nextCost != null && game.balance >= rig.nextCost ? "glaxite" : null,
  };

  return (
    <MotionConfig reducedMotion={reduced ? "always" : "never"}>
      <Frame>
        <TopBar onProfile={() => (sub === "profile" ? null : open("profile"))} />
        <main className="viewport" ref={scroller}>
          {sub && (
            <button type="button" className="crumb" onClick={back}>
              ‹ Back
            </button>
          )}
          <AnimatePresence mode="wait" initial={false} custom={dir}>
            <motion.div
              key={key}
              custom={dir}
              initial={{ opacity: 0, x: 18 * dir }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 * dir }}
              transition={{ duration: 0.22, ease: [0.2, 0.7, 0.2, 1] }}
            >
              <Screen go={go} open={open} />
            </motion.div>
          </AnimatePresence>
        </main>
        <TabBar active={sub ? null : tab} onSelect={go} badges={badges} />
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
