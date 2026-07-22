import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { sessionStorageService } from "../utils/storage";

type AuthContextType = {
  userId: string;
  email: string;
  sessionId: string;

  login: (
    userId: string,
    email: string,
    sessionId: string
  ) => void;

  logout: () => void;
};

const AuthContext =
  createContext<AuthContextType | null>(null);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [userId, setUserId] = useState<string>(() =>
    sessionStorageService.getUserId()
  );

  const [email, setEmail] = useState<string>(() =>
    sessionStorageService.getEmail()
  );

  const [sessionId, setSessionId] = useState<string>(() =>
    sessionStorageService.getSessionId()
  );

  const login = useCallback(
    (
      nextUserId: string,
      nextEmail: string,
      nextSessionId: string
    ) => {
      sessionStorageService.save(
        nextUserId,
        nextEmail,
        nextSessionId
      );

      setUserId(nextUserId);
      setEmail(nextEmail);
      setSessionId(nextSessionId);
    },
    []
  );

  const logout = useCallback(() => {
    sessionStorageService.clear();

    setUserId("");
    setEmail("");
    setSessionId("");
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      userId,
      email,
      sessionId,
      login,
      logout,
    }),
    [
      userId,
      email,
      sessionId,
      login,
      logout,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}