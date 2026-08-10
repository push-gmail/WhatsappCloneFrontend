import {
  useEffect,
  useState,
} from "react";

import {
  RefreshCw,
  X,
} from "lucide-react";

import { QRCodeSVG } from "qrcode.react";

import backendApi, {
  getErrorMessage,
} from "../../api/backendApi";

type LinkedDevicesQrProps = {
  open: boolean;
  onClose: () => void;
};

const normalizeEmail = (
  value: unknown
) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

export default function LinkedDevicesQr({
  open,
  onClose,
}: LinkedDevicesQrProps) {
  const [email, setEmail] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;

    const loadQr = async () => {
      setLoading(true);
      setError("");
      setEmail("");

      try {
        const { data } =
          await backendApi.get(
            "/user/chat/my-qr"
          );

        if (cancelled) {
          return;
        }

        const qrEmail = normalizeEmail(
          data?.qr?.email ||
            data?.qr?.value
        );

        if (!qrEmail) {
          throw new Error(
            "Your QR code could not be generated"
          );
        }

        setEmail(qrEmail);
      } catch (loadError) {
        if (!cancelled) {
          setError(
            getErrorMessage(loadError)
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadQr();

    return () => {
      cancelled = true;
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Linked devices QR code"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 15000,
        padding: 18,
        display: "grid",
        placeItems: "center",
        background: "rgba(5, 10, 12, 0.78)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        style={{
          width: "min(430px, 100%)",
          maxHeight: "calc(100dvh - 36px)",
          overflow: "auto",
          border: "1px solid var(--wa-border, rgba(255,255,255,.08))",
          borderRadius: 16,
          color: "var(--wa-text, #e9edef)",
          background: "var(--wa-bg, #111b21)",
          boxShadow: "0 26px 80px rgba(0,0,0,.48)",
        }}
      >
        <header
          style={{
            minHeight: 64,
            padding: "12px 12px 12px 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            borderBottom: "1px solid var(--wa-border, rgba(255,255,255,.08))",
            background: "var(--wa-secondary-bg, #202c33)",
          }}
        >
          <div>
            <strong
              style={{
                display: "block",
                fontSize: 17,
              }}
            >
              Linked devices
            </strong>
            <span
              style={{
                display: "block",
                marginTop: 3,
                color: "var(--wa-muted, #8696a0)",
                fontSize: 12,
              }}
            >
              Your QR code
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close QR code"
            style={{
              width: 40,
              height: 40,
              border: 0,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              color: "var(--wa-muted, #8696a0)",
              background: "transparent",
              cursor: "pointer",
            }}
          >
            <X />
          </button>
        </header>

        <div
          style={{
            padding: "30px 22px 28px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 74,
              height: 74,
              marginBottom: 14,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              color: "#ffffff",
              background: "#00a884",
              fontSize: 28,
              fontWeight: 700,
              textTransform: "uppercase",
            }}
          >
            {email
              ? email.charAt(0)
              : "W"}
          </div>

          <strong
            style={{
              fontSize: 18,
              fontWeight: 600,
            }}
          >
            {email || "Your account"}
          </strong>

          <span
            style={{
              maxWidth: 330,
              marginTop: 7,
              color: "var(--wa-muted, #8696a0)",
              fontSize: 13,
              lineHeight: 1.5,
            }}
          >
            Ask another user to open Scan QR in the app and scan this code to start a chat with you.
          </span>

          <div
            style={{
              width: "min(270px, 78vw)",
              aspectRatio: "1",
              marginTop: 26,
              padding: 16,
              borderRadius: 12,
              display: "grid",
              placeItems: "center",
              background: "#ffffff",
              boxShadow: "0 12px 36px rgba(0,0,0,.24)",
            }}
          >
            {loading ? (
              <RefreshCw
                size={34}
                style={{
                  color: "#00a884",
                }}
              />
            ) : email ? (
              <QRCodeSVG
                value={email}
                size={238}
                level="M"
                style={{
                  width: "100%",
                  height: "100%",
                  display: "block",
                }}
              />
            ) : (
              <span
                style={{
                  padding: 14,
                  color: "#667781",
                  fontSize: 13,
                  lineHeight: 1.45,
                }}
              >
                {error ||
                  "QR code could not be loaded"}
              </span>
            )}
          </div>

          {error && !loading && (
            <button
              type="button"
              onClick={() => {
                setError("");
                setEmail("");

                void backendApi
                  .get("/user/chat/my-qr")
                  .then(({ data }) => {
                    const qrEmail =
                      normalizeEmail(
                        data?.qr?.email ||
                          data?.qr?.value
                      );

                    if (qrEmail) {
                      setEmail(qrEmail);
                    } else {
                      setError(
                        "Your QR code could not be generated"
                      );
                    }
                  })
                  .catch((retryError) => {
                    setError(
                      getErrorMessage(
                        retryError
                      )
                    );
                  });
              }}
              style={{
                marginTop: 18,
                minHeight: 42,
                padding: "0 18px",
                border: 0,
                borderRadius: 22,
                color: "#ffffff",
                background: "#00a884",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
          )}

          <span
            style={{
              maxWidth: 330,
              marginTop: 22,
              color: "var(--wa-muted, #8696a0)",
              fontSize: 12,
              lineHeight: 1.5,
            }}
          >
            This QR is used only to identify your account and open or create a conversation inside this WhatsAppClone.
          </span>
        </div>
      </div>
    </div>
  );
}
