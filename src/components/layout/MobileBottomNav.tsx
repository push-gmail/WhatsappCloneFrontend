import {
  MessageCircle,
  CircleDashed,
  Users,
  Settings,
} from "lucide-react";

import {
  NavLink,
} from "react-router-dom";

export default function MobileBottomNav() {
  return (
    <nav className="mobile-bottom-nav">
      <NavLink to="/user/chats">
        <MessageCircle />
        <span>Chats</span>
      </NavLink>

      <NavLink to="/user/status">
        <CircleDashed />
        <span>Updates</span>
      </NavLink>

      <button type="button">
        <Users />
        <span>Communities</span>
      </button>

      <NavLink to="/user/settings">
        <Settings />
        <span>Settings</span>
      </NavLink>
    </nav>
  );
}