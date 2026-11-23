import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Clock,
  CalendarCheck,
  Zap,
  MapPin,
  Briefcase,
  GraduationCap,
  Banknote,
  LogOut,
  Award,
  BookOpen,
  FileSpreadsheet
} from 'lucide-react';

export const HR_NAV_ITEMS = [
  { to: '/hr', end: true, label: 'Overview', icon: LayoutDashboard },
  { to: '/hr/employees', label: 'Employees', icon: Users },
  { to: '/hr/attendance', label: 'Attendance', icon: Clock },
  { to: '/hr/leave', label: 'Leave', icon: CalendarCheck },
  { to: '/hr/overtime', label: 'Overtime', icon: Zap },
  { to: '/hr/field-visits', label: 'Field Visits', icon: MapPin },
  { to: '/hr/recruitment', label: 'Recruitment', icon: Briefcase },
  { to: '/hr/internships', label: 'Internships', icon: GraduationCap },
  { to: '/hr/payroll', label: 'Payroll', icon: Banknote },
  { to: '/hr/clearance', label: 'Clearance', icon: LogOut },
  { to: '/hr/training', label: 'Training', icon: Award },
  { to: '/hr/upgrades', label: 'Upgrades', icon: BookOpen },
  { to: '/hr/plans', label: 'Plans', icon: FileSpreadsheet }
];

export default function HRLayout() {
  return (
    <div className="flex-1 w-full h-full min-h-0 flex flex-col overflow-hidden bg-slate-50 dark:bg-[#070b12] text-slate-800 dark:text-slate-100">
      {/* HR Subsystem Top Tab Bar - Permanently fixed directly under Header with ZERO gap, positioned after (right of) Sidebar */}
      <div className="shrink-0 w-full border-b border-slate-200/80 dark:border-slate-800/90 bg-white/95 dark:bg-[#0e1626]/95 backdrop-blur-md z-20">
        <div className="w-full px-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-2.5 scrollbar-none">
            {HR_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-[#00ced1] text-[#020617] shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#152238] hover:text-[#00ced1]'
                    }`
                  }
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main HR Outlet - Scrollable content area */}
      <div className="flex-1 w-full min-h-0 overflow-y-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        <Outlet />
      </div>
    </div>
  );
}
