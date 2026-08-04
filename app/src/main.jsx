import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

import { MiningProvider } from "./context/MiningContext";
import { GameProvider } from "./context/GameContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GameProvider>
      <MiningProvider>
        <App />
      </MiningProvider>
    </GameProvider>
  </React.StrictMode>
);