import { Toaster } from "react-hot-toast";
import AppRoutes from "./routes/AppRoutes";

export default function App() {
  return (
    <>
      <AppRoutes />

      <Toaster
        position="bottom-center"
        gutter={10}
        containerStyle={{
          bottom: 82,
        }}
        toastOptions={{
          duration: 3000,
          style: {
            background: "#202c33",
            color: "#fff",
            borderRadius: "8px",
            padding: "10px 14px",
            fontSize: "14px",
            maxWidth: "min(92vw, 420px)",
            boxShadow: "0 6px 24px rgba(0,0,0,0.25)",
          },
        }}
      />
    </>
  );
}