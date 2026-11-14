import Modal from './Modal';

export default function ConfirmDelete({ show, title, busy, onCancel, onConfirm, children }) {
  return (
    <Modal
      show={show}
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
