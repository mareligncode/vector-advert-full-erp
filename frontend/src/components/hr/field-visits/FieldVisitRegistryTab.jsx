import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search,
  Filter,
  MapPin,
  Calendar,
  Clock,
  Users,
  Eye,
  CheckCircle2,
  Trash2,
  Paperclip,
  RotateCcw,
  Navigation,
  Edit3
} from 'lucide-react';
import { fieldVisitService } from '../../../services/hrService';
import StatusBadge from '../StatusBadge';
import { getEmployeeFullName, getEmployeeInitial } from '../../../utils/rbac';

export default function FieldVisitRegistryTab({
  onViewDetails,
  onCheckInClick,
  onEvidenceOpen,
  onEditVisit,
  canEdit,
  canDelete
}) {
  const { t, i18n } = useTranslation();
  const isAmharic = i18n.language === 'am';

  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchVisits = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 15
      };
      if (statusFilter !== 'all') params.status = statusFilter;

      const res = await fieldVisitService.getVisits(params);
      if (res.success) {
        setVisits(res.data || []);
        setTotalPages(res.totalPages || 1);
        setTotalCount(res.total || 0);
      }
    } catch (err) {
      console.error('Failed to load field visits directory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisits();
  }, [page, statusFilter]);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (
      !window.confirm(
        isAmharic
          ? 'እርግጠኛ ነዎት ይህን የመስክ ጉዞ መሰረዝ ይፈልጋሉ?'
          : 'Are you sure you want to delete this field visit?'
      )
    )
      return;

    try {
      const res = await fieldVisitService.deleteVisit(id);
      if (res.success) {
        fetchVisits();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete visit');
    }
  };

  const filteredVisits = visits.filter((v) => {
    if (!search.trim()) return true;
    const purpose = (v.visitPurpose || '').toLowerCase();
    const address = (v.visitAddress || '').toLowerCase();
    const leader = getEmployeeFullName(v.leader).toLowerCase();
    const q = search.toLowerCase();
    return purpose.includes(q) || address.includes(q) || leader.includes(q);
  });

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              isAmharic
                ? 'በዓላማ፣ አድራሻ ወይም በቡድን መሪ ፈልግ...'
                : 'Search by purpose, address, or team leader...'
            }
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00ced1]"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs font-bold py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00ced1] cursor-pointer"
          >
            <option value="all">{isAmharic ? 'ሁሉም ሁኔታዎች (All)' : 'All Status'}</option>
            <option value="scheduled">{isAmharic ? 'የታቀደ (Scheduled)' : 'Scheduled'}</option>
            <option value="in_progress">{isAmharic ? 'በስራ ላይ (In Progress)' : 'In Progress'}</option>
            <option value="completed">{isAmharic ? 'የተጠናቀቀ (Completed)' : 'Completed'}</option>
            <option value="cancelled">{isAmharic ? 'የተሰረዘ (Cancelled)' : 'Cancelled'}</option>
          </select>

          <button
            type="button"
            onClick={fetchVisits}
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
                <th className="py-3 px-4">{isAmharic ? 'ዓላማ / ርዕስ' : 'Purpose / Title'}</th>
                <th className="py-3 px-3">{isAmharic ? 'ቀን እና ሰዓት' : 'Date & Shift'}</th>
                <th className="py-3 px-3">{isAmharic ? 'አድራሻ' : 'Destination Site'}</th>
                <th className="py-3 px-3">{isAmharic ? 'የቡድን መሪ' : 'Leader'}</th>
                <th className="py-3 px-3">{isAmharic ? 'ቡድን' : 'Team'}</th>
                <th className="py-3 px-3 text-center">{isAmharic ? 'መግቢያዎች' : 'Check-Ins'}</th>
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
              ) : filteredVisits.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <MapPin className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    <p className="font-semibold">
                      {isAmharic
                        ? 'ምንም የመስክ ጉዞ አልተገኘም'
                        : 'No field visit assignments found'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredVisits.map((v) => {
                  const leaderName = getEmployeeFullName(v.leader);
                  const memberCount = (v.employees || []).length;
                  const checkInCount = (v.checkIns || []).length;

                  return (
                    <tr
                      key={v._id}
                      onClick={() => onViewDetails(v)}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                    >
                      {/* Purpose */}
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {v.visitPurpose}
                      </td>

                      {/* Date & Shift */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <p className="font-medium">
                          {new Date(v.visitDate).toLocaleDateString()}
                          {v.returnDate && ` – ${new Date(v.returnDate).toLocaleDateString()}`}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-slate-400 font-mono">
                            {v.visitStartTime} – {v.visitEndTime}
                          </span>
                          {v.returnDate && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-black bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                              {isAmharic ? 'የብዙ ቀናት' : 'Multi-Day'}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Site Address */}
                      <td className="py-3 px-3 max-w-xs truncate text-slate-500 font-medium">
                        <span className="flex items-center gap-1">
                          <Navigation className="w-3 h-3 text-[#00ced1] shrink-0" />
                          <span className="truncate">{v.visitAddress}</span>
                        </span>
                      </td>

                      {/* Leader */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {leaderName || '—'}
                        </span>
                      </td>

                      {/* Team */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {memberCount + (v.leader ? 1 : 0)} staff
                        </span>
                      </td>

                      {/* Check-ins with Visible Names */}
                      <td className="py-3 px-3 min-w-[150px]">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black inline-flex items-center gap-1 w-fit ${
                              checkInCount > 0
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                            }`}
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>
                              {checkInCount} / {memberCount + (v.leader ? 1 : 0)} {isAmharic ? 'ገብተዋል' : 'checked in'}
                            </span>
                          </span>

                          {checkInCount > 0 ? (
                            <div className="flex flex-wrap gap-1 max-w-xs mt-0.5">
                              {(v.checkIns || []).map((c, idx) => (
                                <span
                                  key={c._id || idx}
                                  className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                                  title={`${getEmployeeFullName(c.employee)} - ${new Date(c.checkInTime).toLocaleTimeString()}`}
                                >
                                  <span>{getEmployeeFullName(c.employee) || 'Staff'}</span>
                                  <span className="opacity-60 text-[9px]">
                                    ({new Date(c.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                                  </span>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">
                              {isAmharic ? 'እስካሁን ማንም አልገባም' : 'No check-ins yet'}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <StatusBadge status={v.visitStatus} />
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          {/* Attachments */}
                          <button
                            type="button"
                            onClick={() => onEvidenceOpen(v)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                            title={isAmharic ? 'አባሪዎች እና ማስረጃዎች' : 'Attachments & Evidence'}
                          >
                            <Paperclip className="w-3.5 h-3.5" />
                          </button>

                          {/* Check-In On-site */}
                          {v.visitStatus !== 'completed' && v.visitStatus !== 'cancelled' && (
                            <button
                              type="button"
                              onClick={() => onCheckInClick(v)}
                              className="px-2.5 py-1 rounded-xl bg-[#00ced1] hover:brightness-95 text-slate-950 font-bold text-[11px] transition-all cursor-pointer shadow-xs"
                            >
                              {isAmharic ? 'መግቢያ' : 'Check-In'}
                            </button>
                          )}

                          {/* Edit Visit (HR & Management) */}
                          {canEdit && onEditVisit && (
                            <button
                              type="button"
                              onClick={() => onEditVisit(v)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-[#00ced1] transition-colors cursor-pointer"
                              title={isAmharic ? 'መረጃ አሻሽል' : 'Edit Field Visit'}
                            >
                              <Edit3 className="w-3.5 h-3.5 text-[#00ced1]" />
                            </button>
                          )}

                          {/* Details Button */}
                          <button
                            type="button"
                            onClick={() => onViewDetails(v)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors cursor-pointer"
                            title={isAmharic ? 'ዝርዝር እይ' : 'View Details'}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Button */}
                          {canDelete && (
                            <button
                              type="button"
                              onClick={(e) => handleDelete(v._id, e)}
                              className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-500 hover:text-rose-600 transition-colors cursor-pointer"
                              title={isAmharic ? 'ሰርዝ' : 'Delete Visit'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
