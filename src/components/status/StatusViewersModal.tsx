import {
  useEffect,
  useState,
} from "react";

import {
  Eye,
  LoaderCircle,
  X,
} from "lucide-react";

import toast from "react-hot-toast";

import backendApi, {
  getErrorMessage,
} from "../../api/backendApi";

import Avatar from "../common/Avatar";

import type {
  StatusViewersResponse,
} from "../../types";

type StatusViewersModalProps = {
  statusItemId: string | null;
  onClose: () => void;
};

const formatSeenTime = (
  value: string
) => {
  const date = new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return "";
  }

  return date.toLocaleString(
    [],
    {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
};

export default function StatusViewersModal({
  statusItemId,
  onClose,
}: StatusViewersModalProps) {
  const [data, setData] =
    useState<StatusViewersResponse | null>(
      null
    );

  const [loading, setLoading] =
    useState(false);

  useEffect(() => {
    if (!statusItemId) {
      setData(null);
      setLoading(false);

      return;
    }

    let active = true;

    const loadViewers =
      async () => {
        setLoading(true);
        setData(null);

        try {
          const response =
            await backendApi.get<StatusViewersResponse>(
              `/user/status/${statusItemId}/viewers`
            );

          if (active) {
            setData(
              response.data
            );
          }
        } catch (error) {
          if (active) {
            toast.error(
              getErrorMessage(
                error
              )
            );
          }
        } finally {
          if (active) {
            setLoading(false);
          }
        }
      };

    void loadViewers();

    return () => {
      active = false;
    };
  }, [statusItemId]);

  if (!statusItemId) {
    return null;
  }

  return (
    <div
      className="wa-status-modal-overlay wa-status-viewers-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <section
        className="wa-status-viewers-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Status viewers"
      >
        <header>
          <div>
            <Eye />
            <h2>Viewed by</h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
          >
            <X />
          </button>
        </header>

        {loading ? (
          <div className="wa-status-viewers-loading">
            <LoaderCircle className="wa-status-spin" />
            Loading viewers...
          </div>
        ) : (
          <>
            <div className="wa-status-view-count">
              <Eye />

              <strong>
                {data?.viewsCount || 0}
              </strong>

              <span>
                unique views
              </span>
            </div>

            <div className="wa-status-viewers-list">
              {!data?.viewers?.length ? (
                <div className="wa-status-no-viewers">
                  No views yet
                </div>
              ) : (
                data.viewers.map(
                  (viewer) => (
                    <div
                      key={`${viewer.userId}-${viewer.seenAt}`}
                      className="wa-status-viewer-row"
                    >
                      <Avatar
                        src={
                          viewer.profilePhoto
                        }
                        name={
                          viewer.name ||
                          viewer.email
                        }
                        size={46}
                      />

                      <div>
                        <strong>
                          {viewer.name ||
                            viewer.email}
                        </strong>

                        <small>
                          {formatSeenTime(
                            viewer.seenAt
                          )}
                        </small>
                      </div>
                    </div>
                  )
                )
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}