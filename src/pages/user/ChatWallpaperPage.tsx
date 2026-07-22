import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import {
  ArrowLeft,
  Check,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { useChatSettings } from "../../store/ChatSettingsContext";

import type {
  ChatWallpaper,
  WallpaperType,
} from "../../types";

const DEFAULT_WALLPAPER: ChatWallpaper =
  {
    type: "default",
    value: "",
    doodlesEnabled: true,
  };

const wallpaperColors = [
  "#0b3b36",
  "#0c3026",
  "#102d2a",
  "#101f29",
  "#142735",
  "#202428",
  "#28261f",
  "#2c291d",
  "#302116",
  "#321d1d",
  "#351619",
  "#291b30",
  "#171d2e",
  "#0c2530",
  "#121212",
  "#efeae2",
];

const normalizeWallpaper = (
  wallpaper?: ChatWallpaper | null
): ChatWallpaper => {
  if (!wallpaper) {
    return DEFAULT_WALLPAPER;
  }

  const supportedType: WallpaperType =
    wallpaper.type === "color"
      ? "color"
      : "default";

  return {
    type: supportedType,

    value:
      supportedType === "color"
        ? wallpaper.value
        : "",

    doodlesEnabled:
      wallpaper.doodlesEnabled !==
      false,
  };
};

export default function ChatWallpaperPage() {
  const navigate = useNavigate();

  const {
    chatSettings,
    loading,
    resolvedTheme,
    saveWallpaper,
  } = useChatSettings();

  const [draft, setDraft] =
    useState<ChatWallpaper>(
      DEFAULT_WALLPAPER
    );

  const [saving, setSaving] =
    useState(false);

  useEffect(() => {
    if (
      chatSettings?.wallpaper
    ) {
      setDraft(
        normalizeWallpaper(
          chatSettings.wallpaper
        )
      );
    }
  }, [chatSettings?.wallpaper]);

  const previewStyle =
    useMemo<CSSProperties>(() => {
      if (
        draft.type === "color" &&
        draft.value
      ) {
        return {
          backgroundColor:
            draft.value,
        };
      }

      return {
        backgroundColor:
          "#0b3b36",
      };
    }, [
      draft.type,
      draft.value,
    ]);

  const selectDefault = () => {
    setDraft((current) => ({
      ...current,
      type: "default",
      value: "",
    }));
  };

  const selectColor = (
    color: string
  ) => {
    setDraft((current) => ({
      ...current,
      type: "color",
      value: color,
    }));
  };

  const save = async () => {
    if (saving) {
      return;
    }

    try {
      setSaving(true);

      await saveWallpaper(draft);

      toast.success(
        "Wallpaper updated"
      );

      navigate(
        "/user/chat-settings"
      );
    } catch {
      toast.error(
        "Wallpaper could not be updated"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="wa-wallpaper-layout"
      data-wa-chat-theme={
        resolvedTheme
      }
    >
      <section className="wa-wallpaper-selector">
        <header className="wa-wallpaper-header">
          <button
            type="button"
            onClick={() =>
              navigate(
                "/user/chat-settings"
              )
            }
            aria-label="Back to chat settings"
          >
            <ArrowLeft />
          </button>

          <h1>
            Set chat wallpaper
          </h1>
        </header>

        {loading ? (
          <div className="wa-wallpaper-loading">
            Loading wallpaper...
          </div>
        ) : (
          <div className="wa-wallpaper-content">
            <label className="wa-doodles-option">
              <input
                type="checkbox"
                checked={
                  draft.doodlesEnabled
                }
                onChange={(event) =>
                  setDraft(
                    (current) => ({
                      ...current,

                      doodlesEnabled:
                        event.target
                          .checked,
                    })
                  )
                }
              />

              <span className="wa-checkbox">
                {draft.doodlesEnabled && (
                  <Check size={14} />
                )}
              </span>

              <span>
                Add WhatsApp-style
                doodles
              </span>
            </label>

            <div className="wa-wallpaper-grid">
              <button
                type="button"
                className={`wa-wallpaper-color wa-default-wallpaper ${
                  draft.type ===
                  "default"
                    ? "selected"
                    : ""
                }`}
                onClick={
                  selectDefault
                }
                aria-label="Select default wallpaper"
              >
                <span>
                  Default
                </span>

                {draft.type ===
                  "default" && (
                  <Check className="wa-color-check" />
                )}
              </button>

              {wallpaperColors.map(
                (color) => {
                  const selected =
                    draft.type ===
                      "color" &&
                    draft.value ===
                      color;

                  return (
                    <button
                      type="button"
                      key={color}
                      className={`wa-wallpaper-color ${
                        selected
                          ? "selected"
                          : ""
                      }`}
                      style={{
                        backgroundColor:
                          color,
                      }}
                      onClick={() =>
                        selectColor(
                          color
                        )
                      }
                      aria-label={`Select wallpaper ${color}`}
                    >
                      {selected && (
                        <Check className="wa-color-check" />
                      )}
                    </button>
                  );
                }
              )}
            </div>

            <button
              type="button"
              className="wa-wallpaper-apply"
              onClick={() =>
                void save()
              }
              disabled={saving}
            >
              <Check size={18} />

              {saving
                ? "Applying..."
                : "Apply wallpaper"}
            </button>
          </div>
        )}
      </section>

      <section className="wa-wallpaper-preview-panel">
        <header>
          Wallpaper preview
        </header>

        <div
          className={`wa-wallpaper-preview ${
            draft.doodlesEnabled
              ? "wa-wallpaper-doodles"
              : ""
          }`}
          style={previewStyle}
        >
          <div className="wa-preview-date">
            Today
          </div>

          <div className="wa-preview-line incoming">
            <div className="wa-preview-message">
              <span>Hello</span>

              <small>
                10:24
              </small>
            </div>
          </div>

          <div className="wa-preview-line outgoing">
            <div className="wa-preview-message">
              <span>
                Hi, how are you?
              </span>

              <small>
                10:25
              </small>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}