import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bird, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { api, saveToken } from '../api';

export default function LoginPage({ onLogin }) {
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const data = await api.post('/auth/login', { usdusd: code, usdpwd: password, remember });
      saveToken(data.token, remember); onLogin(data.user);
      navigate(location.state?.from || '/', { replace: true });
    } catch (error) { setError(error.message); } finally { setBusy(false); }
  }
  return <div className="grid min-h-screen lg:grid-cols-2">
    <section className="relative flex min-h-72 flex-col justify-between overflow-hidden bg-[#254d32] p-9 text-white lg:p-14">
      <img src="/images/farm.jpg" alt="Chickens at a poultry farm" className="absolute inset-0 h-full w-full object-cover opacity-45" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#163923] via-transparent to-[#163923]/30" />
      <div className="relative flex items-center gap-3 text-2xl font-bold"><Bird size={32} />SRTBF.</div>
      <div className="relative my-12 max-w-lg"><p className="mb-5 text-xs uppercase tracking-[.25em] text-green-200">Rooted in care. Growing with purpose.</p><h1 className="text-4xl font-semibold leading-tight lg:text-6xl">A healthier farm.<br />A brighter tomorrow.</h1><p className="mt-6 max-w-sm leading-7 text-green-100">Your customers, your people, and a clearer picture of your farm. All in one place.</p></div>
      <p className="relative text-xs text-green-100">SRTBF Chicken Farm · Farm management</p>
    </section>
    <section className="flex items-center justify-center bg-[#fbfcfa] px-7 py-14"><div className="w-full max-w-sm"><span className="mb-7 inline-flex rounded-2xl bg-green-100 p-4 text-green-800"><Bird size={28} /></span><p className="text-xs uppercase tracking-[.2em] text-green-700">Welcome to the farm</p><h2 className="mt-3 text-3xl font-semibold tracking-tight">Good to see you again.</h2><p className="mb-9 mt-3 text-sm text-stone-500">Sign in to your SRTBF workspace.</p>
      <form onSubmit={submit} className="space-y-5">
        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div><label htmlFor="code" className="mb-2 block text-sm font-medium">User code</label><input id="code" className="field" autoComplete="username" required value={code} onChange={e => setCode(e.target.value)} placeholder="Enter your user code" /></div>
        <div><label htmlFor="password" className="mb-2 block text-sm font-medium">Password</label><div className="relative"><input id="password" className="field pr-12" type={visible ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" /><button type="button" className="absolute right-3 top-3 text-stone-400" aria-label={visible ? 'Hide password' : 'Show password'} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></div>
        <label className="flex items-center gap-2 text-sm text-stone-500"><input type="checkbox" className="accent-green-700" checked={remember} onChange={e => setRemember(e.target.checked)} />Keep me signed in</label>
        <button disabled={busy} className="button button-primary w-full py-3.5">{busy ? 'Signing in…' : 'Sign in to workspace'}<ArrowRight size={18} /></button>
      </form><p className="mt-8 text-center text-xs text-stone-400">Need access? Contact your farm administrator.</p>
    </div></section>
  </div>;
}
