import "../styles/BottomNav.css";

function BottomNav({ page, setPage }) {

  return (

    <nav className="bottom-nav">

      <button
        className={page === "leaderboard" ? "active" : ""}
        onClick={() => setPage("leaderboard")}
      >
        <span className="nav-icon">🏆</span>
        <span className="nav-label">Scores</span>
      </button>


      <button
        className={page === "wallet" ? "active" : ""}
        onClick={() => setPage("wallet")}
      >
        <span className="nav-icon">💰</span>
        <span className="nav-label">Wallet</span>
      </button>


      <button
        className={
          page === "mine"
            ? "mine-button-nav active"
            : "mine-button-nav"
        }
        onClick={() => setPage("mine")}
      >
        <span className="nav-icon">⛏️</span>
        <span className="nav-label">Mining</span>
      </button>


      <button
        className={page === "upgrades" ? "active" : ""}
        onClick={() => setPage("upgrades")}
      >
        <span className="nav-icon">🚀</span>
        <span className="nav-label">Upgrades</span>
      </button>


      <button
        className={page === "profile" ? "active" : ""}
        onClick={() => setPage("profile")}
      >
        <span className="nav-icon">👤</span>
        <span className="nav-label">Profile</span>
      </button>

    </nav>

  );

}

export default BottomNav;