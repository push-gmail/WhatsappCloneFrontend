import {
  ArrowLeft,
  Bell,
  BellRing,
  MousePointer2,
  Volume2,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import toast from "react-hot-toast";

import backendApi, {
  getErrorMessage,
} from "../../api/backendApi";

import EmptyPane from "../../components/layout/EmptyPane";

import type {
  BrowserNotificationPermission,
  NotificationSettings,
} from "../../types";

type Category =
  | "messages"
  | "groups"
  | "status";

const isCategory = (
  value?: string
): value is Category => {
  return (
    value === "messages" ||
    value === "groups" ||
    value === "status"
  );
};

const categoryTitle = (
  category: Category
) => {
  if (category === "messages") {
    return "Messages";
  }

  if (category === "groups") {
    return "Groups";
  }

  return "Status";
};

const getBrowserPermission =
  (): BrowserNotificationPermission => {
    if (
      typeof window === "undefined" ||
      !("Notification" in window)
    ) {
      return "unsupported";
    }

    return Notification.permission;
  };

export default function NotificationCategoryPage() {
  const navigate = useNavigate();

  const { category: categoryParam } =
    useParams<{
      category?: string;
    }>();

  const category = isCategory(categoryParam)
    ? categoryParam
    : "messages";

  const [
    notificationSettings,
    setNotificationSettings,
  ] = useState<NotificationSettings | null>(
    null
  );

  const [loading, setLoading] =
    useState(true);

  const [
    permissionModalOpen,
    setPermissionModalOpen,
  ] = useState(false);

  const currentCategory = useMemo(() => {
    if (!notificationSettings) {
      return null;
    }

    return notificationSettings[category];
  }, [notificationSettings, category]);

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

  const savePermissionStatus = async (
    status: BrowserNotificationPermission
  ) => {
    try {
      const { data } =
        await backendApi.patch(
          "/user/notifications/general",
          {
            browserPermissionStatus: status,
          }
        );

      setNotificationSettings(
        data.notificationSettings
      );
    } catch {
      // Permission DB save fail hone par
      // category flow ko crash nahi karna.
    }
  };

  const updateCategory = async (
    payload: {
      showNotifications?: boolean;
      showReactionNotifications?: boolean;
      playSound?: boolean;
    }
  ) => {
    if (!notificationSettings) {
      return;
    }

    const previous = notificationSettings;

    setNotificationSettings({
      ...notificationSettings,
      [category]: {
        ...notificationSettings[category],
        ...payload,
      },
    } as NotificationSettings);

    try {
      const { data } =
        await backendApi.patch(
          `/user/notifications/${category}`,
          payload
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

  const requestBrowserPermission = async () => {
    const currentPermission =
      getBrowserPermission();

    if (currentPermission === "unsupported") {
      await savePermissionStatus("unsupported");

      toast.error(
        "Browser notifications are not supported"
      );

      return false;
    }

    if (currentPermission === "granted") {
      await savePermissionStatus("granted");

      return true;
    }

    if (currentPermission === "denied") {
      await savePermissionStatus("denied");
      setPermissionModalOpen(true);

      return false;
    }

    try {
      const result =
        await Notification.requestPermission();

      await savePermissionStatus(result);

      if (result === "granted") {
        return true;
      }

      setPermissionModalOpen(true);

      return false;
    } catch {
      setPermissionModalOpen(true);

      return false;
    }
  };

  const handleShowNotifications = async (
    enabled: boolean
  ) => {
    if (!enabled) {
      await updateCategory({
        showNotifications: false,
        ...(category !== "status"
          ? {
              showReactionNotifications: false,
            }
          : {}),
      });

      return;
    }

    const allowed =
      await requestBrowserPermission();

    if (!allowed) {
      return;
    }

    await updateCategory({
      showNotifications: true,
    });
  };

  return (
    <div className="notification-settings-layout">
      <section className="notification-settings-panel">
        <header className="notification-settings-header">
          <button
            type="button"
            onClick={() =>
              navigate("/user/notifications")
            }
            aria-label="Back to notifications"
          >
            <ArrowLeft />
          </button>

          <h1>{categoryTitle(category)}</h1>
        </header>

        {loading || !currentCategory ? (
          <div className="notification-settings-loading">
            Loading notification settings...
          </div>
        ) : (
          <div className="notification-category-content">
            <div className="notification-toggle-row">
              <Bell />

              <div>
                <strong>
                  Show notifications
                </strong>
              </div>

              <label className="notification-switch">
                <input
                  type="checkbox"
                  checked={
                    currentCategory
                      .showNotifications
                  }
                  onChange={(event) =>
                    void handleShowNotifications(
                      event.target.checked
                    )
                  }
                />

                <span />
              </label>
            </div>

            {category !== "status" && (
              <>
                <div className="notification-divider" />

                <div
                  className={`notification-toggle-row ${
                    !currentCategory
                      .showNotifications
                      ? "disabled"
                      : ""
                  }`}
                >
                  <BellRing />

                  <div>
                    <strong>
                      Show reaction notifications
                    </strong>
                  </div>

                  <label className="notification-switch">
                    <input
                      type="checkbox"
                      disabled={
                        !currentCategory
                          .showNotifications
                      }
                      checked={
                        "showReactionNotifications" in
                        currentCategory
                          ? currentCategory
                              .showReactionNotifications
                          : false
                      }
                      onChange={(event) =>
                        void updateCategory({
                          showReactionNotifications:
                            event.target.checked,
                        })
                      }
                    />

                    <span />
                  </label>
                </div>
              </>
            )}

            <div className="notification-divider" />

            <div className="notification-toggle-row">
              <Volume2 />

              <div>
                <strong>Play sound</strong>
              </div>

              <label className="notification-switch">
                <input
                  type="checkbox"
                  checked={currentCategory.playSound}
                  onChange={(event) =>
                    void updateCategory({
                      playSound:
                        event.target.checked,
                    })
                  }
                />

                <span />
              </label>
            </div>
          </div>
        )}
      </section>

      <EmptyPane />

      {permissionModalOpen && (
        <div className="notification-permission-overlay">
          <section
            className="notification-permission-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Allow notifications"
          >
            <div className="notification-permission-icon">
              <MousePointer2 />
            </div>

            <div>
              <h2>Allow notifications</h2>

              <p>
                Click the browser settings icon next
                to the address bar and turn
                Notifications on.
              </p>

              <button
                type="button"
                onClick={() =>
                  setPermissionModalOpen(false)
                }
              >
                OK
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}