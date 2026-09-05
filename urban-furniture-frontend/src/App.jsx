import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Contacts from './pages/Contacts';
import Products from './pages/Products';
import ChartOfAccounts from './pages/ChartOfAccounts';
import Journals from './pages/Journals';
import Transactions from './pages/Transactions';
import JournalEntries from './pages/JournalEntries';
import Analytics from './pages/Analytics';
import Budgets from './pages/Budgets';
import Reports from './pages/Reports';
import Users from './pages/Users';
import MyInvoices from './pages/MyInvoices';

const STAFF = ['Admin', 'Accountant'];

function Home() {
  const { isContact } = useAuth();
  return isContact ? <MyInvoices /> : <Dashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Home />} />
            <Route path="transactions" element={<ProtectedRoute roles={STAFF}><Transactions /></ProtectedRoute>} />
            <Route path="contacts" element={<ProtectedRoute roles={STAFF}><Contacts /></ProtectedRoute>} />
            <Route path="products" element={<ProtectedRoute roles={STAFF}><Products /></ProtectedRoute>} />
            <Route path="chart-of-accounts" element={<ProtectedRoute roles={STAFF}><ChartOfAccounts /></ProtectedRoute>} />
            <Route path="journals" element={<ProtectedRoute roles={STAFF}><Journals /></ProtectedRoute>} />
            <Route path="journal-entries" element={<ProtectedRoute roles={STAFF}><JournalEntries /></ProtectedRoute>} />
            <Route path="analytics" element={<ProtectedRoute roles={STAFF}><Analytics /></ProtectedRoute>} />
            <Route path="budgets" element={<ProtectedRoute roles={STAFF}><Budgets /></ProtectedRoute>} />
            <Route path="reports" element={<ProtectedRoute roles={STAFF}><Reports /></ProtectedRoute>} />
            <Route path="users" element={<ProtectedRoute roles={['Admin']}><Users /></ProtectedRoute>} />
            <Route path="my-invoices" element={<ProtectedRoute roles={['Contact']}><MyInvoices /></ProtectedRoute>} />
          </Route>
        </Routes>
      </ToastProvider>
    </AuthProvider>
  );
}