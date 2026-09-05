import React from 'react';
import { Menu, Search, Bell } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Breadcrumbs } from './Breadcrumbs';
import { UserMenu } from './UserMenu';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onMenuClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language.startsWith('hi') ? 'hi' : 'en';
  const setLang = (code: 'en' | 'hi') => {
    i18n.changeLanguage(code);
    localStorage.setItem('ufas-language', code);
  };

  return (
    <header className="h-16 bg-white border-b border-[#e5e7eb] shadow-sm flex items-center px-4 md:px-6 gap-4 flex-shrink-0">
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="md:hidden p-2 rounded-md hover:bg-[#f3f5f7] transition-colors"
        aria-label="Toggle navigation"
      >
        <Menu className="h-5 w-5 text-[#6b7280]" />
      </button>

      {/* Breadcrumbs */}
      <div className="flex-1 min-w-0">
        <Breadcrumbs />
      </div>

      {/* Search */}
      <div className="hidden md:flex items-center relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9ca3af]" />
        <input
          type="text"
          placeholder={t('search')}
          className="pl-8 pr-3 py-2 bg-[#f3f4f6] border border-transparent rounded-md text-sm focus:border-[#1a2a3a] focus:bg-white focus:outline-none transition-all duration-200 w-48 focus:w-56"
        />
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {/* Language selector */}
        <div className="flex items-center gap-0.5 bg-[#f3f4f6] rounded-md p-0.5">
          {[
            { code: 'en', label: 'EN' },
            { code: 'hi', label: 'हि' },
            { code: 'gu', label: 'ગુ' },
          ].filter(({ code }) => code !== 'gu').map(({ code, label }) => (
            <button
              key={code}
              onClick={() => setLang(code as 'en' | 'hi')}
              className={cn(
                'px-2 py-0.5 text-xs font-medium rounded transition-colors',
                lang === code
                  ? 'bg-white shadow-sm text-[#1a2a3a]'
                  : 'text-[#6b7280] hover:bg-[#e5e9ee]'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="w-px h-6 bg-[#e5e7eb] mx-1" />

        {/* Notifications */}
        <button
          className="relative p-2 rounded-md hover:bg-[#f3f5f7] transition-colors"
          aria-label={t('notifications')}
        >
          <Bell className="h-4 w-4 text-[#6b7280]" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        {/* User menu */}
        <UserMenu />
      </div>
    </header>
  );
};
