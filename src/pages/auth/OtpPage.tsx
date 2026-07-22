import {
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import toast from "react-hot-toast";

import backendApi, {
  getErrorMessage,
} from "../../api/backendApi";

import {
  useAuth,
} from "../../store/AuthContext";

type OtpLocationState = {
  email?: string;
};

type VerifyOtpResponse = {
  message: string;
  isNewUser: boolean;
  requiresTwoStep: boolean;
  userId: string;
  profileId?: string;
  accountId?: string;
  sessionId?: string;
};

export default function OtpPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const { login } = useAuth();

  const email =
    (
      location.state as
        | OtpLocationState
        | null
    )?.email || "";

  const [otp, setOtp] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const submit = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    if (!/^\d{6}$/.test(otp)) {
      toast.error(
        "Enter valid six-digit OTP"
      );

      return;
    }

    try {
      setLoading(true);

      const { data } =
        await backendApi.post<VerifyOtpResponse>(
          "/auth/verify-otp",
          {
            email,
            otp,
          }
        );

      /*
       * Two-step verification ON hai.
       * Session PIN verification ke baad create hogi.
       */
      if (data.requiresTwoStep) {
        toast.success(data.message);

        navigate(
          "/auth/two-step",
          {
            state: {
              email,
            },
          }
        );

        return;
      }

      if (
        !data.userId ||
        !data.sessionId
      ) {
        toast.error(
          "Login session was not created"
        );

        return;
      }

      login(
        data.userId,
        email,
        data.sessionId
      );

      toast.success(data.message);

      navigate(
        "/user/chats",
        {
          replace: true,
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

  if (!email) {
    return (
      <main className="auth-page">
        <div className="auth-card">
          <p>
            Email missing. Start again.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate("/auth/email")
            }
          >
            Go back
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <form
        className="auth-card"
        onSubmit={submit}
      >
        <h1>
          Enter verification code
        </h1>

        <p>
          We sent a six-digit OTP to{" "}
          <strong>{email}</strong>
        </p>

        <input
          className="otp-input"
          maxLength={6}
          inputMode="numeric"
          value={otp}
          onChange={(event) =>
            setOtp(
              event.target.value.replace(
                /\D/g,
                ""
              )
            )
          }
          autoFocus
        />

        <button
          className="primary-btn"
          disabled={loading}
        >
          {loading
            ? "VERIFYING..."
            : "VERIFY"}
        </button>
      </form>
    </main>
  );
}