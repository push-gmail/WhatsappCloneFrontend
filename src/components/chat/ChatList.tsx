import {
  Search,
  MoreVertical,
  SquarePen,
} from "lucide-react";

import Avatar from "../common/Avatar";

import type {
  Conversation,
  SavedContact,
} from "../../types";

type ChatListProps = {
  conversations:
    Conversation[];

  selectedId?: string;

  onSelect: (
    conversation: Conversation
  ) => void;

  search: string;

  setSearch: (
    value: string
  ) => void;

  onSearch: () => void;

  typingUsersByConversation: Map<
    string,
    Set<string>
  >;

  savedContactsByUser: Map<
    string,
    SavedContact
  >;
};

const timeLabel = (
  value?: string
) =>
  value
    ? new Date(
        value
      ).toLocaleTimeString(
        [],
        {
          hour: "2-digit",
          minute: "2-digit",
        }
      )
    : "";

export default function ChatList({
  conversations,
  selectedId,
  onSelect,
  search,
  setSearch,
  onSearch,
  typingUsersByConversation,
  savedContactsByUser,
}: ChatListProps) {
  return (
    <section className="chat-list-panel">
      <header className="panel-header">
        <h1>
          WhatsAppClone
        </h1>

        <div>
          <button
            type="button"
            onClick={onSearch}
            aria-label="Start new chat"
          >
            <SquarePen />
          </button>

          <button
            type="button"
            aria-label="More options"
          >
            <MoreVertical />
          </button>
        </div>
      </header>

      <form
        className="search-box"
        onSubmit={(event) => {
          event.preventDefault();
          onSearch();
        }}
      >
        <Search />

        <input
          value={search}
          onChange={(event) =>
            setSearch(
              event.target.value
            )
          }
          placeholder="Search or start a new chat"
        />
      </form>

      <div className="chat-filters">
        <button
          type="button"
          className="active"
        >
          All
        </button>

        <button type="button">
          Unread
        </button>

        <button type="button">
          Favorites
        </button>

        <button type="button">
          Groups
        </button>
      </div>

      <div className="conversation-list">
        {conversations.length ===
          0 && (
          <div className="empty-list">
            No conversations yet.
            Search an email to start
            chatting.
          </div>
        )}

        {conversations.map(
          (conversation) => {
            const conversationId =
              String(
                conversation._id
              );

            const otherUserId =
              String(
                conversation.otherUser
                  .userId
              );

            const savedContact =
              savedContactsByUser.get(
                otherUserId
              );

            const typingUsers =
              typingUsersByConversation.get(
                conversationId
              );

            const otherUserIsTyping =
              Boolean(
                typingUsers?.has(
                  otherUserId
                )
              );

            const displayName =
              savedContact?.displayName ||
              conversation.otherUser
                .name ||
              conversation.otherUser
                .email;

            const previewText =
              otherUserIsTyping
                ? "typing..."
                : conversation.lastMessage ||
                  conversation.otherUser
                    .about ||
                  conversation.otherUser
                    .email;

            return (
              <button
                type="button"
                key={conversationId}
                className={`conversation-row ${
                  selectedId ===
                  conversationId
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  onSelect(
                    conversation
                  )
                }
              >
                <Avatar
                  src={
                    conversation
                      .otherUser
                      .profilePhoto
                  }
                  name={displayName}
                  size={48}
                />

                <div className="conversation-copy">
                  <div>
                    <strong>
                      {displayName}
                    </strong>

                    <time>
                      {timeLabel(
                        conversation.lastMessageAt
                      )}
                    </time>
                  </div>

                  <div>
                    <span
                      className={
                        otherUserIsTyping
                          ? "chat-list-typing"
                          : undefined
                      }
                    >
                      {previewText}
                    </span>

                    {conversation.unreadCount >
                      0 && (
                      <b>
                        {
                          conversation.unreadCount
                        }
                      </b>
                    )}
                  </div>
                </div>
              </button>
            );
          }
        )}
      </div>
    </section>
  );
}
