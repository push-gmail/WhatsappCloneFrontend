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

type TwoStepLocationState = {
  email?: string;
};

type VerifyTwoStepResponse = {
  message: string;
  requiresTwoStep: boolean;
  userId: string;
  profileId?: string;
  sessionId: string;
};

export default function TwoStepPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const { login } = useAuth();

  const email =
    (
      location.state as
        | TwoStepLocationState
        | null
    )?.email || "";

  const [pin, setPin] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const submit = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    if (!email) {
      toast.error(
        "Email is missing. Start login again."
      );

      navigate(
        "/auth/email",
        {
          replace: true,
        }
      );

      return;
    }

    if (!/^\d{6}$/.test(pin)) {
      toast.error(
        "Enter valid six-digit PIN"
      );

      return;
    }

    try {
      setLoading(true);

      const { data } =
        await backendApi.post<VerifyTwoStepResponse>(
          "/auth/verify-two-step-pin",
          {
            email,
            pin,
          }
        );

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
            Email missing. Start login
            again.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate(
                "/auth/email",
                {
                  replace: true,
                }
              )
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
          Two-step verification
        </h1>

        <p>
          Enter your six-digit PIN.
        </p>

        <input
          className="otp-input"
          maxLength={6}
          inputMode="numeric"
          value={pin}
          onChange={(event) =>
            setPin(
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
            : "CONTINUE"}
        </button>
      </form>
    </main>
  );
}