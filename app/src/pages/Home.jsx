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