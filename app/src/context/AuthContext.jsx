import { createContext, useContext, useEffect, useState } from "react";
import { login } from "../api/userApi";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        let telegramId = 1;
        let username = "Developer";

        if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
          telegramId = window.Telegram.WebApp.initDataUnsafe.user.id;
          username =
            window.Telegram.WebApp.initDataUnsafe.user.username || "";
        }

        const data = await login(telegramId, username);

        if (data.success) {
          setUser(data.user);
        }
      } catch (err) {
        console.error(err);
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}