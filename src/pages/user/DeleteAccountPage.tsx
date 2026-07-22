import { ArrowLeft, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import backendApi, { getErrorMessage } from "../../api/backendApi";
import { useAuth } from "../../store/AuthContext";
import EmptyPane from "../../components/layout/EmptyPane";

export default function DeleteAccountPage() {
  const navigate = useNavigate(); const { logout } = useAuth(); const [reason, setReason] = useState(""); const [confirm, setConfirm] = useState(false);
  const remove = async () => { if (!confirm) return toast.error("Confirm account deletion"); try { await backendApi.delete("/user/account/delete-account", { data: { reason } }); logout(); toast.success("Account deleted"); navigate("/auth/email", { replace: true }); } catch (error) { toast.error(getErrorMessage(error)); } };
  return <div className="settings-layout"><section className="settings-panel delete-panel"><header className="subpage-header"><button onClick={() => navigate(-1)}><ArrowLeft /></button><h2>Delete my account</h2></header><AlertTriangle size={64} /><h2>Deleting your account is irreversible</h2><p>Your account will be marked deleted and you will no longer be able to sign in with it.</p><select value={reason} onChange={(e) => setReason(e.target.value)}><option value="">Select a reason</option><option>I no longer need this account</option><option>I am changing my email</option><option>Privacy concern</option><option>Other</option></select><label className="confirm-check"><input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} /> I understand this action cannot be reversed.</label><button className="danger-btn" onClick={remove}>DELETE ACCOUNT</button></section><EmptyPane /></div>;
}
