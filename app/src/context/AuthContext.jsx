import { createContext, useContext, useEffect, useState } from "react";
import { login } from "../api/userApi";
import { getInitData } from "../api/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // null | "not_in_telegram" | "login_failed"
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    async function init() {
      const webApp = window.Telegram?.WebApp;

      try {
        webApp?.ready?.();
        webApp?.expand?.();
      } catch {
        // older Telegram clients
      }

      // No fallback test account: without signed initData the server
      // cannot identify the player.
      if (!getInitData()) {
        setAuthError("not_in_telegram");
        setLoading(false);
        return;
      }

      try {
        const data = await login();

        if (data.success) {
          setUser(data.user);
        } else {
          setAuthError("login_failed");
        }
      } catch (err) {
        console.error(err);
        setAuthError("login_failed");
      }

      setLoading(false);
    }

    init();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        authError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
