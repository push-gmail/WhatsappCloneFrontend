import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Camera, Check, Clipboard, Pencil, Trash2, Upload, X } from "lucide-react";
import { useNavigate, useOutletContext } from "react-router-dom";
import toast from "react-hot-toast";
import backendApi, { getErrorMessage } from "../../api/backendApi";
import Avatar from "../../components/common/Avatar";
import EmptyPane from "../../components/layout/EmptyPane";
import Loading from "../../components/common/Loading";
import type { Profile } from "../../types";

export default function ProfilePage() {
  const navigate = useNavigate();
  const context = useOutletContext<{ profile: Profile | null; setProfile: (profile: Profile) => void }>();
  const [profile, setProfile] = useState<Profile | null>(context.profile);
  const [editing, setEditing] = useState<"name" | "about" | "phone" | null>(null);
  const [draft, setDraft] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [photoMenu, setPhotoMenu] = useState(false);

  useEffect(() => {
    if (profile) return;
    backendApi.get("/user/profile").then(({ data }) => setProfile(data.profile || data)).catch((error) => toast.error(getErrorMessage(error)));
  }, [profile]);

  const startEdit = (field: "name" | "about" | "phone") => { setEditing(field); setDraft(field === "phone" ? profile?.phoneNumber || "" : profile?.[field] || ""); };
  const save = async () => {
    if (!profile || !editing) return;
    try {
      const key = editing === "phone" ? "phoneNumber" : editing;
      const { data } = await backendApi.patch("/user/profile", { [key]: draft });
      const updated = data.profile || data;
      setProfile(updated); context.setProfile(updated); setEditing(null); toast.success("Profile updated");
    } catch (error) { toast.error(getErrorMessage(error)); }
  };
  const upload = async (file?: File) => {
    if (!file) return;
    const form = new FormData(); form.append("profilePhoto", file);
    try {
      const { data } = await backendApi.post("/user/profile/photo", form, { headers: { "Content-Type": "multipart/form-data" } });
      const updated = data.profile || data; setProfile(updated); context.setProfile(updated); setPhotoMenu(false); toast.success("Photo updated");
    } catch (error) { toast.error(getErrorMessage(error)); }
  };
  const removePhoto = async () => {
    try { const { data } = await backendApi.delete("/user/profile/photo"); const updated = data.profile || data; setProfile(updated); context.setProfile(updated); setPhotoMenu(false); toast.success("Photo removed"); } catch (error) { toast.error(getErrorMessage(error)); }
  };
  if (!profile) return <Loading />;

  const editableRow = (label: string, field: "name" | "about" | "phone", value: string) => (
    <div className="profile-row"><small>{label}</small>{editing === field ? <div className="inline-edit"><input value={draft} onChange={(e) => setDraft(e.target.value)} autoFocus /><button onClick={save}><Check /></button><button onClick={() => setEditing(null)}><X /></button></div> : <div><strong>{value || `Add ${label.toLowerCase()}`}</strong><span>{field === "phone" && value && <button onClick={() => { navigator.clipboard.writeText(value); toast.success("Phone number copied"); }}><Clipboard /></button>}<button onClick={() => startEdit(field)}><Pencil /></button></span></div>}</div>
  );

  return (
    <div className="settings-layout">
      <section className="settings-panel profile-panel">
        <header className="subpage-header"><button onClick={() => navigate(-1)}><ArrowLeft /></button><h2>Edit profile</h2></header>
        <div className="photo-editor"><Avatar src={profile.profilePhoto} name={profile.name} size={128} /><button onClick={() => setPhotoMenu(!photoMenu)}><Camera /> Edit</button><input ref={fileRef} hidden type="file" accept="image/*" onChange={(e) => upload(e.target.files?.[0])} />{photoMenu && <div className="photo-menu"><button onClick={() => fileRef.current?.click()}><Upload />Upload photo</button><button onClick={removePhoto}><Trash2 />Remove photo</button></div>}</div>
        {editableRow("About", "about", profile.about)}
        {editableRow("Name", "name", profile.name)}
        {editableRow("Phone", "phone", profile.phoneNumber)}
      </section>
      <EmptyPane />
    </div>
  );
}
