import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to: '/', label: 'Dashboard', roles: ['Admin', 'Accountant'] },
  { to: '/transactions', label: 'Transactions', roles: ['Admin', 'Accountant'] },
  { to: '/contacts', label: 'Contacts', roles: ['Admin', 'Accountant'] },
  { to: '/products', label: 'Products', roles: ['Admin', 'Accountant'] },
  { to: '/chart-of-accounts', label: 'Chart of Accounts', roles: ['Admin', 'Accountant'] },
  { to: '/journals', label: 'Journals', roles: ['Admin', 'Accountant'] },
  { to: '/journal-entries', label: 'Journal Entries', roles: ['Admin', 'Accountant'] },
  { to: '/analytics', label: 'Analytic Accounts', roles: ['Admin', 'Accountant'] },
  { to: '/budgets', label: 'Budgets', roles: ['Admin', 'Accountant'] },
  { to: '/reports', label: 'Reports', roles: ['Admin', 'Accountant'] },
  { to: '/users', label: 'Users', roles: ['Admin'] },
  { to: '/my-invoices', label: 'My Invoices', roles: ['Contact'] },
];

export default function Layout() {
  const { user, signOut } = useAuth();

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">🪑 Urban Furniture <span>Accounting</span></div>
        <div className="topbar-right">
          <span className="role-badge">{user?.role}</span>
          <span className="user-name">{user?.name}</span>
          <button className="btn btn-ghost" onClick={signOut}>Log out</button>
        </div>
      </header>
      <div className="app-body">
        <nav className="sidebar">
          {NAV.filter((item) => item.roles.includes(user?.role)).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}