import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Filter,
  BarChart3,
  CalendarDays
} from 'lucide-react';
import { attendanceService } from '../../../services/hrService';
import StatusBadge from '../StatusBadge';
import AttendanceDetailModal from './AttendanceDetailModal';

export default function MyAttendanceTab() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });

  // Month & Year Filter for Summary
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [summary, setSummary] = useState(null);

  // Date range filter for records
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modal State
  const [selectedRecord, setSelectedRecord] = useState(null);

  const fetchSummary = async () => {
    try {
      const res = await attendanceService.getSummary({
        month: selectedMonth,
        year: selectedYear
      });
      if (res.success) {
        setSummary(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch attendance summary:', err);
    }
  };

  const fetchRecords = async (page = 1) => {
    try {
      setLoading(true);
      const params = { page, limit: pagination.limit };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await attendanceService.getMyAttendance(params);
      if (res.success) {
        setRecords(res.data || []);
        setPagination({
          page: res.page || 1,
          limit: pagination.limit,
          total: res.total || 0,
          totalPages: res.totalPages || 1
        });
      }
    } catch (err) {
      console.error('Failed to fetch my attendance records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    fetchRecords(1);
  }, [startDate, endDate]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '—';
    try {
      return new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return timeStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary KPI Cards & Month Selector */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#00ced1]" />
              <span>{t('hrPages.attendance.summaryTitle')}</span>
            </h3>
            <p className="text-xs text-slate-500">Monthly breakdown and lateness metrics</p>
          </div>

          {/* Month & Year Selectors */}
          <div className="flex items-center gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070b12] text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#00ced1]"
            >
              {[
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
              ].map((m, idx) => (
                <option key={m} value={idx + 1}>
                  {m}
                </option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070b12] text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#00ced1]"
            >
              {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => {
                fetchSummary();
                fetchRecords(pagination.page);
              }}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#00ced1]' : ''}`} />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Total Days */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#070b12] border border-slate-200/70 dark:border-slate-800/70">
            <span className="text-[10px] uppercase font-bold text-slate-400">
              {t('hrPages.attendance.totalLoggedDays')}
            </span>
            <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
              {summary?.totalLoggedDays || 0}
            </p>
          </div>

          {/* Present */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40">
            <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400">
              {t('hrPages.attendance.presentDays')}
            </span>
            <p className="text-xl font-black text-emerald-800 dark:text-emerald-300 mt-1">
              {summary?.presentDays || 0}
            </p>
          </div>

          {/* Half Day */}
          <div className="p-3.5 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/40">
            <span className="text-[10px] uppercase font-bold text-purple-700 dark:text-purple-400">
              {t('hrPages.attendance.halfDays')}
            </span>
            <p className="text-xl font-black text-purple-800 dark:text-purple-300 mt-1">
              {summary?.halfDays || 0}
            </p>
          </div>

          {/* Late Days */}
          <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
            <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400">
              {t('hrPages.attendance.lateDays')}
            </span>
            <p className="text-xl font-black text-amber-800 dark:text-amber-300 mt-1">
              {summary?.totalLateDays || 0}
            </p>
          </div>

          {/* Total Minutes Late */}
          <div className="p-3.5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40">
            <span className="text-[10px] uppercase font-bold text-rose-700 dark:text-rose-400">
              {t('hrPages.attendance.totalMinutesLate')}
            </span>
            <p className="text-xl font-black text-rose-800 dark:text-rose-300 mt-1 font-mono">
              {summary?.totalMinutesLate || 0}m
            </p>
          </div>

          {/* Overtime Hours */}
          <div className="p-3.5 rounded-2xl bg-cyan-50/60 dark:bg-cyan-950/20 border border-cyan-200/60 dark:border-cyan-900/40">
            <span className="text-[10px] uppercase font-bold text-cyan-700 dark:text-cyan-400">
              {t('hrPages.attendance.totalOvertimeHours')}
            </span>
            <p className="text-xl font-black text-cyan-800 dark:text-cyan-300 mt-1 font-mono">
              {summary?.totalOvertimeHours || 0}h
            </p>
          </div>
        </div>
      </div>

      {/* Date Range Filter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-[#00ced1]" />
            <span>Date Range:</span>
          </span>

          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070b12] text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#00ced1]"
          />
          <span className="text-xs text-slate-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070b12] text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#00ced1]"
          />

          {(startDate || endDate) && (
            <button
              type="button"
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="text-xs font-bold text-rose-500 hover:text-rose-600 ml-1 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        <div className="text-xs text-slate-500">
          Showing <span className="font-bold text-slate-900 dark:text-white">{records.length}</span> of {pagination.total} records
        </div>
      </div>

      {/* Attendance History Table */}
      <div className="rounded-3xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-900/40 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">{t('hrPages.attendance.dateCol')}</th>
                <th className="py-3 px-4">{t('hrPages.attendance.morningCol')}</th>
                <th className="py-3 px-4">{t('hrPages.attendance.afternoonCol')}</th>
                <th className="py-3 px-4">{t('hrPages.attendance.lateCol')}</th>
                <th className="py-3 px-4">{t('hrPages.attendance.overtimeCol')}</th>
                <th className="py-3 px-4">{t('hrPages.attendance.statusCol')}</th>
                <th className="py-3 px-4 text-right">{t('hrPages.attendance.actionCol')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#00ced1] mb-2" />
                    <span>Loading attendance records...</span>
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <CalendarDays className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                    <span>{t('hrPages.attendance.noRecords')}</span>
                  </td>
                </tr>
              ) : (
                records.map((rec) => {
                  const mIn = rec.morningCheck?.checkIn;
                  const mOut = rec.morningCheck?.checkOut;
                  const aIn = rec.afternoonCheck?.checkIn;
                  const aOut = rec.afternoonCheck?.checkOut;

                  return (
                    <tr
                      key={rec._id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Date */}
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                        {formatDate(rec.attendanceDate)}
                      </td>

                      {/* Morning Shift */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className={mIn?.time ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-400'}>
                            {formatTime(mIn?.time)}
                          </span>
                          <span className="text-slate-300 dark:text-slate-600">–</span>
                          <span className={mOut?.time ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-400'}>
                            {formatTime(mOut?.time)}
                          </span>
                        </div>
                      </td>

                      {/* Afternoon Shift */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className={aIn?.time ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-400'}>
                            {formatTime(aIn?.time)}
                          </span>
                          <span className="text-slate-300 dark:text-slate-600">–</span>
                          <span className={aOut?.time ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-400'}>
                            {formatTime(aOut?.time)}
                          </span>
                        </div>
                      </td>

                      {/* Lateness */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {rec.late?.isLate ? (
                          <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full text-[11px] border border-amber-200 dark:border-amber-900/60">
                            <AlertTriangle className="w-3 h-3" />
                            <span>{rec.late.minutesLate || 0}m</span>
                          </span>
                        ) : (
                          <span className="text-emerald-500 text-[11px] font-semibold">On time</span>
                        )}
                      </td>

                      {/* Overtime */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {rec.overtime?.hasOvertime ? (
                          <span className="inline-flex items-center gap-1 text-[#00ced1] font-bold bg-[#00ced1]/10 px-2 py-0.5 rounded-full text-[11px] border border-[#00ced1]/30">
                            <Zap className="w-3 h-3" />
                            <span>{rec.overtime.numberOfHours || 0}h</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <StatusBadge status={rec.attendanceStatus} size="sm" />
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedRecord(rec)}
                          className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors inline-flex items-center gap-1 cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fetchRecords(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => fetchRecords(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Attendance Detail Modal */}
      <AttendanceDetailModal
        isOpen={Boolean(selectedRecord)}
        onClose={() => setSelectedRecord(null)}
        record={selectedRecord}
      />
    </div>
  );
}
