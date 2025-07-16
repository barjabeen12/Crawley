
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Globe, LogOut, } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const Sidebar = () => {
  const { logout } = useAuth();
  const location = useLocation();

  const navigationItems = [
    { path: '/', label: 'Dashboard', icon: Home },
   
  ];

  const isActive = (path: string) => {
    return path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
  };

  return (
    <div className="w-64 bg-gradient-to-b from-slate-900/95 to-slate-800/95 backdrop-blur-xl border-r border-white/10 h-screen flex flex-col">

      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Crawley
            </h1>
            <p className="text-xs text-slate-400">URL Analysis Platform</p>
          </div>
        </div>
      </div>

    
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
              isActive(item.path)
                ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border border-blue-500/30'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <item.icon className={`w-5 h-5 ${isActive(item.path) ? 'text-blue-400' : 'text-slate-400 group-hover:text-blue-400'}`} />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

 
      <div className="p-4 border-t border-white/10">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-slate-300 hover:text-white hover:bg-red-500/10 hover:border-red-500/30 border border-transparent transition-all duration-200 group"
        >
          <LogOut className="w-5 h-5 text-slate-400 group-hover:text-red-400" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};
