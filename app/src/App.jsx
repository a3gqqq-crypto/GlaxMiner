import { useState } from "react";
import "./App.css";

import Home from "./pages/Home";
import Wallet from "./pages/Wallet";
import Upgrades from "./pages/Upgrades";
import Community from "./pages/Community";
import Leaderboard from "./pages/Leaderboard";
import Profile from "./pages/Profile";

function App() {
  const [page, setPage] = useState("mine");

  switch (page) {

    case "leaderboard":
      return (
        <Leaderboard
          page={page}
          setPage={setPage}
        />
      );

    case "wallet":
      return (
        <Wallet
          page={page}
          setPage={setPage}
        />
      );

    case "upgrades":
      return (
        <Upgrades
          page={page}
          setPage={setPage}
        />
      );

    case "community":
      return (
        <Community
          page={page}
          setPage={setPage}
        />
      );

    case "profile":
      return (
        <Profile
          page={page}
          setPage={setPage}
        />
      );

    default:
      return (
        <Home
          page={page}
          setPage={setPage}
        />
      );
  }
}

export default App;