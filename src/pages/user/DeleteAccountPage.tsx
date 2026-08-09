import {
  ArrowLeft,
  AlertTriangle,
  LoaderCircle,
  MessageSquareText,
  X,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import toast from "react-hot-toast";

import backendApi, {
  getErrorMessage,
} from "../../api/backendApi";

import { useAuth } from "../../store/AuthContext";

import EmptyPane from "../../components/layout/EmptyPane";

const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;

type RequestDeleteOtpResponse = {
  message?: string;
  maskedPhoneNumber?: string;
  expiresInMinutes?: number;
};

export default function DeleteAccountPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [reason, setReason] = useState("");
  const [confirm, setConfirm] = useState(false);

  const [otpOpen, setOtpOpen] = useState(false);
  const [otp, setOtp] = useState("");
  const [maskedPhoneNumber, setMaskedPhoneNumber] =
    useState("");

  const [requestingOtp, setRequestingOtp] =
    useState(false);
  const [verifyingOtp, setVerifyingOtp] =
    useState(false);
  const [resendSeconds, setResendSeconds] =
    useState(0);

  const otpInputRef = useRef<HTMLInputElement | null>(
    null
  );

  useEffect(() => {
    if (!otpOpen) {
      setOtp("");
      setResendSeconds(0);
      return;
    }

    window.setTimeout(() => {
      otpInputRef.current?.focus();
    }, 0);
  }, [otpOpen]);

  useEffect(() => {
    if (!otpOpen || resendSeconds <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setResendSeconds((current) =>
        current > 0 ? current - 1 : 0
      );
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [otpOpen, resendSeconds]);

  const validateDeleteForm = () => {
    if (!reason.trim()) {
      toast.error("Please select a reason");
      return false;
    }

    if (!confirm) {
      toast.error("Confirm account deletion");
      return false;
    }

    return true;
  };

  const requestDeleteOtp = async () => {
    if (requestingOtp || verifyingOtp) {
      return;
    }

    if (!validateDeleteForm()) {
      return;
    }

    setRequestingOtp(true);

    try {
      const { data } =
        await backendApi.post<RequestDeleteOtpResponse>(
          "/user/account/delete-account/request-otp"
        );

      setMaskedPhoneNumber(
        data?.maskedPhoneNumber || "your registered number"
      );

      setOtp("");
      setOtpOpen(true);
      setResendSeconds(RESEND_SECONDS);

      toast.success(
        data?.message || "OTP sent to your phone number"
      );
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setRequestingOtp(false);
    }
  };

  const verifyOtpAndDelete = async () => {
    if (verifyingOtp || requestingOtp) {
      return;
    }

    const cleanOtp = otp.trim();

    if (!/^\d{6}$/.test(cleanOtp)) {
      toast.error("Enter the six-digit OTP");
      return;
    }

    setVerifyingOtp(true);

    try {
      await backendApi.delete(
        "/user/account/delete-account",
        {
          data: {
            reason: reason.trim(),
            otp: cleanOtp,
          },
        }
      );

      setOtpOpen(false);

      logout();
      toast.success("Account deleted");

      navigate("/auth/email", {
        replace: true,
      });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setVerifyingOtp(false);
    }
  };

  const closeOtpModal = () => {
    if (requestingOtp || verifyingOtp) {
      return;
    }

    setOtpOpen(false);
  };

  return (
    <div className="settings-layout">
      <section className="settings-panel delete-panel">
        <header className="subpage-header">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Back"
          >
            <ArrowLeft />
          </button>

          <h2>Delete my account</h2>
        </header>

        <AlertTriangle size={64} />

        <h2>
          Deleting your account is irreversible
        </h2>

        <p>
          Your account will be marked deleted and you
          will no longer be able to sign in with it.
        </p>

        <select
          value={reason}
          onChange={(event) =>
            setReason(event.target.value)
          }
          disabled={requestingOtp || verifyingOtp}
        >
          <option value="">Select a reason</option>
          <option>I no longer need this account</option>
          <option>I am changing my email</option>
          <option>Privacy concern</option>
          <option>Other</option>
        </select>

        <label className="confirm-check">
          <input
            type="checkbox"
            checked={confirm}
            onChange={(event) =>
              setConfirm(event.target.checked)
            }
            disabled={requestingOtp || verifyingOtp}
          />
          I understand this action cannot be reversed.
        </label>

        <button
          type="button"
          className="danger-btn"
          onClick={() => {
            void requestDeleteOtp();
          }}
          disabled={requestingOtp || verifyingOtp}
        >
          {requestingOtp ? (
            <>
              <LoaderCircle className="delete-account-spin" />
              SENDING OTP...
            </>
          ) : (
            "DELETE ACCOUNT"
          )}
        </button>
      </section>

      <EmptyPane />

      {otpOpen && (
        <div
          className="delete-account-otp-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              closeOtpModal();
            }
          }}
        >
          <section
            className="delete-account-otp-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-otp-title"
          >
            <header>
              <div className="delete-account-otp-icon">
                <MessageSquareText />
              </div>

              <button
                type="button"
                onClick={closeOtpModal}
                disabled={requestingOtp || verifyingOtp}
                aria-label="Close OTP verification"
              >
                <X />
              </button>
            </header>

            <h2 id="delete-account-otp-title">
              Verify your phone number
            </h2>

            <p>
              We sent a six-digit OTP to {" "}
              <strong>{maskedPhoneNumber}</strong>.
              Enter it below to permanently delete your
              account.
            </p>

            <input
              ref={otpInputRef}
              className="delete-account-otp-input"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={OTP_LENGTH}
              value={otp}
              onChange={(event) => {
                const digitsOnly = event.target.value
                  .replace(/\D/g, "")
                  .slice(0, OTP_LENGTH);

                setOtp(digitsOnly);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void verifyOtpAndDelete();
                }
              }}
              placeholder="------"
              disabled={verifyingOtp}
            />

            <div className="delete-account-otp-meta">
              <span>{otp.length}/6</span>

              <button
                type="button"
                onClick={() => {
                  void requestDeleteOtp();
                }}
                disabled={
                  requestingOtp ||
                  verifyingOtp ||
                  resendSeconds > 0
                }
              >
                {requestingOtp
                  ? "Sending..."
                  : resendSeconds > 0
                    ? `Resend in ${resendSeconds}s`
                    : "Resend OTP"}
              </button>
            </div>

            <div className="delete-account-otp-warning">
              <AlertTriangle />
              <span>
                After OTP verification your account will
                be deleted immediately. This action cannot
                be reversed.
              </span>
            </div>

            <footer>
              <button
                type="button"
                className="delete-account-otp-cancel"
                onClick={closeOtpModal}
                disabled={requestingOtp || verifyingOtp}
              >
                Cancel
              </button>

              <button
                type="button"
                className="delete-account-otp-delete"
                onClick={() => {
                  void verifyOtpAndDelete();
                }}
                disabled={
                  otp.length !== OTP_LENGTH ||
                  verifyingOtp ||
                  requestingOtp
                }
              >
                {verifyingOtp ? (
                  <>
                    <LoaderCircle className="delete-account-spin" />
                    VERIFYING...
                  </>
                ) : (
                  "VERIFY & DELETE"
                )}
              </button>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
}
