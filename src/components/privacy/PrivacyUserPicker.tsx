import { useEffect, useMemo, useState } from "react";
import { Check, Search, X } from "lucide-react";
import toast from "react-hot-toast";

import backendApi, {
  BACKEND_URL,
  getErrorMessage,
} from "../../api/backendApi";

import Avatar from "../common/Avatar";
import type { PrivacyUser } from "../../types";

type PrivacyUserPickerProps = {
  open: boolean;
  title: string;
  selectedUserIds: string[];
  onClose: () => void;
  onSave: (selectedUserIds: string[]) => void;
};

const getImageUrl = (image?: string) => {
  if (!image) return "";

  if (
    image.startsWith("http://") ||
    image.startsWith("https://")
  ) {
    return image;
  }

  return `${BACKEND_URL}${image}`;
};

export default function PrivacyUserPicker({
  open,
  title,
  selectedUserIds,
  onClose,
  onSave,
}: PrivacyUserPickerProps) {
  const [users, setUsers] = useState<PrivacyUser[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(
    new Set(selectedUserIds)
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    setSelected(new Set(selectedUserIds));
    setSearch("");

    let cancelled = false;

    const loadUsers = async () => {
      try {
        setLoading(true);

        const { data } = await backendApi.get(
          "/user/privacy/users"
        );

        if (cancelled) return;

        setUsers(
          Array.isArray(data?.users) ? data.users : []
        );
      } catch (error) {
        if (!cancelled) {
          toast.error(getErrorMessage(error));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadUsers();

    return () => {
      cancelled = true;
    };
  }, [open, selectedUserIds]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return users;

    return users.filter((user) => {
      return (
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
      );
    });
  }, [users, search]);

  const toggleUser = (userId: string) => {
    setSelected((current) => {
      const next = new Set(current);

      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }

      return next;
    });
  };

  const saveSelection = () => {
    onSave(Array.from(selected));
  };

  if (!open) return null;

  return (
    <div
      className="privacy-picker-overlay"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        className="privacy-picker"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="privacy-picker-header">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
          >
            <X />
          </button>

          <div>
            <h2>{title}</h2>
            <p>{selected.size} selected</p>
          </div>
        </header>

        <div className="privacy-picker-search">
          <Search size={18} />

          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search name or email"
          />
        </div>

        <div className="privacy-picker-users">
          {loading ? (
            <div className="privacy-picker-message">
              Loading users...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="privacy-picker-message">
              No users found
            </div>
          ) : (
            filteredUsers.map((user) => {
              const checked = selected.has(user.userId);

              return (
                <button
                  type="button"
                  key={user.userId}
                  className={`privacy-user-row ${
                    checked ? "selected" : ""
                  }`}
                  onClick={() => toggleUser(user.userId)}
                >
                  <Avatar
                    src={getImageUrl(user.profilePhoto)}
                    name={user.name || user.email}
                  />

                  <div className="privacy-user-details">
                    <strong>
                      {user.name || user.email}
                    </strong>
                    <span>{user.email}</span>
                  </div>

                  <span
                    className={`privacy-checkbox ${
                      checked ? "checked" : ""
                    }`}
                  >
                    {checked && <Check size={15} />}
                  </span>
                </button>
              );
            })
          )}
        </div>

        <button
          type="button"
          className="privacy-picker-save"
          onClick={saveSelection}
          aria-label="Save selected users"
        >
          <Check />
        </button>
      </section>
    </div>
  );
}