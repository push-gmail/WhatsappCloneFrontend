import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

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
    saveMediaUploadQuality,
  } = useChatSettings();

  const selectQuality = async (
    quality: MediaUploadQuality
  ) => {
    try {
      await saveMediaUploadQuality(quality);
      toast.success("Upload quality updated");
    } catch {
      toast.error("Quality could not be updated");
    }
  };

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

        <h1>Media upload quality</h1>
      </header>

      <div className="privacy-radio-list quality-list">
        <button
          type="button"
          className="privacy-radio-row"
          onClick={() =>
            void selectQuality("standard")
          }
        >
          <span
            className={`privacy-radio ${
              chatSettings?.mediaUploadQuality ===
              "standard"
                ? "active"
                : ""
            }`}
          >
            {chatSettings?.mediaUploadQuality ===
              "standard" && <span />}
          </span>

          <div>
            <strong>Standard quality</strong>
            <small>
              Uses less storage and is faster to send
            </small>
          </div>
        </button>

        <button
          type="button"
          className="privacy-radio-row"
          onClick={() => void selectQuality("hd")}
        >
          <span
            className={`privacy-radio ${
              chatSettings?.mediaUploadQuality === "hd"
                ? "active"
                : ""
            }`}
          >
            {chatSettings?.mediaUploadQuality ===
              "hd" && <span />}
          </span>

          <div>
            <strong>HD quality</strong>
            <small>
              Higher quality and larger file size
            </small>
          </div>
        </button>
      </div>
    </section>
  );
}