import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useGame } from "../state/GameProvider";
import { Avatar, Card, Chip, PlannedBadge, ScreenHeader } from "../ui/kit";
import { IconCrown, IconRefresh } from "../ui/icons";
import { glx } from "../lib/format";
import { RIG_NAMES } from "../data/economy";
import { telegramUser } from "../lib/telegram";

function display(row, i) {
  return row.username ? row.username : `Prospector #${i + 1}`;
}

export default function Ranks() {
  const { board, fetchBoard, profile, balance } = useGame();
  const [view, setView] = useState("all");
  const me = (profile?.username || telegramUser()?.username || "").toLowerCase();

  useEffect(() => {
    if (board.state === "idle" || Date.now() - board.at > 60_000) fetchBoard();
  }, [board.state, board.at, fetchBoard]);

  const rows = board.rows;
  const myIndex = me ? rows.findIndex((r) => (r.username || "").toLowerCase() === me) : -1;
  const podium = rows.slice(0, 3);
  const rest = rows.slice(3);

  return (
    <div className="screen ranks">
      <ScreenHeader
        kicker="Leaderboard"
        title="Ranks"
        aside={
          <button type="button" className="icon-btn" aria-label="Refresh leaderboard" onClick={fetchBoard} disabled={board.state === "loading" || board.state === "refreshing"}>
            <IconRefresh size={20} className={board.state === "refreshing" ? "spin" : ""} />
          </button>
        }
      />

      <div className="segmented" role="tablist" aria-label="Leaderboard period">
        {[
          ["all", "All time"],
          ["week", "Weekly"],
          ["crews", "Crews"],
        ].map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={view === id} className={view === id ? "is-on" : ""} onClick={() => setView(id)}>
            {label}
          </button>
        ))}
      </div>

      {view !== "all" ? (
        <Card className="planned-panel">
          <PlannedBadge />
          <h2>{view === "week" ? "Weekly seasons" : "Crew rankings"}</h2>
          <p>
            {view === "week"
              ? "Weekly ranks need a per-session history on the server. Until that ships, only the all-time board below is real."
              : "Crews (teams) aren't built yet. When they are, crews will rank by what their members mine together."}
          </p>
        </Card>
      ) : (
        <>
          <p className="fineprint ranks__basis">Top 50 by current GLX balance, live from the server.</p>

          {board.state === "loading" && <div className="skeleton-list" aria-label="Loading leaderboard">{Array.from({ length: 6 }, (_, i) => <div key={i} className="skeleton" />)}</div>}
          {board.state === "error" && (
            <Card className="planned-panel">
              <h2>Leaderboard unavailable</h2>
              <p>{board.error}</p>
            </Card>
          )}

          {rows.length > 0 && (
            <>
              <div className="podium">
                {[1, 0, 2].map((idx) => {
                  const r = podium[idx];
                  if (!r) return <div key={idx} className="podium__slot podium__slot--empty" />;
                  return (
                    <motion.div
                      key={idx}
                      className={`podium__slot podium__slot--${idx + 1} ${idx === myIndex ? "is-me" : ""}`}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * idx, duration: 0.32 }}
                    >
                      {idx === 0 && <IconCrown size={20} className="podium__crown" />}
                      <Avatar name={display(r, idx)} size={idx === 0 ? 56 : 46} />
                      <div className="podium__name">{display(r, idx)}</div>
                      <div className="podium__bal">{glx(r.balance)}</div>
                      <div className="podium__base">
                        <span>{idx + 1}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <ol className="board" start={4}>
                {rest.map((r, i) => {
                  const idx = i + 3;
                  return (
                    <li key={idx} className={`board__row ${idx === myIndex ? "is-me" : ""}`}>
                      <span className="board__pos">{idx + 1}</span>
                      <Avatar name={display(r, idx)} size={32} />
                      <span className="board__who">
                        <span className="board__name">{display(r, idx)}{idx === myIndex && <Chip tone="glaxite">You</Chip>}</span>
                        <span className="board__rig">Rig {r.pickaxe_level} · {RIG_NAMES[r.pickaxe_level] || ""}</span>
                      </span>
                      <span className="board__bal">{glx(r.balance)}</span>
                    </li>
                  );
                })}
              </ol>

              <div className="me-bar">
                {myIndex >= 0 ? (
                  <span>
                    You're <strong>#{myIndex + 1}</strong> with {glx(balance)} GLX
                  </span>
                ) : rows.length >= 50 && balance < Number(rows[rows.length - 1].balance) ? (
                  <span>You're outside the top 50 · {glx(balance)} GLX</span>
                ) : (
                  <span>Your balance: {glx(balance)} GLX{!me && " · set a Telegram username to be highlighted"}</span>
                )}
              </div>
            </>
          )}
          {board.state === "ready" && rows.length === 0 && (
            <Card className="planned-panel">
              <h2>No miners yet</h2>
              <p>Be the first on the board.</p>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
