import Header from "../components/Header";
import StatsCards from "../components/StatsCards";
import BalanceCard from "../components/BalanceCard";
import MiningCard from "../components/MiningCard";
import ProgressBar from "../components/ProgressBar";
import InviteCard from "../components/InviteCard";
import BottomNav from "../components/BottomNav";

function Home({ page, setPage }) {
  return (
    <div className="app-container">
      <main className="main-content">

        <div className="upgrade-card">
          <h2>🚧 GLAXMINER BETA v0.2</h2>

          <p>
            Welcome to the early beta! New features like
            Referrals, VIP, Wallet, Daily Rewards and
            Leaderboards are coming soon.
          </p>
        </div>

        <Header />

        <StatsCards />

        <BalanceCard />

        <MiningCard />

        <ProgressBar />

        <InviteCard />

      </main>

      <BottomNav
        page={page}
        setPage={setPage}
      />
    </div>
  );
}

export default Home;