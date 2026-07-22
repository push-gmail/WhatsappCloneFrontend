import { ArrowLeft, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import backendApi, { getErrorMessage } from "../../api/backendApi";
import EmptyPane from "../../components/layout/EmptyPane";

export default function RequestInfoPage() {
  const navigate = useNavigate(); const request = async () => { try { await backendApi.post("/user/account/request-info"); toast.success("Account report requested"); } catch (error) { toast.error(getErrorMessage(error)); } };
  return <div className="settings-layout"><section className="settings-panel"><header className="subpage-header"><button onClick={() => navigate(-1)}><ArrowLeft /></button><h2>Request account info</h2></header><div className="report-block"><small>Account information</small><button onClick={request}><FileText /><span><strong>Request report</strong><small>Create a report of your account information and settings. This report does not include your messages.</small></span></button></div></section><EmptyPane /></div>;
}
