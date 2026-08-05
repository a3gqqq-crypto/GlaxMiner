import BottomNav from "../components/BottomNav";

function Community({ page, setPage }) {
  return (
    <div className="app-container">
      <main className="main-content">

        <h1 className="page-title">👥 Invite Friends</h1>

        <div className="upgrade-card">

          <h2>🎁 Earn Rewards</h2>

          <p>
            Grow the GlaxMiner community and earn rewards for every friend you invite.
          </p>

          <br />

          <hr />

          <h3>🎁 Referral Rewards</h3>

          <p>👤 Invite 1 Friend</p>
          <strong>+500 GLX</strong>

          <br /><br />

          <p>👥 Invite 5 Friends</p>
          <strong>+2,500 GLX</strong>

          <br /><br />

          <p>🚀 Invite 25 Friends</p>
          <strong>Exclusive VIP Reward</strong>

          <hr />

          <h3>🏆 Referral Leaderboard</h3>

          <p>
            Compete with other miners and climb the global referral rankings.
          </p>

          <button disabled style={{ marginTop: "10px" }}>
            🚧 Coming Soon
          </button>

          <hr />

          <h3>🎖 Referral Badges</h3>

          <p>🛰 Explorer</p>
          <p>⭐ Captain</p>
          <p>👑 Commander</p>
          <p>🌌 Galaxy Master</p>

          <hr />

          <div style={{ textAlign: "center" }}>
            <h3>🚀 Launching Soon</h3>

            <p>
              The Referral System is currently under active development.
            </p>

            <p>
              Invite your friends, earn passive GLX, unlock badges,
              and compete on the global leaderboard.
            </p>

            <button disabled>
              Beta Feature
            </button>
          </div>

        </div>

      </main>

      <BottomNav page={page} setPage={setPage} />
    </div>
  );
}

export default Community;