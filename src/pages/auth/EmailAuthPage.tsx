import {
  useEffect,
  useState,
} from "react";

import { Mail } from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import toast from "react-hot-toast";

import backendApi, {
  getErrorMessage,
} from "../../api/backendApi";

export default function EmailAuthPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] =
    useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const logoutSuccess =
      sessionStorage.getItem(
        "whatsapp_clone_logout_success"
      );

    if (logoutSuccess === "true") {
      sessionStorage.removeItem(
        "whatsapp_clone_logout_success"
      );

      toast.dismiss();
      toast.success(
        "Logged out successfully"
      );
    }
  }, []);

  const submit = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    if (
      !/^\S+@\S+\.\S+$/.test(
        email.trim()
      )
    ) {
      toast.error(
        "Enter a valid email address"
      );

      return;
    }

    try {
      setLoading(true);

      const { data } =
        await backendApi.post(
          "/auth/request-otp",
          {
            email,
          }
        );

      toast.success(data.message);

      navigate("/auth/otp", {
        state: {
          email: data.email,
        },
      });
    } catch (error) {
      toast.error(
        getErrorMessage(error)
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <form
        className="auth-card"
        onSubmit={submit}
      >
        <div className="auth-icon">
          <Mail />
        </div>

        <h1>
          Verify your email address
        </h1>

        <p>
          We will send an email message to
          verify your email address.
        </p>

        <label>
          Email address
        </label>

        <input
          value={email}
          onChange={(event) =>
            setEmail(event.target.value)
          }
          placeholder="name@example.com"
          autoFocus
        />

        <button
          className="primary-btn"
          disabled={loading}
        >
          {loading
            ? "SENDING..."
            : "NEXT"}
        </button>
      </form>
    </main>
  );
}