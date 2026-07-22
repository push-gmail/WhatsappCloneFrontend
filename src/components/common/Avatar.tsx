import { UserRound } from "lucide-react";
import { BACKEND_URL } from "../../api/backendApi";

export default function Avatar({ src, name = "", size = 44 }: { src?: string; name?: string; size?: number }) {
  const resolved = src ? (src.startsWith("http") ? src : `${BACKEND_URL}${src}`) : "";
  return (
    <div className="avatar" style={{ width: size, height: size }} aria-label={name || "User"}>
      {resolved ? <img src={resolved} alt={name || "Profile"} /> : <UserRound size={size * 0.5} />}
    </div>
  );
}
