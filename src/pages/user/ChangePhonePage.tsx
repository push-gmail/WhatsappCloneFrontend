import { ArrowLeft, Phone } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import backendApi, { getErrorMessage } from "../../api/backendApi";
import EmptyPane from "../../components/layout/EmptyPane";

export default function ChangePhonePage() {
  const navigate = useNavigate(); const [phoneNumber, setPhoneNumber] = useState("");
  const save = async () => { try { await backendApi.patch("/user/account/change-phone-number", { phoneNumber }); toast.success("Phone number updated"); navigate("/user/profile"); } catch (error) { toast.error(getErrorMessage(error)); } };
  return <div className="settings-layout"><section className="settings-panel"><header className="subpage-header"><button onClick={() => navigate(-1)}><ArrowLeft /></button><h2>Change phone number</h2></header><div className="form-section"><Phone size={56} /><p>Enter your phone number with country code. It will update in Account and Profile.</p><input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+91 98765 43210" /><button className="primary-btn" onClick={save}>SAVE</button></div></section><EmptyPane /></div>;
}
