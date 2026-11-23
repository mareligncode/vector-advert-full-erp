import React from 'react';
import { Outlet } from 'react-router-dom';

export default function HRLayout() {
  return (
    <div className="flex-1 w-full flex flex-col bg-slate-50 dark:bg-[#070b12] text-slate-800 dark:text-slate-100">
      {/* Main HR Outlet - Full width with responsive padding */}
      <div className="flex-1 w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        <Outlet />
      </div>
    </div>
  );
}
