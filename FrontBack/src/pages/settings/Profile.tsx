import React from 'react';
import { PageHeader } from '@/components/common/PageHeader';

export const Profile: React.FC = () => {
  return (
    <>
      <PageHeader title="Profile" description="Manage your account profile information." />
      <div className="bg-white border border-[#e5e7eb] rounded-md p-6 text-center text-[#6b7280]">
        Profile page coming soon.
      </div>
    </>
  );
};