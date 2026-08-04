import { createContext, useContext } from "react";
import useMining from "../hooks/useMining";

const MiningContext = createContext();

export function MiningProvider({ children }) {
  const mining = useMining();

  return (
    <MiningContext.Provider value={mining}>
      {children}
    </MiningContext.Provider>
  );
}

export function useMiningContext() {
  return useContext(MiningContext);
}