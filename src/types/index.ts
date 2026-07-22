export type Profile = {
  _id?: string;
  userId?: string;
  profilePhoto: string;
  name: string;
  about: string;
  aboutDuration?:
    | "until_changed"
    | "custom";
  aboutExpiresAt?: string | null;
  aboutVisibility?:
    | "everyone"
    | "contacts"
    | "contacts_except"
    | "nobody";
  phoneNumber: string;
};

export type PublicUser = {
  userId: string;
  profileId?: string;

  email: string;
  name: string;
  profilePhoto: string;
  about: string;
  phoneNumber?: string;
};

export type Conversation = {
  _id: string;
  participants: string[];
  lastMessage?: string;
  lastMessageAt?: string;
  otherUser: PublicUser;
  unreadCount: number;
};

export type MessageStatus =
  | "sent"
  | "delivered"
  | "read";

export type MessageType =
  | "text"
  | "image"
  | "video"
  | "document"
  | "audio";

export type Message = {
  _id: string;

  conversationId:
    | string
    | {
        _id: string;
      };

  senderId:
    | string
    | {
        _id: string;
      };

  receiverId:
    | string
    | {
        _id: string;
      };

  messageType: MessageType;
  text: string;
  fileUrl?: string;

  status: MessageStatus;

  deliveredAt?: string | null;
  readAt?: string | null;

  createdAt: string;
  updatedAt: string;
};

export type AddedAccount = {
  _id: string;
  email: string;
  isEmailVerified: boolean;
  verifiedAt?: string;
};

export type Account = {
  _id: string;
  userId: string;
  profileId: string;
  addedAccounts: AddedAccount[];
  twoStepVerificationEnabled: boolean;
  phoneNumber: string;
  securityNotificationsEnabled: boolean;
  securityNotificationGone: boolean;
  lastSecurityNotificationAt?: string;
  accountInfoRequestStatus?: string;
  isAccountDeleted?: boolean;
};

export type PrivacyVisibilityMode =
  | "everyone"
  | "my_contacts"
  | "my_contacts_except"
  | "nobody"
  | "only_share_with";

export type OnlineVisibility =
  | "everyone"
  | "same_as_last_seen";

export type DefaultMessageTimer =
  | "off"
  | "24_hours"
  | "7_days"
  | "30_days"
  | "90_days";

export type PrivacyRule = {
  mode: PrivacyVisibilityMode;
  includedUsers: string[];
  excludedUsers: string[];
};

export type PrivacySettings = {
  _id: string;
  userId: string;
  profileId: string;
  accountId: string;

  lastSeen: PrivacyRule;
  onlineVisibility: OnlineVisibility;

  profilePicture: PrivacyRule;
  about: PrivacyRule;
  status: PrivacyRule;

  readReceiptsEnabled: boolean;
  defaultMessageTimer:
    DefaultMessageTimer;

  createdAt: string;
  updatedAt: string;
};

export type PrivacyUser = {
  userId: string;
  email: string;
  name: string;
  profilePhoto: string;
};

export type ChatTheme =
  | "light"
  | "dark"
  | "system";

export type WallpaperType =
  | "default"
  | "color"
  | "preset"
  | "image";

export type MediaUploadQuality =
  | "standard"
  | "hd";

export type ChatWallpaper = {
  type: WallpaperType;
  value: string;
  doodlesEnabled: boolean;
};

export type MediaAutoDownload = {
  photos: boolean;
  audio: boolean;
  videos: boolean;
  documents: boolean;
};

export type ChatSettings = {
  _id: string;
  userId: string;
  accountId: string;
  privacyId: string;

  theme: ChatTheme;
  wallpaper: ChatWallpaper;

  mediaUploadQuality:
    MediaUploadQuality;

  mediaAutoDownload:
    MediaAutoDownload;

  spellCheckEnabled: boolean;
  replaceTextWithEmoji: boolean;
  enterIsSend: boolean;

  createdAt: string;
  updatedAt: string;
};

export type BrowserNotificationPermission =
  | "default"
  | "granted"
  | "denied"   
  | "unsupported";

export type NotificationCategorySettings = {
  showNotifications: boolean;
  showReactionNotifications: boolean;
  playSound: boolean;
};

export type StatusNotificationSettings = {
  showNotifications: boolean;
  playSound: boolean;
};

export type NotificationSettings = {
  _id: string;

  userId: string;
  profileId: string;
  privacyId: string;
  chatSettingsId: string;

  messages:
    NotificationCategorySettings;

  groups:
    NotificationCategorySettings;

  status:
    StatusNotificationSettings;

  showPreviews: boolean;
  playOutgoingSound: boolean;
  backgroundSyncEnabled: boolean;

  browserPermissionStatus:
    BrowserNotificationPermission;

  createdAt: string;
  updatedAt: string;
};

/* =====================================================
   STATUS TYPES
===================================================== */

export type StatusMediaType =
  | "image"
  | "video";

export type StatusSeenBy = {
  userId: string;
  profileId: string;
  seenAt: string;
};

export type StatusItem = {
  _id: string;
  mediaType: StatusMediaType;
  mediaUrl: string;
  caption: string;

  viewsCount?: number;
  seenBy?: StatusSeenBy[];

  createdAt: string;
  expiresAt: string;

  isSeenByMe?: boolean;
};

export type StatusOwnerProfile = {
  name: string;
  profilePhoto: string;
  email?: string;
};

export type StatusFeedGroup = {
  statusDocumentId: string;
  userId: string;
  profileId: string;

  profile: StatusOwnerProfile;

  statusExist: "yes" | "no";

  statuses: StatusItem[];

  allStatusesSeenByMe: boolean;
  latestStatusAt: string;
};

export type MyStatusResponse = {
  statusDocumentId?: string;
  statusExist: "yes" | "no";
  profile: Profile | null;
  statuses: StatusItem[];
};

export type StatusFeedResponse = {
  statuses: StatusFeedGroup[];
};

export type StatusViewerUser = {
  userId: string;
  profileId: string;
  name: string;
  profilePhoto: string;
  email: string;
  seenAt: string;
};

export type StatusViewersResponse = {
  statusId: string;
  mediaType: StatusMediaType;
  mediaUrl: string;
  viewsCount: number;
  viewers: StatusViewerUser[];
};


/* =====================================================
   ONLINE / LAST SEEN TYPES
===================================================== */

export type UserPresence = {
  userId: string;

  isOnline: boolean;

  onlineAt:
    | string
    | null;

  lastSeenAt:
    | string
    | null;

  canSeeOnline: boolean;
  canSeeLastSeen: boolean;
};

export type UserPresenceResponse = {
  presence: UserPresence;
};

/* =====================================================
   CONTACT TYPES
===================================================== */

export type SavedContact = {
  contactId: string;

  ownerUserId: string;
  contactUserId: string;
  contactProfileId: string;

  customName: string;
  displayName: string;

  profilePhoto: string;
  about: string;
  email: string;
  phoneNumber: string;

  createdAt?: string;
  updatedAt?: string;
};

export type ContactDetails = {
  contactId: string | null;

  ownerUserId: string;
  contactUserId: string;
  contactProfileId: string;

  customName: string;
  displayName: string;

  isSavedContact: boolean;

  createdAt: string | null;
  updatedAt: string | null;

  user: {
    userId: string;
    email: string;
    userName: string;
    phoneNumber: string;
  };

  profile: {
    profileId: string;
    userId: string;
    profilePhoto: string;
    name: string;
    about: string;
    phoneNumber: string;
  };
};

export type ContactDetailsResponse = {
  contact: ContactDetails;
};