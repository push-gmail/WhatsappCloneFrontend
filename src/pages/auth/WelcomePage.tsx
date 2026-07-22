import { MessageCircleMore } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function WelcomePage() {
  const navigate = useNavigate();
  return (
    <main className="welcome-page">
      <h1>Welcome to WhatsAppClone</h1>
      <div className="welcome-art"><MessageCircleMore size={100} /></div>
      <p>Private, simple and reliable messaging.</p>
      <button className="primary-btn wide" onClick={() => navigate("/auth/email")}>AGREE AND CONTINUE</button>
      <small>from<br /><strong>YOUR BRAND</strong></small>
    </main>
  );
}
