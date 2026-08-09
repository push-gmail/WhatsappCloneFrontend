import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  ImagePlus,
  LoaderCircle,
  Upload,
  Video,
  X,
} from "lucide-react";

import toast from "react-hot-toast";

import backendApi, {
  getErrorMessage,
} from "../../api/backendApi";

type StatusUploadModalProps = {
  open: boolean;
  onClose: () => void;
  onUploaded: () => void;
};

type SelectedMediaType =
  | "image"
  | "video"
  | null;

const IMAGE_MAX_SIZE =
  10 * 1024 * 1024;

const FILE_MAX_SIZE =
  50 * 1024 * 1024;

const IMAGE_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "webp",
  "gif",
  "heic",
  "heif",
]);

const VIDEO_EXTENSIONS = new Set([
  "mp4",
  "webm",
  "mov",
  "m4v",
  "mkv",
  "3gp",
]);

const getFileExtension = (
  fileName: string
) => {
  const normalizedName =
    String(fileName || "")
      .trim()
      .toLowerCase();

  const lastDotIndex =
    normalizedName.lastIndexOf(".");

  if (
    lastDotIndex < 0 ||
    lastDotIndex ===
      normalizedName.length - 1
  ) {
    return "";
  }

  return normalizedName.slice(
    lastDotIndex + 1
  );
};

const getSelectedMediaType = (
  selectedFile: File
): SelectedMediaType => {
  const mimeType = String(
    selectedFile.type || ""
  ).toLowerCase();

  if (mimeType.startsWith("image/")) {
    return "image";
  }

  if (mimeType.startsWith("video/")) {
    return "video";
  }

  /*
   * Some mobile browsers/file providers can return
   * an empty MIME type. Extension fallback keeps
   * gallery selection working without changing the
   * existing upload flow.
   */
  const extension = getFileExtension(
    selectedFile.name
  );

  if (IMAGE_EXTENSIONS.has(extension)) {
    return "image";
  }

  if (VIDEO_EXTENSIONS.has(extension)) {
    return "video";
  }

  return null;
};

export default function StatusUploadModal({
  open,
  onClose,
  onUploaded,
}: StatusUploadModalProps) {
  const fileInputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const [file, setFile] =
    useState<File | null>(null);

  const [
    selectedMediaType,
    setSelectedMediaType,
  ] = useState<SelectedMediaType>(
    null
  );

  const [
    previewUrl,
    setPreviewUrl,
  ] = useState("");

  const [caption, setCaption] =
    useState("");

  const [uploading, setUploading] =
    useState(false);

  useEffect(() => {
    if (!file) {
      setPreviewUrl("");
      return;
    }

    const nextPreviewUrl =
      URL.createObjectURL(file);

    setPreviewUrl(
      nextPreviewUrl
    );

    return () => {
      URL.revokeObjectURL(
        nextPreviewUrl
      );
    };
  }, [file]);

  useEffect(() => {
    if (!open) {
      setFile(null);
      setSelectedMediaType(null);
      setCaption("");
      setUploading(false);
    }
  }, [open]);

  if (!open) {
    return null;
  }

  const selectFile = (
    selectedFile?: File
  ) => {
    if (!selectedFile) {
      return;
    }

    const mediaType =
      getSelectedMediaType(
        selectedFile
      );

    if (!mediaType) {
      toast.error(
        "Only image and video files are allowed"
      );

      return;
    }

    if (
      selectedFile.size >
      FILE_MAX_SIZE
    ) {
      toast.error(
        "Status file cannot exceed 50 MB"
      );

      return;
    }

    if (
      mediaType === "image" &&
      selectedFile.size >
        IMAGE_MAX_SIZE
    ) {
      toast.error(
        "Status image cannot exceed 10 MB"
      );

      return;
    }

    setSelectedMediaType(mediaType);
    setFile(selectedFile);
  };

  const uploadStatus = async () => {
    if (!file || uploading) {
      return;
    }

    const cleanCaption =
      caption.trim();

    if (
      cleanCaption.length > 700
    ) {
      toast.error(
        "Caption cannot exceed 700 characters"
      );

      return;
    }

    setUploading(true);

    try {
      const formData =
        new FormData();

      formData.append(
        "media",
        file
      );

      formData.append(
        "caption",
        cleanCaption
      );

      /*
       * Do not manually set Content-Type here.
       * Browser/Axios will add the correct
       * multipart boundary automatically on both
       * desktop and mobile browsers.
       */
      await backendApi.post(
        "/user/status/upload",
        formData
      );

      toast.success(
        "Status uploaded successfully"
      );

      onUploaded();
      onClose();
    } catch (error) {
      toast.error(
        getErrorMessage(error)
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className="wa-status-modal-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (
          event.target ===
            event.currentTarget &&
          !uploading
        ) {
          onClose();
        }
      }}
    >
      <section
        className="wa-status-upload-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Add status"
      >
        <header>
          <h2>Add status</h2>

          <button
            type="button"
            onClick={onClose}
            disabled={uploading}
            aria-label="Close"
          >
            <X />
          </button>
        </header>

        {!file ? (
          <button
            type="button"
            className="wa-status-file-picker"
            onClick={() =>
              fileInputRef.current?.click()
            }
          >
            <span>
              <ImagePlus />
              <Video />
            </span>

            <strong>
              Select photo or video
            </strong>

            <small>
              Images up to 10 MB and videos up to 50 MB
            </small>
          </button>
        ) : (
          <div className="wa-status-upload-preview">
            {selectedMediaType ===
            "video" ? (
              <video
                src={previewUrl}
                controls
                playsInline
                preload="metadata"
              />
            ) : (
              <img
                src={previewUrl}
                alt="Status preview"
              />
            )}

            <button
              type="button"
              className="wa-status-change-file"
              onClick={() =>
                fileInputRef.current?.click()
              }
              disabled={uploading}
            >
              Change media
            </button>
          </div>
        )}

        <input
          ref={fileInputRef}
          hidden
          type="file"
          accept="image/*,video/*,.heic,.heif,.mov,.m4v,.3gp"
          onChange={(event) => {
            selectFile(
              event.target.files?.[0]
            );

            event.currentTarget.value =
              "";
          }}
        />

        <div className="wa-status-caption-field">
          <textarea
            value={caption}
            maxLength={700}
            placeholder="Add a caption..."
            onChange={(event) =>
              setCaption(
                event.target.value
              )
            }
          />

          <small>
            {caption.length}/700
          </small>
        </div>

        <footer>
          <button
            type="button"
            className="wa-status-cancel-button"
            onClick={onClose}
            disabled={uploading}
          >
            Cancel
          </button>

          <button
            type="button"
            className="wa-status-upload-button"
            onClick={() => {
              void uploadStatus();
            }}
            disabled={
              !file || uploading
            }
          >
            {uploading ? (
              <LoaderCircle className="wa-status-spin" />
            ) : (
              <Upload />
            )}

            {uploading
              ? "Uploading..."
              : "Upload status"}
          </button>
        </footer>
      </section>
    </div>
  );
}
