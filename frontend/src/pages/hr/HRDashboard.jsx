import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Clock,
  CalendarCheck,
  Zap,
  Briefcase,
  Banknote,
  GraduationCap,
  MapPin,
  ArrowUpRight,
  Sparkles,
  ShieldCheck,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { employeeService, attendanceService, leaveService, payrollService } from '../../services/hrService';

export default function HRDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    todayPresent: 0,
    pendingLeaves: 0,
    activeRuns: 0
  });
  const [loading, setLoading] = useState(true);

  const isManagement = user?.roles?.some((r) =>
    ['superadmin', 'ceo', 'cao', 'coo', 'hrmanager', 'hrofficer', 'departmenthead', 'manager', 'finance'].includes(r)
  );

  useEffect(() => {
    const fetchDashboardMetrics = async () => {
      try {
        setLoading(true);
        const [empRes, attRes, leaveRes] = await Promise.allSettled([
          employeeService.getEmployees({ limit: 1 }),
          attendanceService.getTodayAttendance(),
          leaveService.getMyBalance()
        ]);

        let empTotal = 0;
        if (empRes.status === 'fulfilled' && empRes.value?.success) {
          empTotal = empRes.value.pagination?.total || empRes.value.data?.length || 0;
        }

        let attPresent = 0;
        if (attRes.status === 'fulfilled' && attRes.value?.success) {
          attPresent = attRes.value.data ? 1 : 0;
        }

        setStats({
          totalEmployees: empTotal,
          activeEmployees: empTotal,
          todayPresent: attPresent,
          pendingLeaves: 0,
          activeRuns: 0
        });
      } catch (err) {
        console.error('Failed to load metrics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardMetrics();
  }, []);

  const quickModules = [
    {
      title: 'Employee Master Directory',
      desc: 'Staff roster, Fayda National ID verifications, contracts & guarantor records',
      to: '/hr/employees',
      icon: Users,
      badge: 'Core'
    },
    {
      title: 'GPS Attendance & Geofencing',
      desc: 'Perimeter check-in, camera selfie punch, shift times & lateness logs',
      to: '/hr/attendance',
      icon: Clock,
      badge: 'Daily'
    },
    {
      title: 'Leave & Time-Off Approvals',
      desc: 'Annual accrued days, medical leave certificates & multi-tier approval queue',
      to: '/hr/leave',
      icon: CalendarCheck,
      badge: 'Self & HR'
    },
    {
      title: 'Overtime Ledger',
      desc: 'Calculated overtime hours, weekend multipliers & department reviews',
      to: '/hr/overtime',
      icon: Zap,
      badge: 'Payroll Link'
    },
    {
      title: 'Talent Acquisition & Recruitment',
      desc: 'Job vacancy postings, candidate pipeline Kanban & interview scorecards',
      to: '/hr/recruitment',
      icon: Briefcase,
      badge: 'Hiring'
    },
    {
      title: 'Ethiopian Statutory Payroll',
      desc: 'Tax proclamation brackets, pension 7%/11%, monthly batches & payslip viewer',
      to: '/hr/payroll',
      icon: Banknote,
      badge: 'Finance'
    },
    {
      title: 'Internship Programs',
      desc: 'University partnerships, mentor evaluations & 1-click staff conversion',
      to: '/hr/internships',
      icon: GraduationCap,
      badge: 'Talent'
    },
    {
      title: 'Client Field Visits',
      desc: 'Client site check-in with GPS verification, report notes & team assignments',
      to: '/hr/field-visits',
      icon: MapPin,
      badge: 'On-Site'
    }
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-white via-cyan-50/20 to-blue-50/30 dark:from-[#0e1626] dark:via-[#111c30] dark:to-[#152238] border border-slate-200/90 dark:border-slate-800 shadow-xs">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold text-[#00ced1] bg-[#00ced1]/10 border border-[#00ced1]/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Human Resources Management Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Vector ERP HR Management Portal
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            Centralized hub for employee life-cycle, statutory Ethiopian payroll compliance, GPS time-tracking, and talent operations.
          </p>
        </div>
      </div>

      {/* Key Metric Highlights */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Headcount</span>
            <Users className="w-4 h-4 text-[#00ced1]" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {loading ? '...' : stats.totalEmployees}
          </p>
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            Active Directory Records
          </span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Self Clock-In</span>
            <Clock className="w-4 h-4 text-[#00ced1]" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {stats.todayPresent ? 'Clocked In' : 'Not Clocked'}
          </p>
          <Link to="/hr/attendance" className="text-[11px] font-bold text-[#00ced1] hover:underline">
            Open Punch Pad &rarr;
          </Link>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Annual Leave</span>
            <CalendarCheck className="w-4 h-4 text-[#00ced1]" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            16 Days
          </p>
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            Legal Standard Entitlement
          </span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Compliance</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
            100%
          </p>
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            Ethiopian Proclamation Ready
          </span>
        </div>
      </div>

      {/* Submodule Exploration Cards */}
      <div className="space-y-4">
        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
          HR Submodules & Portals
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickModules.map((mod) => {
            const Icon = mod.icon;
            return (
              <Link
                key={mod.to}
                to={mod.to}
                className="group p-5 rounded-2xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 hover:border-[#00ced1]/50 dark:hover:border-[#00ced1]/50 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-[#00ced1]/15 text-[#00ced1] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {mod.badge}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#00ced1] transition-colors">
                    {mod.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {mod.desc}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-bold text-[#00ced1]">
                  <span>Explore Module</span>
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
