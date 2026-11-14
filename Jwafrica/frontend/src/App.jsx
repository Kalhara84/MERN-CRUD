import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UserListPage from './pages/UserListPage';
import UserFormPage from './pages/UserFormPage';
import ExpireListPage from './pages/ExpireListPage';
import ExpireFormPage from './pages/ExpireFormPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* Logged-in users */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardPage />} />

          {/* Expire Module */}
          <Route path="/expire" element={<ExpireListPage />} />
          <Route path="/expire/add" element={<ExpireFormPage />} />
          <Route path="/expire/:id/edit" element={<ExpireFormPage />} />

          {/* Users: admin only */}
          <Route element={<ProtectedRoute admin />}>
            <Route path="/users" element={<UserListPage />} />
            <Route path="/users/add" element={<UserFormPage />} />
            <Route path="/users/:id/edit" element={<UserFormPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
