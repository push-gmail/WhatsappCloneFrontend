import {
  useState,
} from "react";

import {
  Eye,
  EyeOff,
  LockKeyhole,
} from "lucide-react";

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

type PasswordLocationState = {
  email?: string;
  isExistingUser?: boolean;
};

type PasswordAuthResponse = {
  message: string;

  isNewUser: boolean;
  requiresTwoStep: boolean;

  userId: string;
  profileId?: string;
  accountId?: string;
  sessionId?: string;
};

export default function PasswordAuthPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const { login } = useAuth();

  const locationState =
    location.state as
      | PasswordLocationState
      | null;

  const email =
    String(
      locationState?.email || ""
    ).trim();

  const isExistingUser =
    locationState
      ?.isExistingUser === true;

  const [password, setPassword] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [loading, setLoading] =
    useState(false);

  const submit = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    if (!password) {
      toast.error(
        "Enter your password"
      );

      return;
    }

    if (password.length < 6) {
      toast.error(
        "Password must be at least 6 characters"
      );

      return;
    }

    if (
      !isExistingUser &&
      !confirmPassword
    ) {
      toast.error(
        "Confirm your password"
      );

      return;
    }

    if (
      !isExistingUser &&
      password !== confirmPassword
    ) {
      toast.error(
        "Password and confirm password do not match"
      );

      return;
    }

    try {
      setLoading(true);

      const endpoint =
        isExistingUser
          ? "/auth/login-password"
          : "/auth/signup-password";

      const requestBody =
        isExistingUser
          ? {
              email,
              password,
            }
          : {
              email,
              password,
              confirmPassword,
            };

      const { data } =
        await backendApi.post<PasswordAuthResponse>(
          endpoint,
          requestBody
        );

      /*
       * Existing two-step flow same rahega.
       * Session PIN verify hone ke baad create hogi.
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
            className="primary-btn"
            onClick={() =>
              navigate("/auth/email")
            }
          >
            GO BACK
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
        <div className="auth-icon">
          <LockKeyhole />
        </div>

        <h1>
          {isExistingUser
            ? "Enter your password"
            : "Create your password"}
        </h1>

        <p>
          {isExistingUser
            ? "Enter the password for"
            : "Create a password for"}{" "}
          <strong>{email}</strong>
        </p>

        <label>
          Password
        </label>

        <div
          style={{
            position: "relative",
          }}
        >
          <input
            type={
              showPassword
                ? "text"
                : "password"
            }
            value={password}
            onChange={(event) =>
              setPassword(
                event.target.value
              )
            }
            placeholder="Enter password"
            autoComplete={
              isExistingUser
                ? "current-password"
                : "new-password"
            }
            autoFocus
            style={{
              width: "100%",
              paddingRight: "48px",
            }}
          />

          <button
            type="button"
            aria-label={
              showPassword
                ? "Hide password"
                : "Show password"
            }
            onClick={() =>
              setShowPassword(
                (current) => !current
              )
            }
            style={{
              position: "absolute",
              top: "50%",
              right: "12px",
              transform:
                "translateY(-50%)",
              border: 0,
              background: "transparent",
              padding: 0,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {showPassword ? (
              <EyeOff size={20} />
            ) : (
              <Eye size={20} />
            )}
          </button>
        </div>

        {!isExistingUser && (
          <>
            <label>
              Confirm password
            </label>

            <div
              style={{
                position: "relative",
              }}
            >
              <input
                type={
                  showConfirmPassword
                    ? "text"
                    : "password"
                }
                value={
                  confirmPassword
                }
                onChange={(event) =>
                  setConfirmPassword(
                    event.target.value
                  )
                }
                placeholder="Confirm password"
                autoComplete="new-password"
                style={{
                  width: "100%",
                  paddingRight: "48px",
                }}
              />

              <button
                type="button"
                aria-label={
                  showConfirmPassword
                    ? "Hide confirm password"
                    : "Show confirm password"
                }
                onClick={() =>
                  setShowConfirmPassword(
                    (current) =>
                      !current
                  )
                }
                style={{
                  position: "absolute",
                  top: "50%",
                  right: "12px",
                  transform:
                    "translateY(-50%)",
                  border: 0,
                  background:
                    "transparent",
                  padding: 0,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent:
                    "center",
                }}
              >
                {showConfirmPassword ? (
                  <EyeOff size={20} />
                ) : (
                  <Eye size={20} />
                )}
              </button>
            </div>
          </>
        )}

        <button
          className="primary-btn"
          disabled={loading}
        >
          {loading
            ? isExistingUser
              ? "LOGGING IN..."
              : "CREATING..."
            : isExistingUser
              ? "LOGIN"
              : "CREATE ACCOUNT"}
        </button>

        <button
          type="button"
          onClick={() =>
            navigate("/auth/email")
          }
          disabled={loading}
          style={{
            border: 0,
            background: "transparent",
            cursor: "pointer",
          }}
        >
          Change email
        </button>
      </form>
    </main>
  );
}