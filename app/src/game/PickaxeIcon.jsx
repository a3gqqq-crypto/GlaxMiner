import { useEffect, useRef } from "react";
import { drawHead } from "./engine";
import { pickaxe } from "./pickaxes";

// Static portrait of a tier's pickaxe, drawn with the same head art as the
// mining scene so the Lab and the HQ always match.
export default function PickaxeIcon({ tier = 1, size = 48, dim = false, title }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = Math.round(size * dpr);
    c.height = Math.round(size * dpr);
    const ctx = c.getContext("2d");
    const pk = pickaxe(tier);
    const k = (size / 100) * dpr;
    ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.clearRect(0, 0, 100, 100);
    // handle from bottom-left to the head at top-right
    const a = -Math.PI / 4;
    const hx = 64;
    const hy = 36;
    const len = 62;
    ctx.lineCap = "round";
    ctx.strokeStyle = pk.handle;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(hx - Math.cos(a) * len, hy - Math.sin(a) * len);
    ctx.lineTo(hx, hy);
    ctx.stroke();
    ctx.strokeStyle = pk.grip;
    ctx.lineWidth = 7.5;
    ctx.beginPath();
    ctx.moveTo(hx - Math.cos(a) * len, hy - Math.sin(a) * len);
    ctx.lineTo(hx - Math.cos(a) * len * 0.62, hy - Math.sin(a) * len * 0.62);
    ctx.stroke();
    ctx.save();
    ctx.translate(hx, hy);
    ctx.rotate(a);
    ctx.scale(1.25, 1.25);
    drawHead(ctx, pk, 0.6, 0.5);
    ctx.restore();
  }, [tier, size]);
  return (
    <canvas
      ref={ref}
      className={`pickaxe-icon ${dim ? "is-dim" : ""}`}
      style={{ width: size, height: size }}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    />
  );
}
