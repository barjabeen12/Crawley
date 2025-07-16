import React from 'react';
import { User, Menu } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export const Header = ({ onToggleSidebar }: HeaderProps) => {
  const { user } = useAuth();

  return (
    <header className="bg-gradient-to-r from-slate-100 to-slate-200 backdrop-blur-xl border-b border-slate-300 sticky top-0 z-40 w-full h-[77px]">
      <div className="px-4 sm:px-6 py-1 sm:py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          
        
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-300/40 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <h2 className="text-base sm:text-lg font-semibold text-slate-800">
                Welcome back!
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 leading-tight">
                Monitor and analyze your website's performance
              </p>
            </div>
          </div>

         
          <div className="flex items-center gap-2 sm:gap-3 text-sm bg-white/70 rounded-lg px-3 py-2 border border-slate-300 w-full sm:w-auto justify-between sm:justify-end">
            <User className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="text-slate-700 truncate max-w-[160px] sm:max-w-none">{user?.email}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
