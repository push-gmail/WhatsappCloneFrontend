import {
  ArrowLeft,
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
  MediaUploadQuality,
} from "../../types";

export default function MediaUploadQualityPage() {
  const navigate = useNavigate();

  const {
    chatSettings,
    resolvedTheme,
    saveMediaUploadQuality,
  } = useChatSettings();

  const selectedQuality =
    chatSettings?.mediaUploadQuality ||
    "standard";

  const selectQuality = async (
    quality: MediaUploadQuality
  ) => {
    if (quality === selectedQuality) {
      return;
    }

    try {
      await saveMediaUploadQuality(
        quality
      );

      toast.success(
        "Media upload quality updated"
      );
    } catch {
      toast.error(
        "Quality could not be updated"
      );
    }
  };

  return (
    <div
      className="wa-media-quality-layout"
      data-wa-chat-theme={
        resolvedTheme
      }
    >
      <section className="wa-media-quality-panel">
        <header className="wa-media-quality-header">
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
            Media upload quality
          </h1>
        </header>

        <div className="wa-media-quality-content">
          <p className="wa-media-quality-description">
            Choose the quality of photos and
            videos you send.
          </p>

          <button
            type="button"
            className="wa-media-quality-option"
            onClick={() =>
              void selectQuality(
                "standard"
              )
            }
          >
            <span
              className={`wa-media-quality-radio ${
                selectedQuality ===
                "standard"
                  ? "active"
                  : ""
              }`}
            >
              {selectedQuality ===
                "standard" && (
                <span />
              )}
            </span>

            <span className="wa-media-quality-copy">
              <strong>
                Standard quality
              </strong>

              <small>
                Uses less storage and is
                faster to send
              </small>
            </span>
          </button>

          <button
            type="button"
            className="wa-media-quality-option"
            onClick={() =>
              void selectQuality("hd")
            }
          >
            <span
              className={`wa-media-quality-radio ${
                selectedQuality === "hd"
                  ? "active"
                  : ""
              }`}
            >
              {selectedQuality ===
                "hd" && <span />}
            </span>

            <span className="wa-media-quality-copy">
              <span className="wa-media-quality-title">
                <strong>
                  HD quality
                </strong>

                <b>HD</b>
              </span>

              <small>
                Higher quality and larger file
                size
              </small>
            </span>
          </button>

          <p className="wa-media-quality-note">
            Standard quality uses less data.
            HD quality may take longer to
            upload.
          </p>
        </div>
      </section>

      <EmptyPane />
    </div>
  );
}