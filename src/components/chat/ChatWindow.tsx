import {
  useEffect,
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
  MoreVertical,
  Paperclip,
  Phone,
  Search,
  Send,
  Smile,
  Video,
} from "lucide-react";

import Avatar from "../common/Avatar";

import type {
  Conversation,
  Message,
} from "../../types";

import {
  useAuth,
} from "../../store/AuthContext";

import {
  useChatSettings,
} from "../../store/ChatSettingsContext";

type ChatWindowProps = {
  conversation: Conversation;
  messages: Message[];
  onBack: () => void;

  onSend: (
    text: string
  ) => void;

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

  const yesterday =
    new Date(now);

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

  if (
    isSameDate(
      date,
      now
    )
  ) {
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

export default function ChatWindow({
  conversation,
  messages,
  onBack,
  onSend,
  onTypingStart,
  onTypingStop,
  isTyping,
  online,
  lastSeenAt,
  onOpenContactInfo,
}: ChatWindowProps) {
  const [text, setText] =
    useState("");

  const bottomRef =
    useRef<HTMLDivElement | null>(
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

  const { userId } =
    useAuth();

  const {
    chatSettings,
    resolvedTheme,
  } = useChatSettings();

  const wallpaper =
    chatSettings?.wallpaper;

  const clearTypingTimer =
    () => {
      if (
        typingTimeoutRef.current
      ) {
        clearTimeout(
          typingTimeoutRef.current
        );

        typingTimeoutRef.current =
          null;
      }
    };

  const stopLocalTyping =
    () => {
      clearTypingTimer();

      if (
        localTypingRef.current
      ) {
        localTypingRef.current =
          false;

        onTypingStop();
      }
    };

  const scheduleTypingStop =
    () => {
      clearTypingTimer();

      typingTimeoutRef.current =
        setTimeout(() => {
          stopLocalTyping();
        }, TYPING_STOP_DELAY_MS);
    };

  useEffect(() => {
    bottomRef.current?.scrollIntoView(
      {
        behavior: "smooth",
        block: "end",
      }
    );
  }, [messages]);

  useEffect(() => {
    /*
     * Conversation change par old input
     * aur old typing state clear.
     */
    stopLocalTyping();

    setText("");

    return () => {
      stopLocalTyping();
    };
  }, [conversation._id]);

  useEffect(() => {
    return () => {
      clearTypingTimer();
    };
  }, []);

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

  const sendCurrentMessage =
    () => {
      const preparedText =
        prepareMessageText(text);

      if (!preparedText) {
        stopLocalTyping();

        return;
      }

      stopLocalTyping();

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

    /*
     * Input empty hone par immediately
     * typing stop.
     */
    if (!nextValue.trim()) {
      stopLocalTyping();

      return;
    }

    /*
     * Sirf first keypress par typing_start.
     */
    if (
      !localTypingRef.current
    ) {
      localTypingRef.current =
        true;

      onTypingStart();
    }

    /*
     * Har keypress par inactivity timer reset.
     */
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
    if (
      message.status === "read"
    ) {
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

    return (
      <Check size={15} />
    );
  };

  /*
   * Header priority:
   *
   * typing...
   * online
   * last seen
   * email
   */
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
              getSenderId(
                message
              ) === userId;

            return (
              <div
                key={message._id}
                className={`message-line ${
                  mine
                    ? "mine"
                    : "theirs"
                }`}
              >
                <div className="message-bubble">
                  {message.messageType ===
                    "text" && (
                    <span>
                      {
                        message.text
                      }
                    </span>
                  )}

                  {message.fileUrl && (
                    <a
                      href={
                        message.fileUrl
                      }
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open attachment
                    </a>
                  )}

                  <small>
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

        <div ref={bottomRef} />
      </div>

      <form
        className="message-composer"
        onSubmit={submit}
      >
        <button
          type="button"
          aria-label="Emoji"
        >
          <Smile />
        </button>

        <button
          type="button"
          aria-label="Attach file"
        >
          <Paperclip />
        </button>

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
    </section>
  );
}