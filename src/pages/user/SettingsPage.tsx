import {
  Bell,
  ChevronRight,
  CircleHelp,
  Keyboard,
  Lock,
  LogOut,
  MessageSquare,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import {
  Link,
  useOutletContext,
} from "react-router-dom";

import { useState } from "react";
import toast from "react-hot-toast";

import Avatar from "../../components/common/Avatar";
import EmptyPane from "../../components/layout/EmptyPane";

import backendApi from "../../api/backendApi";
import { sessionStorageService } from "../../utils/storage";

import type {
  Profile,
} from "../../types";

export default function SettingsPage() {
  const { profile } = useOutletContext<{
    profile: Profile | null;
  }>();

  const [logoutLoading, setLogoutLoading] =
    useState(false);

  const rows = [
    [
      "/user/profile",
      UserRound,
      "Profile",
      "Name, profile picture, about",
    ],
    [
      "/user/account",
      ShieldCheck,
      "Account",
      "Security notifications, account info",
    ],
    [
      "/user/privacy",
      Lock,
      "Privacy",
      "Last seen, profile photo, about and status",
    ],
    [
      "/user/chat-settings",
      MessageSquare,
      "Chats",
      "Theme, wallpaper, chat settings",
    ],
    [
      "/user/notifications",
      Bell,
      "Notifications",
      "Messages, groups, sounds",
    ],
    [
      "#",
      Keyboard,
      "Keyboard shortcuts",
      "Quick actions",
    ],
    [
      "#",
      CircleHelp,
      "Help and feedback",
      "Help center, contact us, privacy policy",
    ],
  ] as const;

  const handleLogout = async () => {
    if (logoutLoading) {
      return;
    }

    setLogoutLoading(true);

    try {
      /*
       * Abhi storage clear nahi karna.
       * Logout API ko current userId/sessionId headers chahiye.
       */
      await backendApi.post("/auth/logout");
    } catch (error) {
      /*
       * Session database mein pehle se delete ho,
       * tab bhi frontend logout complete hoga.
       */
      console.error("Logout API error:", error);
    }

    /*
     * React AuthContext logout() call nahi karna.
     * Usse protected providers dobara render hokar
     * profile/chat-settings APIs call kar dete hain.
     */
    sessionStorageService.clear();

    toast.dismiss();

    /*
     * Success message next login page load ke baad
     * dikhane ke liye temporary flag.
     */
    sessionStorage.setItem(
      "whatsapp_clone_logout_success",
      "true"
    );

    /*
     * Hard redirect React protected tree ko turant
     * destroy karega. Profile/chat API dobara call nahi hogi.
     */
    window.location.replace("/auth/email");
  };

  return (
    <div className="settings-layout">
      <section className="settings-panel">
        <h1>
          {profile?.name || "Settings"}
        </h1>

        <div className="settings-profile">
          <Avatar
            src={profile?.profilePhoto}
            name={profile?.name}
            size={126}
          />

          <span>
            {profile?.about || "Available"}
          </span>
        </div>

        <div className="settings-menu">
          {rows.map(
            ([to, Icon, title, subtitle]) =>
              to === "#" ? (
                <button
                  type="button"
                  key={title}
                >
                  <Icon />

                  <div>
                    <strong>{title}</strong>
                    <small>{subtitle}</small>
                  </div>

                  <ChevronRight />
                </button>
              ) : (
                <Link
                  key={title}
                  to={to}
                >
                  <Icon />

                  <div>
                    <strong>{title}</strong>
                    <small>{subtitle}</small>
                  </div>

                  <ChevronRight />
                </Link>
              )
          )}

          <button
            type="button"
            className="settings-logout-button"
            onClick={() => {
              void handleLogout();
            }}
            disabled={logoutLoading}
          >
            <LogOut />

            <div>
              <strong>
                {logoutLoading
                  ? "Logging out..."
                  : "Log out"}
              </strong>
            </div>
          </button>
        </div>
      </section>

      <EmptyPane />
    </div>
  );
}