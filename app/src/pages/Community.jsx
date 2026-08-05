import BottomNav from "../components/BottomNav";

function Community({ page, setPage }) {
  return (
    <div className="app-container">

      <main className="main-content">

        <h1 className="page-title">
          👥 Invite Friends
        </h1>


        <div className="referral-card">

          <h2>🎁 Earn Rewards</h2>

          <p className="subtitle">
            Invite friends and grow the GlaxMiner community
          </p>


          <div className="reward-grid">

            <div className="reward-box">
              👤
              <h3>Invite 1 Friend</h3>
              <span>+500 GLX</span>
            </div>


            <div className="reward-box">
              👥
              <h3>Invite 5 Friends</h3>
              <span>+2,500 GLX</span>
            </div>


            <div className="reward-box">
              🚀
              <h3>Invite 25 Friends</h3>
              <span>VIP Reward</span>
            </div>

          </div>


          <div className="coming-box">

            🏆 Referral Leaderboard

            <br/>

            <span>
              Coming Soon
            </span>

          </div>


          <div className="badges">

            <h2>🎖 Referral Badges</h2>

            <div className="badge-grid">

              <div>
                🌎
                <p>Explorer</p>
              </div>

              <div>
                ⭐
                <p>Captain</p>
              </div>

              <div>
                👑
                <p>Commander</p>
              </div>

              <div>
                🌌
                <p>Galaxy Master</p>
              </div>

            </div>

          </div>


        </div>


      </main>


      <BottomNav page={page} setPage={setPage}/>

    </div>
  );
}

export default Community;