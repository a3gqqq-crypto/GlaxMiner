import BottomNav from "../components/BottomNav";

function Wallet({ page, setPage }) {
  return (
    <div className="app-container">
      <main className="main-content">

        <h1 className="page-title">💰 Wallet</h1>

        <div className="upgrade-card">

          <h2>GLAX Wallet</h2>

          <p>
            Manage your GLX safely.
          </p>

          <br />

          <p>💸 Withdraw GLX</p>
          <p>📈 Transaction History</p>
          <p>🎁 Reward History</p>
          <p>💳 Future Deposits</p>

          <br />

          <button disabled>
            🚧 Coming Soon
          </button>

        </div>

      </main>

      <BottomNav page={page} setPage={setPage} />
    </div>
  );
}

export default Wallet;