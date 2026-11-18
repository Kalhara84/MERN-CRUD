import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Bird, LayoutDashboard, Users, ContactRound, LogOut, Menu, X, Sprout } from 'lucide-react';

export default function Layout({ user, message, onCloseMessage, onLogout, children }) {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const title = pathname.startsWith('/customers') ? 'Customers' : pathname.startsWith('/users') ? 'Users' : 'Dashboard';
  useEffect(() => { setOpen(false); document.title = `${title} | SRTBF`; }, [pathname, title]);
  const links = [{ to: '/', label: 'Overview', icon: LayoutDashboard }, { to: '/customers', label: 'Customers', icon: ContactRound }];
  if (user.is_admin) links.push({ to: '/users', label: 'Users', icon: Users });
  return <div className="min-h-screen lg:pl-64">
    {open && <button aria-label="Close navigation" onClick={() => setOpen(false)} className="fixed inset-0 z-30 bg-black/30 lg:hidden" />}
    <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-stone-200 bg-white px-5 py-8 transition-transform ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
      <NavLink to="/" className="flex items-center gap-3 px-3"><span className="rounded-xl bg-[#e6f1dd] p-2.5 text-green-800"><Bird size={27} /></span><span><strong className="text-2xl tracking-tight">SRTBF<span className="text-green-600">.</span></strong><span className="block text-[10px] uppercase tracking-[.22em] text-stone-500">Chicken farm</span></span></NavLink>
      <p className="mb-4 mt-12 px-4 text-[10px] font-semibold uppercase tracking-[.2em] text-stone-400">Workspace</p>
      <nav className="space-y-2">{links.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium ${isActive ? 'bg-[#eaf3e2] text-green-900' : 'text-stone-500 hover:bg-stone-50'}`}><Icon size={19} />{label}</NavLink>)}</nav>
      <div className="mt-auto rounded-2xl bg-[#f1f6eb] p-5"><Sprout className="mb-3 text-green-700" size={25} /><p className="text-sm font-semibold">Growing together.</p><p className="mt-2 text-xs leading-5 text-stone-500">Good relationships are at the heart of a healthy farm.</p></div>
      <button onClick={onLogout} className="mt-6 flex items-center gap-3 px-4 py-3 text-sm text-stone-500 hover:text-green-800"><LogOut size={18} />Sign out</button>
    </aside>
    <header className="flex h-20 items-center gap-4 border-b border-stone-200 bg-white px-5 md:px-9">
      <button aria-label="Toggle navigation" aria-expanded={open} className="lg:hidden" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
      <div className="text-sm text-stone-400">Workspace <span className="mx-3">/</span><span className="font-medium text-stone-700">{title}</span></div>
      <div className="ml-auto flex items-center gap-3"><div className="hidden text-right sm:block"><p className="text-sm font-semibold">{user.usdnam || user.usdusd}</p><p className="text-xs text-stone-500">{user.is_admin ? 'Administrator' : 'Farm team'}</p></div><span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e6efdc] text-sm font-bold text-green-800">{user.usdusd.slice(0, 1).toUpperCase()}</span></div>
    </header>
    <main className="mx-auto max-w-[1500px] p-5 md:p-9">
      {message && <div role="alert" className={`mb-5 flex items-center justify-between rounded-xl p-4 text-sm ${message.type === 'danger' ? 'bg-red-50 text-red-700' : 'bg-green-100 text-green-900'}`}>{message.text}<button aria-label="Dismiss message" onClick={onCloseMessage}><X size={18} /></button></div>}
      {children}
    </main>
    <footer className="px-9 pb-6 text-xs text-stone-400">SRTBF Chicken Farm · Cultivating care, every day.</footer>
  </div>;
}
