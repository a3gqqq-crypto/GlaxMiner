import { useEffect, useRef } from "react";
import { MiningScene, W, H } from "./engine";
import { haptic } from "../lib/telegram";
import { prefersReducedMotion, subscribePrefs } from "../lib/prefs";
import { unlockAudio } from "./sound";

// React wrapper around the canvas scene. The loop only runs while the stage
// is on screen and the app is visible, which keeps battery use down.
export default function MiningStage({ mode = "idle", tier = 1, charge = 0, label, className = "", interactive = true, onIdleTap }) {
  const ref = useRef(null);
  const scene = useRef(null);
  const visible = useRef(true);

  useEffect(() => {
    const canvas = ref.current;
    const s = new MiningScene(canvas, {
      mode,
      tier,
      reduced: prefersReducedMotion(),
      onImpact: ({ big, tap }) => {
        if (tap) haptic.impact(big ? "heavy" : "light");
      },
    });
    scene.current = s;
    if (import.meta.env.DEV) window.__glxScene = s; // dev-only debugging handle
    const sync = () => {
      const run = visible.current && document.visibilityState === "visible" && !prefersReducedMotion();
      if (run) s.start();
      else s.stop();
      if (!run) s.renderStill();
    };
    const ro = new ResizeObserver(() => s.resize());
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => {
      visible.current = e.isIntersecting;
      sync();
    });
    io.observe(canvas);
    document.addEventListener("visibilitychange", sync);
    const unsub = subscribePrefs(() => {
      s.setState({ reduced: prefersReducedMotion() });
      sync();
    });
    sync();
    return () => {
      s.stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
      unsub();
    };
    // the scene is created once; state changes go through setState below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scene.current?.setState({ mode, tier, charge });
  }, [mode, tier, charge]);

  function onPointerDown() {
    if (!interactive) return;
    unlockAudio();
    const s = scene.current;
    if (!s) return;
    if (s.mode === "mining" || s.mode === "preview") {
      if (s.strike()) haptic.tap();
    } else {
      onIdleTap?.();
    }
  }

  return (
    <div className={`stage-canvas ${className}`} style={{ aspectRatio: `${W} / ${H}` }}>
      <canvas ref={ref} role="img" aria-label={label} onPointerDown={onPointerDown} />
    </div>
  );
}
