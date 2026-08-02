import {
  useEffect,
  useState,
} from "react";

import {
  Outlet,
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
  sessionStatus:
    ProtectedSessionStatus;
};

type CheckSessionResponse = {
  authenticated: boolean;
  userId?: string;
  profileId?: string;
  sessionId?: string;
  message?: string;
};

export default function RequireUser() {
  const {
    userId,
    sessionId,
  } = useAuth();

  const [
    sessionStatus,
    setSessionStatus,
  ] =
    useState<ProtectedSessionStatus>(
      "checking"
    );

  useEffect(() => {
    let active = true;

    const validateSession =
      async () => {
        /*
         * Browser storage me login details
         * available nahi hain.
         */
        if (
          !userId ||
          !sessionId
        ) {
          if (active) {
            setSessionStatus(
              "invalid"
            );
          }

          return;
        }

        /*
         * Session sirf userId/sessionId
         * change hone par check hogi.
         *
         * Protected route change par
         * dobara check nahi hogi.
         */
        setSessionStatus(
          "checking"
        );

        try {
          const { data } =
            await backendApi.get<CheckSessionResponse>(
              "/auth/check-session"
            );

          if (!active) {
            return;
          }

          const responseSessionId =
            String(
              data?.sessionId || ""
            );

          const isValid =
            data?.authenticated ===
              true &&
            responseSessionId ===
              sessionId;

          setSessionStatus(
            isValid
              ? "valid"
              : "invalid"
          );
        } catch {
          if (active) {
            setSessionStatus(
              "invalid"
            );
          }
        }
      };

    void validateSession();

    return () => {
      active = false;
    };
  }, [
    userId,
    sessionId,
  ]);

  /*
   * Ye loader sirf first protected-page
   * load ya login ke baad ek baar dikhega.
   *
   * Chats, status, settings aur profile
   * routes change karne par nahi dikhega.
   */
  if (
    sessionStatus ===
    "checking"
  ) {
    return (
      <main
        className="loading"
        aria-label="Loading your account"
      >
        <span
          className="spinner"
          aria-hidden="true"
        />
      </main>
    );
  }

  /*
   * Existing valid/invalid rendering
   * behavior unchanged hai.
   */
  return (
    <Outlet
      context={{
        sessionStatus,
      }}
    />
  );
}