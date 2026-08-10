import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Camera,
  RefreshCw,
  X,
} from "lucide-react";

import {
  Html5Qrcode,
  Html5QrcodeSupportedFormats,
} from "html5-qrcode";

import toast from "react-hot-toast";

type ChatQrScannerProps = {
  open: boolean;
  onClose: () => void;
  onScannedEmail: (
    email: string
  ) => Promise<boolean>;
};

const QR_READER_ID =
  "wa-chat-user-qr-reader";

const EMAIL_PATTERN =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeEmail = (
  value: unknown
): string | null => {
  const email = String(
    value ?? ""
  )
    .trim()
    .toLowerCase();

  return EMAIL_PATTERN.test(email)
    ? email
    : null;
};

const extractEmailFromQr = (
  rawValue: string
): string | null => {
  const raw = rawValue.trim();

  if (!raw) {
    return null;
  }

  const directEmail =
    normalizeEmail(raw);

  if (directEmail) {
    return directEmail;
  }

  try {
    const parsedJson = JSON.parse(
      raw
    ) as {
      email?: unknown;
    };

    const jsonEmail =
      normalizeEmail(
        parsedJson?.email
      );

    if (jsonEmail) {
      return jsonEmail;
    }
  } catch {
    // Not JSON. Continue with URL parsing.
  }

  try {
    const url = new URL(raw);

    const queryEmail =
      normalizeEmail(
        url.searchParams.get(
          "email"
        )
      );

    if (queryEmail) {
      return queryEmail;
    }

    if (
      url.protocol === "mailto:" &&
      url.pathname
    ) {
      return normalizeEmail(
        decodeURIComponent(
          url.pathname
        )
      );
    }
  } catch {
    // Not a URL.
  }

  const emailMatch = raw.match(
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
  );

  return normalizeEmail(
    emailMatch?.[0]
  );
};

const isLikelyMobile = () =>
  window.matchMedia(
    "(max-width: 768px)"
  ).matches ||
  /Android|iPhone|iPad|iPod/i.test(
    navigator.userAgent
  );

type ScannerCamera = {
  id: string;
  label: string;
};

const chooseCamera = (
  cameras: ScannerCamera[]
): ScannerCamera | undefined => {
  if (!cameras.length) {
    return undefined;
  }

  if (isLikelyMobile()) {
    const rearCamera =
      cameras.find((camera) =>
        /back|rear|environment/i.test(
          camera.label
        )
      );

    return (
      rearCamera ||
      cameras[cameras.length - 1]
    );
  }

  return cameras[0];
};

export default function ChatQrScanner({
  open,
  onClose,
  onScannedEmail,
}: ChatQrScannerProps) {
  const scannerRef =
    useRef<Html5Qrcode | null>(
      null
    );

  const processingRef =
    useRef(false);

  const [starting, setStarting] =
    useState(false);

  const [processing, setProcessing] =
    useState(false);

  const [cameraError, setCameraError] =
    useState("");

  const [retryKey, setRetryKey] =
    useState(0);

  const stopScanner =
    useCallback(async () => {
      const scanner =
        scannerRef.current;

      scannerRef.current = null;

      if (!scanner) {
        return;
      }

      try {
        if (scanner.isScanning) {
          await scanner.stop();
        }
      } catch {
        // Scanner may already be stopped.
      }

      try {
        scanner.clear();
      } catch {
        // Reader may already be cleared.
      }
    }, []);

  const closeScanner =
    useCallback(() => {
      processingRef.current = false;
      setProcessing(false);

      void stopScanner().finally(
        onClose
      );
    }, [onClose, stopScanner]);

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;

    const startScanner = async () => {
      setStarting(true);
      setCameraError("");
      processingRef.current = false;
      setProcessing(false);

      await stopScanner();

      try {
        if (
          !navigator.mediaDevices
            ?.getUserMedia
        ) {
          throw new Error(
            "Camera is not supported on this browser"
          );
        }

        const cameras =
          await Html5Qrcode.getCameras();

        if (cancelled) {
          return;
        }

        const selectedCamera =
          chooseCamera(cameras);

        if (!selectedCamera) {
          throw new Error(
            "No camera was found on this device"
          );
        }

        const scanner =
          new Html5Qrcode(
            QR_READER_ID,
            {
              formatsToSupport: [
                Html5QrcodeSupportedFormats.QR_CODE,
              ],
              verbose: false,
            }
          );

        scannerRef.current =
          scanner;

        await scanner.start(
          selectedCamera.id,
          {
            fps: 10,
            qrbox: (
              viewportWidth,
              viewportHeight
            ) => {
              const size = Math.max(
                190,
                Math.min(
                  290,
                  Math.floor(
                    Math.min(
                      viewportWidth,
                      viewportHeight
                    ) * 0.72
                  )
                )
              );

              return {
                width: size,
                height: size,
              };
            },
            aspectRatio: 1,
          },
          async (decodedText) => {
            if (
              processingRef.current
            ) {
              return;
            }

            const email =
              extractEmailFromQr(
                decodedText
              );

            if (!email) {
              processingRef.current =
                true;

              toast.error(
                "This QR code does not contain a valid user email"
              );

              window.setTimeout(
                () => {
                  processingRef.current =
                    false;
                },
                1300
              );

              return;
            }

            processingRef.current =
              true;
            setProcessing(true);

            try {
              const opened =
                await onScannedEmail(
                  email
                );

              if (opened) {
                await stopScanner();

                if (!cancelled) {
                  onClose();
                }

                return;
              }
            } catch (error) {
              console.error(
                "QR chat open failed:",
                error
              );
            }

            if (!cancelled) {
              setProcessing(false);

              window.setTimeout(
                () => {
                  processingRef.current =
                    false;
                },
                1400
              );
            }
          },
          () => {
            // Normal frame with no QR found.
          }
        );
      } catch (error) {
        if (cancelled) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : "Camera could not be started";

        setCameraError(
          /notallowed|permission|denied/i.test(
            message
          )
            ? "Camera permission is required to scan a QR code"
            : message
        );

        await stopScanner();
      } finally {
        if (!cancelled) {
          setStarting(false);
        }
      }
    };

    void startScanner();

    return () => {
      cancelled = true;
      processingRef.current = false;
      void stopScanner();
    };
  }, [
    open,
    onClose,
    onScannedEmail,
    retryKey,
    stopScanner,
  ]);

  if (!open) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Scan QR code"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 15010,
        padding: 18,
        display: "grid",
        placeItems: "center",
        background: "rgba(5, 10, 12, 0.8)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        style={{
          width: "min(520px, 100%)",
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
              Scan QR
            </strong>
            <span
              style={{
                display: "block",
                marginTop: 3,
                color: "var(--wa-muted, #8696a0)",
                fontSize: 12,
              }}
            >
              Scan another user's QR to open their chat
            </span>
          </div>

          <button
            type="button"
            onClick={closeScanner}
            aria-label="Close scanner"
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
            padding: 18,
          }}
        >
          <div
            style={{
              position: "relative",
              width: "100%",
              minHeight: 330,
              overflow: "hidden",
              borderRadius: 16,
              background: "#050b0d",
            }}
          >
            <div
              id={QR_READER_ID}
              style={{
                width: "100%",
                minHeight: 330,
              }}
            />

            {(starting || processing) && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "grid",
                  placeItems: "center",
                  background: "rgba(5,11,13,.48)",
                }}
              >
                <div
                  style={{
                    padding: "12px 16px",
                    borderRadius: 12,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    color: "#ffffff",
                    background: "rgba(17,27,33,.88)",
                  }}
                >
                  <RefreshCw size={18} />
                  <span>
                    {processing
                      ? "Opening chat..."
                      : "Starting camera..."}
                  </span>
                </div>
              </div>
            )}

            {cameraError && !starting && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  padding: 24,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 12,
                  textAlign: "center",
                  background: "#0b141a",
                }}
              >
                <Camera
                  size={38}
                  style={{
                    color: "#00a884",
                  }}
                />

                <strong>
                  Camera unavailable
                </strong>

                <span
                  style={{
                    maxWidth: 330,
                    color: "var(--wa-muted, #8696a0)",
                    fontSize: 13,
                    lineHeight: 1.5,
                  }}
                >
                  {cameraError}
                </span>

                <button
                  type="button"
                  onClick={() => {
                    setCameraError("");
                    setRetryKey(
                      (current) =>
                        current + 1
                    );
                  }}
                  style={{
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
                  Try camera again
                </button>
              </div>
            )}
          </div>

          <div
            style={{
              marginTop: 16,
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
              color: "var(--wa-muted, #8696a0)",
            }}
          >
            <Camera
              size={20}
              style={{
                flex: "0 0 auto",
                marginTop: 1,
                color: "#00a884",
              }}
            />

            <div>
              <strong
                style={{
                  display: "block",
                  color: "var(--wa-text, #e9edef)",
                  fontSize: 13,
                }}
              >
                Point the camera at the QR code
              </strong>
              <span
                style={{
                  display: "block",
                  marginTop: 4,
                  fontSize: 12,
                  lineHeight: 1.5,
                }}
              >
                On mobile the rear camera is preferred. After a valid QR is detected, the existing user search and open/create conversation flow opens the chat.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
