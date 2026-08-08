import Header from "../components/Header";
import StatsCards from "../components/StatsCards";
import BalanceCard from "../components/BalanceCard";
import MiningCard from "../components/MiningCard";
import ProgressBar from "../components/ProgressBar";
import InviteCard from "../components/InviteCard";
import BottomNav from "../components/BottomNav";

import { useGame } from "../context/GameContext";

import "../styles/Home.css";

function Home({ page, setPage }) {
  const { gameLoading } = useGame();

  return (
    <div className="app-container">
      <main className="main-content">

        <Header />

        {gameLoading ? (
          <div className="game-loading">
            <div className="game-loading-spinner"></div>
            <div className="game-loading-text">
              Loading...
            </div>
          </div>
        ) : (
          <>
            <StatsCards />

            <BalanceCard />

            <MiningCard />

            <ProgressBar />

            <InviteCard />
          </>
        )}

      </main>

      <BottomNav
        page={page}
        setPage={setPage}
      />
    </div>
  );
}

export default Home;