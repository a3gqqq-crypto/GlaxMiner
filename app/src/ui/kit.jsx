import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { glx } from "../lib/format";
import { haptic } from "../lib/telegram";
import { IconX } from "./icons";

export function Button({ variant = "primary", size = "lg", busy, children, onClick, disabled, icon, className = "", ...rest }) {
  return (
    <button
      type="button"
      className={`btn btn--${variant} btn--${size} ${busy ? "is-busy" : ""} ${className}`}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      onClick={(e) => {
        haptic.tap();
        onClick?.(e);
      }}
      {...rest}
    >
      {busy ? <span className="btn__spinner" aria-hidden="true" /> : icon}
      <span>{children}</span>
    </button>
  );
}

export function Card({ as: Tag = "section", className = "", children, ...rest }) {
  return (
    <Tag className={`card ${className}`} {...rest}>
      {children}
    </Tag>
  );
}

export function Stat({ label, value, unit, tone, hint }) {
  return (
    <div className="stat">
      <div className="stat__label">{label}</div>
      <div className={`stat__value ${tone ? `tone-${tone}` : ""}`}>
        {value}
        {unit && <span className="stat__unit"> {unit}</span>}
      </div>
      {hint && <div className="stat__hint">{hint}</div>}
    </div>
  );
}

// Status chips: "live" pulses (cyan), "ready" is amber, "planned" marks
// sections that are designed but not yet built on the server.
export function Chip({ tone = "neutral", children, pulse }) {
  return (
    <span className={`chip chip--${tone}`}>
      {pulse && <span className="chip__dot" aria-hidden="true" />}
      {children}
    </span>
  );
}

export function SectionTitle({ children, aside }) {
  return (
    <div className="section-title">
      <h2>{children}</h2>
      {aside}
    </div>
  );
}

export function ScreenHeader({ title, kicker, aside }) {
  return (
    <header className="screen-header">
      <div>
        {kicker && <div className="screen-header__kicker">{kicker}</div>}
        <h1 className="screen-header__title">{title}</h1>
      </div>
      {aside}
    </header>
  );
}

// Animated count between server values (display only).
export function Ticker({ value, decimals = 2, className = "" }) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(Number(value) || 0);
  const from = useRef(Number(value) || 0);
  useEffect(() => {
    const target = Number(value) || 0;
    if (reduce || from.current === target) {
      setShown(target);
      from.current = target;
      return undefined;
    }
    const start = performance.now();
    const a = from.current;
    const dur = 900;
    let raf;
    const step = (t) => {
      const k = Math.min(1, (t - start) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      setShown(a + (target - a) * e);
      if (k < 1) raf = requestAnimationFrame(step);
      else from.current = target;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, reduce]);
  const isInt = Number.isInteger(Number(value));
  return <span className={`ticker ${className}`}>{isInt ? glx(Math.round(shown)) : shown.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: decimals })}</span>;
}

export function Sheet({ open, onClose, title, children, labelledBy }) {
  const reduce = useReducedMotion();
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="sheet-layer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          <button type="button" className="sheet-scrim" aria-label="Close" onClick={onClose} />
          <motion.div
            className="sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy}
            initial={reduce ? { opacity: 0 } : { y: "100%" }}
            animate={reduce ? { opacity: 1 } : { y: 0 }}
            exit={reduce ? { opacity: 0 } : { y: "100%" }}
            transition={{ type: "tween", duration: 0.32, ease: [0.2, 0.7, 0.2, 1] }}
          >
            <div className="sheet__grab" aria-hidden="true" />
            <div className="sheet__head">
              {title && <h2 id={labelledBy}>{title}</h2>}
              <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}>
                <IconX size={20} />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export function Toast({ toast, onDismiss }) {
  return (
    <div className="toast-anchor" aria-live="polite">
      <AnimatePresence>
        {toast && (
          <motion.button
            type="button"
            key={toast.id}
            className={`toast toast--${toast.tone}`}
            onClick={onDismiss}
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
          >
            {toast.message}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Avatar({ name = "", photo, size = 40 }) {
  const [failed, setFailed] = useState(false);
  const letter = (name || "?").trim().charAt(0).toUpperCase() || "?";
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.4 }}>
      {photo && !failed ? <img src={photo} alt="" onError={() => setFailed(true)} referrerPolicy="no-referrer" /> : letter}
    </span>
  );
}

export function Meter({ value = 0, tone = "glaxite", label }) {
  const v = Math.max(0, Math.min(1, value));
  return (
    <div className={`meter meter--${tone}`} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(v * 100)}>
      <div className="meter__fill" style={{ transform: `scaleX(${v})` }} />
    </div>
  );
}
