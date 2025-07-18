
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Globe, LogOut, Settings as SettingsIcon, Plus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const Sidebar = () => {
  const location = useLocation();

  const navigationItems = [
    { path: '/urls', label: 'Show URLs', icon: Globe },
    { path: '/settings', label: 'Settings', icon: SettingsIcon },
  ];

  const isActive = (path: string) => {
    return path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
  };

  return (
    <aside className="w-64 min-w-[220px] bg-gradient-to-b from-blue-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-slate-950 dark:to-blue-950 shadow-xl border-r border-slate-200 dark:border-slate-800 h-screen flex flex-col transition-all duration-300">
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
        <div>
          <h1 className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent tracking-tight">Crawley</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">URL Analysis Platform</p>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-5 py-3 rounded-xl font-semibold transition-all duration-200 group text-base ${
                isActive
                  ? 'bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 dark:from-blue-900 dark:to-purple-900 dark:text-white border border-blue-300 dark:border-blue-700 shadow-lg'
                  : 'text-slate-700 dark:text-slate-300 hover:text-blue-700 hover:bg-blue-50 dark:hover:text-white dark:hover:bg-blue-900/30'
              }`
            }
          >
            <item.icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
     
    </aside>
  );
};
