import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import {
  useChatSettings,
} from "../../store/ChatSettingsContext";

import type {
  MediaAutoDownload,
} from "../../types";

export default function MediaAutoDownloadPage() {
  const navigate = useNavigate();

  const {
    chatSettings,
    saveMediaAutoDownload,
  } = useChatSettings();

  if (!chatSettings) {
    return null;
  }

  const update = async (
    key: keyof MediaAutoDownload,
    value: boolean
  ) => {
    try {
      await saveMediaAutoDownload({
        ...chatSettings.mediaAutoDownload,
        [key]: value,
      });
    } catch {
      toast.error(
        "Auto-download setting could not be updated"
      );
    }
  };

  const rows: Array<{
    key: keyof MediaAutoDownload;
    label: string;
  }> = [
    { key: "photos", label: "Photos" },
    { key: "audio", label: "Audio" },
    { key: "videos", label: "Videos" },
    { key: "documents", label: "Documents" },
  ];

  return (
    <section className="single-settings-page">
      <header className="chat-settings-header">
        <button
          type="button"
          onClick={() =>
            navigate("/user/chat-settings")
          }
        >
          <ArrowLeft />
        </button>

        <h1>Media auto-download</h1>
      </header>

      <div className="media-download-list">
        {rows.map(({ key, label }) => (
          <div
            className="chat-setting-toggle-row"
            key={key}
          >
            <strong>{label}</strong>

            <label className="privacy-switch">
              <input
                type="checkbox"
                checked={
                  chatSettings.mediaAutoDownload[key]
                }
                onChange={(event) =>
                  void update(
                    key,
                    event.target.checked
                  )
                }
              />

              <span />
            </label>
          </div>
        ))}

        <p className="media-download-note">
          Voice messages can continue to load
          automatically for the best communication
          experience.
        </p>
      </div>
    </section>
  );
}