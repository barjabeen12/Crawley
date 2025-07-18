import React, { useState, useRef, useEffect } from 'react';
import { User, Menu, ChevronDown, LogOut, BadgeCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export const Header = ({ onToggleSidebar }: HeaderProps) => {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  // Placeholder for subscription plan (replace with real data)
  const subscription = user?.subscription || 'Pro';
  const firstName = user?.firstName || 'Web';
  const lastName = user?.lastName || 'Explorer';

  return (
    <header className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-slate-950 dark:to-blue-950 shadow-lg border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 w-full h-[77px]">
      <div className="px-4 sm:px-8 py-1 sm:py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-600 dark:text-blue-300 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-lg sm:text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Welcome back, {firstName}!
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-tight">
                Monitor and analyze your website's performance
              </p>
            </div>
          </div>
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 shadow hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-700 dark:text-slate-200 font-semibold transition-all"
            >
              <User className="w-5 h-5 text-blue-600 dark:text-blue-300 shrink-0" />
              <span className="truncate max-w-[120px] sm:max-w-[180px]">{firstName} {lastName}</span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 p-4 animate-fade-in">
                <div className="flex items-center gap-3 mb-3">
                  <User className="w-8 h-8 text-blue-600 dark:text-blue-300" />
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-100 text-lg">
                      {firstName} {lastName}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <BadgeCheck className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-semibold text-purple-600 dark:text-purple-300">
                    {subscription} Plan
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold shadow hover:from-red-600 hover:to-pink-600 transition-all mt-2"
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
