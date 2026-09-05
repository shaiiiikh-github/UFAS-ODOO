import React from 'react';
import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { RequireAuth } from '@/components/auth/RequireAuth';

interface AppShellProps {
  children: ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  return <RequireAuth roles={['ADMIN', 'ACCOUNTANT']}>
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 bg-[#f8f9fa]">
          <div className="page-container">{children}</div>
        </main>
      </div>
    </div>
  </RequireAuth>;
};
