import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { GameProvider } from "./state/GameProvider";
import { initTelegram } from "./lib/telegram";
import "./styles/tokens.css";
import "./styles/app.css";

initTelegram();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GameProvider>
      <App />
    </GameProvider>
  </React.StrictMode>
);
