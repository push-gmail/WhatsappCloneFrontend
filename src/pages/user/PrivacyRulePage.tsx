import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check } from "lucide-react";
import {
  useNavigate,
  useParams,
} from "react-router-dom";
import toast from "react-hot-toast";

import backendApi, {
  getErrorMessage,
} from "../../api/backendApi";

import PrivacyUserPicker from "../../components/privacy/PrivacyUserPicker";

import type {
  PrivacyRule,
  PrivacySettings,
  PrivacyVisibilityMode,
} from "../../types";

type PrivacyRuleKey =
  | "lastSeen"
  | "profilePicture"
  | "about"
  | "status";

const routeMap: Record<
  string,
  {
    key: PrivacyRuleKey;
    title: string;
  }
> = {
  "last-seen": {
    key: "lastSeen",
    title: "Last seen and online",
  },

  "profile-picture": {
    key: "profilePicture",
    title: "Profile picture",
  },

  about: {
    key: "about",
    title: "About",
  },

  status: {
    key: "status",
    title: "Status privacy",
  },
};

type RadioOption = {
  value: PrivacyVisibilityMode;
  label: string;
  description?: string;
};

export default function PrivacyRulePage() {
  const [privacy, setPrivacy] =
    useState<PrivacySettings | null>(null);

  const [rule, setRule] = useState<PrivacyRule>({
    mode: "everyone",
    includedUsers: [],
    excludedUsers: [],
  });

  const [onlineVisibility, setOnlineVisibility] =
    useState<"everyone" | "same_as_last_seen">(
      "everyone"
    );

  const [pickerOpen, setPickerOpen] =
    useState(false);

  const [pickerPurpose, setPickerPurpose] = useState<
    "included" | "excluded"
  >("included");

  const [saving, setSaving] = useState(false);

  const { section = "" } = useParams<{
    section: string;
  }>();

  const navigate = useNavigate();

  const config = routeMap[section];

  const options = useMemo<RadioOption[]>(() => {
    if (config?.key === "status") {
      return [
        {
          value: "my_contacts",
          label: "My contacts",
        },
        {
          value: "my_contacts_except",
          label: "My contacts except...",
        },
        {
          value: "only_share_with",
          label: "Only share with...",
        },
      ];
    }

    return [
      {
        value: "everyone",
        label: "Everyone",
      },
      {
        value: "my_contacts",
        label: "My contacts",
      },
      {
        value: "my_contacts_except",
        label: "My contacts except...",
      },
      {
        value: "nobody",
        label: "Nobody",
      },
    ];
  }, [config?.key]);

  useEffect(() => {
    if (!config) return;

    let cancelled = false;

    const loadPrivacy = async () => {
      try {
        const { data } = await backendApi.get(
          "/user/privacy"
        );

        if (cancelled) return;

        const fetchedPrivacy: PrivacySettings =
          data.privacy;

        setPrivacy(fetchedPrivacy);

        setRule(
          fetchedPrivacy[config.key] || {
            mode:
              config.key === "status"
                ? "my_contacts"
                : "everyone",
            includedUsers: [],
            excludedUsers: [],
          }
        );

        setOnlineVisibility(
          fetchedPrivacy.onlineVisibility ||
            "everyone"
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
  }, [config]);

  if (!config) {
    return (
      <section className="privacy-rule-page">
        <header className="privacy-rule-header">
          <button
            type="button"
            onClick={() =>
              navigate("/user/privacy")
            }
          >
            <ArrowLeft />
          </button>

          <h1>Privacy</h1>
        </header>

        <div className="privacy-loading">
          Invalid privacy section
        </div>
      </section>
    );
  }

  const openPickerForMode = (
    mode: PrivacyVisibilityMode
  ) => {
    if (mode === "my_contacts") {
      setPickerPurpose("included");
      setPickerOpen(true);
      return;
    }

    if (mode === "my_contacts_except") {
      setPickerPurpose("excluded");
      setPickerOpen(true);
      return;
    }

    if (mode === "only_share_with") {
      setPickerPurpose("included");
      setPickerOpen(true);
    }
  };

  const selectMode = (
    mode: PrivacyVisibilityMode
  ) => {
    setRule((current) => ({
      ...current,
      mode,
    }));

    openPickerForMode(mode);
  };

  const saveRule = async () => {
    try {
      setSaving(true);

      await backendApi.patch(
        `/user/privacy/${config.key}`,
        {
          mode: rule.mode,
          includedUsers: rule.includedUsers,
          excludedUsers: rule.excludedUsers,
        }
      );

      if (config.key === "lastSeen") {
        await backendApi.patch(
          "/user/privacy/onlineVisibility",
          {
            value: onlineVisibility,
          }
        );
      }

      toast.success("Privacy updated");
      navigate("/user/privacy");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const saveSelectedUsers = (
    selectedUserIds: string[]
  ) => {
    setRule((current) => {
      if (pickerPurpose === "included") {
        return {
          ...current,
          includedUsers: selectedUserIds,
        };
      }

      return {
        ...current,
        excludedUsers: selectedUserIds,
      };
    });

    setPickerOpen(false);
  };

  const selectedPickerUsers =
    pickerPurpose === "included"
      ? rule.includedUsers
      : rule.excludedUsers;

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

        <h1>{config.title}</h1>
      </header>

      <div className="privacy-rule-content">
        <p className="privacy-rule-label">
          {config.key === "lastSeen"
            ? "Who can see my last seen"
            : config.key === "status"
              ? "Who can see my status updates"
              : `Who can see my ${config.title.toLowerCase()}`}
        </p>

        <div className="privacy-radio-list">
          {options.map((option) => (
            <button
              type="button"
              key={option.value}
              className="privacy-radio-row"
              onClick={() =>
                selectMode(option.value)
              }
            >
              <span
                className={`privacy-radio ${
                  rule.mode === option.value
                    ? "active"
                    : ""
                }`}
              >
                {rule.mode === option.value && (
                  <span />
                )}
              </span>

              <div>
                <strong>{option.label}</strong>

                {option.value ===
                  "my_contacts_except" &&
                  rule.excludedUsers.length > 0 && (
                    <small>
                      {rule.excludedUsers.length} excluded
                    </small>
                  )}

                {(option.value ===
                  "my_contacts" ||
                  option.value ===
                    "only_share_with") &&
                  rule.includedUsers.length > 0 && (
                    <small>
                      {rule.includedUsers.length} selected
                    </small>
                  )}
              </div>
            </button>
          ))}
        </div>

        {config.key === "lastSeen" && (
          <>
            <p className="privacy-rule-label privacy-online-label">
              Who can see when I'm online
            </p>

            <div className="privacy-radio-list">
              <button
                type="button"
                className="privacy-radio-row"
                onClick={() =>
                  setOnlineVisibility("everyone")
                }
              >
                <span
                  className={`privacy-radio ${
                    onlineVisibility === "everyone"
                      ? "active"
                      : ""
                  }`}
                >
                  {onlineVisibility ===
                    "everyone" && <span />}
                </span>

                <strong>Everyone</strong>
              </button>

              <button
                type="button"
                className="privacy-radio-row"
                onClick={() =>
                  setOnlineVisibility(
                    "same_as_last_seen"
                  )
                }
              >
                <span
                  className={`privacy-radio ${
                    onlineVisibility ===
                    "same_as_last_seen"
                      ? "active"
                      : ""
                  }`}
                >
                  {onlineVisibility ===
                    "same_as_last_seen" && <span />}
                </span>

                <strong>Same as last seen</strong>
              </button>
            </div>
          </>
        )}

        <button
          type="button"
          className="privacy-save-button"
          onClick={() => void saveRule()}
          disabled={saving}
        >
          <Check size={19} />
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      <PrivacyUserPicker
        open={pickerOpen}
        title={
          pickerPurpose === "included"
            ? "Select contacts"
            : "Exclude contacts"
        }
        selectedUserIds={selectedPickerUsers}
        onClose={() => setPickerOpen(false)}
        onSave={saveSelectedUsers}
      />
    </section>
  );
}