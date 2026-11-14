
import { useEffect, useRef, useState } from 'react';
import { api } from '../api/client';
import Modal from './Modal';

export default function AddLocationModal({ show, onClose, onAdded }) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const codeRef = useRef(null);

  // Every time the pop-up opens: start with empty boxes, cursor in the code box
  useEffect(() => {
    if (!show) return;
    setCode(''); setName(''); setErrors({}); setBusy(false);
    setTimeout(() => codeRef.current && codeRef.current.focus(), 50);
  }, [show]);

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!code.trim()) errs.exlocloc = 'Location Code is required';
    if (!name.trim()) errs.exlocnam = 'Location Name is required';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setBusy(true);
    try {
      const d = await api.post('/expire/locations', { exlocloc: code.trim(), exlocnam: name.trim() });
      onAdded({ id: d.id, label: d.label });
      onClose();
    } catch (err) {
      // Server messages, e.g. "This Location Code already exists"
      const serverErrors = (err.data && err.data.errors) || {};
      setErrors(Object.keys(serverErrors).length ? serverErrors : { __all__: err.message || 'Could not save. Please try again.' });
      setBusy(false);
    }
  };

  return (
    <Modal
      show={show}
      title="Add Location"
      onClose={onClose}
      as="form"
      onSubmit={submit}
      footer={(
        <>
          <button type="button" className="btn btn-light" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={busy}>Save</button>
        </>
      )}
    >
      <div className="mb-3">
        <label className="form-label" htmlFor="locCode">Location Code <span className="text-danger">*</span></label>
        <input ref={codeRef} id="locCode" type="text" maxLength={40} autoComplete="off" value={code}
          className={`form-control ${errors.exlocloc ? 'is-invalid' : ''}`}
          onChange={(e) => { setCode(e.target.value); setErrors((x) => ({ ...x, exlocloc: undefined })); }} />
        <div className="invalid-feedback">{errors.exlocloc}</div>
      </div>
      <div>
        <label className="form-label" htmlFor="locName">Location Name <span className="text-danger">*</span></label>
        <input id="locName" type="text" maxLength={40} autoComplete="off" value={name}
          className={`form-control ${errors.exlocnam ? 'is-invalid' : ''}`}
          onChange={(e) => { setName(e.target.value); setErrors((x) => ({ ...x, exlocnam: undefined })); }} />
        <div className="invalid-feedback">{errors.exlocnam}</div>
      </div>
      {errors.__all__ && <div className="text-danger small mt-2">{errors.__all__}</div>}
    </Modal>
  );
}
