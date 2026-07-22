import {
  useEffect,
  useState,
} from "react";

import {
  ArrowLeft,
  Check,
  Info,
  LoaderCircle,
  Mail,
  Pencil,
  Phone,
  Trash2,
  X,
} from "lucide-react";

import toast from "react-hot-toast";

import backendApi, {
  getErrorMessage,
} from "../../api/backendApi";

import Avatar from "../common/Avatar";
import DeleteContactModal from "./DeleteContactModal";

import type {
  ContactDetails,
  ContactDetailsResponse,
  PublicUser,
  SavedContact,
} from "../../types";

type ContactInfoPanelProps = {
  open: boolean;
  contactUser: PublicUser | null;
  onClose: () => void;
  onSaved: (
    contact: SavedContact
  ) => void;
  onDeleted: (
    contactUserId: string
  ) => void;
};

const toSavedContact = (
  contact: ContactDetails
): SavedContact => ({
  contactId:
    contact.contactId || "",
  ownerUserId:
    contact.ownerUserId,
  contactUserId:
    contact.contactUserId,
  contactProfileId:
    contact.contactProfileId,
  customName:
    contact.customName,
  displayName:
    contact.displayName,
  profilePhoto:
    contact.profile.profilePhoto,
  about:
    contact.profile.about,
  email:
    contact.user.email,
  phoneNumber:
    contact.profile.phoneNumber ||
    contact.user.phoneNumber,
  createdAt:
    contact.createdAt || undefined,
  updatedAt:
    contact.updatedAt || undefined,
});

export default function ContactInfoPanel({
  open,
  contactUser,
  onClose,
  onSaved,
  onDeleted,
}: ContactInfoPanelProps) {
  const [contact, setContact] =
    useState<ContactDetails | null>(
      null
    );

  const [loading, setLoading] =
    useState(false);

  const [editing, setEditing] =
    useState(false);

  const [customName, setCustomName] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const [showDelete, setShowDelete] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

  useEffect(() => {
    if (
      !open ||
      !contactUser?.userId
    ) {
      setContact(null);
      setEditing(false);
      setShowDelete(false);
      return;
    }

    let cancelled = false;

    const loadContact = async () => {
      setLoading(true);

      try {
        const { data } =
          await backendApi.get<ContactDetailsResponse>(
            `/user/contacts/${contactUser.userId}`,
            {
              params: contactUser.profileId
                ? {
                    profileId:
                      contactUser.profileId,
                  }
                : undefined,
            }
          );

        if (cancelled) {
          return;
        }

        setContact(
          data.contact
        );

        setCustomName(
          data.contact.customName ||
            data.contact.profile.name ||
            data.contact.user.userName ||
            data.contact.user.email
        );
      } catch (error) {
        if (!cancelled) {
          toast.error(
            getErrorMessage(error)
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadContact();

    return () => {
      cancelled = true;
    };
  }, [
    open,
    contactUser?.userId,
    contactUser?.profileId,
  ]);

  if (!open || !contactUser) {
    return null;
  }

  const fallbackName =
    contactUser.name ||
    contactUser.email;

  const displayName =
    contact?.displayName ||
    fallbackName;

  const profilePhoto =
    contact?.profile.profilePhoto ||
    contactUser.profilePhoto;

  const about =
    contact?.profile.about ||
    contactUser.about ||
    "Hey there! I am using WhatsAppClone.";

  const email =
    contact?.user.email ||
    contactUser.email;

  const phoneNumber =
    contact?.profile.phoneNumber ||
    contact?.user.phoneNumber ||
    contactUser.phoneNumber ||
    "Not added";

  const startEditing = () => {
    setCustomName(
      contact?.customName ||
        contact?.profile.name ||
        contact?.user.userName ||
        contact?.user.email ||
        fallbackName
    );

    setEditing(true);
  };

  const cancelEditing = () => {
    setCustomName(
      contact?.customName ||
        contact?.profile.name ||
        contact?.user.userName ||
        contact?.user.email ||
        fallbackName
    );

    setEditing(false);
  };

  const saveContact = async () => {
    const cleanName =
      customName.trim();

    if (!cleanName) {
      toast.error(
        "Contact name is required"
      );
      return;
    }

    setSaving(true);

    try {
      const { data } =
        await backendApi.patch<ContactDetailsResponse>(
          `/user/contacts/${contactUser.userId}`,
          {
            customName: cleanName,
            profileId:
              contact?.contactProfileId ||
              contactUser.profileId,
          }
        );

      setContact(data.contact);
      setEditing(false);
      onSaved(
        toSavedContact(
          data.contact
        )
      );

      toast.success(
        "Contact updated"
      );
    } catch (error) {
      toast.error(
        getErrorMessage(error)
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteContact = async () => {
    setDeleting(true);

    try {
      await backendApi.delete(
        `/user/contacts/${contactUser.userId}`,
        {
          params: {
            profileId:
              contact?.contactProfileId ||
              contactUser.profileId,
          },
        }
      );

      onDeleted(
        contactUser.userId
      );

      toast.success(
        "Contact deleted"
      );

      setShowDelete(false);
      onClose();
    } catch (error) {
      toast.error(
        getErrorMessage(error)
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <aside className="wa-contact-info-panel">
        <header className="wa-contact-info-header">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close contact info"
          >
            <ArrowLeft />
          </button>

          <h2>
            Contact info
          </h2>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="wa-contact-desktop-close"
          >
            <X />
          </button>
        </header>

        {loading ? (
          <div className="wa-contact-loading">
            <LoaderCircle className="wa-contact-spin" />
            Loading contact...
          </div>
        ) : (
          <div className="wa-contact-info-content">
            <section className="wa-contact-hero">
              <Avatar
                src={profilePhoto}
                name={displayName}
                size={188}
              />

              {editing ? (
                <div className="wa-contact-name-editor">
                  <input
                    value={customName}
                    onChange={(event) =>
                      setCustomName(
                        event.target.value
                      )
                    }
                    maxLength={100}
                    autoFocus
                    aria-label="Contact name"
                  />

                  <button
                    type="button"
                    onClick={saveContact}
                    disabled={saving}
                    aria-label="Save contact"
                  >
                    {saving ? (
                      <LoaderCircle className="wa-contact-spin" />
                    ) : (
                      <Check />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={cancelEditing}
                    disabled={saving}
                    aria-label="Cancel editing"
                  >
                    <X />
                  </button>
                </div>
              ) : (
                <div className="wa-contact-name-row">
                  <div>
                    <h3>
                      {displayName}
                    </h3>

                    <span>
                      {phoneNumber}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={startEditing}
                    aria-label="Edit contact"
                  >
                    <Pencil />
                  </button>
                </div>
              )}
            </section>

            <section className="wa-contact-detail-card">
              <div>
                <Info />

                <span>
                  <small>
                    About
                  </small>

                  <strong>
                    {about}
                  </strong>
                </span>
              </div>

              <div>
                <Mail />

                <span>
                  <small>
                    Email
                  </small>

                  <strong>
                    {email}
                  </strong>
                </span>
              </div>

              <div>
                <Phone />

                <span>
                  <small>
                    Phone
                  </small>

                  <strong>
                    {phoneNumber}
                  </strong>
                </span>
              </div>
            </section>

            <button
              type="button"
              className="wa-contact-delete-row"
              onClick={() =>
                setShowDelete(true)
              }
            >
              <Trash2 />

              <span>
                Delete contact
              </span>
            </button>
          </div>
        )}
      </aside>

      {showDelete && (
        <DeleteContactModal
          contactName={displayName}
          deleting={deleting}
          onCancel={() =>
            setShowDelete(false)
          }
          onConfirm={deleteContact}
        />
      )}
    </>
  );
}
