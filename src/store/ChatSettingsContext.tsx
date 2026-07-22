import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import toast from "react-hot-toast";

import backendApi, {
  getErrorMessage,
} from "../api/backendApi";

import type {
  ChatSettings,
  ChatTheme,
  ChatWallpaper,
  MediaAutoDownload,
  MediaUploadQuality,
} from "../types";

type ChatSettingsContextValue = {
  chatSettings: ChatSettings | null;
  loading: boolean;
  resolvedTheme: "light" | "dark";

  refreshChatSettings: () => Promise<void>;

  saveTheme: (
    theme: ChatTheme
  ) => Promise<void>;

  saveWallpaper: (
    wallpaper: ChatWallpaper
  ) => Promise<void>;

  saveMediaUploadQuality: (
    quality: MediaUploadQuality
  ) => Promise<void>;

  saveMediaAutoDownload: (
    settings: MediaAutoDownload
  ) => Promise<void>;

  saveBehaviour: (payload: {
    spellCheckEnabled?: boolean;
    replaceTextWithEmoji?: boolean;
    enterIsSend?: boolean;
  }) => Promise<void>;
};

const ChatSettingsContext =
  createContext<ChatSettingsContextValue | null>(
    null
  );

type ProviderProps = {
  children: ReactNode;
};

export function ChatSettingsProvider({
  children,
}: ProviderProps) {
  const [chatSettings, setChatSettings] =
    useState<ChatSettings | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [systemTheme, setSystemTheme] =
    useState<"light" | "dark">(() =>
      window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches
        ? "dark"
        : "light"
    );

  const resolvedTheme =
    useMemo<"light" | "dark">(() => {
      if (!chatSettings) {
        return systemTheme;
      }

      if (chatSettings.theme === "system") {
        return systemTheme;
      }

      return chatSettings.theme;
    }, [chatSettings, systemTheme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia(
      "(prefers-color-scheme: dark)"
    );

    const handleChange = (
      event: MediaQueryListEvent
    ) => {
      setSystemTheme(
        event.matches ? "dark" : "light"
      );
    };

    mediaQuery.addEventListener(
      "change",
      handleChange
    );

    return () => {
      mediaQuery.removeEventListener(
        "change",
        handleChange
      );
    };
  }, []);

  const refreshChatSettings =
    useCallback(async () => {
      try {
        setLoading(true);

        const { data } =
          await backendApi.get(
            "/user/chat-settings"
          );

        setChatSettings(
          data?.chatSettings || null
        );
      } catch (error) {
        toast.error(
          getErrorMessage(error)
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    void refreshChatSettings();
  }, [refreshChatSettings]);

  const saveTheme = async (
    theme: ChatTheme
  ) => {
    const { data } =
      await backendApi.patch(
        "/user/chat-settings/theme",
        {
          theme,
        }
      );

    setChatSettings(data.chatSettings);
  };

  const saveWallpaper = async (
    wallpaper: ChatWallpaper
  ) => {
    const { data } =
      await backendApi.patch(
        "/user/chat-settings/wallpaper",
        wallpaper
      );

    setChatSettings(data.chatSettings);
  };

  const saveMediaUploadQuality = async (
    quality: MediaUploadQuality
  ) => {
    const { data } =
      await backendApi.patch(
        "/user/chat-settings/media-upload-quality",
        {
          quality,
        }
      );

    setChatSettings(data.chatSettings);
  };

  const saveMediaAutoDownload = async (
    settings: MediaAutoDownload
  ) => {
    const { data } =
      await backendApi.patch(
        "/user/chat-settings/media-auto-download",
        settings
      );

    setChatSettings(data.chatSettings);
  };

  const saveBehaviour = async (payload: {
    spellCheckEnabled?: boolean;
    replaceTextWithEmoji?: boolean;
    enterIsSend?: boolean;
  }) => {
    const { data } =
      await backendApi.patch(
        "/user/chat-settings/behaviour",
        payload
      );

    setChatSettings(data.chatSettings);
  };

  return (
    <ChatSettingsContext.Provider
      value={{
        chatSettings,
        loading,
        resolvedTheme,
        refreshChatSettings,
        saveTheme,
        saveWallpaper,
        saveMediaUploadQuality,
        saveMediaAutoDownload,
        saveBehaviour,
      }}
    >
      {children}
    </ChatSettingsContext.Provider>
  );
}

export function useChatSettings() {
  const context = useContext(
    ChatSettingsContext
  );

  if (!context) {
    throw new Error(
      "useChatSettings must be used inside ChatSettingsProvider"
    );
  }

  return context;
}