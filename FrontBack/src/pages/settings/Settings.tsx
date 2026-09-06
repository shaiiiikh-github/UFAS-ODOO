import React from 'react';
import { PageHeader } from '@/components/common/PageHeader';

export const Settings: React.FC = () => {
  return (
    <>
      <PageHeader title="Settings" description="Configure your application settings." />
      <div className="bg-white border border-[#e5e7eb] rounded-md p-6 text-center text-[#6b7280]">
        Settings page coming soon.
      </div>
    </>
  );
};