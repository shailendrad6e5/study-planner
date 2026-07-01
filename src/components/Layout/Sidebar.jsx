import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Timer,
  BarChart2,
  Settings,
  Moon,
  Sun,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { name: 'Dashboard',  path: '/dashboard',  icon: LayoutDashboard, emoji: '🏠' },
  { name: 'Timetable',  path: '/timetable',  icon: Calendar,       emoji: '📅' },
  { name: 'Focus Mode', path: '/focus',       icon: Timer,          emoji: '⏱️' },
  { name: 'Analytics',  path: '/analytics',   icon: BarChart2,      emoji: '📊' },
  { name: 'Settings',   path: '/settings',    icon: Settings,       emoji: '⚙️' },
];

// eslint-disable-next-line no-unused-vars
function SidebarNavItem({ name, path, icon: Icon }) {
  return (
    <NavLink key={name} to={path} className={({ isActive }) =>
      `flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200 group ${
        isActive
          ? 'bg-gradient-to-r from-primary-500/12 to-secondary-500/8 dark:from-primary-500/25 dark:to-secondary-500/15 text-primary-700 dark:text-primary-300 border border-primary-200/60 dark:border-primary-700/40 shadow-sm'
          : 'text-gray-600 dark:text-gray-400 hover:bg-indigo-50/80 dark:hover:bg-indigo-900/20 hover:text-primary-700 dark:hover:text-primary-300'
      }`
    }>
      {({ isActive }) => (
        <>
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
            isActive
              ? 'bg-gradient-to-br from-primary-500 to-secondary-500 text-white shadow-glow-sm'
              : 'bg-gray-100 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 group-hover:text-primary-600 dark:group-hover:text-primary-400'
          }`}>
            <Icon className="w-4 h-4" />
          </div>
          <span>{name}</span>
          {isActive && (
            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500" />
          )}
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar() {
  const { isDarkMode, toggleTheme } = useTheme();
  const { currentUser, userProfile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const displayName = userProfile?.name || currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Student';
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const email = currentUser?.email || '';

  return (
    <div className="w-64 h-screen flex-shrink-0 hidden md:flex flex-col relative
      bg-white/80 dark:bg-[#0f0e1e]/90
      backdrop-blur-xl
      border-r border-indigo-100/60 dark:border-indigo-900/30
      transition-colors duration-300 overflow-hidden">

      {/* Ambient glow blobs — light mode only */}
      <div className="absolute -top-20 -left-12 w-56 h-56 bg-indigo-300/20 dark:bg-indigo-700/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-0 w-48 h-48 bg-fuchsia-300/15 dark:bg-fuchsia-800/10 rounded-full blur-3xl pointer-events-none" />

      {/* Logo */}
      <div className="px-6 pt-7 pb-4 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-glow-sm flex-shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold gradient-text leading-tight">AI Study</h1>
            <p className="text-xs text-gray-400 dark:text-gray-500 -mt-0.5 font-medium">Planner</p>
          </div>
        </div>
      </div>

      {/* User pill */}
      <div className="mx-4 mb-5 relative z-10">
        <div className="flex items-center gap-3 p-3 rounded-2xl
          bg-gradient-to-r from-indigo-50/80 to-fuchsia-50/60
          dark:from-indigo-950/60 dark:to-fuchsia-950/40
          border border-indigo-100/60 dark:border-indigo-800/30">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500
            flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{displayName}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{email}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1 relative z-10">
        <p className="px-3 mb-2 text-[10px] font-bold tracking-widest uppercase text-gray-400 dark:text-gray-600">
          Navigation
        </p>
        {navItems.map((item) => (
          <SidebarNavItem key={item.name} {...item} />
        ))}
      </nav>

      {/* Bottom controls */}
      <div className="px-3 pb-5 pt-3 border-t border-indigo-100/40 dark:border-indigo-900/20 space-y-1 relative z-10">
        {/* Theme toggle */}
        <button onClick={toggleTheme}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-2xl text-sm font-medium
            text-gray-600 dark:text-gray-400
            hover:bg-amber-50 dark:hover:bg-amber-900/20
            hover:text-amber-700 dark:hover:text-amber-400
            transition-all duration-200 group">
          <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-800/60 flex items-center justify-center
            group-hover:bg-amber-100 dark:group-hover:bg-amber-900/30 transition-colors">
            {isDarkMode
              ? <Sun className="w-4 h-4 text-amber-500" />
              : <Moon className="w-4 h-4 text-indigo-400" />}
          </div>
          {isDarkMode ? 'Light Mode' : 'Dark Mode'}
        </button>

        {/* Logout */}
        <button onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-2xl text-sm font-medium
            text-gray-500 dark:text-gray-500
            hover:bg-red-50 dark:hover:bg-red-900/20
            hover:text-red-600 dark:hover:text-red-400
            transition-all duration-200 group">
          <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-800/60 flex items-center justify-center
            group-hover:bg-red-100 dark:group-hover:bg-red-900/30 transition-colors">
            <LogOut className="w-4 h-4" />
          </div>
          Sign Out
        </button>
      </div>
    </div>
  );
}
