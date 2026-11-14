import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { usePageTitle } from '../components/Layout';
import { APP_NAME } from '../config';
import { longToday } from '../utils/format';

function Kpi({ label, value, icon, ok }) {
  return (
    <div className="col-6 col-xl-3">
      <div className={`jw-card jw-kpi ${ok ? 'ok' : ''}`}>
        <div className="d-flex justify-content-between">
          <div><div className="jw-kpi-lbl">{label}</div><div className="jw-kpi-val">{value}</div></div>
          <div className="jw-kpi-ico"><i className={`bi ${icon}`} /></div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  usePageTitle('Dashboard');
  const { user } = useAuth();
  const [stats, setStats] = useState(null);

  // User count cards are for admin users only
  useEffect(() => {
    if (!user.is_admin) return;
    api.get('/dashboard').then((d) => setStats(d.stats)).catch(() => {});
  }, [user.is_admin]);

  return (
    <>
      {/* Welcome banner */}
      <section className="jw-hero mb-4">
        <img className="jw-hero-art d-none d-md-block" src="/assets/img/hero-art.svg" alt="" />
        <h2>Welcome, {user.usdnam || user.usdusd}</h2>
        <p>You are signed in to {APP_NAME}.</p>
        <span className="jw-chip"><i className="bi bi-calendar3" /> {longToday()}</span>
        {user.usdemail && <span className="jw-chip"><i className="bi bi-envelope" /> {user.usdemail}</span>}
      </section>

      {user.is_admin && stats && (
        <div className="row g-3">
          <Kpi label="Total users" value={stats.total} icon="bi-people" />
          <Kpi label="Active users" value={stats.active} icon="bi-person-check" ok />
          <Kpi label="Administrators" value={stats.admins} icon="bi-shield-lock" />
        </div>
      )}
    </>
  );
}
