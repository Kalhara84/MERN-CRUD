import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Download, Users, ContactRound, UserCheck, Wallet, Plus, Sprout } from 'lucide-react';
import { api } from '../api';
import { longToday } from '../helpers';

const number = value => Number(value).toLocaleString('en-LK');
function Stat({ label, value, note, icon: Icon }) {
  return <div className="panel"><div className="flex items-center justify-between"><p className="text-sm text-stone-500">{label}</p><span className="rounded-lg bg-[#f0f5e9] p-2 text-green-800"><Icon size={18} /></span></div><p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p><p className="mt-2 text-xs text-stone-400">{note}</p></div>;
}
export default function DashboardPage({ user }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  async function load() {
    setLoading(true); setError('');
    try { setData(await api.get('/dashboard')); } catch (error) { setError(error.message); } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);
  if (loading) return <div role="status" className="py-20 text-center"><div className="spinner" /><p className="mt-4 text-sm text-stone-500">Loading your farm overview…</p></div>;
  if (error) return <div role="alert" className="panel"><p className="text-red-700">{error}</p><button onClick={load} className="button button-primary mt-4">Try again</button></div>;
  const { customers, users, categories, recent } = data;
  const months = Array.from({ length: 6 }, (_, index) => {
    const today = new Date();
    const date = new Date(today.getFullYear(), today.getMonth() - 5 + index, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    return { label: date.toLocaleDateString('en', { month: 'short' }), value: Number(data.months.find(item => item.month === key)?.value || 0) };
  });
  const max = Math.max(1, ...months.map(month => month.value));
  const activePercent = customers.total ? Math.round(customers.active / customers.total * 100) : 0;
  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs text-stone-500">{longToday()}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Farm overview<span className="text-green-600">.</span></h1><p className="mt-2 text-sm text-stone-500">A little clarity for a productive day.</p></div><button className="button button-light no-print" onClick={() => window.print()}><Download size={16} />Export report</button></div>
    <section className="relative overflow-hidden rounded-2xl bg-[#eaf2df] md:min-h-52">
      <img src="/images/farm.jpg" alt="Chickens at a poultry farm" className="absolute right-0 top-0 hidden h-full w-1/2 object-cover object-center md:block" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#eaf2df] via-[#eaf2df] to-transparent" />
      <div className="relative max-w-xl p-7 md:p-8"><span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-green-800"><Sprout size={15} />Care that keeps us growing</span><h2 className="mt-3 text-2xl font-semibold text-[#254d32]">Welcome back, {user.usdnam || user.usdusd}.</h2><p className="mt-2 max-w-sm text-sm leading-6 text-[#60705a]">Keep your customer relationships strong and your farm team connected.</p><Link to="/customers/add" className="button button-primary mt-5 no-print"><Plus size={16} />Add a customer</Link></div>
    </section>
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Stat label="Total customers" value={number(customers.total)} note="Your customer community" icon={ContactRound} />
      <Stat label="Active customers" value={number(customers.active)} note={`${activePercent}% of all customers`} icon={UserCheck} />
      <Stat label="Customer credit limits" value={number(customers.creditLimit)} note="LKR · Total assigned limits" icon={Wallet} />
      <Stat label={users ? 'Team members' : 'Reachable customers'} value={number(users ? users.total : customers.contactable)} note={users ? `${users.active} active · ${users.admins} administrators` : 'With a phone number or email'} icon={Users} />
    </section>
    <section className="grid gap-6 xl:grid-cols-3">
      <div className="panel xl:col-span-2"><div className="flex items-center justify-between"><div><h2 className="font-semibold">Customer growth</h2><p className="mt-1 text-xs text-stone-400">New customer records · Last 6 months</p></div><span className="rounded-lg bg-stone-50 px-3 py-2 text-xs text-stone-500">Monthly</span></div>
        <div className="relative mt-8"><div className="pointer-events-none absolute inset-x-0 bottom-7 top-0 flex flex-col justify-between">{[max, Math.round(max / 2), 0].map((value, index) => <div key={index} className="border-b border-dashed border-stone-200 text-[10px] text-stone-400">{value}</div>)}</div><div className="relative ml-8 flex h-52 items-end justify-around gap-3">{months.map((month, index) => <div key={month.label} className="flex h-full flex-1 flex-col items-center justify-end"><span className="mb-1 text-xs font-medium text-stone-500">{month.value}</span><div title={`${month.label}: ${month.value} new customers`} className={`w-full max-w-12 rounded-t-md ${index === 5 ? 'bg-[#487b44]' : 'bg-[#c9dfab]'}`} style={{ height: `${month.value / max * 75}%`, minHeight: month.value ? 4 : 0 }} /><span className="mt-3 text-xs text-stone-500">{month.label}</span></div>)}</div></div>
        {!months.some(month => month.value) && <p className="mt-4 text-xs text-stone-400">No customers were added in this period.</p>}
      </div>
      <div className="panel"><h2 className="font-semibold">Customer health</h2><p className="mt-1 text-xs text-stone-400">Active and inactive accounts</p><div role="img" aria-label={`${customers.active} active, ${customers.total - customers.active} inactive customers`} className="mx-auto my-6 flex h-40 w-40 items-center justify-center rounded-full" style={{ background: `conic-gradient(#628d4c ${activePercent}%, #e9efdf 0)` }}><div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white"><strong className="text-3xl font-semibold">{activePercent}%</strong><span className="text-xs text-stone-400">active</span></div></div><div className="flex justify-between text-xs"><span><span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#628d4c]" />Active <b>{number(customers.active)}</b></span><span><span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#e9efdf]" />Inactive <b>{number(customers.total - customers.active)}</b></span></div></div>
    </section>
    <section className="grid gap-6 xl:grid-cols-3">
      <div className="panel xl:col-span-2"><div className="mb-5 flex items-center justify-between"><h2 className="font-semibold">Recently added customers</h2><Link className="flex items-center gap-1 text-xs font-medium text-green-800 no-print" to="/customers">View all<ArrowUpRight size={15} /></Link></div><div className="overflow-x-auto"><table><thead><tr><th>Customer</th><th>Code</th><th>Phone</th><th>Status</th></tr></thead><tbody>{recent.map(customer => <tr key={customer.cussno}><td><Link className="font-medium hover:text-green-700" to={`/customers/${customer.cussno}/edit`}>{customer.cusnam}</Link></td><td className="text-stone-500">{customer.cuscus}</td><td className="text-stone-500">{customer.custelno || '—'}</td><td><span className={`rounded-full px-2.5 py-1 text-xs ${customer.cusactyn === 'N' ? 'bg-stone-100 text-stone-500' : 'bg-green-50 text-green-700'}`}>{customer.cusactyn === 'N' ? 'Inactive' : 'Active'}</span></td></tr>)}</tbody></table>{!recent.length && <p className="py-10 text-center text-sm text-stone-400">Your first customer starts here. Use “Add a customer” above.</p>}</div></div>
      <div className="panel"><h2 className="font-semibold">Report summary</h2><p className="mb-6 mt-1 text-xs text-stone-400">Customers by category</p><div className="space-y-5">{categories.map(category => <div key={category.label}><div className="mb-2 flex justify-between text-xs"><span className="text-stone-500">{category.label}</span><strong>{number(category.value)}</strong></div><div className="h-2 overflow-hidden rounded-full bg-stone-100"><div className="h-full rounded-full bg-[#a6c784]" style={{ width: `${customers.total ? category.value / customers.total * 100 : 0}%` }} /></div></div>)}</div>{!categories.length && <p className="text-sm text-stone-400">No customer categories to report yet.</p>}<div className="mt-6 border-t border-stone-100 pt-4 text-xs leading-6 text-stone-500">{number(customers.contactable)} customers have contact details.<br />Credit limits show assigned allowances, not sales or outstanding balances.</div></div>
    </section>
  </div>;
}
