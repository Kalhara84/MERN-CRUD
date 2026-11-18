import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
export default function Modal({ title, onClose, onSubmit, footer, children }) {
  const dialog = useRef(null);
  useEffect(() => { const element = dialog.current; element.showModal(); return () => element.close(); }, []);
  return <dialog ref={dialog} onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === dialog.current) onClose(); }} className="m-auto max-h-[85vh] w-[calc(100%-2rem)] max-w-xl overflow-auto rounded-2xl border-0 p-0 shadow-xl backdrop:bg-black/35">
    <form onSubmit={onSubmit || (event => event.preventDefault())}><div className="flex items-center justify-between border-b border-stone-100 p-5"><h2 className="font-semibold">{title}</h2><button type="button" aria-label="Close dialog" onClick={onClose}><X size={20} /></button></div><div className="p-5">{children}</div><div className="flex justify-end gap-2 border-t border-stone-100 p-5">{footer}</div></form>
  </dialog>;
}
export function ConfirmDelete({ title, busy, onCancel, onConfirm, children }) {
  return <Modal title={title} onClose={() => { if (!busy) onCancel(); }} footer={<><button type="button" disabled={busy} className="button button-light" onClick={onCancel}>Cancel</button><button type="button" className="button button-danger" disabled={busy} onClick={onConfirm}>{busy ? 'Deleting…' : 'Delete'}</button></>}>{children}</Modal>;
}
