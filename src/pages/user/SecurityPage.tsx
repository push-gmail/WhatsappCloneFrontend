import { ArrowLeft, LockKeyhole, MessageSquare, Phone, Image, MapPin, CircleDashed } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import backendApi, { getErrorMessage } from "../../api/backendApi";
import EmptyPane from "../../components/layout/EmptyPane";

export default function SecurityPage() {
  const navigate = useNavigate(); const [enabled, setEnabled] = useState(true);
  useEffect(() => { backendApi.get("/user/account").then(({ data }) => setEnabled((data.account || data).securityNotificationsEnabled)).catch(() => undefined); }, []);
  const toggle = async () => { try { const next = !enabled; await backendApi.patch("/user/account/security-notifications", { enabled: next }); setEnabled(next); toast.success("Security notifications updated"); } catch (error) { toast.error(getErrorMessage(error)); } };
  return <div className="settings-layout"><section className="settings-panel security-panel"><header className="subpage-header"><button onClick={() => navigate(-1)}><ArrowLeft /></button><h2>Security</h2></header><div className="security-art"><LockKeyhole /></div><h2>Your chats and calls are private</h2><p>Your personal conversations are between you and the people you choose.</p><ul><li><MessageSquare />Text and voice messages</li><li><Phone />Audio and video calls</li><li><Image />Photos, videos and documents</li><li><MapPin />Location sharing</li><li><CircleDashed />Statuses</li></ul><div className="toggle-row"><div><strong>Send login security notifications</strong><small>Get an email whenever your account is logged in.</small></div><button className={`toggle ${enabled ? "on" : ""}`} onClick={toggle}><span /></button></div></section><EmptyPane /></div>;
}
