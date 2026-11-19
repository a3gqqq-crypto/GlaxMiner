import { motion } from "framer-motion";
import { FacetMark } from "../art/Facet";
import { Button } from "../ui/kit";
import { IconRefresh } from "../ui/icons";

export function BootScreen() {
  return (
    <div className="gate" role="status" aria-live="polite">
      <motion.div className="gate__mark" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
        <FacetMark size={72} />
        <span className="gate__pulse" aria-hidden="true" />
      </motion.div>
      <div className="gate__brand">GLAXMINER</div>
      <div className="gate__sub">Signing in…</div>
    </div>
  );
}

export function NotInTelegram() {
  return (
    <div className="gate">
      <div className="gate__mark">
        <FacetMark size={72} />
      </div>
      <div className="gate__brand">GLAXMINER</div>
      <p className="gate__text">GlaxMiner runs inside Telegram. Open the bot and tap Open GlaxMiner to sign in securely with your Telegram account.</p>
      <a className="btn btn--primary btn--lg gate__cta" href="https://t.me/GlaxMinerBot">
        <span>Open @GlaxMinerBot</span>
      </a>
    </div>
  );
}

export function SignInError({ onRetry }) {
  return (
    <div className="gate">
      <div className="gate__mark gate__mark--warn">
        <FacetMark size={72} />
      </div>
      <div className="gate__brand">Connection lost</div>
      <p className="gate__text">We couldn't verify your Telegram sign-in or reach the GlaxMiner servers. Your balance and progress are safe on the server.</p>
      <Button variant="primary" icon={<IconRefresh size={18} />} onClick={onRetry} className="gate__cta">
        Try again
      </Button>
    </div>
  );
}
