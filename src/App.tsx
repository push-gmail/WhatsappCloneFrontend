import { Toaster } from "react-hot-toast";
import AppRoutes from "./routes/AppRoutes";

export default function App() {
  return <><AppRoutes /><Toaster position="top-center" toastOptions={{ style: { background: "#202c33", color: "#fff" } }} /></>;
}
