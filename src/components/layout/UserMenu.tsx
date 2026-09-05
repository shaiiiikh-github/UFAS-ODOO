import React, { useState, useRef, useEffect } from 'react';
import { User, Settings, LogOut, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export const UserMenu: React.FC = () => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-[#f3f5f7] transition-colors"
        aria-label="User menu"
      >
        <div className="w-8 h-8 rounded-full bg-[#1a2a3a] text-white flex items-center justify-center text-xs font-semibold">
          AU
        </div>
        <div className="hidden sm:block text-left">
          <div className="text-sm font-medium text-[#1a2332] leading-tight">Admin User</div>
          <div className="text-[0.6rem] text-[#6b7280] leading-tight">Administrator</div>
        </div>
        <ChevronDown className="h-4 w-4 text-[#6b7280] hidden sm:block" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white border border-[#e5e7eb] rounded-lg shadow-lg py-1 z-50">
          <div className="px-4 py-2.5 border-b border-[#e5e7eb]">
            <div className="text-sm font-medium text-[#1a2332]">Admin User</div>
            <div className="text-xs text-[#6b7280]">Administrator</div>
          </div>
          <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#1a2332] hover:bg-[#f3f5f7] transition-colors">
            <User className="h-4 w-4" /> Profile
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#1a2332] hover:bg-[#f3f5f7] transition-colors">
            <Settings className="h-4 w-4" /> Settings
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-700 hover:bg-red-50 transition-colors">
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      )}
    </div>
  );
};