import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

import { AuthProvider } from "./context/AuthContext";
import { GameProvider } from "./context/GameContext";
import { MiningProvider } from "./context/MiningContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <GameProvider>
        <MiningProvider>
          <App />
        </MiningProvider>
      </GameProvider>
    </AuthProvider>
  </React.StrictMode>
);