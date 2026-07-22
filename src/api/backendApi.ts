import axios from "axios";

import {
  sessionStorageService,
} from "../utils/storage";

export const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ||
  "http://localhost:5000";

const backendApi = axios.create({
  baseURL: `${BACKEND_URL}/api`,

  headers: {
    "Content-Type": "application/json",
  },
});

/* =====================================================
   REQUEST INTERCEPTOR
===================================================== */

backendApi.interceptors.request.use(
  (config) => {
    const userId =
      sessionStorageService.getUserId();

    const sessionId =
      sessionStorageService.getSessionId();

    if (userId) {
      config.headers["x-user-id"] = userId;
    }

    if (sessionId) {
      config.headers["x-session-id"] = sessionId;
    }

    return config;
  },

  (error) => {
    return Promise.reject(error);
  }
);

/* =====================================================
   RESPONSE INTERCEPTOR
===================================================== */

backendApi.interceptors.response.use(
  (response) => response,

  (error) => {
    /*
     * Important:
     *
     * 401 par automatic redirect nahi hoga.
     * Storage bhi automatically clear nahi hogi.
     *
     * Protected component render rahega,
     * lekin backend protected data return nahi karega.
     */
    return Promise.reject(error);
  }
);

export const getErrorMessage = (
  error: unknown
): string => {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ||
      error.message
    );
  }

  return "Something went wrong";
};

export default backendApi;