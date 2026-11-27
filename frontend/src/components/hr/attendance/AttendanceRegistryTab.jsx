import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Users,
  Search,
  Filter,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Eye,
  Edit,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Building2,
  CalendarDays,
  User
} from 'lucide-react';
import { attendanceService } from '../../../services/hrService';
import { DEPARTMENTS } from '../../../utils/rbac';
import StatusBadge from '../StatusBadge';
import AttendanceDetailModal from './AttendanceDetailModal';
import ManualAttendanceModal from './ManualAttendanceModal';

export default function AttendanceRegistryTab({ canEdit = false }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });

  // Filters
  const todayStr = new Date().toISOString().split('T')[0];
  const [useDateRange, setUseDateRange] = useState(false);
  const [date, setDate] = useState(todayStr);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState('');
  const [isLate, setIsLate] = useState(false);
  const [hasOvertime, setHasOvertime] = useState(false);
  const [search, setSearch] = useState('');

  // Modals
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);

  const fetchRegistry = async (page = 1) => {
    try {
      setLoading(true);
      const params = { page, limit: pagination.limit };

      if (!useDateRange && date) {
        params.date = date;
      } else {
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
      }

      if (department) params.department = department;
      if (status) params.status = status;
      if (isLate) params.isLate = 'true';
      if (hasOvertime) params.hasOvertime = 'true';

      const res = await attendanceService.getAllAttendance(params);
      if (res.success) {
        let fetched = res.data || [];
        // Optional client-side search filtering on employee name / number
        if (search.trim()) {
          const q = search.toLowerCase().trim();
          fetched = fetched.filter((r) => {
            const emp = r.employee || {};
            const fullName = `${emp.name?.first || ''} ${emp.name?.last || ''}`.toLowerCase();
            const num = (emp.employeeNumber || '').toLowerCase();
            return fullName.includes(q) || num.includes(q);
          });
        }
        setRecords(fetched);
        setPagination({
          page: res.page || 1,
          limit: pagination.limit,
          total: res.total || 0,
          totalPages: res.totalPages || 1
        });
      }
    } catch (err) {
      console.error('Failed to fetch attendance registry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistry(1);
  }, [date, useDateRange, startDate, endDate, department, status, isLate, hasOvertime]);

  // Handle live search with debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchRegistry(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [search]);

  // Registry Metric Counters
  const metrics = React.useMemo(() => {
    const total = records.length;
    const present = records.filter((r) => r.attendanceStatus === 'present').length;
    const halfDay = records.filter((r) => r.attendanceStatus === 'half_day').length;
    const late = records.filter((r) => r.late?.isLate).length;
    const overtime = records.filter((r) => r.overtime?.hasOvertime).length;
    return { total, present, halfDay, late, overtime };
  }, [records]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
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
      {/* Overview Stat Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Logged</span>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-1">{metrics.total}</p>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40">
          <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400">Present</span>
          <p className="text-xl font-black text-emerald-800 dark:text-emerald-300 mt-1">{metrics.present}</p>
        </div>

        <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/40">
          <span className="text-[10px] uppercase font-bold text-purple-700 dark:text-purple-400">Half Day</span>
          <p className="text-xl font-black text-purple-800 dark:text-purple-300 mt-1">{metrics.halfDay}</p>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
          <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400">Late Arrivals</span>
          <p className="text-xl font-black text-amber-800 dark:text-amber-300 mt-1">{metrics.late}</p>
        </div>

        <div className="p-4 rounded-2xl bg-cyan-50/60 dark:bg-cyan-950/20 border border-cyan-200/60 dark:border-cyan-900/40 col-span-2 sm:col-span-1">
          <span className="text-[10px] uppercase font-bold text-cyan-700 dark:text-cyan-400">Overtime</span>
          <p className="text-xl font-black text-cyan-800 dark:text-cyan-300 mt-1">{metrics.overtime}</p>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="p-4 rounded-3xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('hrPages.attendance.searchEmployee')}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#070b12] text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#00ced1]"
            />
          </div>

          {/* Date Mode Toggle */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setUseDateRange(!useDateRange)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                useDateRange
                  ? 'bg-[#00ced1]/15 text-[#00ced1] border-[#00ced1]/40'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {useDateRange ? 'Date Range' : 'Single Date'}
            </button>

            {!useDateRange ? (
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070b12] text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#00ced1]"
              />
            ) : (
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070b12] text-xs font-semibold text-slate-800 dark:text-slate-200"
                />
                <span className="text-xs text-slate-400">–</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070b12] text-xs font-semibold text-slate-800 dark:text-slate-200"
                />
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => fetchRegistry(pagination.page)}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            title="Refresh Registry"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#00ced1]' : ''}`} />
          </button>
        </div>

        {/* Dropdown Filters & Toggles */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center gap-3">
          {/* Department Filter */}
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070b12] text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#00ced1]"
          >
            <option value="">{t('hrPages.attendance.allDepartments')}</option>
            {DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070b12] text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#00ced1]"
          >
            <option value="">{t('hrPages.attendance.allStatuses')}</option>
            <option value="present">Present</option>
            <option value="half_day">Half Day</option>
            <option value="absent">Absent</option>
            <option value="on_leave">On Leave</option>
            <option value="field_visit">Field Visit</option>
          </select>

          {/* Late Only Toggle */}
          <button
            type="button"
            onClick={() => setIsLate(!isLate)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
              isLate
                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span>{t('hrPages.attendance.lateOnly')}</span>
          </button>

          {/* Overtime Only Toggle */}
          <button
            type="button"
            onClick={() => setHasOvertime(!hasOvertime)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
              hasOvertime
                ? 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300 border-cyan-300 dark:border-cyan-800'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-[#00ced1]" />
            <span>{t('hrPages.attendance.overtimeOnly')}</span>
          </button>
        </div>
      </div>

      {/* Registry Table */}
      <div className="rounded-3xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-900/40 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Employee</th>
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
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#00ced1] mb-2" />
                    <span>Loading company attendance records...</span>
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <CalendarDays className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                    <span>{t('hrPages.attendance.noRecords')}</span>
                  </td>
                </tr>
              ) : (
                records.map((rec) => {
                  const emp = rec.employee || {};
                  const fullName = emp.name
                    ? `${emp.name.first || ''} ${emp.name.last || ''}`.trim()
                    : emp.employeeNumber || 'Employee';

                  const mIn = rec.morningCheck?.checkIn;
                  const mOut = rec.morningCheck?.checkOut;
                  const aIn = rec.afternoonCheck?.checkIn;
                  const aOut = rec.afternoonCheck?.checkOut;

                  return (
                    <tr
                      key={rec._id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Employee Column */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-[#00ced1] flex items-center justify-center font-bold text-xs border border-slate-200 dark:border-slate-700">
                            {emp.name?.first ? emp.name.first[0].toUpperCase() : <User className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white leading-tight">
                              {fullName}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              <span className="font-mono text-[10px] font-semibold text-slate-500 mr-1">
                                {emp.employeeNumber || 'EMP'}
                              </span>
                              <span>• {emp.department || 'Department'}</span>
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
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

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <StatusBadge status={rec.attendanceStatus} size="sm" />
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedRecord(rec)}
                            className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                            title={t('hrPages.attendance.viewDetails')}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => setEditingRecord(rec)}
                              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-[#00ced1]/10 text-slate-600 hover:text-[#00ced1] dark:text-slate-300 transition-colors cursor-pointer"
                              title={t('hrPages.attendance.adjustRecord')}
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
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
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} records)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fetchRegistry(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => fetchRegistry(pagination.page + 1)}
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
        canEdit={canEdit}
        onEditClick={(rec) => setEditingRecord(rec)}
      />

      {/* Manual Attendance Adjustment Modal */}
      <ManualAttendanceModal
        isOpen={Boolean(editingRecord)}
        onClose={() => setEditingRecord(null)}
        record={editingRecord}
        onSuccess={() => fetchRegistry(pagination.page)}
      />
    </div>
  );
}
