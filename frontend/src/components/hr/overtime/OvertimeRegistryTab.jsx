import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search,
  Filter,
  Calendar,
  Clock,
  Zap,
  CheckCircle2,
  XCircle,
  FileText,
  Paperclip,
  RotateCcw,
  User
} from 'lucide-react';
import { overtimeService } from '../../../services/hrService';
import StatusBadge from '../StatusBadge';
import { getEmployeeFullName, getEmployeeInitial } from '../../../utils/rbac';

export default function OvertimeRegistryTab({ onReviewRequest, onEvidenceOpen, isExecutive }) {
  const { t, i18n } = useTranslation();
  const isAmharic = i18n.language === 'am';

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 15
      };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (typeFilter !== 'all') params.overtimeType = typeFilter;

      const res = await overtimeService.getAllRequests(params);
      if (res.success) {
        setRequests(res.data || []);
        setTotalPages(res.totalPages || 1);
        setTotalCount(res.total || 0);
      }
    } catch (err) {
      console.error('Failed to load overtime registry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [page, statusFilter, typeFilter]);

  // Client-side search by employee name or ID
  const filteredRequests = requests.filter((r) => {
    if (!search.trim()) return true;
    const name = getEmployeeFullName(r.employee).toLowerCase();
    const empNum = (r.employee?.employeeNumber || '').toLowerCase();
    const dept = (r.employee?.department || '').toLowerCase();
    const q = search.toLowerCase();
    return name.includes(q) || empNum.includes(q) || dept.includes(q);
  });

  const getTypeLabel = (type) => {
    switch (type) {
      case 'night_shift':
        return { label: isAmharic ? 'የሌሊት ፈረቃ (1.5x)' : 'Night (1.5x)', color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10' };
      case 'weekend':
        return { label: isAmharic ? 'እረፍት ቀን (2.0x)' : 'Weekend (2.0x)', color: 'text-purple-600 dark:text-purple-400 bg-purple-500/10' };
      case 'public_holiday':
        return { label: isAmharic ? 'በዓል ቀን (2.5x)' : 'Holiday (2.5x)', color: 'text-rose-600 dark:text-rose-400 bg-rose-500/10' };
      case 'normal_day':
      default:
        return { label: isAmharic ? 'መደበኛ (1.25x)' : 'Normal (1.25x)', color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10' };
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filters Bar */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              isAmharic
                ? 'በሰራተኛ ስም፣ መለያ ወይም ክፍል ፈልግ...'
                : 'Search by employee name, ID, or department...'
            }
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00ced1]"
          />
        </div>

        {/* Filter Badges */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs font-bold py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00ced1] cursor-pointer"
          >
            <option value="all">{isAmharic ? 'ሁሉም ሁኔታዎች (All Status)' : 'All Status'}</option>
            <option value="pending">{isAmharic ? 'በሂደት ላይ (Pending)' : 'Pending'}</option>
            <option value="approved">{isAmharic ? 'ይሁንታ ያገኘ (Approved)' : 'Approved'}</option>
            <option value="rejected">{isAmharic ? 'ውድቅ የተደረገ (Rejected)' : 'Rejected'}</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs font-bold py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00ced1] cursor-pointer"
          >
            <option value="all">{isAmharic ? 'ሁሉም አይነቶች (All Types)' : 'All Types'}</option>
            <option value="normal_day">{isAmharic ? 'መደበኛ (1.25x)' : 'Normal (1.25x)'}</option>
            <option value="night_shift">{isAmharic ? 'የሌሊት ፈረቃ (1.5x)' : 'Night (1.5x)'}</option>
            <option value="weekend">{isAmharic ? 'የእረፍት ቀን (2.0x)' : 'Weekend (2.0x)'}</option>
            <option value="public_holiday">{isAmharic ? 'የበዓል ቀን (2.5x)' : 'Holiday (2.5x)'}</option>
          </select>

          <button
            type="button"
            onClick={fetchRequests}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
            title={t('common.refresh')}
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#00ced1]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Directory Table */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">{isAmharic ? 'አመልካች' : 'Applicant'}</th>
                <th className="py-3 px-3">{isAmharic ? 'የስራ ክፍል' : 'Department'}</th>
                <th className="py-3 px-3">{isAmharic ? 'ቀን' : 'Date'}</th>
                <th className="py-3 px-3">{isAmharic ? 'ሰዓት' : 'Window'}</th>
                <th className="py-3 px-3">{isAmharic ? 'አይነት' : 'Category'}</th>
                <th className="py-3 px-3 text-right">{isAmharic ? 'ሰዓታት' : 'Hours'}</th>
                <th className="py-3 px-3">{isAmharic ? 'ሁኔታ' : 'Status'}</th>
                <th className="py-3 px-4 text-right">{isAmharic ? 'እርምጃዎች' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="w-5 h-5 border-2 border-[#00ced1] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>{t('common.loading')}</span>
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Zap className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    <p className="font-semibold">
                      {isAmharic
                        ? 'ምንም የትርፍ ሰዓት ጥያቄ አልተገኘም'
                        : 'No overtime requests match criteria'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRequests.map((r) => {
                  const emp = r.employee;
                  const fullName = getEmployeeFullName(emp);
                  const initial = getEmployeeInitial(emp);
                  const typeBadge = getTypeLabel(r.overtimeType);

                  return (
                    <tr
                      key={r._id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Applicant */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-[#00ced1]/15 text-[#00ced1] font-bold text-xs flex items-center justify-center shrink-0">
                            {initial}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">{fullName}</p>
                            <p className="text-[10px] text-slate-400">{emp?.employeeNumber || 'EMP'}</p>
                          </div>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="py-3 px-3 text-slate-500 font-medium text-[11px]">
                        {emp?.department || '—'}
                      </td>

                      {/* Date */}
                      <td className="py-3 px-3 font-medium whitespace-nowrap">
                        {new Date(r.requestDate).toLocaleDateString()}
                      </td>

                      {/* Time Window */}
                      <td className="py-3 px-3 font-mono text-[11px] whitespace-nowrap text-slate-500">
                        {r.startTime} – {r.endTime}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${typeBadge.color}`}>
                          {typeBadge.label}
                        </span>
                      </td>

                      {/* Hours */}
                      <td className="py-3 px-3 text-right font-black text-[#00ced1] font-mono whitespace-nowrap">
                        {r.totalHours} hrs
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <StatusBadge status={r.requestStatus} />
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Evidence Drawer Button */}
                          <button
                            type="button"
                            onClick={() => onEvidenceOpen(r)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                            title={isAmharic ? 'አባሪዎች እና ማስረጃዎች' : 'Attachments & Evidence'}
                          >
                            <Paperclip className="w-3.5 h-3.5" />
                          </button>

                          {/* Review Button */}
                          {['pending', 'pending_manager', 'pending_hr'].includes(r.requestStatus) && (
                            <button
                              type="button"
                              onClick={() => onReviewRequest(r)}
                              className="px-3 py-1.5 rounded-xl bg-[#00ced1] hover:brightness-95 text-slate-950 font-black text-[11px] transition-all cursor-pointer shadow-xs"
                            >
                              {isAmharic ? 'መርምር' : 'Review'}
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

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500">
            <span>
              {isAmharic ? `ጠቅላላ ${totalCount} መዝገቦች` : `Total ${totalCount} records`}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
              >
                {isAmharic ? 'ቀዳሚ' : 'Prev'}
              </button>
              <span className="font-bold text-slate-700 dark:text-slate-300">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
              >
                {isAmharic ? 'ቀጣይ' : 'Next'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
