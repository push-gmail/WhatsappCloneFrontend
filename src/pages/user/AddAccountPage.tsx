import { ArrowLeft, CheckCircle2, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import backendApi, { getErrorMessage } from "../../api/backendApi";
import EmptyPane from "../../components/layout/EmptyPane";
import type { AddedAccount } from "../../types";

export default function AddAccountPage() {
  const navigate = useNavigate(); const [email, setEmail] = useState(""); const [otp, setOtp] = useState(""); const [otpSent, setOtpSent] = useState(false); const [accounts, setAccounts] = useState<AddedAccount[]>([]);
  const load = () => backendApi.get("/user/account").then(({ data }) => setAccounts((data.account || data).addedAccounts || [])).catch(() => undefined);
  useEffect(() => { void load(); }, []);
  const request = async () => { try { await backendApi.post("/user/account/added-accounts/request-otp", { email }); setOtpSent(true); toast.success("OTP sent"); } catch (error) { toast.error(getErrorMessage(error)); } };
  const verify = async () => { try { await backendApi.post("/user/account/added-accounts/verify-otp", { email, otp }); toast.success("Account added"); setEmail(""); setOtp(""); setOtpSent(false); load(); } catch (error) { toast.error(getErrorMessage(error)); } };
  return <div className="settings-layout"><section className="settings-panel"><header className="subpage-header"><button onClick={() => navigate(-1)}><ArrowLeft /></button><h2>Add account</h2></header><div className="form-section"><Mail size={52} /><p>Add another email account and verify it with OTP.</p><input placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} />{otpSent && <input className="otp-input small" placeholder="6-digit OTP" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} />}<button className="primary-btn" onClick={otpSent ? verify : request}>{otpSent ? "VERIFY & ADD" : "SEND OTP"}</button></div><div className="added-list"><h3>Added accounts</h3>{accounts.map((item) => <div key={item._id}><CheckCircle2 /><span>{item.email}</span></div>)}</div></section><EmptyPane /></div>;
}
