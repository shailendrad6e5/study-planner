import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileBottomNav from './MobileBottomNav';

export default function MainLayout() {
  return (
    <div className="flex h-screen overflow-hidden transition-colors duration-300
      bg-[#f8faff] dark:bg-[#080714]
      [background-image:radial-gradient(at_20%_20%,hsla(240,100%,95%,0.7)_0px,transparent_55%),radial-gradient(at_85%_5%,hsla(278,100%,95%,0.6)_0px,transparent_50%),radial-gradient(at_0%_70%,hsla(224,100%,95%,0.5)_0px,transparent_50%)]
      dark:[background-image:radial-gradient(at_20%_20%,hsla(244,80%,12%,0.9)_0px,transparent_55%),radial-gradient(at_85%_5%,hsla(280,80%,10%,0.7)_0px,transparent_50%)]
    ">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-4 pb-20 md:p-8 md:pb-8">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
      <MobileBottomNav />
    </div>
  );
}
