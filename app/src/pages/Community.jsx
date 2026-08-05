import BottomNav from "../components/BottomNav";

function Community({ page, setPage }) {
  return (
    <div className="app-container">
      <main className="main-content">

        <h1 className="page-title">👥 Invite Friends</h1>

        <div className="upgrade-card">

          <h2>🎁 Earn Rewards</h2>

          <p>Invite friends and earn GLX together.</p>

          <hr style={{ margin: "20px 0", opacity: 0.2 }} />

          <h3>👤 Invite 1 Friend</h3>
          <p><strong>+500 GLX</strong></p>

          <br />

          <h3>👥 Invite 5 Friends</h3>
          <p><strong>+2,500 GLX</strong></p>

          <br />

          <h3>🚀 Invite 25 Friends</h3>
          <p><strong>Exclusive VIP Reward</strong></p>

          <hr style={{ margin: "20px 0", opacity: 0.2 }} />

          <h3>🏆 Referral Leaderboard</h3>

          <button disabled>
            🚧 Coming Soon
          </button>

          <hr style={{ margin: "20px 0", opacity: 0.2 }} />

          <h3>🎖 Referral Badges</h3>

          <p>🛰 Explorer</p>
          <p>⭐ Captain</p>
          <p>👑 Commander</p>
          <p>🌌 Galaxy Master</p>

          <hr style={{ margin: "20px 0", opacity: 0.2 }} />

          <button disabled>
            🚀 Launching Soon
          </button>

        </div>

      </main>

      <BottomNav page={page} setPage={setPage} />
    </div>
  );
}

export default Community;