import { IconTrash } from './AdminIcons';

/**
 * Modal de confirmation generique pour les suppressions.
 *
 * Props :
 *  - isOpen      : boolean
 *  - title       : string  (defaut : "Etes-vous sur de vouloir supprimer cet element ?")
 *  - message     : string|node optionnel (texte secondaire)
 *  - onConfirm   : () => Promise|void
 *  - onCancel    : () => void
 *  - busy        : boolean (loading state)
 *  - confirmLabel: string (defaut : "Confirmer")
 *  - cancelLabel : string (defaut : "Annuler")
 */
export default function ConfirmDeleteModal({
  isOpen,
  title = 'Etes-vous sur de vouloir supprimer cet element ?',
  message,
  onConfirm,
  onCancel,
  busy = false,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
}) {
  if (!isOpen) return null;

  return (
    <div
      className="admin-modal-backdrop"
      role="dialog"
      aria-modal="true"
      onClick={busy ? undefined : onCancel}
    >
      <div
        className="admin-modal admin-confirm-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="admin-confirm-head">
          <span className="admin-confirm-icon" aria-hidden="true">
            <IconTrash />
          </span>
          <h3>{title}</h3>
        </header>

        {message && <p className="admin-confirm-message">{message}</p>}

        <footer className="admin-form-footer" style={{ padding: '14px 22px' }}>
          <button
            type="button"
            className="admin-secondary-btn"
            onClick={onCancel}
            disabled={busy}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="admin-primary-btn admin-primary-danger"
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? 'Suppression...' : confirmLabel}
          </button>
        </footer>
      </div>
    </div>
  );
}
