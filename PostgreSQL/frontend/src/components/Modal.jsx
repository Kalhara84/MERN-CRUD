export default function Modal({ title, onClose, onSubmit, footer, children }) {
  return (
    <>
      {/* Clicking the dark area outside the box closes it */}
      <div className="modal fade show d-block" tabIndex="-1" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="modal-dialog modal-dialog-centered">
          <form className="modal-content" onSubmit={onSubmit} noValidate>
            <div className="modal-header">
              <h5 className="modal-title">{title}</h5>
              <button type="button" className="btn-close" aria-label="Close" onClick={onClose} />
            </div>
            <div className="modal-body">{children}</div>
            <div className="modal-footer">{footer}</div>
          </form>
        </div>
      </div>
      <div className="modal-backdrop fade show" />
    </>
  );
}

export function ConfirmDelete({ title, busy, onCancel, onConfirm, children }) {
  return (
    <Modal
      title={title}
      onClose={onCancel}
      footer={(
        <>
          <button type="button" className="btn btn-light" onClick={onCancel}>Cancel</button>
          <button type="button" className="btn btn-danger" onClick={onConfirm} disabled={busy}>Delete</button>
        </>
      )}
    >
      {children}
    </Modal>
  );
}
