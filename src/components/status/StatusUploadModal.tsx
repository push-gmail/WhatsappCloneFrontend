import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Camera,
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

const IMAGE_MAX_SIZE =
  10 * 1024 * 1024;

const FILE_MAX_SIZE =
  50 * 1024 * 1024;

export default function StatusUploadModal({
  open,
  onClose,
  onUploaded,
}: StatusUploadModalProps) {
  const fileInputRef =
    useRef<HTMLInputElement>(null);

  const [file, setFile] =
    useState<File | null>(null);

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

    const isImage =
      selectedFile.type.startsWith(
        "image/"
      );

    const isVideo =
      selectedFile.type.startsWith(
        "video/"
      );

    if (!isImage && !isVideo) {
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
      isImage &&
      selectedFile.size >
        IMAGE_MAX_SIZE
    ) {
      toast.error(
        "Status image cannot exceed 10 MB"
      );

      return;
    }

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

      await backendApi.post(
        "/user/status/upload",
        formData,
        {
          headers: {
            "Content-Type":
              "multipart/form-data",
          },
        }
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
        aria-label="Upload status"
      >
        <header>
          <div>
            <Camera />
            <h2>Add status</h2>
          </div>

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
            {file.type.startsWith(
              "video/"
            ) ? (
              <video
                src={previewUrl}
                controls
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
          accept="image/*,video/*"
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