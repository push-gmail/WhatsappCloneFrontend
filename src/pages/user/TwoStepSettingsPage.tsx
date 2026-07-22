import { ArrowLeft, KeyRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import backendApi, { getErrorMessage } from "../../api/backendApi";
import EmptyPane from "../../components/layout/EmptyPane";

export default function TwoStepSettingsPage() {
  const navigate = useNavigate(); const [enabled, setEnabled] = useState(false); const [pin, setPin] = useState("");
  useEffect(() => { backendApi.get("/user/account").then(({ data }) => setEnabled((data.account || data).twoStepVerificationEnabled)).catch(() => undefined); }, []);
  const save = async () => { if (!/^\d{6}$/.test(pin) && !enabled) return toast.error("Enter a six-digit PIN"); try { const next = !enabled; await backendApi.patch("/user/account/two-step-verification", { enabled: next, ...(next ? { pin } : {}) }); setEnabled(next); setPin(""); toast.success(next ? "Two-step verification enabled" : "Two-step verification disabled"); } catch (error) { toast.error(getErrorMessage(error)); } };
  return <div className="settings-layout"><section className="settings-panel"><header className="subpage-header"><button onClick={() => navigate(-1)}><ArrowLeft /></button><h2>Two-step verification</h2></header><div className="form-section"><KeyRound size={64} /><h2>{enabled ? "Two-step verification is on" : "Protect your account"}</h2><p>{enabled ? "You will enter your PIN after email OTP during login." : "Create a six-digit PIN for additional protection."}</p>{!enabled && <input className="otp-input small" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="Six-digit PIN" />}<button className={enabled ? "danger-btn" : "primary-btn"} onClick={save}>{enabled ? "TURN OFF" : "TURN ON"}</button></div></section><EmptyPane /></div>;
}
