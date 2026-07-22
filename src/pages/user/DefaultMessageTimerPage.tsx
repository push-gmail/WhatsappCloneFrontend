import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Check,
  Clock3,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import backendApi, {
  getErrorMessage,
} from "../../api/backendApi";

import type {
  DefaultMessageTimer,
  PrivacySettings,
} from "../../types";

const timerOptions: Array<{
  value: DefaultMessageTimer;
  label: string;
}> = [
  {
    value: "off",
    label: "Off",
  },
  {
    value: "24_hours",
    label: "24 hours",
  },
  {
    value: "7_days",
    label: "7 days",
  },
  {
    value: "30_days",
    label: "30 days",
  },
  {
    value: "90_days",
    label: "90 days",
  },
];

export default function DefaultMessageTimerPage() {
  const [timer, setTimer] =
    useState<DefaultMessageTimer>("off");
  const [saving, setSaving] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const loadPrivacy = async () => {
      try {
        const { data } = await backendApi.get(
          "/user/privacy"
        );

        if (cancelled) return;

        const privacy: PrivacySettings = data.privacy;

        setTimer(
          privacy.defaultMessageTimer || "off"
        );
      } catch (error) {
        if (!cancelled) {
          toast.error(getErrorMessage(error));
        }
      }
    };

    void loadPrivacy();

    return () => {
      cancelled = true;
    };
  }, []);

  const saveTimer = async () => {
    try {
      setSaving(true);

      await backendApi.patch(
        "/user/privacy/defaultMessageTimer",
        {
          value: timer,
        }
      );

      toast.success("Default message timer updated");
      navigate("/user/privacy");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="privacy-rule-page settings-panel-page">
      <header className="privacy-rule-header">
        <button
          type="button"
          onClick={() =>
            navigate("/user/privacy")
          }
          aria-label="Back"
        >
          <ArrowLeft />
        </button>

        <h1>Default message timer</h1>
      </header>

      <div className="privacy-rule-content">
        <div className="privacy-timer-description">
          <Clock3 />

          <p>
            Start new chats with disappearing messages
            set to your selected duration.
          </p>
        </div>

        <div className="privacy-radio-list">
          {timerOptions.map((option) => (
            <button
              type="button"
              key={option.value}
              className="privacy-radio-row"
              onClick={() => setTimer(option.value)}
            >
              <span
                className={`privacy-radio ${
                  timer === option.value
                    ? "active"
                    : ""
                }`}
              >
                {timer === option.value && <span />}
              </span>

              <strong>{option.label}</strong>
            </button>
          ))}
        </div>

        <button
          type="button"
          className="privacy-save-button"
          onClick={() => void saveTimer()}
          disabled={saving}
        >
          <Check size={19} />
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </section>
  );
}