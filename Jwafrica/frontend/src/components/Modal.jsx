import { useEffect } from 'react';

export default function Modal({ show, title, onClose, children, footer, as: Tag = 'div', onSubmit }) {
  // Lock the page scroll while the pop-up is open + Esc key closes it
  useEffect(() => {
    if (!show) return undefined;
    document.body.classList.add('modal-open');
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.classList.remove('modal-open');
      document.removeEventListener('keydown', onKey);
    };
  }, [show, onClose]);

  if (!show) return null;

  const contentProps = Tag === 'form' ? { onSubmit, noValidate: true } : {};

  return (
    <>
      <div className="modal fade show d-block" tabIndex="-1" role="dialog" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="modal-dialog modal-dialog-centered">
          <Tag className="modal-content" {...contentProps}>
            <div className="modal-header">
              <h5 className="modal-title">{title}</h5>
              <button type="button" className="btn-close" aria-label="Close" onClick={onClose} />
            </div>
            <div className="modal-body">{children}</div>
            <div className="modal-footer">{footer}</div>
          </Tag>
        </div>
      </div>
      <div className="modal-backdrop fade show" />
    </>
  );
}
