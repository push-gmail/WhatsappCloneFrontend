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

type CheckEmailResponse = {
  message: string;
  email: string;
  isExistingUser: boolean;
};

export default function EmailAuthPage() {
  const [email, setEmail] =
    useState("");

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

    const normalizedEmail =
      email.trim().toLowerCase();

    if (
      !/^\S+@\S+\.\S+$/.test(
        normalizedEmail
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
        await backendApi.post<CheckEmailResponse>(
          "/auth/check-email",
          {
            email: normalizedEmail,
          }
        );

      navigate(
        "/auth/otp",
        {
          state: {
            email: data.email,
            isExistingUser:
              data.isExistingUser,
          },
        }
      );
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
          Enter your email address
        </h1>

        <p>
          Enter your email to login or
          create a new account.
        </p>

        <label>
          Email address
        </label>

        <input
          type="email"
          value={email}
          onChange={(event) =>
            setEmail(
              event.target.value
            )
          }
          placeholder="name@example.com"
          autoComplete="email"
          autoFocus
        />

        <button
          className="primary-btn"
          disabled={loading}
        >
          {loading
            ? "CHECKING..."
            : "NEXT"}
        </button>
      </form>
    </main>
  );
}