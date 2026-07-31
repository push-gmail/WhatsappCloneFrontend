import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  ArrowLeft,
  ChevronRight,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import toast from "react-hot-toast";

import EmptyPane from "../../components/layout/EmptyPane";

import {
  useChatSettings,
} from "../../store/ChatSettingsContext";

import type {
  ChatTheme,
} from "../../types";

const getThemeLabel = (
  theme?: ChatTheme
) => {
  if (theme === "light") {
    return "Light";
  }

  if (theme === "dark") {
    return "Dark";
  }

  return "System default";
};

export default function ChatsSettingsPage() {
  const navigate = useNavigate();

  const {
    chatSettings,
    loading,
    resolvedTheme,
    refreshChatSettings,
    saveTheme,
    saveBehaviour,
  } = useChatSettings();

  /*
   * Chat settings page open hone par
   * API sirf ek baar call karne ke liye.
   */
  const requestStartedRef =
    useRef(false);

  const [
    themeModalOpen,
    setThemeModalOpen,
  ] = useState(false);

  const [
    draftTheme,
    setDraftTheme,
  ] = useState<ChatTheme>(
    "system"
  );

  /*
   * Login/Create Account ke baad call nahi hogi.
   *
   * Sirf jab user manually
   * /user/chat-settings page open karega,
   * tab chat-settings fetch hogi.
   */
  useEffect(() => {
    if (
      chatSettings ||
      requestStartedRef.current
    ) {
      return;
    }

    requestStartedRef.current = true;

    void refreshChatSettings();
  }, [
    chatSettings,
    refreshChatSettings,
  ]);

  useEffect(() => {
    if (chatSettings?.theme) {
      setDraftTheme(
        chatSettings.theme
      );
    }
  }, [chatSettings?.theme]);

  const openThemeModal = () => {
    setDraftTheme(
      chatSettings?.theme ||
        "system"
    );

    setThemeModalOpen(true);
  };

  const closeThemeModal = () => {
    setDraftTheme(
      chatSettings?.theme ||
        "system"
    );

    setThemeModalOpen(false);
  };

  const confirmTheme = async () => {
    try {
      await saveTheme(
        draftTheme
      );

      setThemeModalOpen(false);

      toast.success(
        "Theme updated"
      );
    } catch {
      toast.error(
        "Theme could not be updated"
      );
    }
  };

  const updateBehaviour = async (
    key:
      | "spellCheckEnabled"
      | "replaceTextWithEmoji"
      | "enterIsSend",
    value: boolean
  ) => {
    try {
      await saveBehaviour({
        [key]: value,
      });
    } catch {
      toast.error(
        "Setting could not be updated"
      );
    }
  };

  return (
    <div
      className="wa-chat-settings-layout"
      data-wa-chat-theme={
        resolvedTheme
      }
    >
      <section className="wa-chat-settings-panel">
        <header className="wa-chat-settings-header">
          <button
            type="button"
            onClick={() =>
              navigate(
                "/user/settings"
              )
            }
            aria-label="Back to settings"
          >
            <ArrowLeft />
          </button>

          <h1>Chats</h1>
        </header>

        {loading ||
        !chatSettings ? (
          <div className="wa-chat-settings-loading">
            Loading chat settings...
          </div>
        ) : (
          <div className="wa-chat-settings-content">
            <p className="wa-chat-settings-title">
              Display
            </p>

            <button
              type="button"
              className="wa-chat-setting-row"
              onClick={
                openThemeModal
              }
            >
              <div>
                <strong>
                  Theme
                </strong>

                <span>
                  {getThemeLabel(
                    chatSettings.theme
                  )}
                </span>
              </div>

              <ChevronRight />
            </button>

            <button
              type="button"
              className="wa-chat-setting-row"
              onClick={() =>
                navigate(
                  "/user/chat-settings/wallpaper"
                )
              }
            >
              <div>
                <strong>
                  Wallpaper
                </strong>
              </div>

              <ChevronRight />
            </button>

            <p className="wa-chat-settings-title">
              Chat settings
            </p>

            <button
              type="button"
              className="wa-chat-setting-row"
              onClick={() =>
                navigate(
                  "/user/chat-settings/media-upload-quality"
                )
              }
            >
              <div>
                <strong>
                  Media upload quality
                </strong>

                <span>
                  {chatSettings
                    .mediaUploadQuality ===
                  "hd"
                    ? "HD quality"
                    : "Standard quality"}
                </span>
              </div>

              <ChevronRight />
            </button>

            <button
              type="button"
              className="wa-chat-setting-row"
              onClick={() =>
                navigate(
                  "/user/chat-settings/media-auto-download"
                )
              }
            >
              <div>
                <strong>
                  Media auto-download
                </strong>
              </div>

              <ChevronRight />
            </button>

            <div className="wa-chat-toggle-row">
              <div>
                <strong>
                  Spell check
                </strong>

                <span>
                  Check spelling while
                  typing
                </span>
              </div>

              <label className="wa-chat-switch">
                <input
                  type="checkbox"
                  checked={
                    chatSettings
                      .spellCheckEnabled
                  }
                  onChange={(
                    event
                  ) =>
                    void updateBehaviour(
                      "spellCheckEnabled",
                      event.target
                        .checked
                    )
                  }
                />

                <span />
              </label>
            </div>

            <div className="wa-chat-toggle-row">
              <div>
                <strong>
                  Replace text with
                  emoji
                </strong>

                <span>
                  Emoji will replace
                  specific text
                </span>
              </div>

              <label className="wa-chat-switch">
                <input
                  type="checkbox"
                  checked={
                    chatSettings
                      .replaceTextWithEmoji
                  }
                  onChange={(
                    event
                  ) =>
                    void updateBehaviour(
                      "replaceTextWithEmoji",
                      event.target
                        .checked
                    )
                  }
                />

                <span />
              </label>
            </div>

            <div className="wa-chat-toggle-row">
              <div>
                <strong>
                  Enter is send
                </strong>

                <span>
                  Enter key will send
                  your message
                </span>
              </div>

              <label className="wa-chat-switch">
                <input
                  type="checkbox"
                  checked={
                    chatSettings
                      .enterIsSend
                  }
                  onChange={(
                    event
                  ) =>
                    void updateBehaviour(
                      "enterIsSend",
                      event.target
                        .checked
                    )
                  }
                />

                <span />
              </label>
            </div>
          </div>
        )}
      </section>

      <EmptyPane />

      {themeModalOpen && (
        <div
          className="wa-theme-overlay"
          onMouseDown={
            closeThemeModal
          }
        >
          <section
            className="wa-theme-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Chat theme"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <h2>Theme</h2>

            {(
              [
                [
                  "light",
                  "Light",
                ],
                [
                  "dark",
                  "Dark",
                ],
                [
                  "system",
                  "System default",
                ],
              ] as const
            ).map(
              ([value, label]) => {
                const selected =
                  draftTheme ===
                  value;

                return (
                  <button
                    type="button"
                    key={value}
                    className="wa-theme-option"
                    onClick={() =>
                      setDraftTheme(
                        value
                      )
                    }
                  >
                    <span
                      className={`wa-theme-radio ${
                        selected
                          ? "selected"
                          : ""
                      }`}
                    >
                      {selected && (
                        <span />
                      )}
                    </span>

                    <strong>
                      {label}
                    </strong>
                  </button>
                );
              }
            )}

            <footer>
              <button
                type="button"
                className="wa-theme-cancel"
                onClick={
                  closeThemeModal
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className="wa-theme-ok"
                onClick={() =>
                  void confirmTheme()
                }
              >
                OK
              </button>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
}