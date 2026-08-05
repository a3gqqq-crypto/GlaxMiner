import BottomNav from "../components/BottomNav";
import { useAuth } from "../context/AuthContext";

function Profile({ page, setPage }) {
  const { user } = useAuth();

  return (
    <div className="app-container">
      <main className="main-content">

        <h1 className="page-title">👤 Profile</h1>

        <div className="upgrade-card">

          <h2>{user?.username || "Miner"}</h2>

          <p>🚧 Beta Tester</p>

          <br />

          <h3>Roadmap</h3>

          <p>✅ Telegram Login</p>
          <p>✅ Mining System</p>
          <p>✅ Pickaxe Upgrades</p>

          <p>🚧 Referral System</p>
          <p>🚧 Daily Rewards</p>
          <p>🚧 VIP Membership</p>
          <p>🚧 Leaderboards</p>
          <p>🚧 Wallet System</p>

          <br />

          <button disabled>
            🚀 More Features Coming Soon
          </button>

        </div>

      </main>

      <BottomNav page={page} setPage={setPage} />
    </div>
  );
}

export default Profile;