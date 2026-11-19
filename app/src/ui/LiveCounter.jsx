import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "../lib/prefs";
import { humanDuration } from "../lib/format";

// Pending session earnings, drawn locally from server-authoritative data:
//   earned = reward × clamp((serverNow() - start) / duration, 0, 1)
// reward, start and duration come from /mine/status; serverNow() is the
// device clock corrected to the server clock. No per-second API calls, no
// local state that could drift: reopening or reconnecting recomputes the same
// value from the same inputs. It stops exactly at the session reward.
// It is a display of the existing payout, not a balance: GLX only moves when
// the server accepts the claim.
const DECIMALS = 6;

function split(v) {
  const s = v.toFixed(DECIMALS);
  const [i, d] = s.split(".");
  return [Number(i).toLocaleString("en-US"), d];
}

// state: "idle" | "mining" | "ready"; duration in seconds, start in ms.
export default function LiveCounter({ state, start, duration, reward, serverNow }) {
  const intRef = useRef(null);
  const decRef = useRef(null);
  const rate = duration > 0 ? reward / duration : 0;
  const ready = state === "ready";
  const idle = state === "idle";

  useEffect(() => {
    if (!duration || !reward) return undefined;
    let raf = 0;
    let timer = 0;
    let lastText = "";
    const reduced = prefersReducedMotion();
    const paint = () => {
      const elapsed = (serverNow() - start) / 1000;
      const k = idle ? 0 : ready ? 1 : Math.min(1, Math.max(0, elapsed / duration));
      const [i, d] = split(reward * k);
      const text = i + d;
      if (text !== lastText && intRef.current && decRef.current) {
        intRef.current.textContent = i;
        decRef.current.textContent = d;
        lastText = text;
      }
      return idle || k >= 1;
    };
    const loop = () => {
      if (paint()) return;
      // ~30 fps is plenty for the 6th decimal and kinder to batteries
      timer = setTimeout(() => {
        raf = requestAnimationFrame(loop);
      }, reduced ? 1000 : 33);
    };
    loop();
    const onVis = () => document.visibilityState === "visible" && paint();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [start, duration, reward, serverNow, ready, idle]);

  return (
    <div className={`live-counter is-${state}`}>
      <div className="live-counter__label">
        <span className="live-counter__dot" aria-hidden="true" />
        {ready ? "Session earnings · ready to claim" : idle ? "Session earnings" : "Session earnings · pending"}
      </div>
      <div className="live-counter__value" aria-live="off">
        <span ref={intRef} className="live-counter__int">0</span>
        <span className="live-counter__sep">.</span>
        <span ref={decRef} className="live-counter__dec">000000</span>
        <span className="live-counter__unit">GLX</span>
      </div>
      <div className="live-counter__rate">
        <span className="mono">{rate.toFixed(6)}</span> GLX/sec · {reward} GLX per {humanDuration(duration)}
      </div>
    </div>
  );
}

// Compact pending amount (Wallet), same formula and clock as the big counter.
export function PendingValue({ start, duration, reward, serverNow, ready, className = "" }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!duration || !reward) return undefined;
    let id = 0;
    const paint = () => {
      const k = ready ? 1 : Math.min(1, Math.max(0, (serverNow() - start) / 1000 / duration));
      if (ref.current) ref.current.textContent = `+${(reward * k).toFixed(4)}`;
      return k >= 1;
    };
    if (!paint()) id = setInterval(() => paint() && clearInterval(id), prefersReducedMotion() ? 1000 : 100);
    return () => clearInterval(id);
  }, [start, duration, reward, serverNow, ready]);
  return <strong ref={ref} className={`mono ${className}`}>+0.0000</strong>;
}
