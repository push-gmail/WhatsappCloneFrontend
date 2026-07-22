import { ArrowLeft, BellRing, ChevronRight, FileText, KeyRound, MailPlus, Phone, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import EmptyPane from "../../components/layout/EmptyPane";

export default function AccountPage() {
  const navigate = useNavigate();
  const items = [
    ["/user/account/security", BellRing, "Security notifications", "Email alerts after login"],
    ["/user/account/add-account", MailPlus, "Add account", "Verify another email address"],
    ["/user/account/two-step", KeyRound, "Two-step verification", "Create or change six-digit PIN"],
    ["/user/account/change-phone", Phone, "Change phone number", "Update account and profile number"],
    ["/user/account/request-info", FileText, "Request account info", "Create a report of your account"],
    ["/user/account/delete", Trash2, "Delete my account", "Permanently remove your account"],
  ] as const;
  return <div className="settings-layout"><section className="settings-panel"><header className="subpage-header"><button onClick={() => navigate(-1)}><ArrowLeft /></button><h2>Account</h2></header><div className="account-menu">{items.map(([to, Icon, title, subtitle]) => <Link key={to} to={to}><Icon /><div><strong>{title}</strong><small>{subtitle}</small></div><ChevronRight /></Link>)}</div></section><EmptyPane /></div>;
}
