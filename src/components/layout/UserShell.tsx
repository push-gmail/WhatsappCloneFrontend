import {
  useEffect,
  useState,
} from "react";

import {
  Outlet,
  useLocation,
  useOutletContext,
} from "react-router-dom";

import {
  io,
} from "socket.io-client";

import backendApi, {
  BACKEND_URL,
} from "../../api/backendApi";

import type {
  Profile,
} from "../../types";

import type {
  ProtectedRouteOutletContext,
} from "../../routes/RequireUser";

import {
  useAuth,
} from "../../store/AuthContext";

import DesktopRail from "./DesktopRail";
import MobileBottomNav from "./MobileBottomNav";

export type UserShellOutletContext = {
  profile: Profile | null;

  setProfile: React.Dispatch<
    React.SetStateAction<Profile | null>
  >;

  sessionStatus:
    ProtectedRouteOutletContext["sessionStatus"];
};

export default function UserShell() {
  const [profile, setProfile] =
    useState<Profile | null>(
      null
    );

  const location =
    useLocation();

  const { userId } =
    useAuth();

  const {
    sessionStatus,
  } =
    useOutletContext<ProtectedRouteOutletContext>();

  useEffect(() => {
    let active = true;

    if (
      sessionStatus !== "valid"
    ) {
      setProfile(null);

      return () => {
        active = false;
      };
    }

    const loadProfile =
      async () => {
        try {
          const { data } =
            await backendApi.get(
              "/user/profile"
            );

          if (!active) {
            return;
          }

          setProfile(
            data?.profile ||
              data ||
              null
          );
        } catch {
          if (active) {
            setProfile(null);
          }
        }
      };

    void loadProfile();

    return () => {
      active = false;
    };
  }, [
    location.pathname,
    sessionStatus,
  ]);

  /*
   * Application-level presence socket.
   *
   * Chat page close/change hone se ye
   * disconnect nahi hoga.
   *
   * Sirf protected UserShell unmount,
   * logout, tab close ya connection loss
   * par disconnect hoga.
   */
  useEffect(() => {
    if (
      sessionStatus !==
        "valid" ||
      !userId
    ) {
      return;
    }

    const presenceSocket = io(
      BACKEND_URL,
      {
        auth: {
          userId,
          socketRole:
            "presence",
        },

        transports: [
          "websocket",
          "polling",
        ],

        reconnection: true,

        reconnectionAttempts:
          10,

        reconnectionDelay:
          1000,
      }
    );

    presenceSocket.on(
      "connect",
      () => {
        console.log(
          "Presence socket connected:",
          presenceSocket.id
        );
      }
    );

    presenceSocket.on(
      "connect_error",
      (error: Error) => {
        console.error(
          "Presence socket error:",
          error.message
        );
      }
    );

    return () => {
      presenceSocket.disconnect();
    };
  }, [
    sessionStatus,
    userId,
  ]);

  return (
    <div className="app-shell">
      <DesktopRail
        photo={
          sessionStatus ===
          "valid"
            ? profile?.profilePhoto
            : undefined
        }
        name={
          sessionStatus ===
          "valid"
            ? profile?.name
            : undefined
        }
      />

      <main className="user-main">
        <Outlet
          context={{
            profile:
              sessionStatus ===
              "valid"
                ? profile
                : null,

            setProfile,
            sessionStatus,
          } satisfies UserShellOutletContext}
        />
      </main>

      <MobileBottomNav />
    </div>
  );
}