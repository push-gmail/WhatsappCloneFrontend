import {
  MessageCircle,
  CircleDashed,
  Users,
  Settings,
  LogOut,
} from "lucide-react";

import {
  NavLink,
  useNavigate,
} from "react-router-dom";

import Avatar from "../common/Avatar";

import {
  useAuth,
} from "../../store/AuthContext";

import backendApi from "../../api/backendApi";

type DesktopRailProps = {
  photo?: string;
  name?: string;
};

export default function DesktopRail({
  photo,
  name,
}: DesktopRailProps) {
  const { logout } = useAuth();

  const navigate = useNavigate();

  const doLogout = async () => {
    try {
      /*
       * Valid current session hui to backend delete karega.
       * Already invalid hui to 401 aa sakta hai.
       */
      await backendApi.post(
        "/auth/logout"
      );
    } catch {
      /*
       * Session already invalid hone par bhi
       * manual logout complete hoga.
       */
    } finally {
      logout();

      navigate(
        "/auth/email",
        {
          replace: true,
        }
      );
    }
  };

  return (
    <aside className="desktop-rail">
      <div className="rail-top">
        <NavLink
          to="/user/chats"
          title="Chats"
        >
          <MessageCircle />
        </NavLink>

        <NavLink
          to="/user/status"
          title="Updates"
        >
          <CircleDashed />
        </NavLink>

        <button
          type="button"
          title="Communities"
        >
          <Users />
        </button>
      </div>

      <div className="rail-bottom">
        <NavLink
          to="/user/settings"
          title="Settings"
        >
          <Settings />
        </NavLink>

        <button
          type="button"
          title="Logout"
          onClick={() => {
            void doLogout();
          }}
        >
          <LogOut />
        </button>

        <NavLink
          to="/user/profile"
          title="Profile"
        >
          <Avatar
            src={photo}
            name={name}
            size={32}
          />
        </NavLink>
      </div>
    </aside>
  );
}