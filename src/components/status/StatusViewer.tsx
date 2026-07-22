import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ChevronLeft,
  ChevronRight,
  Eye,
  MoreVertical,
  Trash2,
  X,
} from "lucide-react";

import toast from "react-hot-toast";

import backendApi, {
  BACKEND_URL,
  getErrorMessage,
} from "../../api/backendApi";

import Avatar from "../common/Avatar";

import type {
  StatusFeedGroup,
} from "../../types";

type StatusViewerProps = {
  group: StatusFeedGroup;
  isMine: boolean;
  initialIndex?: number;

  onClose: () => void;

  onViewed: (
    statusItemId: string
  ) => void;

  onDeleted: () => void;

  onOpenViewers: (
    statusItemId: string
  ) => void;
};

const IMAGE_DURATION_MS = 5000;

const resolveMediaUrl = (
  mediaUrl: string
) => {
  if (!mediaUrl) {
    return "";
  }

  if (
    mediaUrl.startsWith("http")
  ) {
    return mediaUrl;
  }

  return `${BACKEND_URL}${mediaUrl}`;
};

const formatStatusTime = (
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

export default function StatusViewer({
  group,
  isMine,
  initialIndex = 0,
  onClose,
  onViewed,
  onDeleted,
  onOpenViewers,
}: StatusViewerProps) {
  const normalizedInitialIndex =
    Math.min(
      Math.max(
        initialIndex,
        0
      ),
      Math.max(
        group.statuses.length -
          1,
        0
      )
    );

  const [
    currentIndex,
    setCurrentIndex,
  ] = useState(
    normalizedInitialIndex
  );

  const [deleting, setDeleting] =
    useState(false);

  const markedStatusIdsRef =
    useRef<Set<string>>(
      new Set()
    );

  const currentStatus =
    group.statuses[
      currentIndex
    ];

  const goPrevious =
    useCallback(() => {
      setCurrentIndex(
        (current) =>
          Math.max(
            current - 1,
            0
          )
      );
    }, []);

  const goNext =
    useCallback(() => {
      setCurrentIndex(
        (current) => {
          if (
            current >=
            group.statuses
              .length -
              1
          ) {
            onClose();

            return current;
          }

          return current + 1;
        }
      );
    }, [
      group.statuses.length,
      onClose,
    ]);

  useEffect(() => {
    setCurrentIndex(
      Math.min(
        Math.max(
          initialIndex,
          0
        ),
        Math.max(
          group.statuses
            .length -
            1,
          0
        )
      )
    );

    markedStatusIdsRef.current.clear();
  }, [
    group.statusDocumentId,
    group.statuses.length,
    initialIndex,
  ]);

  useEffect(() => {
    if (
      !currentStatus ||
      isMine ||
      currentStatus.isSeenByMe ||
      markedStatusIdsRef.current.has(
        currentStatus._id
      )
    ) {
      return;
    }

    markedStatusIdsRef.current.add(
      currentStatus._id
    );

    const markViewed =
      async () => {
        try {
          await backendApi.post(
            `/user/status/${currentStatus._id}/view`
          );

          onViewed(
            currentStatus._id
          );
        } catch (error) {
          markedStatusIdsRef.current.delete(
            currentStatus._id
          );

          console.error(
            "Status view error:",
            getErrorMessage(
              error
            )
          );
        }
      };

    void markViewed();
  }, [
    currentStatus,
    isMine,
    onViewed,
  ]);

  useEffect(() => {
    if (
      !currentStatus ||
      currentStatus.mediaType !==
        "image"
    ) {
      return;
    }

    const timer =
      window.setTimeout(
        goNext,
        IMAGE_DURATION_MS
      );

    return () => {
      window.clearTimeout(
        timer
      );
    };
  }, [
    currentStatus,
    goNext,
  ]);

  useEffect(() => {
    const handleKeyDown = (
      event: KeyboardEvent
    ) => {
      if (
        event.key === "Escape"
      ) {
        onClose();
      }

      if (
        event.key ===
        "ArrowRight"
      ) {
        goNext();
      }

      if (
        event.key ===
        "ArrowLeft"
      ) {
        goPrevious();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    goNext,
    goPrevious,
    onClose,
  ]);

  const mediaUrl = useMemo(
    () =>
      resolveMediaUrl(
        currentStatus?.mediaUrl ||
          ""
      ),
    [
      currentStatus?.mediaUrl,
    ]
  );

  if (!currentStatus) {
    return null;
  }

  const deleteCurrentStatus =
    async () => {
      if (deleting) {
        return;
      }

      const confirmed =
        window.confirm(
          "Delete this status?"
        );

      if (!confirmed) {
        return;
      }

      setDeleting(true);

      try {
        await backendApi.delete(
          `/user/status/${currentStatus._id}`
        );

        toast.success(
          "Status deleted successfully"
        );

        onDeleted();
        onClose();
      } catch (error) {
        toast.error(
          getErrorMessage(error)
        );
      } finally {
        setDeleting(false);
      }
    };

  return (
    <div
      className="wa-status-viewer-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Status viewer"
    >
      <div className="wa-status-progress-row">
        {group.statuses.map(
          (status, index) => (
            <span
              key={status._id}
              className={`wa-status-progress ${
                index <
                currentIndex
                  ? "completed"
                  : ""
              } ${
                index ===
                currentIndex
                  ? "active"
                  : ""
              }`}
            >
              {index ===
                currentIndex &&
              currentStatus.mediaType ===
                "image" ? (
                <i />
              ) : null}
            </span>
          )
        )}
      </div>

      <header className="wa-status-viewer-header">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close status"
        >
          <X />
        </button>

        <Avatar
          src={
            group.profile
              .profilePhoto
          }
          name={
            group.profile.name ||
            group.profile.email
          }
          size={42}
        />

        <div className="wa-status-viewer-owner">
          <strong>
            {isMine
              ? "My status"
              : group.profile
                  .name ||
                group.profile
                  .email}
          </strong>

          <small>
            {formatStatusTime(
              currentStatus.createdAt
            )}
          </small>
        </div>

        {isMine ? (
          <button
            type="button"
            className="wa-status-delete-button"
            onClick={() => {
              void deleteCurrentStatus();
            }}
            disabled={deleting}
            aria-label="Delete status"
          >
            <Trash2 />
          </button>
        ) : (
          <button
            type="button"
            aria-label="More options"
          >
            <MoreVertical />
          </button>
        )}
      </header>

      <main className="wa-status-media-stage">
        {currentIndex > 0 && (
          <button
            type="button"
            className="wa-status-navigation previous"
            onClick={goPrevious}
            aria-label="Previous status"
          >
            <ChevronLeft />
          </button>
        )}

        {currentStatus.mediaType ===
        "video" ? (
          <video
            key={
              currentStatus._id
            }
            src={mediaUrl}
            autoPlay
            playsInline
            controls
            onEnded={goNext}
          />
        ) : (
          <img
            key={
              currentStatus._id
            }
            src={mediaUrl}
            alt={
              currentStatus.caption ||
              "Status"
            }
          />
        )}

        <button
          type="button"
          className="wa-status-navigation next"
          onClick={goNext}
          aria-label="Next status"
        >
          <ChevronRight />
        </button>
      </main>

      {currentStatus.caption && (
        <div className="wa-status-viewer-caption">
          {currentStatus.caption}
        </div>
      )}

      {isMine && (
        <button
          type="button"
          className="wa-status-view-count-button"
          onClick={() =>
            onOpenViewers(
              currentStatus._id
            )
          }
        >
          <Eye />

          <span>
            {currentStatus
              .viewsCount || 0}
          </span>
        </button>
      )}
    </div>
  );
}