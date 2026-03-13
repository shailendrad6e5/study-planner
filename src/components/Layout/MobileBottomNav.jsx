import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  Timer, 
  BarChart2, 
  Settings 
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Timetable', path: '/timetable', icon: Calendar },
  { name: 'Focus', path: '/focus', icon: Timer },
  { name: 'Analytics', path: '/analytics', icon: BarChart2 },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export default function MobileBottomNav() {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-50 pb-safe transition-colors duration-200">
      <nav className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) => cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors relative",
                isActive 
                  ? "text-primary-600 dark:text-primary-400" 
                  : "text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-200"
              )}
            >
              {({ isActive }) => (
                <>
                  <Icon className={cn("w-5 h-5", isActive ? "stroke-2" : "stroke-[1.5]")} />
                  <span className={cn("text-[10px] font-medium", isActive ? "font-bold" : "")}>
                    {item.name}
                  </span>
                  {isActive && (
                    <div className="absolute top-0 w-8 h-1 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-b-full shadow-[0_4px_12px_rgba(59,130,246,0.3)]"></div>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
