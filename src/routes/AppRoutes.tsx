import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import WelcomePage from "../pages/auth/WelcomePage";
import EmailAuthPage from "../pages/auth/EmailAuthPage";
import PasswordAuthPage from "../pages/auth/PasswordAuthPage";

/*
 * OTP page reference ke liye project me rahega.
 * Route temporarily inactive hai.
 */
// import OtpPage from "../pages/auth/OtpPage";

import TwoStepPage from "../pages/auth/TwoStepPage";

import RequireUser from "./RequireUser";

import UserShell from "../components/layout/UserShell";

import ChatsPage from "../pages/user/ChatsPage";
import StatusPage from "../components/status/StatusPage";
import SettingsPage from "../pages/user/SettingsPage";
import ProfilePage from "../pages/user/ProfilePage";
import AccountPage from "../pages/user/AccountPage";
import SecurityPage from "../pages/user/SecurityPage";
import AddAccountPage from "../pages/user/AddAccountPage";
import TwoStepSettingsPage from "../pages/user/TwoStepSettingsPage";
import ChangePhonePage from "../pages/user/ChangePhonePage";
import RequestInfoPage from "../pages/user/RequestInfoPage";
import DeleteAccountPage from "../pages/user/DeleteAccountPage";

import PrivacyPage from "../pages/user/PrivacyPage";
import DefaultMessageTimerPage from "../pages/user/DefaultMessageTimerPage";
import PrivacyRulePage from "../pages/user/PrivacyRulePage";

import ChatsSettingsPage from "../pages/user/ChatsSettingsPage";
import ChatWallpaperPage from "../pages/user/ChatWallpaperPage";
import MediaUploadQualityPage from "../pages/user/MediaUploadQualityPage";
import MediaAutoDownloadPage from "../pages/user/MediaAutoDownloadPage";

import NotificationsPage from "../pages/user/NotificationsPage";
import NotificationCategoryPage from "../pages/user/NotificationCategoryPage";

import {
  ChatSettingsProvider,
} from "../store/ChatSettingsContext";
import OtpPage from "../pages/auth/OtpPage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={<WelcomePage />}
      />

      <Route
        path="/auth/email"
        element={<EmailAuthPage />}
      />

      <Route
        path="/auth/password"
        element={<PasswordAuthPage />}
      />

      {/*
       * OTP route temporarily inactive.
       * Component delete nahi kiya gaya.
       */}
      
      <Route
        path="/auth/otp"
        element={<OtpPage />}
      />
      

      <Route
        path="/auth/two-step"
        element={<TwoStepPage />}
      />

      <Route element={<RequireUser />}>
        <Route
          path="/user"
          element={
            <ChatSettingsProvider>
              <UserShell />
            </ChatSettingsProvider>
          }
        >
          <Route
            index
            element={
              <Navigate
                to="chats"
                replace
              />
            }
          />

          <Route
            path="chats"
            element={<ChatsPage />}
          />

          <Route
            path="chats/:conversationId"
            element={<ChatsPage />}
          />

          <Route
            path="status"
            element={<StatusPage />}
          />

          <Route
            path="settings"
            element={<SettingsPage />}
          />

          <Route
            path="profile"
            element={<ProfilePage />}
          />

          <Route
            path="account"
            element={<AccountPage />}
          />

          <Route
            path="account/security"
            element={<SecurityPage />}
          />

          <Route
            path="account/add-account"
            element={<AddAccountPage />}
          />

          <Route
            path="account/two-step"
            element={
              <TwoStepSettingsPage />
            }
          />

          <Route
            path="account/change-phone"
            element={<ChangePhonePage />}
          />

          <Route
            path="account/request-info"
            element={<RequestInfoPage />}
          />

          <Route
            path="account/delete"
            element={
              <DeleteAccountPage />
            }
          />

          <Route
            path="privacy"
            element={<PrivacyPage />}
          />

          <Route
            path="privacy/default-message-timer"
            element={
              <DefaultMessageTimerPage />
            }
          />

          <Route
            path="privacy/:section"
            element={<PrivacyRulePage />}
          />

          <Route
            path="chat-settings"
            element={<ChatsSettingsPage />}
          />

          <Route
            path="chat-settings/wallpaper"
            element={<ChatWallpaperPage />}
          />

          <Route
            path="chat-settings/media-upload-quality"
            element={
              <MediaUploadQualityPage />
            }
          />

          <Route
            path="chat-settings/media-auto-download"
            element={
              <MediaAutoDownloadPage />
            }
          />

          <Route
            path="notifications"
            element={<NotificationsPage />}
          />

          <Route
            path="notifications/:category"
            element={
              <NotificationCategoryPage />
            }
          />
        </Route>
      </Route>

      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />
    </Routes>
  );
}