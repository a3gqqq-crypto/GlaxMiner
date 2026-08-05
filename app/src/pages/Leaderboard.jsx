import BottomNav from "../components/BottomNav";

function Leaderboard({ page, setPage }) {
  return (
    <div className="app-container">

      <main className="main-content">

        <h1 className="page-title">
          🏆 Leaderboard
        </h1>


        <div className="upgrade-card">

          <h2>🌎 Global Rankings</h2>

          <p>
            Compete with miners worldwide and climb the ranks.
          </p>

          <br />

          <h3>🔥 Rankings Coming Soon</h3>

          <p>🥇 Top GLX Holders</p>
          <p>⛏️ Highest Mining Power</p>
          <p>💎 Highest Pickaxe Level</p>
          <p>👑 VIP Rankings</p>
          <p>🚀 Weekly Champions</p>

          <br />

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

export default Leaderboard;