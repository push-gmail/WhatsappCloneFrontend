import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Camera,
  QrCode,
  RefreshCw,
  X,
} from "lucide-react";

import {
  Html5Qrcode,
  Html5QrcodeSupportedFormats,
} from "html5-qrcode";

import { QRCodeSVG } from "qrcode.react";

import toast from "react-hot-toast";

import backendApi, {
  getErrorMessage,
} from "../../api/backendApi";

type LinkedDevicesScannerProps = {
  open: boolean;
  onClose: () => void;
  onScannedEmail: (
    email: string
  ) => Promise<boolean>;
};

const QR_READER_ID =
  "wa-linked-devices-qr-reader";

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
      url.protocol ===
        "mailto:" &&
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

export default function LinkedDevicesScanner({
  open,
  onClose,
  onScannedEmail,
}: LinkedDevicesScannerProps) {
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

  const [fallbackEmail, setFallbackEmail] =
    useState("");

  const [fallbackLoading, setFallbackLoading] =
    useState(false);

  const [fallbackError, setFallbackError] =
    useState("");

  const [retryKey, setRetryKey] =
    useState(0);

  const loadFallbackQr =
    useCallback(async () => {
      setFallbackLoading(true);
      setFallbackError("");

      try {
        const { data } = await backendApi.get(
          "/user/chat/my-qr"
        );

        const email = normalizeEmail(
          data?.qr?.email || data?.qr?.value
        );

        if (!email) {
          throw new Error(
            "Your account email could not be loaded"
          );
        }

        setFallbackEmail(email);
      } catch (error) {
        setFallbackEmail("");
        setFallbackError(
          error instanceof Error
            ? error.message
            : getErrorMessage(error)
        );
      } finally {
        setFallbackLoading(false);
      }
    }, []);

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
        // Scanner may already be stopped during unmount/close.
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

    const startScanner =
      async () => {
        setStarting(true);
        setCameraError("");
        setFallbackEmail("");
        setFallbackError("");
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

          const readableMessage =
            /notallowed|permission|denied/i.test(
              message
            )
              ? "Camera permission is required to scan a QR code"
              : message;

          setCameraError(
            readableMessage
          );

          await stopScanner();
          await loadFallbackQr();
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
    stopScanner,
    loadFallbackQr,
    retryKey,
  ]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="wa-linked-devices-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Linked devices QR scanner"
    >
      <div className="wa-linked-devices-modal">
        <header className="wa-linked-devices-header">
          <div>
            <strong>
              Linked devices
            </strong>
            <span>
              Scan a user QR code to open their chat
            </span>
          </div>

          <button
            type="button"
            onClick={closeScanner}
            aria-label="Close scanner"
          >
            <X />
          </button>
        </header>

        <div className="wa-linked-devices-body">
          <div className="wa-linked-devices-camera-shell">
            <div
              id={QR_READER_ID}
              className="wa-linked-devices-reader"
            />

            <div
              className="wa-linked-devices-scan-frame"
              aria-hidden="true"
            >
              <i />
              <i />
              <i />
              <i />
              <span />
            </div>

            {(starting || processing) && (
              <div className="wa-linked-devices-camera-state">
                <RefreshCw className="wa-linked-devices-spin" />
                <span>
                  {processing
                    ? "Opening chat..."
                    : "Starting camera..."}
                </span>
              </div>
            )}

            {cameraError && (
              <div className="wa-linked-devices-camera-error">
                {fallbackLoading ? (
                  <>
                    <RefreshCw className="wa-linked-devices-spin" />
                    <strong>
                      Camera unavailable
                    </strong>
                    <span>
                      Generating your QR code...
                    </span>
                  </>
                ) : fallbackEmail ? (
                  <>
                    <QrCode />
                    <strong>
                      Your QR code
                    </strong>
                    <span>
                      Camera is unavailable on this device. Ask another user to scan this QR code from their device.
                    </span>

                    <div
                      style={{
                        width: "min(230px, 76vw)",
                        aspectRatio: "1",
                        display: "grid",
                        placeItems: "center",
                        padding: 14,
                        borderRadius: 14,
                        background: "#ffffff",
                        boxShadow: "0 8px 28px rgba(0,0,0,0.18)",
                      }}
                    >
                      <QRCodeSVG
                        value={fallbackEmail}
                        size={210}
                        level="M"
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "block",
                        }}
                      />
                    </div>

                    <span
                      style={{
                        maxWidth: 320,
                        overflowWrap: "anywhere",
                        opacity: 0.78,
                      }}
                    >
                      {fallbackEmail}
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        setFallbackEmail("");
                        setFallbackError("");
                        setCameraError("");
                        setRetryKey(
                          (current) =>
                            current + 1
                        );
                      }}
                    >
                      Try camera again
                    </button>
                  </>
                ) : (
                  <>
                    <Camera />
                    <strong>
                      Camera unavailable
                    </strong>
                    <span>
                      {fallbackError || cameraError}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        void loadFallbackQr();
                      }}
                    >
                      Generate my QR
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFallbackError("");
                        setCameraError("");
                        setRetryKey(
                          (current) =>
                            current + 1
                        );
                      }}
                    >
                      Try camera again
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="wa-linked-devices-help">
            <Camera />
            <div>
              <strong>
                Point the camera at the QR code
              </strong>
              <span>
                On mobile the rear camera is preferred. On desktop the available webcam is used. If the camera cannot start, your own QR code is generated automatically.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
