import { useState } from "react";
import "./App.css";

import Home from "./pages/Home";
import Wallet from "./pages/Wallet";
import Upgrades from "./pages/Upgrades";
import Profile from "./pages/Profile";
import Leaderboard from "./pages/Leaderboard";


function App() {

  const [page, setPage] = useState("mine");


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