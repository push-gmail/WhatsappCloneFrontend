import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Camera,
  CircleDashed,
  LoaderCircle,
  MoreVertical,
  Plus,
  RefreshCw,
} from "lucide-react";

import toast from "react-hot-toast";

import {
  useOutletContext,
} from "react-router-dom";

import backendApi, {
  getErrorMessage,
} from "../../api/backendApi";

import Avatar from "../../components/common/Avatar";
import EmptyPane from "../../components/layout/EmptyPane";

import StatusUploadModal from "../../components/status/StatusUploadModal";
import StatusViewer from "../../components/status/StatusViewer";
import StatusViewersModal from "../../components/status/StatusViewersModal";

import type {
  MyStatusResponse,
  Profile,
  StatusFeedGroup,
  StatusFeedResponse,
} from "../../types";

type ViewerState = {
  group: StatusFeedGroup;
  isMine: boolean;
  initialIndex: number;
};

const createEmptyMyStatus =
  (): MyStatusResponse => ({
    statusExist: "no",
    profile: null,
    statuses: [],
  });

const timeLabel = (
  value?: string
) => {
  if (!value) {
    return "";
  }

  const date = new Date(
    value
  );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return date.toLocaleTimeString(
    [],
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  );
};

export default function StatusPage() {
  const { profile } =
    useOutletContext<{
      profile: Profile | null;
    }>();

  const [myStatus, setMyStatus] =
    useState<MyStatusResponse>(
      createEmptyMyStatus
    );

  const [feed, setFeed] =
    useState<
      StatusFeedGroup[]
    >([]);

  const [loading, setLoading] =
    useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    uploadModalOpen,
    setUploadModalOpen,
  ] = useState(false);

  const [viewer, setViewer] =
    useState<ViewerState | null>(
      null
    );

  const [
    viewersStatusItemId,
    setViewersStatusItemId,
  ] = useState<
    string | null
  >(null);

  const loadStatuses =
    useCallback(
      async (
        showInitialLoader =
          true
      ) => {
        if (
          showInitialLoader
        ) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        try {
          const [
            myStatusResponse,
            feedResponse,
          ] = await Promise.all([
            backendApi.get<MyStatusResponse>(
              "/user/status/me"
            ),

            backendApi.get<StatusFeedResponse>(
              "/user/status/feed"
            ),
          ]);

          const myStatusData =
            myStatusResponse.data;

          setMyStatus({
            statusDocumentId:
              myStatusData
                ?.statusDocumentId,

            statusExist:
              myStatusData
                ?.statusExist ||
              "no",

            profile:
              myStatusData
                ?.profile ||
              null,

            statuses:
              Array.isArray(
                myStatusData
                  ?.statuses
              )
                ? myStatusData
                    .statuses
                : [],
          });

          setFeed(
            Array.isArray(
              feedResponse.data
                ?.statuses
            )
              ? feedResponse.data
                  .statuses
              : []
          );
        } catch (error) {
          toast.error(
            getErrorMessage(error)
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      []
    );

  useEffect(() => {
    void loadStatuses();
  }, [loadStatuses]);

  /*
   * Status page ka isolated polling.
   * Existing chat Socket.IO flow touch nahi hoga.
   */
  useEffect(() => {
    const interval =
      window.setInterval(
        () => {
          void loadStatuses(
            false
          );
        },
        60_000
      );

    return () => {
      window.clearInterval(
        interval
      );
    };
  }, [loadStatuses]);

  const unseenFeed =
    useMemo(
      () =>
        feed.filter(
          (group) =>
            !group.allStatusesSeenByMe
        ),
      [feed]
    );

  const seenFeed =
    useMemo(
      () =>
        feed.filter(
          (group) =>
            group.allStatusesSeenByMe
        ),
      [feed]
    );

  const openMyStatus = () => {
    if (
      myStatus.statuses
        .length === 0
    ) {
      setUploadModalOpen(
        true
      );

      return;
    }

    setViewer({
      group: {
        statusDocumentId:
          myStatus
            .statusDocumentId ||
          "my-status",

        userId:
          myStatus.profile
            ?.userId ||
          "",

        profileId:
          myStatus.profile
            ?._id ||
          "",

        profile: {
          name:
            myStatus.profile
              ?.name ||
            profile?.name ||
            "My status",

          profilePhoto:
            myStatus.profile
              ?.profilePhoto ||
            profile
              ?.profilePhoto ||
            "",

          email: "",
        },

        statusExist: "yes",

        statuses:
          myStatus.statuses,

        allStatusesSeenByMe:
          true,

        latestStatusAt:
          myStatus.statuses[
            myStatus.statuses
              .length - 1
          ]?.createdAt || "",
      },

      isMine: true,
      initialIndex: 0,
    });
  };

  const handleViewed =
    useCallback(
      (
        statusItemId: string
      ) => {
        setFeed(
          (currentFeed) =>
            currentFeed.map(
              (group) => {
                const containsStatus =
                  group.statuses.some(
                    (status) =>
                      status._id ===
                      statusItemId
                  );

                if (
                  !containsStatus
                ) {
                  return group;
                }

                const nextStatuses =
                  group.statuses.map(
                    (status) =>
                      status._id ===
                      statusItemId
                        ? {
                            ...status,
                            isSeenByMe:
                              true,
                          }
                        : status
                  );

                return {
                  ...group,

                  statuses:
                    nextStatuses,

                  allStatusesSeenByMe:
                    nextStatuses.every(
                      (status) =>
                        Boolean(
                          status.isSeenByMe
                        )
                    ),
                };
              }
            )
        );

        setViewer(
          (currentViewer) => {
            if (
              !currentViewer ||
              currentViewer.isMine
            ) {
              return currentViewer;
            }

            const containsStatus =
              currentViewer.group.statuses.some(
                (status) =>
                  status._id ===
                  statusItemId
              );

            if (
              !containsStatus
            ) {
              return currentViewer;
            }

            const nextStatuses =
              currentViewer.group.statuses.map(
                (status) =>
                  status._id ===
                  statusItemId
                    ? {
                        ...status,
                        isSeenByMe:
                          true,
                      }
                    : status
              );

            return {
              ...currentViewer,

              group: {
                ...currentViewer.group,

                statuses:
                  nextStatuses,

                allStatusesSeenByMe:
                  nextStatuses.every(
                    (status) =>
                      Boolean(
                        status.isSeenByMe
                      )
                  ),
              },
            };
          }
        );
      },
      []
    );

  const renderStatusGroup = (
    group: StatusFeedGroup
  ) => {
    const latestStatus =
      group.statuses[
        group.statuses.length -
          1
      ];

    const firstUnseenIndex =
      group.statuses.findIndex(
        (status) =>
          !status.isSeenByMe
      );

    return (
      <button
        type="button"
        key={
          group.statusDocumentId
        }
        className="wa-status-list-row"
        onClick={() =>
          setViewer({
            group,
            isMine: false,

            initialIndex:
              firstUnseenIndex >=
              0
                ? firstUnseenIndex
                : 0,
          })
        }
      >
        <div
          className={`wa-status-avatar-ring ${
            group.allStatusesSeenByMe
              ? "seen"
              : "unseen"
          }`}
        >
          <Avatar
            src={
              group.profile
                .profilePhoto
            }
            name={
              group.profile.name ||
              group.profile.email
            }
            size={50}
          />
        </div>

        <div className="wa-status-list-copy">
          <strong>
            {group.profile.name ||
              group.profile.email ||
              "Unknown user"}
          </strong>

          <small>
            {timeLabel(
              latestStatus
                ?.createdAt
            )}
          </small>
        </div>
      </button>
    );
  };

  return (
    <div className="wa-status-layout">
      <section className="wa-status-panel">
        <header className="wa-status-panel-header">
          <h1>Updates</h1>

          <div>
            <button
              type="button"
              title="Refresh"
              onClick={() => {
                void loadStatuses(
                  false
                );
              }}
              disabled={refreshing}
            >
              <RefreshCw
                className={
                  refreshing
                    ? "wa-status-spin"
                    : ""
                }
              />
            </button>

            <button
              type="button"
              title="More options"
            >
              <MoreVertical />
            </button>
          </div>
        </header>

        <div className="wa-status-my-section">
          <button
            type="button"
            className="wa-status-my-row"
            onClick={
              openMyStatus
            }
          >
            <div className="wa-status-my-avatar">
              <Avatar
                src={
                  myStatus.profile
                    ?.profilePhoto ||
                  profile
                    ?.profilePhoto
                }
                name={
                  myStatus.profile
                    ?.name ||
                  profile?.name
                }
                size={52}
              />

              <span>
                <Plus />
              </span>
            </div>

            <div>
              <strong>
                My status
              </strong>

              <small>
                {myStatus.statuses
                  .length > 0
                  ? `${myStatus.statuses.length} active update${
                      myStatus
                        .statuses
                        .length >
                      1
                        ? "s"
                        : ""
                    }`
                  : "Click to add status update"}
              </small>
            </div>
          </button>

          <button
            type="button"
            className="wa-status-camera-button"
            onClick={() =>
              setUploadModalOpen(
                true
              )
            }
            title="Add status"
          >
            <Camera />
          </button>
        </div>

        {loading ? (
          <div className="wa-status-loading">
            <LoaderCircle className="wa-status-spin" />
            Loading updates...
          </div>
        ) : (
          <div className="wa-status-list">
            {unseenFeed.length >
              0 && (
              <section>
                <h2>
                  Recent updates
                </h2>

                {unseenFeed.map(
                  renderStatusGroup
                )}
              </section>
            )}

            {seenFeed.length >
              0 && (
              <section>
                <h2>
                  Viewed updates
                </h2>

                {seenFeed.map(
                  renderStatusGroup
                )}
              </section>
            )}

            {feed.length ===
              0 && (
              <div className="wa-status-empty-feed">
                <CircleDashed />

                <strong>
                  No status updates
                </strong>

                <span>
                  Status updates from your contacts will appear here.
                </span>
              </div>
            )}
          </div>
        )}
      </section>

      <EmptyPane />

      <button
        type="button"
        className="wa-status-floating-add"
        onClick={() =>
          setUploadModalOpen(
            true
          )
        }
        aria-label="Add status"
      >
        <Camera />
      </button>

      <StatusUploadModal
        open={
          uploadModalOpen
        }
        onClose={() =>
          setUploadModalOpen(
            false
          )
        }
        onUploaded={() => {
          void loadStatuses(
            false
          );
        }}
      />

      {viewer && (
        <StatusViewer
          group={viewer.group}
          isMine={viewer.isMine}
          initialIndex={
            viewer.initialIndex
          }
          onClose={() =>
            setViewer(null)
          }
          onViewed={
            handleViewed
          }
          onDeleted={() => {
            void loadStatuses(
              false
            );
          }}
          onOpenViewers={(
            statusItemId
          ) => {
            setViewersStatusItemId(
              statusItemId
            );
          }}
        />
      )}

      <StatusViewersModal
        statusItemId={
          viewersStatusItemId
        }
        onClose={() =>
          setViewersStatusItemId(
            null
          )
        }
      />
    </div>
  );
}