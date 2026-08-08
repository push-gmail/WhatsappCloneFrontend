import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type FormEvent,
  type KeyboardEvent,
} from "react";

import {
  ArrowLeft,
  Check,
  CheckCheck,
  ContactRound,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Music2,
  MoreVertical,
  Paperclip,
  Phone,
  Search,
  Send,
  Smile,
  Video,
  X,
} from "lucide-react";

import Avatar from "../common/Avatar";

import type {
  Conversation,
  Message,
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

import {
  BACKEND_URL,
} from "../../api/backendApi";

type ChatWindowProps = {
  conversation: Conversation;
  messages: Message[];
  onBack: () => void;

  onSend: (
    text: string
  ) => void;

  onSendImage: (
    file: File,
    caption: string
  ) => Promise<void>;

  onSendVideo: (
    file: File,
    caption: string
  ) => Promise<void>;

  onSendAudio: (
    file: File
  ) => Promise<void>;

  onSendLocation: (
    location: SharedLocation
  ) => void;

  onSendContact: (
    contact: SharedContact
  ) => void;

  onOpenContactChat: (
    contact: SavedContact
  ) => void;

  onEmojiUsed: (
    emoji: string
  ) => void;

  recentEmojis: string[];
  shareableContacts: SavedContact[];

  onTypingStart:
    () => void;

  onTypingStop:
    () => void;

  isTyping: boolean;
  online: boolean;

  lastSeenAt:
    | string
    | null;

  onOpenContactInfo:
    () => void;
};

const TYPING_STOP_DELAY_MS =
  1500;

const EMOJI_GROUPS = [
  {
    label: "Smileys & people",
    emojis: [
      "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣",
      "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰",
      "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜",
      "🤪", "🤨", "🧐", "🤓", "😎", "🥳", "😏", "😒",
      "😞", "😔", "😟", "😕", "🙁", "☹️", "😣", "😖",
      "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡",
      "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰",
      "😥", "😓", "🤗", "🤔", "🫣", "🤭", "🫢", "🫡",
      "🤫", "🫠", "🤥", "😶", "😐", "😑", "😬", "🙄",
      "😯", "😦", "😧", "😮", "😲", "🥱", "😴", "🤤",
      "😪", "😵", "🤐", "🥴", "🤢", "🤮", "🤧", "😷",
      "🤒", "🤕", "👍", "👎", "👌", "✌️", "🤞", "🤟",
      "🤘", "🤙", "👏", "🙌", "🫶", "🙏", "💪", "👀",
    ],
  },
  {
    label: "Hearts & symbols",
    emojis: [
      "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍",
      "🤎", "💔", "❤️‍🔥", "❤️‍🩹", "💕", "💞", "💓", "💗",
      "💖", "💘", "💝", "💟", "❣️", "💯", "🔥", "✨",
      "⭐", "🌟", "💫", "⚡", "🎉", "🎊", "✅", "❌",
    ],
  },
  {
    label: "Food, travel & objects",
    emojis: [
      "☕", "🍵", "🍕", "🍔", "🍟", "🌮", "🍜", "🍰",
      "🍫", "🍎", "🍓", "🥭", "🚗", "🚕", "🚌", "✈️",
      "🚀", "🏠", "🏢", "🌍", "🌙", "☀️", "🌧️", "🎵",
      "🎧", "📱", "💻", "⌚", "📷", "🎁", "💡", "📌",
    ],
  },
];

const replaceTextWithEmoji = (
  value: string
) => {
  return value
    .replace(/:-?\)/g, "🙂")
    .replace(/:-?\(/g, "🙁")
    .replace(/;-?\)/g, "😉")
    .replace(/:-?D/gi, "😄")
    .replace(/<3/g, "❤️");
};

const isSameDate = (
  first: Date,
  second: Date
) => {
  return (
    first.getFullYear() ===
      second.getFullYear() &&
    first.getMonth() ===
      second.getMonth() &&
    first.getDate() ===
      second.getDate()
  );
};

const formatLastSeen = (
  value:
    | string
    | null
) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  const now = new Date();
  const yesterday = new Date(now);

  yesterday.setDate(
    now.getDate() - 1
  );

  const time =
    date.toLocaleTimeString(
      [],
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );

  if (isSameDate(date, now)) {
    return `last seen today at ${time}`;
  }

  if (
    isSameDate(
      date,
      yesterday
    )
  ) {
    return `last seen yesterday at ${time}`;
  }

  const dateText =
    date.toLocaleDateString(
      [],
      {
        day: "2-digit",
        month: "short",
        year:
          date.getFullYear() ===
          now.getFullYear()
            ? undefined
            : "numeric",
      }
    );

  return `last seen ${dateText} at ${time}`;
};

const resolveMediaUrl = (
  fileUrl?: string
) => {
  const cleanUrl = String(
    fileUrl || ""
  ).trim();

  if (!cleanUrl) {
    return "";
  }

  if (/^https?:\/\//i.test(cleanUrl)) {
    return cleanUrl;
  }

  return `${BACKEND_URL}${
    cleanUrl.startsWith("/")
      ? cleanUrl
      : `/${cleanUrl}`
  }`;
};

export default function ChatWindow({
  conversation,
  messages,
  onBack,
  onSend,
  onSendImage,
  onSendVideo,
  onSendAudio,
  onSendLocation,
  onSendContact,
  onOpenContactChat,
  onEmojiUsed,
  recentEmojis,
  shareableContacts,
  onTypingStart,
  onTypingStop,
  isTyping,
  online,
  lastSeenAt,
  onOpenContactInfo,
}: ChatWindowProps) {
  const [text, setText] =
    useState("");

  const [emojiOpen, setEmojiOpen] =
    useState(false);

  const [attachmentOpen, setAttachmentOpen] =
    useState(false);

  const [selectedImage, setSelectedImage] =
    useState<File | null>(null);

  const [selectedImagePreview, setSelectedImagePreview] =
    useState("");

  const [mediaCaption, setMediaCaption] =
    useState("");

  const [sendingImage, setSendingImage] =
    useState(false);

  const [sendingAudio, setSendingAudio] =
    useState(false);

  const [locationModalOpen, setLocationModalOpen] =
    useState(false);

  const [locationLoading, setLocationLoading] =
    useState(false);

  const [pendingLocation, setPendingLocation] =
    useState<SharedLocation | null>(null);

  const [locationError, setLocationError] =
    useState("");

  const [contactModalOpen, setContactModalOpen] =
    useState(false);

  const [contactSearch, setContactSearch] =
    useState("");

  const messageAreaRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const fileInputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const audioInputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const typingTimeoutRef =
    useRef<
      ReturnType<
        typeof setTimeout
      > | null
    >(null);

  const localTypingRef =
    useRef(false);

  const { userId } = useAuth();

  const {
    chatSettings,
    resolvedTheme,
  } = useChatSettings();

  const wallpaper =
    chatSettings?.wallpaper;

  const filteredContacts =
    useMemo(() => {
      const query =
        contactSearch
          .trim()
          .toLowerCase();

      if (!query) {
        return shareableContacts;
      }

      return shareableContacts.filter(
        (contact) =>
          contact.displayName
            .toLowerCase()
            .includes(query) ||
          contact.email
            .toLowerCase()
            .includes(query) ||
          contact.phoneNumber
            .toLowerCase()
            .includes(query)
      );
    }, [
      contactSearch,
      shareableContacts,
    ]);

  const clearTypingTimer = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(
        typingTimeoutRef.current
      );

      typingTimeoutRef.current =
        null;
    }
  };

  const stopLocalTyping = () => {
    clearTypingTimer();

    if (localTypingRef.current) {
      localTypingRef.current = false;
      onTypingStop();
    }
  };

  const scheduleTypingStop = () => {
    clearTypingTimer();

    typingTimeoutRef.current =
      setTimeout(() => {
        stopLocalTyping();
      }, TYPING_STOP_DELAY_MS);
  };

  const closeComposerPanels = () => {
    setEmojiOpen(false);
    setAttachmentOpen(false);
  };

  const closeImagePreview = () => {
    setSelectedImage(null);
    setMediaCaption("");

    if (selectedImagePreview) {
      URL.revokeObjectURL(
        selectedImagePreview
      );
    }

    setSelectedImagePreview("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  useLayoutEffect(() => {
    const messageArea =
      messageAreaRef.current;

    if (!messageArea) {
      return;
    }

    messageArea.scrollTop =
      messageArea.scrollHeight;
  }, [
    conversation._id,
    messages,
  ]);

  useEffect(() => {
    stopLocalTyping();
    setText("");
    closeComposerPanels();
    setLocationModalOpen(false);
    setContactModalOpen(false);
    setPendingLocation(null);
    setLocationError("");
    closeImagePreview();

    return () => {
      stopLocalTyping();
    };
  }, [conversation._id]);

  useEffect(() => {
    return () => {
      clearTypingTimer();

      if (selectedImagePreview) {
        URL.revokeObjectURL(
          selectedImagePreview
        );
      }
    };
  }, [selectedImagePreview]);

  const messageAreaStyle =
    useMemo<CSSProperties>(() => {
      if (
        wallpaper?.type ===
          "color" &&
        wallpaper.value
      ) {
        return {
          backgroundColor:
            wallpaper.value,
        };
      }

      return {
        backgroundColor:
          "#0b3b36",
      };
    }, [wallpaper]);

  const prepareMessageText = (
    value: string
  ) => {
    const cleanText =
      value.trim();

    if (!cleanText) {
      return "";
    }

    if (
      chatSettings
        ?.replaceTextWithEmoji
    ) {
      return replaceTextWithEmoji(
        cleanText
      );
    }

    return cleanText;
  };

  const sendCurrentMessage = () => {
    const preparedText =
      prepareMessageText(text);

    if (!preparedText) {
      stopLocalTyping();
      return;
    }

    stopLocalTyping();
    closeComposerPanels();
    onSend(preparedText);
    setText("");
  };

  const submit = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    sendCurrentMessage();
  };

  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const nextValue =
      event.target.value;

    setText(nextValue);

    if (!nextValue.trim()) {
      stopLocalTyping();
      return;
    }

    if (!localTypingRef.current) {
      localTypingRef.current = true;
      onTypingStart();
    }

    scheduleTypingStop();
  };

  const handleInputKeyDown = (
    event: KeyboardEvent<HTMLInputElement>
  ) => {
    if (
      chatSettings?.enterIsSend &&
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      sendCurrentMessage();
    }
  };

  const handleEmojiSelect = (
    emoji: string
  ) => {
    setText(
      (currentText) =>
        `${currentText}${emoji}`
    );

    onEmojiUsed(emoji);
  };

  const handleImageSelected = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    const isImage =
      file.type.startsWith("image/");
    const isVideo =
      file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      event.target.value = "";
      return;
    }

    if (selectedImagePreview) {
      URL.revokeObjectURL(
        selectedImagePreview
      );
    }

    setSelectedImage(file);
    setSelectedImagePreview(
      URL.createObjectURL(file)
    );
    setMediaCaption("");
    closeComposerPanels();
  };

  const sendSelectedImage = async () => {
    if (!selectedImage || sendingImage) {
      return;
    }

    try {
      setSendingImage(true);
      stopLocalTyping();

      if (
        selectedImage.type.startsWith(
          "video/"
        )
      ) {
        await onSendVideo(
          selectedImage,
          mediaCaption.trim()
        );
      } else {
        await onSendImage(
          selectedImage,
          mediaCaption.trim()
        );
      }

      closeImagePreview();
    } finally {
      setSendingImage(false);
    }
  };

  const handleAudioSelected = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("audio/")) {
      event.target.value = "";
      return;
    }

    if (sendingAudio) {
      return;
    }

    try {
      setSendingAudio(true);
      stopLocalTyping();
      closeComposerPanels();
      await onSendAudio(file);
    } finally {
      setSendingAudio(false);
      event.target.value = "";
    }
  };

  const requestCurrentLocation = () => {
    closeComposerPanels();
    setLocationModalOpen(true);
    setPendingLocation(null);
    setLocationError("");

    if (!navigator.geolocation) {
      setLocationError(
        "Location is not supported on this device."
      );
      return;
    }

    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setPendingLocation({
          latitude:
            position.coords.latitude,
          longitude:
            position.coords.longitude,
          address: "Current location",
        });

        setLocationLoading(false);
      },
      (error) => {
        setLocationLoading(false);
        setLocationError(
          error.message ||
            "Unable to get your location."
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000,
      }
    );
  };

  const shareCurrentLocation = () => {
    if (!pendingLocation) {
      return;
    }

    onSendLocation(
      pendingLocation
    );

    setLocationModalOpen(false);
    setPendingLocation(null);
    setLocationError("");
  };

  const openContactPicker = () => {
    closeComposerPanels();
    setContactSearch("");
    setContactModalOpen(true);
  };

  const shareContact = (
    contact: SavedContact
  ) => {
    onSendContact({
      userId:
        contact.contactUserId,
      profileId:
        contact.contactProfileId,
      name:
        contact.displayName ||
        contact.email,
      email: contact.email,
      phoneNumber:
        contact.phoneNumber,
      profilePhoto:
        contact.profilePhoto,
    });

    setContactModalOpen(false);
    setContactSearch("");
  };

  const getSenderId = (
    message: Message
  ): string => {
    if (
      typeof message.senderId ===
      "string"
    ) {
      return message.senderId;
    }

    return (
      message.senderId?._id ||
      ""
    );
  };

  const renderMessageStatus = (
    message: Message
  ) => {
    if (message.status === "read") {
      return (
        <CheckCheck
          className="read-ticks"
          size={15}
        />
      );
    }

    if (
      message.status ===
      "delivered"
    ) {
      return (
        <CheckCheck size={15} />
      );
    }

    return <Check size={15} />;
  };

  const presenceLabel =
    isTyping
      ? "typing..."
      : online
        ? "online"
        : formatLastSeen(
            lastSeenAt
          ) ||
          conversation.otherUser
            .email;

  return (
    <section
      className="chat-window"
      data-wa-chat-theme={
        resolvedTheme
      }
    >
      <header className="chat-header">
        <button
          type="button"
          className="mobile-only"
          onClick={() => {
            stopLocalTyping();
            onBack();
          }}
          aria-label="Back to chats"
        >
          <ArrowLeft />
        </button>

        <button
          type="button"
          className="chat-contact-trigger chat-contact-avatar-trigger"
          onClick={onOpenContactInfo}
          aria-label="Open contact info"
        >
          <Avatar
            src={
              conversation.otherUser
                .profilePhoto
            }
            name={
              conversation.otherUser
                .name ||
              conversation.otherUser
                .email
            }
          />
        </button>

        <button
          type="button"
          className="chat-person chat-contact-trigger"
          onClick={onOpenContactInfo}
          aria-label="Open contact info"
        >
          <strong>
            {conversation.otherUser
              .name ||
              conversation.otherUser
                .email}
          </strong>

          <small
            className={
              isTyping
                ? "chat-typing-text"
                : undefined
            }
          >
            {presenceLabel}
          </small>
        </button>

        <div className="chat-actions">
          <button
            type="button"
            aria-label="Video call"
          >
            <Video />
          </button>

          <button
            type="button"
            aria-label="Voice call"
          >
            <Phone />
          </button>

          <button
            type="button"
            aria-label="Search messages"
          >
            <Search />
          </button>

          <button
            type="button"
            aria-label="More options"
          >
            <MoreVertical />
          </button>
        </div>
      </header>

      <div
        ref={messageAreaRef}
        className={`message-area ${
          wallpaper?.doodlesEnabled
            ? "wa-active-wallpaper-doodles"
            : ""
        }`}
        style={messageAreaStyle}
      >
        <div className="encryption-note">
          Messages are protected in
          this demo chat flow.
        </div>

        {messages.map(
          (message) => {
            const mine =
              getSenderId(message) ===
              userId;

            const mediaUrl =
              resolveMediaUrl(
                message.fileUrl
              );

            return (
              <div
                key={message._id}
                className={`message-line ${
                  mine
                    ? "mine"
                    : "theirs"
                }`}
              >
                <div
                  className={`message-bubble ${
                    message.messageType ===
                    "image"
                      ? "wa-image-message-bubble"
                      : ""
                  }`}
                >
                  {message.messageType ===
                    "text" && (
                    <span>
                      {message.text}
                    </span>
                  )}

                  {message.messageType ===
                    "image" &&
                    mediaUrl && (
                    <div className="wa-chat-image-message">
                      <a
                        href={mediaUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <img
                          src={mediaUrl}
                          alt="Shared"
                          loading="lazy"
                        />
                      </a>

                      {message.text && (
                        <p>
                          {message.text}
                        </p>
                      )}
                    </div>
                  )}

                  {message.messageType ===
                    "video" &&
                    mediaUrl && (
                    <div className="wa-chat-video-message">
                      <video
                        src={mediaUrl}
                        controls
                        playsInline
                        preload="metadata"
                      />

                      {message.text && (
                        <p>
                          {message.text}
                        </p>
                      )}
                    </div>
                  )}

                  {message.messageType ===
                    "audio" &&
                    mediaUrl && (
                    <div className="wa-chat-audio-message">
                      <audio
                        src={mediaUrl}
                        controls
                        preload="metadata"
                      />
                    </div>
                  )}

                  {message.messageType ===
                    "location" &&
                    message.location && (
                    <a
                      className="wa-chat-location-card"
                      href={`https://www.google.com/maps?q=${message.location.latitude},${message.location.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <span className="wa-chat-location-icon">
                        <MapPin />
                      </span>

                      <span>
                        <strong>
                          {message.location
                            .address ||
                            "Location"}
                        </strong>
                        <small>
                          {message.location.latitude.toFixed(
                            5
                          )}
                          {", "}
                          {message.location.longitude.toFixed(
                            5
                          )}
                        </small>
                      </span>
                    </a>
                  )}

                  {message.messageType ===
                    "contact" &&
                    message.contact && (
                    <div className="wa-chat-contact-card">
                      <Avatar
                        src={
                          message.contact
                            .profilePhoto ||
                          ""
                        }
                        name={
                          message.contact
                            .name ||
                          "Contact"
                        }
                      />

                      <div>
                        <strong>
                          {message.contact
                            .name ||
                            "Contact"}
                        </strong>

                        {message.contact
                          .phoneNumber && (
                          <span>
                            {
                              message.contact
                                .phoneNumber
                            }
                          </span>
                        )}

                        {!message.contact
                          .phoneNumber &&
                          message.contact
                            .email && (
                            <span>
                              {
                                message.contact
                                  .email
                              }
                            </span>
                          )}
                      </div>
                    </div>
                  )}

                  {message.messageType !==
                    "image" &&
                    message.messageType !==
                      "text" &&
                    message.messageType !==
                      "location" &&
                    message.messageType !==
                      "contact" &&
                    message.messageType !==
                      "video" &&
                    message.messageType !==
                      "audio" &&
                    mediaUrl && (
                      <a
                        href={mediaUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open attachment
                      </a>
                    )}

                  <small className="wa-message-meta">
                    {new Date(
                      message.createdAt
                    ).toLocaleTimeString(
                      [],
                      {
                        hour:
                          "2-digit",
                        minute:
                          "2-digit",
                      }
                    )}

                    {mine &&
                      renderMessageStatus(
                        message
                      )}
                  </small>
                </div>
              </div>
            );
          }
        )}
      </div>

      <form
        className="message-composer"
        onSubmit={submit}
      >
        <div className="wa-composer-action-wrap">
          <button
            type="button"
            className={
              emojiOpen
                ? "wa-composer-icon-active"
                : undefined
            }
            onClick={() => {
              setEmojiOpen(
                (current) =>
                  !current
              );
              setAttachmentOpen(false);
            }}
            aria-label="Emoji"
          >
            <Smile />
          </button>

          {emojiOpen && (
            <div className="wa-emoji-picker">
              {recentEmojis.length > 0 && (
                <section>
                  <h4>Recent</h4>
                  <div className="wa-emoji-grid">
                    {recentEmojis.map(
                      (emoji) => (
                        <button
                          type="button"
                          key={`recent-${emoji}`}
                          onClick={() =>
                            handleEmojiSelect(
                              emoji
                            )
                          }
                        >
                          {emoji}
                        </button>
                      )
                    )}
                  </div>
                </section>
              )}

              {EMOJI_GROUPS.map(
                (group) => (
                  <section
                    key={group.label}
                  >
                    <h4>
                      {group.label}
                    </h4>
                    <div className="wa-emoji-grid">
                      {group.emojis.map(
                        (emoji) => (
                          <button
                            type="button"
                            key={`${group.label}-${emoji}`}
                            onClick={() =>
                              handleEmojiSelect(
                                emoji
                              )
                            }
                          >
                            {emoji}
                          </button>
                        )
                      )}
                    </div>
                  </section>
                )
              )}
            </div>
          )}
        </div>

        <div className="wa-composer-action-wrap">
          <button
            type="button"
            className={
              attachmentOpen
                ? "wa-composer-icon-active"
                : undefined
            }
            onClick={() => {
              setAttachmentOpen(
                (current) =>
                  !current
              );
              setEmojiOpen(false);
            }}
            aria-label="Attach file"
          >
            <Paperclip />
          </button>

          {attachmentOpen && (
            <div className="wa-attachment-menu">
              <button
                type="button"
                onClick={() => {
                  setAttachmentOpen(false);
                  fileInputRef.current?.click();
                }}
              >
                <span className="wa-attachment-icon gallery">
                  <ImageIcon />
                </span>
                <span>Gallery</span>
              </button>

              <button
                type="button"
                disabled={sendingAudio}
                onClick={() => {
                  setAttachmentOpen(false);
                  audioInputRef.current?.click();
                }}
              >
                <span className="wa-attachment-icon audio">
                  {sendingAudio ? (
                    <Loader2 className="wa-spin" />
                  ) : (
                    <Music2 />
                  )}
                </span>
                <span>Audio</span>
              </button>

              <button
                type="button"
                onClick={
                  requestCurrentLocation
                }
              >
                <span className="wa-attachment-icon location">
                  <MapPin />
                </span>
                <span>Location</span>
              </button>

              <button
                type="button"
                onClick={
                  openContactPicker
                }
              >
                <span className="wa-attachment-icon contact">
                  <ContactRound />
                </span>
                <span>Contact</span>
              </button>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          className="wa-chat-hidden-file-input"
          type="file"
          accept="image/*,video/*"
          onChange={
            handleImageSelected
          }
        />

        <input
          ref={audioInputRef}
          className="wa-chat-hidden-file-input"
          type="file"
          accept="audio/*"
          onChange={
            handleAudioSelected
          }
        />

        <input
          value={text}
          onChange={
            handleInputChange
          }
          onKeyDown={
            handleInputKeyDown
          }
          onBlur={
            stopLocalTyping
          }
          placeholder="Type a message"
          autoComplete="off"
          spellCheck={
            chatSettings
              ?.spellCheckEnabled ??
            true
          }
        />

        <button
          type="submit"
          className="send-btn"
          disabled={!text.trim()}
          aria-label="Send message"
        >
          <Send />
        </button>
      </form>

      {selectedImage &&
        selectedImagePreview && (
          <div className="wa-chat-modal-overlay">
            <div className="wa-media-preview-modal">
              <header>
                <button
                  type="button"
                  onClick={
                    closeImagePreview
                  }
                  disabled={sendingImage}
                  aria-label="Close preview"
                >
                  <X />
                </button>

                <strong>
                  {selectedImage.type.startsWith(
                    "video/"
                  )
                    ? "Send video"
                    : "Send photo"}
                </strong>
              </header>

              <div className="wa-media-preview-stage">
                {selectedImage.type.startsWith(
                  "video/"
                ) ? (
                  <video
                    src={selectedImagePreview}
                    controls
                    playsInline
                    preload="metadata"
                  />
                ) : (
                  <img
                    src={selectedImagePreview}
                    alt="Selected"
                  />
                )}
              </div>

              <footer>
                <input
                  value={mediaCaption}
                  onChange={(event) =>
                    setMediaCaption(
                      event.target.value
                    )
                  }
                  placeholder="Add a caption"
                  maxLength={5000}
                />

                <button
                  type="button"
                  className="wa-round-send-button"
                  onClick={() =>
                    void sendSelectedImage()
                  }
                  disabled={sendingImage}
                  aria-label={
                    selectedImage.type.startsWith(
                      "video/"
                    )
                      ? "Send video"
                      : "Send photo"
                  }
                >
                  {sendingImage ? (
                    <Loader2 className="wa-spin" />
                  ) : (
                    <Send />
                  )}
                </button>
              </footer>
            </div>
          </div>
        )}

      {locationModalOpen && (
        <div className="wa-chat-modal-overlay">
          <div className="wa-location-share-modal">
            <header>
              <button
                type="button"
                onClick={() => {
                  setLocationModalOpen(false);
                  setPendingLocation(null);
                  setLocationError("");
                }}
                aria-label="Close location"
              >
                <X />
              </button>
              <strong>
                Send location
              </strong>
            </header>

            <div className="wa-location-share-content">
              {locationLoading && (
                <div className="wa-location-loading">
                  <Loader2 className="wa-spin" />
                  <span>
                    Getting your current location...
                  </span>
                </div>
              )}

              {!locationLoading &&
                locationError && (
                  <div className="wa-location-error">
                    <MapPin />
                    <span>
                      {locationError}
                    </span>
                    <button
                      type="button"
                      onClick={
                        requestCurrentLocation
                      }
                    >
                      Try again
                    </button>
                  </div>
                )}

              {!locationLoading &&
                pendingLocation && (
                  <div className="wa-location-preview-card">
                    <div className="wa-location-preview-map">
                      <MapPin />
                    </div>

                    <div>
                      <strong>
                        Current location
                      </strong>
                      <span>
                        {pendingLocation.latitude.toFixed(
                          6
                        )}
                        {", "}
                        {pendingLocation.longitude.toFixed(
                          6
                        )}
                      </span>
                    </div>
                  </div>
                )}
            </div>

            <footer>
              <button
                type="button"
                className="wa-location-send-button"
                disabled={
                  !pendingLocation ||
                  locationLoading
                }
                onClick={
                  shareCurrentLocation
                }
              >
                <MapPin />
                Send your current location
              </button>
            </footer>
          </div>
        </div>
      )}

      {contactModalOpen && (
        <div className="wa-chat-modal-overlay">
          <div className="wa-contact-share-modal">
            <header>
              <button
                type="button"
                onClick={() =>
                  setContactModalOpen(false)
                }
                aria-label="Close contacts"
              >
                <X />
              </button>

              <strong>
                Send contact
              </strong>
            </header>

            <div className="wa-contact-share-search">
              <Search />
              <input
                value={contactSearch}
                onChange={(event) =>
                  setContactSearch(
                    event.target.value
                  )
                }
                placeholder="Search contacts"
              />
            </div>

            <div className="wa-contact-share-list">
              {filteredContacts.length ===
              0 ? (
                <div className="wa-contact-share-empty">
                  No saved contacts found
                </div>
              ) : (
                filteredContacts.map(
                  (contact) => (
                    <button
                      type="button"
                      key={
                        contact.contactId
                      }
                      onClick={() =>
                        onOpenContactChat(
                          contact
                        )
                      }
                    >
                      <Avatar
                        src={
                          contact.profilePhoto
                        }
                        name={
                          contact.displayName ||
                          contact.email
                        }
                      />

                      <span>
                        <strong>
                          {contact.displayName ||
                            contact.email}
                        </strong>

                        <small>
                          {contact.phoneNumber ||
                            contact.email}
                        </small>
                      </span>
                    </button>
                  )
                )
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
