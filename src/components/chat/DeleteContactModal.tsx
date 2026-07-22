import {
  LoaderCircle,
  Trash2,
} from "lucide-react";

type DeleteContactModalProps = {
  contactName: string;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function DeleteContactModal({
  contactName,
  deleting,
  onCancel,
  onConfirm,
}: DeleteContactModalProps) {
  return (
    <div
      className="wa-contact-delete-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onCancel();
        }
      }}
    >
      <section
        className="wa-contact-delete-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-contact-title"
      >
        <div className="wa-contact-delete-icon">
          <Trash2 />
        </div>

        <div>
          <h2 id="delete-contact-title">
            Delete contact?
          </h2>

          <p>
            {contactName} will be
            removed from your saved
            contacts. The user account,
            conversation and messages
            will not be deleted.
          </p>

          <footer>
            <button
              type="button"
              className="wa-contact-modal-cancel"
              onClick={onCancel}
              disabled={deleting}
            >
              Cancel, keep contact
            </button>

            <button
              type="button"
              className="wa-contact-modal-delete"
              onClick={onConfirm}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <LoaderCircle className="wa-contact-spin" />
                  Deleting
                </>
              ) : (
                "Delete"
              )}
            </button>
          </footer>
        </div>
      </section>
    </div>
  );
}
