
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
  <div className="w-64 bg-gradient-to-b from-slate-100 to-slate-200 backdrop-blur-xl border-r border-slate-300 h-screen flex flex-col">

  <div className="p-4 border-b border-slate-300">
    <div className="flex items-center gap-3">
      <div>
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Crawley
        </h1>
        <p className="text-xs text-slate-600">URL Analysis Platform</p>
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
            ? 'bg-gradient-to-r from-blue-100 to-purple-100 text-slate-900 border border-blue-300'
            : 'text-slate-700 hover:text-slate-900 hover:bg-slate-300/40'
        }`}
      >
        <item.icon className={`w-5 h-5 ${isActive(item.path) ? 'text-blue-600' : 'text-slate-500 group-hover:text-blue-600'}`} />
        <span className="font-medium">{item.label}</span>
      </NavLink>
    ))}
  </nav>

  <div className="p-4 border-t border-slate-300">
    <button
      onClick={logout}
      className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-slate-700 hover:text-red-700 hover:bg-red-100 border border-transparent transition-all duration-200 group"
    >
      <LogOut className="w-5 h-5 text-slate-500 group-hover:text-red-500" />
      <span className="font-medium">Logout</span>
    </button>
  </div>
</div>

  );
};
