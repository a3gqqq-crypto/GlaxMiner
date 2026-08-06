import BottomNav from "../components/BottomNav";

function Community({ page, setPage }) {

  return (
    <div className="app-container">

      <main className="main-content">

        <h1 className="page-title">
          🏆 Leaderboard
        </h1>


        <div className="leaderboard-card">

          <h2>
            🌎 GLX Global Rankings
          </h2>

          <p>
            Compete with miners around the world and climb the rankings.
          </p>


          <div className="rank-box">
            🥇 Top GLX Holders
          </div>

          <div className="rank-box">
            ⛏️ Highest Mining Power
          </div>

          <div className="rank-box">
            💎 Highest Pickaxe Level
          </div>

          <div className="rank-box">
            👑 VIP Rankings
          </div>


          <button disabled>
            🚧 Coming Soon
          </button>


        </div>


      </main>


      <BottomNav
        page={page}
        setPage={setPage}
      />

    </div>
  );
}

export default Community;