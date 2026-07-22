const USER_ID_KEY = "whatsapp_clone_user_id";
const USER_EMAIL_KEY = "whatsapp_clone_user_email";
const SESSION_ID_KEY = "whatsapp_clone_session_id";

const clearOldLocalStorage = (): void => {
  localStorage.removeItem(USER_ID_KEY);
  localStorage.removeItem(USER_EMAIL_KEY);
  localStorage.removeItem(SESSION_ID_KEY);
};

export const sessionStorageService = {
  getUserId: (): string => {
    return sessionStorage.getItem(USER_ID_KEY) || "";
  },

  getEmail: (): string => {
    return sessionStorage.getItem(USER_EMAIL_KEY) || "";
  },

  getSessionId: (): string => {
    return sessionStorage.getItem(SESSION_ID_KEY) || "";
  },

  save: (
    userId: string,
    email: string,
    sessionId: string
  ): void => {
    clearOldLocalStorage();

    sessionStorage.setItem(USER_ID_KEY, userId);
    sessionStorage.setItem(USER_EMAIL_KEY, email);
    sessionStorage.setItem(SESSION_ID_KEY, sessionId);
  },

  clear: (): void => {
    sessionStorage.removeItem(USER_ID_KEY);
    sessionStorage.removeItem(USER_EMAIL_KEY);
    sessionStorage.removeItem(SESSION_ID_KEY);

    clearOldLocalStorage();
  },
};