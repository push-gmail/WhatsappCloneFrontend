import {
  ArrowLeft,
  ChevronRight,
  MessageSquareText,
  RefreshCcw,
  UsersRound,
  Volume2,
  Eye,
  CircleDot,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import toast from "react-hot-toast";

import backendApi, {
  getErrorMessage,
} from "../../api/backendApi";

import EmptyPane from "../../components/layout/EmptyPane";

import type {
  NotificationSettings,
} from "../../types";

type GeneralSettingKey =
  | "showPreviews"
  | "playOutgoingSound"
  | "backgroundSyncEnabled";

const getCategoryStatus = (
  enabled?: boolean
) => {
  return enabled ? "On" : "Off";
};

export default function NotificationsPage() {
  const navigate = useNavigate();

  const [
    notificationSettings,
    setNotificationSettings,
  ] = useState<NotificationSettings | null>(
    null
  );

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setLoading(true);

        const { data } =
          await backendApi.get(
            "/user/notifications"
          );

        if (!active) {
          return;
        }

        setNotificationSettings(
          data?.notificationSettings || null
        );
      } catch (error) {
        if (active) {
          toast.error(
            getErrorMessage(error)
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, []);

  const updateGeneral = async (
    key: GeneralSettingKey,
    value: boolean
  ) => {
    if (!notificationSettings) {
      return;
    }

    const previous = notificationSettings;

    setNotificationSettings({
      ...notificationSettings,
      [key]: value,
    });

    try {
      const { data } =
        await backendApi.patch(
          "/user/notifications/general",
          {
            [key]: value,
          }
        );

      setNotificationSettings(
        data.notificationSettings
      );
    } catch (error) {
      setNotificationSettings(previous);

      toast.error(
        getErrorMessage(error)
      );
    }
  };

  return (
    <div className="notification-settings-layout">
      <section className="notification-settings-panel">
        <header className="notification-settings-header">
          <button
            type="button"
            onClick={() =>
              navigate("/user/settings")
            }
            aria-label="Back to settings"
          >
            <ArrowLeft />
          </button>

          <h1>Notifications</h1>
        </header>

        {loading || !notificationSettings ? (
          <div className="notification-settings-loading">
            Loading notification settings...
          </div>
        ) : (
          <div className="notification-settings-content">
            <button
              type="button"
              className="notification-navigation-row"
              onClick={() =>
                navigate(
                  "/user/notifications/messages"
                )
              }
            >
              <MessageSquareText />

              <div>
                <strong>Messages</strong>

                <span>
                  {getCategoryStatus(
                    notificationSettings.messages
                      .showNotifications
                  )}
                </span>
              </div>

              <ChevronRight />
            </button>

            <button
              type="button"
              className="notification-navigation-row"
              onClick={() =>
                navigate(
                  "/user/notifications/groups"
                )
              }
            >
              <UsersRound />

              <div>
                <strong>Groups</strong>

                <span>
                  {getCategoryStatus(
                    notificationSettings.groups
                      .showNotifications
                  )}
                </span>
              </div>

              <ChevronRight />
            </button>

            <button
              type="button"
              className="notification-navigation-row"
              onClick={() =>
                navigate(
                  "/user/notifications/status"
                )
              }
            >
              <CircleDot />

              <div>
                <strong>Status</strong>

                <span>
                  {getCategoryStatus(
                    notificationSettings.status
                      .showNotifications
                  )}
                </span>
              </div>

              <ChevronRight />
            </button>

            <div className="notification-divider" />

            <div className="notification-toggle-row">
              <Eye />

              <div>
                <strong>Show previews</strong>

                <span>
                  Preview message text inside
                  message notifications.
                </span>
              </div>

              <label className="notification-switch">
                <input
                  type="checkbox"
                  checked={
                    notificationSettings.showPreviews
                  }
                  onChange={(event) =>
                    void updateGeneral(
                      "showPreviews",
                      event.target.checked
                    )
                  }
                />

                <span />
              </label>
            </div>

            <div className="notification-toggle-row">
              <Volume2 />

              <div>
                <strong>
                  Play sound for outgoing messages
                </strong>
              </div>

              <label className="notification-switch">
                <input
                  type="checkbox"
                  checked={
                    notificationSettings
                      .playOutgoingSound
                  }
                  onChange={(event) =>
                    void updateGeneral(
                      "playOutgoingSound",
                      event.target.checked
                    )
                  }
                />

                <span />
              </label>
            </div>

            <div className="notification-divider" />

            <div className="notification-toggle-row">
              <RefreshCcw />

              <div>
                <strong>Background sync</strong>

                <span>
                  Get faster performance by syncing
                  messages in the background.
                </span>
              </div>

              <label className="notification-switch">
                <input
                  type="checkbox"
                  checked={
                    notificationSettings
                      .backgroundSyncEnabled
                  }
                  onChange={(event) =>
                    void updateGeneral(
                      "backgroundSyncEnabled",
                      event.target.checked
                    )
                  }
                />

                <span />
              </label>
            </div>

            <div className="notification-divider" />

            <p className="notification-info-note">
              To get notifications, make sure they
              are turned on in your browser and
              device settings.
            </p>
          </div>
        )}
      </section>

      <EmptyPane />
    </div>
  );
}