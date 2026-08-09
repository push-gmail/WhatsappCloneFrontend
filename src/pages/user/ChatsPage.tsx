import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  io,
  type Socket,
} from "socket.io-client";

import toast from "react-hot-toast";

import {
  Phone,
  PhoneOff,
  Video,
} from "lucide-react";

import backendApi, {
  BACKEND_URL,
  getErrorMessage,
} from "../../api/backendApi";

import ChatList from "../../components/chat/ChatList";
import LinkedDevicesScanner from "../../components/chat/LinkedDevicesScanner";
import ChatWindow from "../../components/chat/ChatWindow";
import EmptyPane from "../../components/layout/EmptyPane";
import ContactInfoPanel from "../../components/chat/ContactInfoPanel";
import Avatar from "../../components/common/Avatar";

import type {
  Conversation,
  Message,
  PublicUser,
  UserPresence,
  UserPresenceResponse,
  SavedContact,
  SharedContact,
  SharedLocation,
} from "../../types";

import {
  useAuth,
} from "../../store/AuthContext";

import {
  useChatSettings,
} from "../../store/ChatSettingsContext";

type SocketAcknowledgement = {
  ok?: boolean;
  message?: Message;
  error?: string;
  code?: string;
  callId?: string;
};

type CallType = "video" | "audio";
type CallPhase =
  | "incoming"
  | "outgoing"
  | "connecting"
  | "connected";

type CallPerson = {
  userId: string;
  email: string;
  name: string;
  profilePhoto: string;
};

type ActiveCall = {
  callId: string;
  conversationId: string;
  callType: CallType;
  phase: CallPhase;
  otherUser: CallPerson;
  offer?: RTCSessionDescriptionInit;
};

type IncomingCallPayload = {
  callId: string;
  conversationId: string;
  callType: CallType;
  offer: RTCSessionDescriptionInit;
  caller: CallPerson;
};

type CallAnsweredPayload = {
  callId: string;
  answer: RTCSessionDescriptionInit;
};

type CallIceCandidatePayload = {
  callId: string;
  candidate: RTCIceCandidateInit;
};

type CallEndedPayload = {
  callId: string;
  reason?: string;
};

type PresencePayload =
  UserPresence;

type MessagesReadPayload = {
  conversationId: string;
  readBy: string;
  readAt: string;
};

type TypingChangedPayload = {
  conversationId: string;
  userId: string;
  isTyping: boolean;
};

const getConversationId = (
  message: Message
): string => {
  if (
    typeof message.conversationId ===
    "string"
  ) {
    return message.conversationId;
  }

  return (
    message.conversationId?._id ||
    ""
  );
};

const createCallId = () => {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
};

const buildRtcConfiguration = (): RTCConfiguration => {
  const iceServers: RTCIceServer[] = [
    {
      urls: [
        "stun:stun.l.google.com:19302",
        "stun:stun1.l.google.com:19302",
      ],
    },
  ];

  const turnUrl = String(
    import.meta.env.VITE_WEBRTC_TURN_URL ||
      ""
  ).trim();

  if (turnUrl) {
    iceServers.push({
      urls: turnUrl,
      username: String(
        import.meta.env.VITE_WEBRTC_TURN_USERNAME ||
          ""
      ),
      credential: String(
        import.meta.env.VITE_WEBRTC_TURN_CREDENTIAL ||
          ""
      ),
    });
  }

  return { iceServers };
};

const stopStream = (
  stream: MediaStream | null
) => {
  stream?.getTracks().forEach((track) => {
    track.stop();
  });
};

type CallOverlayProps = {
  call: ActiveCall;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  onAccept: () => void;
  onReject: () => void;
  onEnd: () => void;
};

function CallOverlay({
  call,
  localStream,
  remoteStream,
  onAccept,
  onReject,
  onEnd,
}: CallOverlayProps) {
  const localVideoRef =
    useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef =
    useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef =
    useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (localVideoRef.current) {
      localVideoRef.current.srcObject =
        localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject =
        remoteStream;
    }

    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject =
        remoteStream;
    }
  }, [remoteStream]);

  const displayName =
    call.otherUser.name ||
    call.otherUser.email ||
    "WhatsApp user";

  if (call.phase === "incoming") {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          display: "grid",
          placeItems: "center",
          background: "rgba(0,0,0,0.58)",
          padding: 18,
        }}
      >
        <div
          style={{
            width: "min(390px, 100%)",
            borderRadius: 22,
            padding: 24,
            textAlign: "center",
            color: "white",
            background:
              "linear-gradient(160deg, #182c2a, #0d1717)",
            boxShadow:
              "0 22px 60px rgba(0,0,0,0.45)",
          }}
        >
          <div
            style={{
              width: 78,
              height: 78,
              margin: "0 auto 14px",
            }}
          >
            <Avatar
              src={call.otherUser.profilePhoto}
              name={displayName}
            />
          </div>

          <h2 style={{ margin: 0 }}>
            {displayName}
          </h2>
          <p style={{ opacity: 0.72 }}>
            Incoming {call.callType === "video"
              ? "video"
              : "voice"} call
          </p>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 30,
              marginTop: 22,
            }}
          >
            <button
              type="button"
              onClick={onReject}
              aria-label="Reject call"
              style={{
                width: 58,
                height: 58,
                borderRadius: "50%",
                border: 0,
                color: "white",
                background: "#ef4444",
                cursor: "pointer",
              }}
            >
              <PhoneOff />
            </button>

            <button
              type="button"
              onClick={onAccept}
              aria-label="Accept call"
              style={{
                width: 58,
                height: 58,
                borderRadius: "50%",
                border: 0,
                color: "white",
                background: "#22c55e",
                cursor: "pointer",
              }}
            >
              {call.callType === "video" ? (
                <Video />
              ) : (
                <Phone />
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        color: "white",
        background: "#07110f",
      }}
    >
      <div
        style={{
          position: "relative",
          flex: 1,
          display: "grid",
          placeItems: "center",
          overflow: "hidden",
          background:
            "radial-gradient(circle at center, #14332f, #07110f 65%)",
        }}
      >
        {call.callType === "video" ? (
          remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          ) : (
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  width: 110,
                  height: 110,
                  margin: "0 auto 16px",
                }}
              >
                <Avatar
                  src={call.otherUser.profilePhoto}
                  name={displayName}
                />
              </div>
              <h2>{displayName}</h2>
            </div>
          )
        ) : (
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: 120,
                height: 120,
                margin: "0 auto 18px",
              }}
            >
              <Avatar
                src={call.otherUser.profilePhoto}
                name={displayName}
              />
            </div>
            <h2>{displayName}</h2>
            <audio
              ref={remoteAudioRef}
              autoPlay
            />
          </div>
        )}

        <div
          style={{
            position: "absolute",
            top: 22,
            left: 0,
            right: 0,
            textAlign: "center",
            textShadow: "0 1px 4px #000",
          }}
        >
          <strong>{displayName}</strong>
          <div
            style={{
              marginTop: 4,
              fontSize: 13,
              opacity: 0.82,
            }}
          >
            {call.phase === "outgoing"
              ? "Calling..."
              : call.phase === "connecting"
                ? "Connecting..."
                : "Connected"}
          </div>
        </div>

        {call.callType === "video" &&
          localStream && (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              style={{
                position: "absolute",
                right: 18,
                bottom: 18,
                width: "min(28vw, 220px)",
                aspectRatio: "3 / 4",
                objectFit: "cover",
                borderRadius: 16,
                background: "black",
                boxShadow:
                  "0 8px 28px rgba(0,0,0,0.4)",
              }}
            />
          )}
      </div>

      <div
        style={{
          minHeight: 100,
          display: "grid",
          placeItems: "center",
          background: "#101a18",
        }}
      >
        <button
          type="button"
          onClick={onEnd}
          aria-label="End call"
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            border: 0,
            color: "white",
            background: "#ef4444",
            cursor: "pointer",
          }}
        >
          <PhoneOff />
        </button>
      </div>
    </div>
  );
}

export default function ChatsPage() {
  const [
    conversations,
    setConversations,
  ] = useState<
    Conversation[]
  >([]);

  const [
    messages,
    setMessages,
  ] = useState<Message[]>([]);

  const [search, setSearch] =
    useState("");

  const [
    linkedDevicesScannerOpen,
    setLinkedDevicesScannerOpen,
  ] = useState(false);

  const closeLinkedDevicesScanner =
    useCallback(() => {
      setLinkedDevicesScannerOpen(
        false
      );
    }, []);

  const [
    presenceByUser,
    setPresenceByUser,
  ] = useState<
    Map<string, UserPresence>
  >(new Map());

  /*
   * conversationId -> typing user IDs
   */
  const [
    typingUsersByConversation,
    setTypingUsersByConversation,
  ] = useState<
    Map<string, Set<string>>
  >(new Map());

  const [socket, setSocket] =
    useState<Socket | null>(
      null
    );

  const [
    savedContactsByUser,
    setSavedContactsByUser,
  ] = useState<
    Map<string, SavedContact>
  >(new Map());

  const [
    contactInfoUser,
    setContactInfoUser,
  ] = useState<
    PublicUser | null
  >(null);

  const [
    recentEmojis,
    setRecentEmojis,
  ] = useState<string[]>([]);

  const [activeCall, setActiveCall] =
    useState<ActiveCall | null>(null);

  const [localCallStream, setLocalCallStream] =
    useState<MediaStream | null>(null);

  const [remoteCallStream, setRemoteCallStream] =
    useState<MediaStream | null>(null);

  const peerConnectionRef =
    useRef<RTCPeerConnection | null>(null);

  const pendingIceCandidatesRef =
    useRef<RTCIceCandidateInit[]>([]);

  const signalingReadyCallIdsRef =
    useRef<Set<string>>(new Set());

  const pendingLocalIceCandidatesRef =
    useRef<Map<string, RTCIceCandidateInit[]>>(
      new Map()
    );

  const activeCallRef =
    useRef<ActiveCall | null>(null);

  const localCallStreamRef =
    useRef<MediaStream | null>(null);

  const remoteCallStreamRef =
    useRef<MediaStream | null>(null);

  const { conversationId } =
    useParams<{
      conversationId?: string;
    }>();

  const navigate =
    useNavigate();

  const { userId } =
    useAuth();

  const { resolvedTheme } =
    useChatSettings();

  const activeConversationRef =
    useRef<
      string | undefined
    >(conversationId);

  useEffect(() => {
    activeConversationRef.current =
      conversationId;
  }, [conversationId]);

  const selected =
    useMemo(() => {
      if (!conversationId) {
        return undefined;
      }

      return conversations.find(
        (conversation) =>
          conversation._id ===
          conversationId
      );
    }, [
      conversations,
      conversationId,
    ]);

  const selectedOtherUserId =
    selected?.otherUser
      .userId || "";

  const selectedPresence =
    selectedOtherUserId
      ? presenceByUser.get(
          selectedOtherUserId
        )
      : undefined;

  const selectedSavedContact =
    selectedOtherUserId
      ? savedContactsByUser.get(
          selectedOtherUserId
        )
      : undefined;

  const selectedForDisplay =
    useMemo(() => {
      if (!selected) {
        return undefined;
      }

      if (!selectedSavedContact) {
        return selected;
      }

      return {
        ...selected,
        otherUser: {
          ...selected.otherUser,
          name:
            selectedSavedContact.displayName,
          profileId:
            selectedSavedContact.contactProfileId,
        },
      };
    }, [
      selected,
      selectedSavedContact,
    ]);

  const selectedTypingUsers =
    conversationId
      ? typingUsersByConversation.get(
          conversationId
        )
      : undefined;

  const selectedUserIsTyping =
    Boolean(
      selectedOtherUserId &&
        selectedTypingUsers?.has(
          String(
            selectedOtherUserId
          )
        )
    );

  useEffect(() => {
    activeCallRef.current = activeCall;
  }, [activeCall]);

  useEffect(() => {
    localCallStreamRef.current =
      localCallStream;
  }, [localCallStream]);

  useEffect(() => {
    remoteCallStreamRef.current =
      remoteCallStream;
  }, [remoteCallStream]);

  const cleanupCall =
    useCallback(() => {
      const peer = peerConnectionRef.current;

      if (peer) {
        peer.onicecandidate = null;
        peer.ontrack = null;
        peer.onconnectionstatechange = null;
        peer.close();
      }

      peerConnectionRef.current = null;
      pendingIceCandidatesRef.current = [];

      const currentCallId =
        activeCallRef.current?.callId;

      if (currentCallId) {
        signalingReadyCallIdsRef.current.delete(
          currentCallId
        );
        pendingLocalIceCandidatesRef.current.delete(
          currentCallId
        );
      }

      stopStream(localCallStreamRef.current);
      stopStream(remoteCallStreamRef.current);

      localCallStreamRef.current = null;
      remoteCallStreamRef.current = null;

      setLocalCallStream(null);
      setRemoteCallStream(null);
      activeCallRef.current = null;
      setActiveCall(null);
    }, []);

  const createPeerConnection =
    useCallback(
      (client: Socket, callId: string) => {
        const existing =
          peerConnectionRef.current;

        if (existing) {
          existing.close();
        }

        const peer =
          new RTCPeerConnection(
            buildRtcConfiguration()
          );

        peerConnectionRef.current = peer;

        peer.onicecandidate = (event) => {
          if (!event.candidate) {
            return;
          }

          const candidate =
            event.candidate.toJSON();

          if (
            !signalingReadyCallIdsRef.current.has(
              callId
            )
          ) {
            const queued =
              pendingLocalIceCandidatesRef.current.get(
                callId
              ) || [];

            queued.push(candidate);
            pendingLocalIceCandidatesRef.current.set(
              callId,
              queued
            );
            return;
          }

          client.emit(
            "call_ice_candidate",
            {
              callId,
              candidate,
            }
          );
        };

        peer.ontrack = (event) => {
          const stream =
            event.streams[0] ||
            new MediaStream([event.track]);

          remoteCallStreamRef.current =
            stream;
          setRemoteCallStream(stream);
        };

        peer.onconnectionstatechange = () => {
          if (
            peer.connectionState ===
            "connected"
          ) {
            setActiveCall((current) =>
              current &&
              current.callId === callId
                ? {
                    ...current,
                    phase: "connected",
                  }
                : current
            );
          }

          if (
            peer.connectionState ===
              "failed" ||
            peer.connectionState ===
              "closed"
          ) {
            if (
              activeCallRef.current
                ?.callId === callId
            ) {
              client.emit("call_end", {
                callId,
                reason: "connection_failed",
              });

              cleanupCall();
            }
          }
        };

        return peer;
      },
      [cleanupCall]
    );

  const flushPendingIceCandidates =
    useCallback(async () => {
      const peer = peerConnectionRef.current;

      if (!peer?.remoteDescription) {
        return;
      }

      const candidates =
        pendingIceCandidatesRef.current;

      pendingIceCandidatesRef.current = [];

      for (const candidate of candidates) {
        try {
          await peer.addIceCandidate(
            candidate
          );
        } catch (error) {
          console.error(
            "Failed to add queued ICE candidate:",
            error
          );
        }
      }
    }, []);

  const loadConversations =
    useCallback(async () => {
      const { data } =
        await backendApi.get(
          "/user/chat/conversations"
        );

      setConversations(
        Array.isArray(
          data?.conversations
        )
          ? data.conversations
          : []
      );
    }, []);

  const loadSavedContacts =
    useCallback(async () => {
      const { data } =
        await backendApi.get(
          "/user/contacts"
        );

      const nextContacts =
        new Map<
          string,
          SavedContact
        >();

      if (
        Array.isArray(
          data?.contacts
        )
      ) {
        data.contacts.forEach(
          (contact: SavedContact) => {
            if (
              contact?.contactUserId
            ) {
              nextContacts.set(
                String(
                  contact.contactUserId
                ),
                contact
              );
            }
          }
        );
      }

      setSavedContactsByUser(
        nextContacts
      );
    }, []);

  const loadRecentEmojis =
    useCallback(async () => {
      try {
        const { data } =
          await backendApi.get(
            "/user/chat/emojis/recent"
          );

        setRecentEmojis(
          Array.isArray(data?.emojis)
            ? data.emojis
            : []
        );
      } catch (error) {
        console.error(
          "Recent emojis load failed:",
          getErrorMessage(error)
        );
      }
    }, []);

  useEffect(() => {
    const run = async () => {
      try {
        await Promise.all([
          loadConversations(),
          loadSavedContacts(),
          loadRecentEmojis(),
        ]);
      } catch (error) {
        toast.error(
          getErrorMessage(error)
        );
      }
    };

    void run();
  }, [
    loadConversations,
    loadSavedContacts,
    loadRecentEmojis,
  ]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    const client = io(
      BACKEND_URL,
      {
        auth: {
          userId,

          socketRole:
            "chat",
        },

        transports: [
          "websocket",
          "polling",
        ],

        reconnection: true,

        reconnectionAttempts:
          10,

        reconnectionDelay:
          1000,
      }
    );

    setSocket(client);

    const handleConnect = () => {
      console.log(
        "Socket connected:",
        client.id
      );

      /*
       * Socket reconnect ke baad active
       * conversation room dobara join.
       */
      const activeConversationId =
        activeConversationRef.current;

      if (
        activeConversationId
      ) {
        client.emit(
          "join_conversation",
          {
            conversationId:
              activeConversationId,
          },
          (response: {
            ok?: boolean;
            error?: string;
          }) => {
            if (
              !response?.ok &&
              response?.error
            ) {
              console.error(
                "Conversation rejoin failed:",
                response.error
              );
            }
          }
        );
      }
    };

    const handleConnectError = (
      error: Error
    ) => {
      console.error(
        "Socket connection error:",
        error.message
      );
    };

    const handleReceiveMessage = (
      message: Message
    ) => {
      const incomingConversationId =
        getConversationId(
          message
        );

      if (
        incomingConversationId ===
        activeConversationRef.current
      ) {
        setMessages(
          (currentMessages) => {
            const alreadyExists =
              currentMessages.some(
                (
                  currentMessage
                ) =>
                  currentMessage._id ===
                  message._id
              );

            if (alreadyExists) {
              return currentMessages.map(
                (
                  currentMessage
                ) =>
                  currentMessage._id ===
                  message._id
                    ? message
                    : currentMessage
              );
            }

            return [
              ...currentMessages,
              message,
            ];
          }
        );

        client.emit(
          "mark_messages_read",
          {
            conversationId:
              incomingConversationId,
          }
        );
      }

      void loadConversations().catch(
        () => undefined
      );
    };

    const handleConversationUpdated =
      () => {
        void loadConversations().catch(
          () => undefined
        );
      };

    const handlePresenceChanged =
      (
        payload:
          PresencePayload
      ) => {
        if (!payload?.userId) {
          return;
        }

        setPresenceByUser(
          (currentPresence) => {
            const nextPresence =
              new Map(
                currentPresence
              );

            nextPresence.set(
              String(
                payload.userId
              ),
              payload
            );

            return nextPresence;
          }
        );
      };

    const handleTypingChanged =
      ({
        conversationId:
          typingConversationId,
        userId:
          typingUserId,
        isTyping,
      }: TypingChangedPayload) => {
        if (
          !typingConversationId ||
          !typingUserId
        ) {
          return;
        }

        const normalizedConversationId =
          String(
            typingConversationId
          );

        const normalizedTypingUserId =
          String(
            typingUserId
          );

        setTypingUsersByConversation(
          (currentTypingMap) => {
            const nextTypingMap =
              new Map<
                string,
                Set<string>
              >(currentTypingMap);

            const currentTypingUsers =
              new Set<string>(
                nextTypingMap.get(
                  normalizedConversationId
                ) || []
              );

            if (isTyping) {
              currentTypingUsers.add(
                normalizedTypingUserId
              );
            } else {
              currentTypingUsers.delete(
                normalizedTypingUserId
              );
            }

            if (
              currentTypingUsers.size ===
              0
            ) {
              nextTypingMap.delete(
                normalizedConversationId
              );
            } else {
              nextTypingMap.set(
                normalizedConversationId,
                currentTypingUsers
              );
            }

            return nextTypingMap;
          }
        );
      };

    const handleMessagesRead = ({
      conversationId:
        readConversationId,
    }: MessagesReadPayload) => {
      if (
        readConversationId !==
        activeConversationRef.current
      ) {
        return;
      }

      setMessages(
        (currentMessages) =>
          currentMessages.map(
            (message) => {
              const messageConversationId =
                getConversationId(
                  message
                );

              const senderId =
                typeof message.senderId ===
                "string"
                  ? message.senderId
                  : message.senderId
                      ?._id || "";

              if (
                messageConversationId ===
                  readConversationId &&
                senderId === userId
              ) {
                return {
                  ...message,
                  status: "read",
                };
              }

              return message;
            }
          )
      );
    };

    const handleIncomingCall = (
      payload: IncomingCallPayload
    ) => {
      if (
        !payload?.callId ||
        !payload?.conversationId ||
        !payload?.offer ||
        !payload?.caller?.userId
      ) {
        return;
      }

      if (activeCallRef.current) {
        client.emit("call_reject", {
          callId: payload.callId,
          reason: "busy",
        });
        return;
      }

      const incomingCall: ActiveCall = {
        callId: payload.callId,
        conversationId:
          payload.conversationId,
        callType: payload.callType,
        phase: "incoming",
        otherUser: payload.caller,
        offer: payload.offer,
      };

      signalingReadyCallIdsRef.current.add(
        payload.callId
      );
      activeCallRef.current = incomingCall;
      setActiveCall(incomingCall);
    };

    const handleCallAnswered = async (
      payload: CallAnsweredPayload
    ) => {
      if (
        !payload?.callId ||
        !payload?.answer ||
        activeCallRef.current?.callId !==
          payload.callId
      ) {
        return;
      }

      const peer =
        peerConnectionRef.current;

      if (!peer) {
        return;
      }

      try {
        await peer.setRemoteDescription(
          payload.answer
        );

        await flushPendingIceCandidates();

        setActiveCall((current) =>
          current &&
          current.callId === payload.callId
            ? {
                ...current,
                phase: "connecting",
              }
            : current
        );
      } catch (error) {
        console.error(
          "Call answer failed:",
          error
        );
        toast.error(
          "Could not connect the call"
        );
        cleanupCall();
      }
    };

    const handleCallIceCandidate = async (
      payload: CallIceCandidatePayload
    ) => {
      if (
        !payload?.callId ||
        !payload?.candidate ||
        activeCallRef.current?.callId !==
          payload.callId
      ) {
        return;
      }

      const peer =
        peerConnectionRef.current;

      if (!peer?.remoteDescription) {
        pendingIceCandidatesRef.current.push(
          payload.candidate
        );
        return;
      }

      try {
        await peer.addIceCandidate(
          payload.candidate
        );
      } catch (error) {
        console.error(
          "ICE candidate failed:",
          error
        );
      }
    };

    const handleCallRejected = (
      payload: CallEndedPayload
    ) => {
      if (
        activeCallRef.current?.callId !==
        payload?.callId
      ) {
        return;
      }

      toast.error(
        payload.reason === "busy"
          ? "User is busy on another call"
          : "Call declined"
      );
      cleanupCall();
    };

    const handleCallEnded = (
      payload: CallEndedPayload
    ) => {
      if (
        activeCallRef.current?.callId !==
        payload?.callId
      ) {
        return;
      }

      if (payload.reason === "timeout") {
        toast.error("Call was not answered");
      }

      cleanupCall();
    };

    client.on(
      "connect",
      handleConnect
    );

    client.on(
      "connect_error",
      handleConnectError
    );

    client.on(
      "receive_message",
      handleReceiveMessage
    );

    client.on(
      "conversation_updated",
      handleConversationUpdated
    );

    client.on(
      "presence_changed",
      handlePresenceChanged
    );

    client.on(
      "typing_changed",
      handleTypingChanged
    );

    client.on(
      "messages_read",
      handleMessagesRead
    );

    client.on(
      "incoming_call",
      handleIncomingCall
    );

    client.on(
      "call_answered",
      handleCallAnswered
    );

    client.on(
      "call_ice_candidate",
      handleCallIceCandidate
    );

    client.on(
      "call_rejected",
      handleCallRejected
    );

    client.on(
      "call_ended",
      handleCallEnded
    );

    return () => {
      client.off(
        "connect",
        handleConnect
      );

      client.off(
        "connect_error",
        handleConnectError
      );

      client.off(
        "receive_message",
        handleReceiveMessage
      );

      client.off(
        "conversation_updated",
        handleConversationUpdated
      );

      client.off(
        "presence_changed",
        handlePresenceChanged
      );

      client.off(
        "typing_changed",
        handleTypingChanged
      );

      client.off(
        "messages_read",
        handleMessagesRead
      );

      client.off(
        "incoming_call",
        handleIncomingCall
      );

      client.off(
        "call_answered",
        handleCallAnswered
      );

      client.off(
        "call_ice_candidate",
        handleCallIceCandidate
      );

      client.off(
        "call_rejected",
        handleCallRejected
      );

      client.off(
        "call_ended",
        handleCallEnded
      );

      cleanupCall();
      client.disconnect();

      setSocket(null);

      setTypingUsersByConversation(
        new Map()
      );
    };
  }, [
    userId,
    loadConversations,
    cleanupCall,
    flushPendingIceCandidates,
  ]);

  /*
   * Chat select hote hi current
   * online/last-seen DB se load.
   */
  useEffect(() => {
    if (!selectedOtherUserId) {
      return;
    }

    let cancelled = false;

    const loadPresence =
      async () => {
        try {
          const { data } =
            await backendApi.get<UserPresenceResponse>(
              `/user/presence/${selectedOtherUserId}`
            );

          if (
            cancelled ||
            !data?.presence
          ) {
            return;
          }

          setPresenceByUser(
            (currentPresence) => {
              const nextPresence =
                new Map(
                  currentPresence
                );

              nextPresence.set(
                String(
                  selectedOtherUserId
                ),
                data.presence
              );

              return nextPresence;
            }
          );
        } catch (error) {
          if (!cancelled) {
            console.error(
              "Presence load failed:",
              getErrorMessage(
                error
              )
            );
          }
        }
      };

    void loadPresence();

    return () => {
      cancelled = true;
    };
  }, [selectedOtherUserId]);

  useEffect(() => {
    if (
      !conversationId ||
      !socket
    ) {
      setMessages([]);

      return;
    }

    let cancelled = false;

    const loadSelectedChat =
      async () => {
        try {
          socket.emit(
            "join_conversation",
            {
              conversationId,
            },
            (response: {
              ok?: boolean;
              error?: string;
            }) => {
              if (
                !response?.ok &&
                response?.error
              ) {
                toast.error(
                  response.error
                );
              }
            }
          );

          const { data } =
            await backendApi.get(
              `/user/chat/conversations/${conversationId}/messages`,
              {
                params: {
                  page: 1,
                  limit: 50,
                },
              }
            );

          if (cancelled) {
            return;
          }

          setMessages(
            Array.isArray(
              data?.messages
            )
              ? data.messages
              : []
          );

          await backendApi.patch(
            `/user/chat/conversations/${conversationId}/read`
          );

          if (cancelled) {
            return;
          }

          socket.emit(
            "mark_messages_read",
            {
              conversationId,
            }
          );

          await loadConversations();
        } catch (error) {
          if (!cancelled) {
            toast.error(
              getErrorMessage(
                error
              )
            );

            setMessages([]);
          }
        }
      };

    void loadSelectedChat();

    return () => {
      cancelled = true;

      /*
       * Old selected chat leave karte waqt
       * typing state stop.
       */
      socket.emit(
        "typing_stop",
        {
          conversationId,
        }
      );

      socket.emit(
        "leave_conversation",
        {
          conversationId,
        }
      );
    };
  }, [
    conversationId,
    socket,
    loadConversations,
  ]);

  const searchUser =
    async () => {
      const searchedEmail =
        search
          .trim()
          .toLowerCase();

      if (!searchedEmail) {
        toast.error(
          "Please enter an email address"
        );

        return;
      }

      try {
        const { data: searchData } =
          await backendApi.get(
            "/user/chat/search",
            {
              params: {
                email:
                  searchedEmail,
              },
            }
          );

        const foundUser:
          | PublicUser
          | undefined =
          searchData?.user;

        if (
          !foundUser?.userId
        ) {
          toast.error(
            "User not found"
          );

          return;
        }

        const {
          data:
            conversationData,
        } =
          await backendApi.post(
            `/user/chat/conversations/with/${foundUser.userId}`
          );

        const openedConversation =
          conversationData
            ?.conversation;

        const openedConversationId =
          String(
            openedConversation?._id ||
              conversationData
                ?.conversationId ||
              ""
          ).trim();

        if (
          !openedConversationId
        ) {
          toast.error(
            "Conversation could not be opened"
          );

          return;
        }

        /*
         * Search ke baad conversation ko
         * immediately local state me add/update.
         *
         * Isse navigate hote hi selected chat
         * mil jayega aur chat window open hogi.
         */
        if (
          openedConversation?._id
        ) {
          setConversations(
            (
              currentConversations
            ) => {
              const alreadyExists =
                currentConversations.some(
                  (
                    conversation
                  ) =>
                    conversation._id ===
                    openedConversationId
                );

              if (alreadyExists) {
                return currentConversations.map(
                  (
                    conversation
                  ) =>
                    conversation._id ===
                    openedConversationId
                      ? {
                          ...conversation,
                          ...openedConversation,
                        }
                      : conversation
                );
              }

              return [
                openedConversation,
                ...currentConversations,
              ];
            }
          );
        }

        setSearch("");

        navigate(
          `/user/chats/${openedConversationId}`
        );

        /*
         * Latest conversation list background
         * me refresh hogi.
         */
        void loadConversations().catch(
          () => undefined
        );
      } catch (error) {
        toast.error(
          getErrorMessage(error)
        );
      }
    };


  const openScannedUserChat =
    useCallback(
      async (
        scannedEmail: string
      ): Promise<boolean> => {
        const normalizedEmail =
          scannedEmail
            .trim()
            .toLowerCase();

        if (!normalizedEmail) {
          toast.error(
            "Invalid QR code"
          );
          return false;
        }

        try {
          const { data: searchData } =
            await backendApi.get(
              "/user/chat/search",
              {
                params: {
                  email:
                    normalizedEmail,
                },
              }
            );

          const foundUser:
            | PublicUser
            | undefined =
            searchData?.user;

          if (!foundUser?.userId) {
            toast.error(
              "User not found"
            );
            return false;
          }

          if (
            userId &&
            String(foundUser.userId) ===
              String(userId)
          ) {
            toast.error(
              "You can't open a chat with yourself"
            );
            return false;
          }

          const {
            data:
              conversationData,
          } =
            await backendApi.post(
              `/user/chat/conversations/with/${foundUser.userId}`
            );

          const openedConversation =
            conversationData
              ?.conversation;

          const openedConversationId =
            String(
              openedConversation?._id ||
                conversationData
                  ?.conversationId ||
                ""
            ).trim();

          if (!openedConversationId) {
            toast.error(
              "Conversation could not be opened"
            );
            return false;
          }

          if (
            openedConversation?._id
          ) {
            setConversations(
              (
                currentConversations
              ) => {
                const alreadyExists =
                  currentConversations.some(
                    (
                      conversation
                    ) =>
                      conversation._id ===
                      openedConversationId
                  );

                if (alreadyExists) {
                  return currentConversations.map(
                    (
                      conversation
                    ) =>
                      conversation._id ===
                      openedConversationId
                        ? {
                            ...conversation,
                            ...openedConversation,
                          }
                        : conversation
                  );
                }

                return [
                  openedConversation,
                  ...currentConversations,
                ];
              }
            );
          }

          navigate(
            `/user/chats/${openedConversationId}`
          );

          void loadConversations().catch(
            () => undefined
          );

          return true;
        } catch (error) {
          toast.error(
            getErrorMessage(error)
          );
          return false;
        }
      },
      [
        loadConversations,
        navigate,
        userId,
      ]
    );

  const openContactChat = async (
    contact: SavedContact
  ) => {
    try {
      const { data: conversationData } =
        await backendApi.post(
          `/user/chat/conversations/with/${contact.contactUserId}`
        );

      const openedConversation =
        conversationData?.conversation;

      const openedConversationId =
        String(
          openedConversation?._id ||
            conversationData?.conversationId ||
            ""
        ).trim();

      if (!openedConversationId) {
        toast.error(
          "Conversation could not be opened"
        );
        return;
      }

      if (openedConversation?._id) {
        setConversations(
          (currentConversations) => {
            const alreadyExists =
              currentConversations.some(
                (conversation) =>
                  conversation._id ===
                  openedConversationId
              );

            if (alreadyExists) {
              return currentConversations.map(
                (conversation) =>
                  conversation._id ===
                  openedConversationId
                    ? {
                        ...conversation,
                        ...openedConversation,
                      }
                    : conversation
              );
            }

            return [
              openedConversation,
              ...currentConversations,
            ];
          }
        );
      }

      navigate(
        `/user/chats/${openedConversationId}`
      );

      void loadConversations().catch(
        () => undefined
      );
    } catch (error) {
      toast.error(
        getErrorMessage(error)
      );
    }
  };

  const startCall =
    useCallback(
      async (callType: CallType) => {
        if (
          !socket ||
          !conversationId ||
          !selectedForDisplay
        ) {
          toast.error(
            "Chat server is not connected"
          );
          return;
        }

        if (activeCallRef.current) {
          toast.error(
            "A call is already active"
          );
          return;
        }

        if (
          !navigator.mediaDevices
            ?.getUserMedia
        ) {
          toast.error(
            "Calling is not supported on this browser"
          );
          return;
        }

        const callId = createCallId();

        try {
          const stream =
            await navigator.mediaDevices.getUserMedia({
              audio: true,
              video:
                callType === "video",
            });

          localCallStreamRef.current = stream;
          setLocalCallStream(stream);

          const peer = createPeerConnection(
            socket,
            callId
          );

          stream.getTracks().forEach((track) => {
            peer.addTrack(track, stream);
          });

          const offer =
            await peer.createOffer();

          await peer.setLocalDescription(
            offer
          );

          const otherUser: CallPerson = {
            userId:
              selectedForDisplay.otherUser
                .userId,
            email:
              selectedForDisplay.otherUser
                .email || "",
            name:
              selectedForDisplay.otherUser
                .name || "",
            profilePhoto:
              selectedForDisplay.otherUser
                .profilePhoto || "",
          };

          const outgoingCall: ActiveCall = {
            callId,
            conversationId,
            callType,
            phase: "outgoing",
            otherUser,
          };

          activeCallRef.current = outgoingCall;
          setActiveCall(outgoingCall);

          socket.emit(
            "call_offer",
            {
              callId,
              conversationId,
              callType,
              offer: peer.localDescription,
            },
            (response: SocketAcknowledgement) => {
              if (!response?.ok) {
                toast.error(
                  response?.code === "busy"
                    ? "User is busy on another call"
                    : response?.code ===
                        "offline"
                      ? "User is currently offline"
                      : response?.error ||
                        "Call could not be started"
                );
                cleanupCall();
                return;
              }

              signalingReadyCallIdsRef.current.add(
                callId
              );

              const queuedCandidates =
                pendingLocalIceCandidatesRef.current.get(
                  callId
                ) || [];

              pendingLocalIceCandidatesRef.current.delete(
                callId
              );

              queuedCandidates.forEach(
                (candidate) => {
                  socket.emit(
                    "call_ice_candidate",
                    {
                      callId,
                      candidate,
                    }
                  );
                }
              );
            }
          );
        } catch (error) {
          cleanupCall();
          toast.error(
            error instanceof DOMException &&
              error.name ===
                "NotAllowedError"
              ? callType === "video"
                ? "Camera and microphone permission is required"
                : "Microphone permission is required"
              : getErrorMessage(error)
          );
        }
      },
      [
        socket,
        conversationId,
        selectedForDisplay,
        createPeerConnection,
        cleanupCall,
      ]
    );

  const acceptIncomingCall =
    useCallback(async () => {
      const call = activeCallRef.current;

      console.log("[CALL DEBUG] Accept clicked", {
        hasSocket: Boolean(socket),
        callId: call?.callId,
        phase: call?.phase,
        callType: call?.callType,
        hasOffer: Boolean(call?.offer),
      });

      if (
        !socket ||
        !call ||
        call.phase !== "incoming" ||
        !call.offer
      ) {
        console.error(
          "[CALL DEBUG] Accept aborted: invalid call state",
          {
            hasSocket: Boolean(socket),
            call,
          }
        );
        return;
      }

      try {
        console.log(
          "[CALL DEBUG] Requesting camera/microphone",
          {
            audio: true,
            video: call.callType === "video",
          }
        );

        const stream =
          await navigator.mediaDevices.getUserMedia({
            audio: true,
            video:
              call.callType === "video",
          });

        console.log("[CALL DEBUG] Local media ready", {
          audioTracks: stream.getAudioTracks().length,
          videoTracks: stream.getVideoTracks().length,
          tracks: stream.getTracks().map((track) => ({
            kind: track.kind,
            enabled: track.enabled,
            readyState: track.readyState,
            label: track.label,
          })),
        });

        localCallStreamRef.current = stream;
        setLocalCallStream(stream);

        console.log(
          "[CALL DEBUG] Creating RTCPeerConnection",
          call.callId
        );

        const peer = createPeerConnection(
          socket,
          call.callId
        );

        stream.getTracks().forEach((track) => {
          peer.addTrack(track, stream);
        });

        console.log(
          "[CALL DEBUG] Local tracks added to peer",
          {
            senders: peer.getSenders().map((sender) =>
              sender.track?.kind || "no-track"
            ),
          }
        );

        console.log(
          "[CALL DEBUG] Setting remote offer",
          {
            type: call.offer.type,
            signalingState: peer.signalingState,
          }
        );

        await peer.setRemoteDescription(
          call.offer
        );

        console.log(
          "[CALL DEBUG] Remote offer set successfully",
          {
            signalingState: peer.signalingState,
            remoteDescriptionType:
              peer.remoteDescription?.type,
          }
        );

        await flushPendingIceCandidates();

        console.log(
          "[CALL DEBUG] Pending remote ICE flushed"
        );

        console.log(
          "[CALL DEBUG] Creating WebRTC answer"
        );

        const answer =
          await peer.createAnswer();

        console.log("[CALL DEBUG] Answer created", {
          type: answer.type,
        });

        await peer.setLocalDescription(
          answer
        );

        console.log(
          "[CALL DEBUG] Local answer set",
          {
            signalingState: peer.signalingState,
            localDescriptionType:
              peer.localDescription?.type,
          }
        );

        console.log(
          "[CALL DEBUG] Emitting call_answer",
          call.callId
        );

        socket.emit(
          "call_answer",
          {
            callId: call.callId,
            answer: peer.localDescription,
          },
          (response: SocketAcknowledgement) => {
            console.log(
              "[CALL DEBUG] call_answer acknowledgement",
              response
            );

            if (!response?.ok) {
              console.error(
                "[CALL DEBUG] Backend rejected call_answer",
                response
              );
              toast.error(
                response?.error ||
                  "Call could not be answered"
              );
              cleanupCall();
            }
          }
        );

        setActiveCall((current) =>
          current &&
          current.callId === call.callId
            ? {
                ...current,
                phase: "connecting",
              }
            : current
        );

        console.log(
          "[CALL DEBUG] Receiver moved to connecting state",
          call.callId
        );
      } catch (error) {
        console.error(
          "[CALL DEBUG] Accept incoming call failed",
          error
        );

        if (error instanceof DOMException) {
          console.error(
            "[CALL DEBUG] DOMException details",
            {
              name: error.name,
              message: error.message,
            }
          );
        }

        socket.emit("call_reject", {
          callId: call.callId,
          reason:
            error instanceof DOMException &&
            error.name === "NotAllowedError"
              ? "permission_denied"
              : "accept_failed",
        });

        const readableError =
          error instanceof DOMException
            ? `${error.name}: ${error.message}`
            : getErrorMessage(error);

        cleanupCall();
        toast.error(
          error instanceof DOMException &&
            error.name === "NotAllowedError"
            ? call.callType === "video"
              ? "Camera and microphone permission is required"
              : "Microphone permission is required"
            : readableError ||
                "Call accept failed"
        );
      }
    }, [
      socket,
      createPeerConnection,
      cleanupCall,
      flushPendingIceCandidates,
    ]);

  const rejectIncomingCall =
    useCallback(() => {
      const call = activeCallRef.current;

      if (!socket || !call) {
        cleanupCall();
        return;
      }

      socket.emit("call_reject", {
        callId: call.callId,
        reason: "declined",
      });

      cleanupCall();
    }, [socket, cleanupCall]);

  const endActiveCall =
    useCallback(() => {
      const call = activeCallRef.current;

      if (socket && call) {
        socket.emit("call_end", {
          callId: call.callId,
          reason: "hangup",
        });
      }

      cleanupCall();
    }, [socket, cleanupCall]);

  const searchConversationMessages =
    useCallback(
      async (query: string) => {
        if (!conversationId) {
          return [];
        }

        const cleanQuery = query.trim();

        if (!cleanQuery) {
          return [];
        }

        const { data } =
          await backendApi.get(
            `/user/chat/conversations/${conversationId}/search`,
            {
              params: {
                query: cleanQuery,
                limit: 100,
              },
            }
          );

        return Array.isArray(data?.messages)
          ? data.messages
          : [];
      },
      [conversationId]
    );

  const openSearchResult =
    useCallback(
      async (messageId: string) => {
        if (
          !conversationId ||
          !messageId
        ) {
          return;
        }

        const { data } =
          await backendApi.get(
            `/user/chat/conversations/${conversationId}/messages/${messageId}/context`,
            {
              params: {
                before: 25,
                after: 25,
              },
            }
          );

        setMessages(
          Array.isArray(data?.messages)
            ? data.messages
            : []
        );
      },
      [conversationId]
    );

  const restoreLatestMessages =
    useCallback(async () => {
      if (!conversationId) {
        return;
      }

      try {
        const { data } =
          await backendApi.get(
            `/user/chat/conversations/${conversationId}/messages`,
            {
              params: {
                page: 1,
                limit: 50,
              },
            }
          );

        setMessages(
          Array.isArray(data?.messages)
            ? data.messages
            : []
        );
      } catch (error) {
        console.error(
          "Latest messages restore failed:",
          getErrorMessage(error)
        );
      }
    }, [conversationId]);

  const startTyping = () => {
    if (
      !socket ||
      !conversationId
    ) {
      return;
    }

    socket.emit(
      "typing_start",
      {
        conversationId,
      }
    );
  };

  const stopTyping = () => {
    if (
      !socket ||
      !conversationId
    ) {
      return;
    }

    socket.emit(
      "typing_stop",
      {
        conversationId,
      }
    );
  };

  const addSavedMessage =
    useCallback(
      (savedMessage: Message) => {
        setMessages(
          (currentMessages) => {
            const exists =
              currentMessages.some(
                (message) =>
                  message._id ===
                  savedMessage._id
              );

            if (exists) {
              return currentMessages.map(
                (message) =>
                  message._id ===
                  savedMessage._id
                    ? savedMessage
                    : message
              );
            }

            return [
              ...currentMessages,
              savedMessage,
            ];
          }
        );

        void loadConversations().catch(
          () => undefined
        );
      },
      [loadConversations]
    );

  const sendSocketMessage =
    useCallback(
      (payload: Record<string, unknown>) => {
        return new Promise<void>((resolve, reject) => {
          if (
            !socket ||
            !conversationId
          ) {
            const error = new Error(
              "Chat server is not connected"
            );

            toast.error(error.message);
            reject(error);
            return;
          }

          socket.emit(
            "typing_stop",
            {
              conversationId,
            }
          );

          socket.emit(
            "send_message",
            {
              conversationId,
              ...payload,
            },
            (
              response:
                SocketAcknowledgement
            ) => {
              if (
                !response?.ok ||
                !response.message
              ) {
                const error = new Error(
                  response?.error ||
                    "Message could not be sent"
                );

                toast.error(error.message);
                reject(error);
                return;
              }

              addSavedMessage(
                response.message
              );

              resolve();
            }
          );
        });
      },
      [
        socket,
        conversationId,
        addSavedMessage,
      ]
    );

  const send = (
    messageText: string
  ) => {
    const cleanText =
      messageText.trim();

    if (!cleanText) {
      return;
    }

    void sendSocketMessage({
      messageType: "text",
      text: cleanText,
    }).catch(() => undefined);
  };

  const sendImage = async (
    file: File,
    caption: string
  ) => {
    if (!conversationId) {
      toast.error(
        "Conversation is not selected"
      );
      return;
    }

    try {
      const formData = new FormData();
      formData.append("media", file);

      const { data } =
        await backendApi.post(
          `/user/chat/conversations/${conversationId}/media`,
          formData,
          {
            headers: {
              "Content-Type":
                "multipart/form-data",
            },
          }
        );

      const fileUrl = String(
        data?.fileUrl || ""
      ).trim();

      if (!fileUrl) {
        throw new Error(
          "Uploaded image URL was not returned"
        );
      }

      await sendSocketMessage({
        messageType: "image",
        text: caption.trim(),
        fileUrl,
      });
    } catch (error) {
      toast.error(
        getErrorMessage(error)
      );
      throw error;
    }
  };

  const sendVideo = async (
    file: File,
    caption: string
  ) => {
    if (!conversationId) {
      toast.error(
        "Conversation is not selected"
      );
      return;
    }

    try {
      const formData = new FormData();
      formData.append("media", file);

      const { data } =
        await backendApi.post(
          `/user/chat/conversations/${conversationId}/media`,
          formData,
          {
            headers: {
              "Content-Type":
                "multipart/form-data",
            },
          }
        );

      const fileUrl = String(
        data?.fileUrl || ""
      ).trim();

      if (!fileUrl) {
        throw new Error(
          "Uploaded video URL was not returned"
        );
      }

      await sendSocketMessage({
        messageType: "video",
        text: caption.trim(),
        fileUrl,
      });
    } catch (error) {
      toast.error(
        getErrorMessage(error)
      );
      throw error;
    }
  };

  const sendAudio = async (
    file: File
  ) => {
    if (!conversationId) {
      toast.error(
        "Conversation is not selected"
      );
      return;
    }

    try {
      const formData = new FormData();
      formData.append("media", file);

      const { data } =
        await backendApi.post(
          `/user/chat/conversations/${conversationId}/media`,
          formData,
          {
            headers: {
              "Content-Type":
                "multipart/form-data",
            },
          }
        );

      const fileUrl = String(
        data?.fileUrl || ""
      ).trim();

      if (!fileUrl) {
        throw new Error(
          "Uploaded audio URL was not returned"
        );
      }

      await sendSocketMessage({
        messageType: "audio",
        text: "",
        fileUrl,
      });
    } catch (error) {
      toast.error(
        getErrorMessage(error)
      );
      throw error;
    }
  };

  const sendLocation = (
    location: SharedLocation
  ) => {
    void sendSocketMessage({
      messageType: "location",
      location,
    }).catch(() => undefined);
  };

  const sendContact = (
    contact: SharedContact
  ) => {
    void sendSocketMessage({
      messageType: "contact",
      contact,
    }).catch(() => undefined);
  };

  const recordEmojiUsage = (
    emoji: string
  ) => {
    setRecentEmojis(
      (currentEmojis) => [
        emoji,
        ...currentEmojis.filter(
          (item) => item !== emoji
        ),
      ].slice(0, 32)
    );

    void backendApi
      .post(
        "/user/chat/emojis/use",
        { emoji }
      )
      .then(({ data }) => {
        if (
          Array.isArray(data?.emojis)
        ) {
          setRecentEmojis(
            data.emojis
          );
        }
      })
      .catch((error) => {
        console.error(
          "Emoji usage save failed:",
          getErrorMessage(error)
        );
      });
  };

  const handleContactSaved = (
    contact: SavedContact
  ) => {
    setSavedContactsByUser(
      (currentContacts) => {
        const nextContacts =
          new Map(
            currentContacts
          );

        nextContacts.set(
          String(
            contact.contactUserId
          ),
          contact
        );

        return nextContacts;
      }
    );
  };

  const handleContactDeleted = (
    contactUserId: string
  ) => {
    setSavedContactsByUser(
      (currentContacts) => {
        const nextContacts =
          new Map(
            currentContacts
          );

        nextContacts.delete(
          String(contactUserId)
        );

        return nextContacts;
      }
    );
  };

  return (
    <div
      className={`chat-layout ${
        selected
          ? "chat-open"
          : ""
      }`}
      data-wa-chat-theme={
        resolvedTheme
      }
    >
      <ChatList
        conversations={
          conversations
        }
        selectedId={
          conversationId
        }
        search={search}
        setSearch={setSearch}
        onSearch={searchUser}
        onOpenLinkedDevices={() =>
          setLinkedDevicesScannerOpen(
            true
          )
        }
        typingUsersByConversation={
          typingUsersByConversation
        }
        savedContactsByUser={
          savedContactsByUser
        }
        onSelect={(
          conversation
        ) =>
          navigate(
            `/user/chats/${conversation._id}`
          )
        }
      />

      {selectedForDisplay ? (
        <ChatWindow
          conversation={
            selectedForDisplay
          }
          messages={
            messages
          }
          onBack={() =>
            navigate(
              "/user/chats"
            )
          }
          onSend={send}
          onSendImage={sendImage}
          onSendVideo={sendVideo}
          onSendAudio={sendAudio}
          onSendLocation={sendLocation}
          onSendContact={sendContact}
          onOpenContactChat={
            openContactChat
          }
          onEmojiUsed={recordEmojiUsage}
          recentEmojis={recentEmojis}
          shareableContacts={[
            ...savedContactsByUser.values(),
          ]}
          onTypingStart={
            startTyping
          }
          onTypingStop={
            stopTyping
          }
          isTyping={
            selectedUserIsTyping
          }
          online={
            selectedPresence
              ?.isOnline ||
            false
          }
          lastSeenAt={
            selectedPresence
              ?.lastSeenAt ||
            null
          }
          onOpenContactInfo={() =>
            setContactInfoUser(
              selectedForDisplay.otherUser
            )
          }
          onStartCall={startCall}
          onSearchMessages={
            searchConversationMessages
          }
          onOpenSearchResult={
            openSearchResult
          }
          onCloseSearch={
            restoreLatestMessages
          }
        />
      ) : (
        <EmptyPane />
      )}

      <LinkedDevicesScanner
        open={
          linkedDevicesScannerOpen
        }
        onClose={
          closeLinkedDevicesScanner
        }
        onScannedEmail={
          openScannedUserChat
        }
      />

      <ContactInfoPanel
        open={
          Boolean(contactInfoUser)
        }
        contactUser={
          contactInfoUser
        }
        onClose={() =>
          setContactInfoUser(null)
        }
        onSaved={
          handleContactSaved
        }
        onDeleted={
          handleContactDeleted
        }
      />

      {activeCall && (
        <CallOverlay
          call={activeCall}
          localStream={localCallStream}
          remoteStream={remoteCallStream}
          onAccept={() =>
            void acceptIncomingCall()
          }
          onReject={rejectIncomingCall}
          onEnd={endActiveCall}
        />
      )}
    </div>
  );
}