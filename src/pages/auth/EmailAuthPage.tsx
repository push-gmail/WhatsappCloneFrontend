import {
  useEffect,
  useState,
} from "react";

import {
  Mail,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import toast from "react-hot-toast";

import backendApi, {
  getErrorMessage,
} from "../../api/backendApi";

type RequestOtpResponse = {
  message: string;
  email: string;
  isExistingUser: boolean;
  purpose:
    | "signup"
    | "login";
};

export default function EmailAuthPage() {
  const [email, setEmail] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const navigate =
    useNavigate();

  useEffect(() => {
    const logoutSuccess =
      sessionStorage.getItem(
        "whatsapp_clone_logout_success"
      );

    if (
      logoutSuccess === "true"
    ) {
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

    if (loading) {
      return;
    }

    const normalizedEmail =
      email
        .trim()
        .toLowerCase();

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

      /*
       * OTP email send karne wali API.
       *
       * Existing user:
       * purpose = login
       *
       * New user:
       * purpose = signup
       */
      const { data } =
        await backendApi.post<RequestOtpResponse>(
          "/auth/request-otp",
          {
            email:
              normalizedEmail,
          }
        );

      if (!data?.email) {
        toast.error(
          "OTP could not be sent"
        );

        return;
      }

      toast.success(
        data.message ||
          "OTP sent successfully"
      );

      navigate(
        "/auth/otp",
        {
          state: {
            email:
              data.email,

            isExistingUser:
              data.isExistingUser,

            purpose:
              data.purpose,
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
          Enter your email to login
          or create a new account.
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
          disabled={loading}
        />

        <button
          type="submit"
          className="primary-btn"
          disabled={loading}
        >
          {loading
            ? "SENDING OTP..."
            : "NEXT"}
        </button>
      </form>
    </main>
  );
}