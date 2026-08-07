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

import backendApi, {
  BACKEND_URL,
  getErrorMessage,
} from "../../api/backendApi";

import ChatList from "../../components/chat/ChatList";
import ChatWindow from "../../components/chat/ChatWindow";
import EmptyPane from "../../components/layout/EmptyPane";
import ContactInfoPanel from "../../components/chat/ContactInfoPanel";

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

      client.disconnect();

      setSocket(null);

      setTypingUsersByConversation(
        new Map()
      );
    };
  }, [
    userId,
    loadConversations,
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
          onSendLocation={sendLocation}
          onSendContact={sendContact}
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
        />
      ) : (
        <EmptyPane />
      )}

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
    </div>
  );
}