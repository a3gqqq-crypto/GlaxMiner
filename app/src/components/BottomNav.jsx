function BottomNav({ page, setPage }) {
  return (
    <div className="bottom-nav">

      <button
        className={page === "leaderboard" ? "active" : ""}
        onClick={() => setPage("leaderboard")}
      >
        🏆
      </button>


      <button
        className={page === "wallet" ? "active" : ""}
        onClick={() => setPage("wallet")}
      >
        👛
      </button>


      <button
        className={
          page === "mine"
            ? "active mine-center"
            : "mine-center"
        }
        onClick={() => setPage("mine")}
      >
        ⛏️
      </button>


      <button
        className={page === "upgrades" ? "active" : ""}
        onClick={() => setPage("upgrades")}
      >
        🚀
      </button>


      <button
        className={page === "profile" ? "active" : ""}
        onClick={() => setPage("profile")}
      >
        👤
      </button>

    </div>
  );
}

export default BottomNav;