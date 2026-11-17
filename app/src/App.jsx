import { useState } from "react";
import "./App.css";

import Home from "./pages/Home";
import Wallet from "./pages/Wallet";
import Upgrades from "./pages/Upgrades";
import Profile from "./pages/Profile";
import Leaderboard from "./pages/Leaderboard";
import { useAuth } from "./context/AuthContext";


function App() {

  const [page, setPage] = useState("mine");

  const { authError } = useAuth();


  if (authError) {
    return (
      <div className="app-container">
        <main className="main-content" style={{ textAlign: "center", paddingTop: "40vh" }}>
          <h2>
            {authError === "not_in_telegram"
              ? "Open GlaxMiner from Telegram"
              : "Could not sign you in"}
          </h2>
          <p>
            {authError === "not_in_telegram"
              ? "Start the GlaxMiner bot in Telegram and tap Open GlaxMiner."
              : "Close the app and open it again from the bot."}
          </p>
        </main>
      </div>
    );
  }


  if (page === "leaderboard") {
    return (
      <Leaderboard
        page={page}
        setPage={setPage}
      />
    );
  }


  if (page === "wallet") {
    return (
      <Wallet
        page={page}
        setPage={setPage}
      />
    );
  }


  if (page === "upgrades") {
    return (
      <Upgrades
        page={page}
        setPage={setPage}
      />
    );
  }


  if (page === "profile") {
    return (
      <Profile
        page={page}
        setPage={setPage}
      />
    );
  }


  // Mining page
  return (
    <Home
      page={page}
      setPage={setPage}
    />
  );

}


export default App;