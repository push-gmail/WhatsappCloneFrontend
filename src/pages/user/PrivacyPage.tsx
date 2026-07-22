import { useEffect, useState } from "react";

import {
  ArrowLeft,
  ChevronRight,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import backendApi, {
  getErrorMessage,
} from "../../api/backendApi";

import EmptyPane from "../../components/layout/EmptyPane";

import type {
  PrivacySettings,
} from "../../types";

const visibilityLabel = (
  mode?: string,
  includedCount = 0,
  excludedCount = 0
) => {
  switch (mode) {
    case "my_contacts":
      return includedCount > 0
        ? `${includedCount} contacts included`
        : "My contacts";

    case "my_contacts_except":
      return excludedCount > 0
        ? `${excludedCount} contacts excluded`
        : "My contacts except...";

    case "only_share_with":
      return includedCount > 0
        ? `${includedCount} contacts included`
        : "Only share with...";

    case "nobody":
      return "Nobody";

    default:
      return "Everyone";
  }
};

const timerLabel = (value?: string) => {
  switch (value) {
    case "24_hours":
      return "24 hours";

    case "7_days":
      return "7 days";

    case "30_days":
      return "30 days";

    case "90_days":
      return "90 days";

    default:
      return "Off";
  }
};

export default function PrivacyPage() {
  const [privacy, setPrivacy] =
    useState<PrivacySettings | null>(null);

  const [loading, setLoading] =
    useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const loadPrivacy = async () => {
      try {
        setLoading(true);

        const { data } =
          await backendApi.get(
            "/user/privacy"
          );

        if (!cancelled) {
          setPrivacy(
            data?.privacy || null
          );
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(
            getErrorMessage(error)
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadPrivacy();

    return () => {
      cancelled = true;
    };
  }, []);

  const updateReadReceipts = async (
    enabled: boolean
  ) => {
    const previousPrivacy = privacy;

    setPrivacy((current) =>
      current
        ? {
            ...current,
            readReceiptsEnabled:
              enabled,
          }
        : current
    );

    try {
      const { data } =
        await backendApi.patch(
          "/user/privacy/readReceipts",
          {
            enabled,
          }
        );

      setPrivacy(
        data?.privacy ||
          previousPrivacy
      );
    } catch (error) {
      setPrivacy(previousPrivacy);

      toast.error(
        getErrorMessage(error)
      );
    }
  };

  return (
    <div className="settings-layout">
      <section className="settings-panel privacy-page">
        <header className="privacy-page-header">
          <button
            type="button"
            onClick={() =>
              navigate("/user/settings")
            }
            aria-label="Back to settings"
          >
            <ArrowLeft />
          </button>

          <h1>Privacy</h1>
        </header>

        {loading ? (
          <div className="privacy-loading">
            Loading privacy settings...
          </div>
        ) : (
          <div className="privacy-options-list">
            <h2 className="privacy-section-title">
              Who can see my personal info
            </h2>

            <button
              type="button"
              className="privacy-main-row"
              onClick={() =>
                navigate(
                  "/user/privacy/last-seen"
                )
              }
            >
              <div>
                <strong>
                  Last seen and online
                </strong>

                <span>
                  {visibilityLabel(
                    privacy?.lastSeen?.mode,
                    privacy?.lastSeen
                      ?.includedUsers
                      ?.length || 0,
                    privacy?.lastSeen
                      ?.excludedUsers
                      ?.length || 0
                  )}
                </span>
              </div>

              <ChevronRight />
            </button>

            <button
              type="button"
              className="privacy-main-row"
              onClick={() =>
                navigate(
                  "/user/privacy/profile-picture"
                )
              }
            >
              <div>
                <strong>
                  Profile picture
                </strong>

                <span>
                  {visibilityLabel(
                    privacy?.profilePicture
                      ?.mode,
                    privacy?.profilePicture
                      ?.includedUsers
                      ?.length || 0,
                    privacy?.profilePicture
                      ?.excludedUsers
                      ?.length || 0
                  )}
                </span>
              </div>

              <ChevronRight />
            </button>

            <button
              type="button"
              className="privacy-main-row"
              onClick={() =>
                navigate(
                  "/user/privacy/about"
                )
              }
            >
              <div>
                <strong>About</strong>

                <span>
                  {visibilityLabel(
                    privacy?.about?.mode,
                    privacy?.about
                      ?.includedUsers
                      ?.length || 0,
                    privacy?.about
                      ?.excludedUsers
                      ?.length || 0
                  )}
                </span>
              </div>

              <ChevronRight />
            </button>

            <button
              type="button"
              className="privacy-main-row"
              onClick={() =>
                navigate(
                  "/user/privacy/status"
                )
              }
            >
              <div>
                <strong>Status</strong>

                <span>
                  {visibilityLabel(
                    privacy?.status?.mode,
                    privacy?.status
                      ?.includedUsers
                      ?.length || 0,
                    privacy?.status
                      ?.excludedUsers
                      ?.length || 0
                  )}
                </span>
              </div>

              <ChevronRight />
            </button>

            <div className="privacy-toggle-row">
              <div>
                <strong>
                  Read receipts
                </strong>

                <p>
                  If turned off, you
                  won't send or receive
                  read receipts. Read
                  receipts are always
                  sent for group chats.
                </p>
              </div>

              <label className="privacy-switch">
                <input
                  type="checkbox"
                  checked={
                    privacy
                      ?.readReceiptsEnabled ??
                    true
                  }
                  onChange={(event) =>
                    void updateReadReceipts(
                      event.target
                        .checked
                    )
                  }
                />

                <span />
              </label>
            </div>

            <h2 className="privacy-section-title privacy-section-gap">
              Disappearing messages
            </h2>

            <button
              type="button"
              className="privacy-main-row"
              onClick={() =>
                navigate(
                  "/user/privacy/default-message-timer"
                )
              }
            >
              <div>
                <strong>
                  Default message timer
                </strong>

                <span>
                  {timerLabel(
                    privacy
                      ?.defaultMessageTimer
                  )}
                </span>
              </div>

              <ChevronRight />
            </button>

            <button
              type="button"
              className="privacy-main-row"
            >
              <div>
                <strong>Groups</strong>
                <span>Everyone</span>
              </div>

              <ChevronRight />
            </button>

            <button
              type="button"
              className="privacy-main-row"
            >
              <div>
                <strong>
                  Blocked contacts
                </strong>

                <span>0</span>
              </div>

              <ChevronRight />
            </button>

            <button
              type="button"
              className="privacy-main-row"
            >
              <div>
                <strong>App lock</strong>

                <span>
                  Require password to
                  unlock WhatsAppClone
                </span>
              </div>

              <ChevronRight />
            </button>
          </div>
        )}
      </section>

      <EmptyPane />
    </div>
  );
}