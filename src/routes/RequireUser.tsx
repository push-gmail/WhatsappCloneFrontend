import {
  useEffect,
  useState,
} from "react";

import {
  Outlet,
  useLocation,
} from "react-router-dom";

import backendApi from "../api/backendApi";

import {
  useAuth,
} from "../store/AuthContext";

export type ProtectedSessionStatus =
  | "checking"
  | "valid"
  | "invalid";

export type ProtectedRouteOutletContext = {
  sessionStatus: ProtectedSessionStatus;
};

type CheckSessionResponse = {
  authenticated: boolean;
  userId?: string;
  profileId?: string;
  sessionId?: string;
  message?: string;
};

export default function RequireUser() {
  const location = useLocation();

  const {
    userId,
    sessionId,
  } = useAuth();

  const [
    sessionStatus,
    setSessionStatus,
  ] = useState<ProtectedSessionStatus>(
    "checking"
  );

  useEffect(() => {
    let active = true;

    const validateSession = async () => {
      setSessionStatus("checking");

      /*
       * Browser tab ke paas login details hi nahi hain.
       */
      if (!userId || !sessionId) {
        if (active) {
          setSessionStatus("invalid");
        }

        return;
      }

      try {
        const { data } =
          await backendApi.get<CheckSessionResponse>(
            "/auth/check-session"
          );

        if (!active) {
          return;
        }

        const responseSessionId = String(
          data?.sessionId || ""
        );

        const isValid =
          data?.authenticated === true &&
          responseSessionId === sessionId;

        setSessionStatus(
          isValid ? "valid" : "invalid"
        );
      } catch {
        if (active) {
          setSessionStatus("invalid");
        }
      }
    };

    void validateSession();

    return () => {
      active = false;
    };
  }, [
    location.pathname,
    userId,
    sessionId,
  ]);

  /*
   * Route hit hone par session-check API complete hone se
   * pehle protected child component render nahi hoga.
   */
  if (sessionStatus === "checking") {
    return (
      <main className="loading">
        <span className="spinner" />

        <span>Checking session...</span>
      </main>
    );
  }

  /*
   * Valid aur invalid dono condition mein component render.
   *
   * Invalid condition mein backend protected APIs 401 return
   * karengi aur actual protected data show nahi hoga.
   */
  return (
    <Outlet
      key={`${location.pathname}-${sessionStatus}-${sessionId}`}
      context={{
        sessionStatus,
      }}
    />
  );
}