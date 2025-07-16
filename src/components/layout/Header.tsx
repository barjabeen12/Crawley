
import React from 'react';
import { User, Menu } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export const Header = ({ onToggleSidebar }: HeaderProps) => {
  const { user } = useAuth();
  console.log(user)
  return (
    <header className="bg-gradient-to-r from-slate-900/95 to-slate-800/95 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <div>
              <h2 className="text-lg font-semibold text-white">
                Welcome back!
              </h2>
              <p className="text-sm text-slate-400">
                Monitor and analyze your website's performance
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm bg-white/5 rounded-lg px-3 py-2 border border-white/10">
              <User className="w-4 h-4 text-blue-400" />
             
              <span className="text-slate-400">{user?.email}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
