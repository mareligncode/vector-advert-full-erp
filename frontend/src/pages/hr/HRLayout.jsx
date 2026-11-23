import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
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
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight
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
  const location = useLocation();
  const scrollContainerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Check scroll position and bounds
  const checkScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const hasLeft = el.scrollLeft > 2;
    const hasRight = el.scrollLeft < el.scrollWidth - el.clientWidth - 2;
    setCanScrollLeft(hasLeft);
    setCanScrollRight(hasRight);
  }, []);

  // Monitor scroll, window resize, and container resize
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    checkScroll();

    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);

    let resizeObserver;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        checkScroll();
      });
      resizeObserver.observe(el);
    }

    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [checkScroll]);

  // Keep active tab visible on navigation
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const activeEl = el.querySelector('a[aria-current="page"]');
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
    checkScroll();
  }, [location.pathname, checkScroll]);

  // Handle smooth scroll clicks
  const scrollByAmount = (direction) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const scrollAmount = 260;
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  return (
    <div className="flex-1 w-full h-full min-h-0 flex flex-col overflow-hidden bg-slate-50 dark:bg-[#070b12] text-slate-800 dark:text-slate-100">
      {/* HR Subsystem Top Tab Bar - Permanently fixed directly under Header with ZERO gap, positioned after (right of) Sidebar */}
      <div className="shrink-0 w-full border-b border-slate-200/80 dark:border-slate-800/90 bg-white/95 dark:bg-[#0e1626]/95 backdrop-blur-md z-20 relative">
        <div className="w-full relative flex items-center">
          {/* Scroll Left Button (<-) with Gradient Fade */}
          {canScrollLeft && (
            <div className="absolute left-0 inset-y-0 z-10 flex items-center pl-1 sm:pl-2 pr-6 bg-gradient-to-r from-white via-white/95 to-transparent dark:from-[#0e1626] dark:via-[#0e1626]/95 dark:to-transparent pointer-events-none">
              <button
                type="button"
                onClick={() => scrollByAmount('left')}
                className="pointer-events-auto p-1 sm:p-1.5 rounded-xl bg-white dark:bg-[#152238] border border-slate-200/90 dark:border-slate-700 shadow-md text-slate-700 dark:text-slate-200 hover:text-[#00ced1] hover:bg-slate-50 dark:hover:bg-[#1c2e4a] transition-all flex items-center justify-center cursor-pointer shrink-0"
                aria-label="Scroll tabs left"
                title="Scroll left"
              >
                <ChevronLeft className="w-4 h-4 text-[#00ced1]" />
              </button>
            </div>
          )}

          {/* Horizontally Scrollable Tabs Ribbon */}
          <div
            ref={scrollContainerRef}
            className="w-full flex items-center gap-1 sm:gap-2 overflow-x-auto py-2.5 px-3 sm:px-6 lg:px-8 scrollbar-none scroll-smooth"
          >
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

          {/* Scroll Right Button (->) with Gradient Fade */}
          {canScrollRight && (
            <div className="absolute right-0 inset-y-0 z-10 flex items-center pr-1 sm:pr-2 pl-6 bg-gradient-to-l from-white via-white/95 to-transparent dark:from-[#0e1626] dark:via-[#0e1626]/95 dark:to-transparent pointer-events-none">
              <button
                type="button"
                onClick={() => scrollByAmount('right')}
                className="pointer-events-auto p-1 sm:p-1.5 rounded-xl bg-white dark:bg-[#152238] border border-slate-200/90 dark:border-slate-700 shadow-md text-slate-700 dark:text-slate-200 hover:text-[#00ced1] hover:bg-slate-50 dark:hover:bg-[#1c2e4a] transition-all flex items-center justify-center cursor-pointer shrink-0"
                aria-label="Scroll tabs right"
                title="Scroll right"
              >
                <ChevronRight className="w-4 h-4 text-[#00ced1]" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main HR Outlet - Scrollable content area */}
      <div className="flex-1 w-full min-h-0 overflow-y-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        <Outlet />
      </div>
    </div>
  );
}
