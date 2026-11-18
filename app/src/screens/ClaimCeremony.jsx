import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { FacetMark } from "../art/Facet";
import { Button, Ticker } from "../ui/kit";
import { glx } from "../lib/format";

// Shown after the server confirms a claim. Every number on it comes from
// the claim response ({ reward, balance }).
export default function ClaimCeremony({ result, onClose, onStartNext, startBusy }) {
  const reduce = useReducedMotion();
  return createPortal(
    <AnimatePresence>
      {result && (
        <motion.div
          className="ceremony"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ceremony-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <div className="ceremony__burst" aria-hidden="true">
            {!reduce &&
              Array.from({ length: 18 }, (_, i) => {
                const a = (i / 18) * Math.PI * 2;
                const d = 110 + (i % 3) * 40;
                return (
                  <motion.span
                    key={i}
                    className="ceremony__shard"
                    initial={{ x: 0, y: 0, opacity: 0, rotate: 0, scale: 0.6 }}
                    animate={{ x: Math.cos(a) * d, y: Math.sin(a) * d, opacity: [0, 1, 0], rotate: 180, scale: 1 }}
                    transition={{ duration: 1.3, ease: [0.2, 0.7, 0.2, 1], delay: 0.1 + (i % 4) * 0.03 }}
                  />
                );
              })}
          </div>
          <motion.div
            className="ceremony__card"
            initial={reduce ? { opacity: 0 } : { scale: 0.9, opacity: 0, y: 20 }}
            animate={reduce ? { opacity: 1 } : { scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }}
          >
            <motion.div
              className="ceremony__mark"
              initial={reduce ? false : { rotate: -20, scale: 0.6 }}
              animate={reduce ? undefined : { rotate: 0, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
            >
              <FacetMark size={64} />
            </motion.div>
            <div className="ceremony__kicker">Session complete</div>
            <h2 id="ceremony-title" className="ceremony__amount">
              +<Ticker value={result.reward} /> <span className="ceremony__unit">GLX</span>
            </h2>
            <p className="ceremony__note">Credited to your Vault by the server.</p>
            <div className="ceremony__balance">
              <span>New balance</span>
              <strong>{glx(result.balance)} GLX</strong>
            </div>
            <div className="ceremony__actions">
              <Button variant="primary" busy={startBusy} onClick={onStartNext}>
                Start next session
              </Button>
              <Button variant="ghost" onClick={onClose}>
                Back to Outpost
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
