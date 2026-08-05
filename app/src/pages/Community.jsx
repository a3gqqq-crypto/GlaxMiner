import BottomNav from "../components/BottomNav";

function Community({ page, setPage }) {
  return (
    <div className="app-container">
      <main className="main-content">

        <h1 className="page-title">👥 Friends</h1>

        <div className="upgrade-card">

          <h2>🚀 Referral Program</h2>

          <p>
            Invite your friends and earn passive GLX rewards
            every time they mine.
          </p>

          <br />

          <h3>🎁 Planned Rewards</h3>

          <p>✔ Invite Friends</p>
          <p>✔ Referral Bonuses</p>
          <p>✔ Referral Leaderboards</p>
          <p>✔ Exclusive Referral Badges</p>

          <br />

          <button disabled>
            🚧 Launching Soon
          </button>

        </div>

      </main>

      <BottomNav page={page} setPage={setPage} />
    </div>
  );
}

export default Community;