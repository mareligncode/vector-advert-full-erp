import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search,
  Filter,
  CalendarCheck,
  CheckCircle2,
  XCircle,
  FileText,
  Paperclip,
  Clock,
  RefreshCw,
  Building2,
  CheckCheck
} from 'lucide-react';
import { leaveService } from '../../../services/hrService';
import { getEmployeeFullName, getEmployeeInitial } from '../../../utils/rbac';
import StatusBadge from '../StatusBadge';
import LeaveReviewModal from './LeaveReviewModal';

export default function LeaveRegistryTab({ isExecutive, onEvidenceOpen }) {
  const { t } = useTranslation();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [search, setSearch] = useState('');

  // Selected request for review modal
  const [selectedRequest, setSelectedRequest] = useState(null);

  const fetchAllRequests = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.leaveType = typeFilter;
      if (departmentFilter) params.department = departmentFilter;

      const res = await leaveService.getAllRequests(params);
      if (res.success) {
        setRequests(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load leave requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllRequests();
  }, [statusFilter, typeFilter, departmentFilter]);

  const filteredRequests = requests.filter((r) => {
    if (!search) return true;
    const term = search.toLowerCase();
    const empName = getEmployeeFullName(r.employee).toLowerCase();
    const numMatch = r.employee?.employeeNumber?.toLowerCase().includes(term);
    const reasonMatch = r.requestReason?.toLowerCase().includes(term);
    return empName.includes(term) || numMatch || reasonMatch;
  });

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="p-4 rounded-3xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by employee name, ID or reason..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#070b12] border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#00ced1]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070b12] border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending Review (All)</option>
            <option value="pending_manager">Pending Manager</option>
            <option value="pending_hr">Pending HR</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070b12] border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200"
          >
            <option value="">All Leave Types</option>
            <option value="annual">{t('hrPages.leave.types.annual')}</option>
            <option value="sick">{t('hrPages.leave.types.sick')}</option>
            <option value="casual">{t('hrPages.leave.types.casual')}</option>
            <option value="maternity">{t('hrPages.leave.types.maternity')}</option>
            <option value="paternity">{t('hrPages.leave.types.paternity')}</option>
            <option value="unpaid">{t('hrPages.leave.types.unpaid')}</option>
          </select>

          <button
            type="button"
            onClick={fetchAllRequests}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            title={t('common.refresh')}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#00ced1]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Applications Table */}
      <div className="rounded-3xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {t('hrPages.leave.registryTitle')}
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-[#00ced1]/10 text-[#00ced1]">
              {filteredRequests.length}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">
            {t('hrPages.leave.loading')}
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            {t('hrPages.leave.emptyRegistry')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#070b12] text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">{t('hrPages.leave.applicantCol')}</th>
                  <th className="py-3 px-4">{t('hrPages.leave.typeCol')}</th>
                  <th className="py-3 px-4">{t('hrPages.leave.datesCol')}</th>
                  <th className="py-3 px-4">{t('hrPages.leave.daysCol')}</th>
                  <th className="py-3 px-4">{t('hrPages.leave.reasonCol')}</th>
                  <th className="py-3 px-4">{t('hrPages.leave.statusCol')}</th>
                  <th className="py-3 px-4 text-right">{t('hrPages.leave.actionsCol')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredRequests.map((req) => (
                  <tr
                    key={req._id}
                    className="hover:bg-slate-50/50 dark:hover:bg-[#152238]/30 transition-colors"
                  >
                    {/* Applicant */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-[#00ced1]/10 text-[#00ced1] flex items-center justify-center font-bold text-xs shrink-0">
                          {getEmployeeInitial(req.employee)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 dark:text-white truncate">
                            {getEmployeeFullName(req.employee)}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {req.employee?.employeeNumber} • {req.employee?.department}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Type & Period */}
                    <td className="py-3 px-4">
                      <span className="font-semibold capitalize text-slate-800 dark:text-slate-200 block">
                        {t(`hrPages.leave.types.${req.leaveType}`, req.leaveType)}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {t(`hrPages.leave.periods.${req.startDayPeriod}`, req.startDayPeriod)}
                      </span>
                    </td>

                    {/* Dates */}
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                      {new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}
                    </td>

                    {/* Days */}
                    <td className="py-3 px-4">
                      <span className="font-black text-[#00ced1]">
                        {req.totalLeaveDays}d
                      </span>
                    </td>

                    {/* Reason */}
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate" title={req.requestReason}>
                      {req.requestReason}
                    </td>

                    {/* Status & Approval Stage */}
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <StatusBadge status={req.requestStatus} />
                        {req.isAdvanceLeave && (
                          <span className="text-[10px] block px-1.5 py-0.5 rounded font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 w-fit">
                            Advance Request
                          </span>
                        )}
                        {req.requestStatus === 'pending_manager' && (
                          <span className="text-[10px] block text-amber-500 font-bold">
                            Stage 1: Manager
                          </span>
                        )}
                        {req.requestStatus === 'pending_hr' && (
                          <span className="text-[10px] block text-[#00ced1] font-bold">
                            Stage 2: HR Final
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedRequest(req)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#00ced1]/15 text-[#00ced1] hover:bg-[#00ced1]/25 transition-colors cursor-pointer"
                        >
                          {t('hrPages.leave.reviewBtn')}
                        </button>

                        <button
                          type="button"
                          onClick={() => onEvidenceOpen?.(req)}
                          className="p-1.5 text-slate-400 hover:text-[#00ced1] rounded-lg transition-colors cursor-pointer"
                          title={t('hrPages.leave.attachments')}
                        >
                          <Paperclip className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedRequest && (
        <LeaveReviewModal
          isOpen={!!selectedRequest}
          onClose={() => setSelectedRequest(null)}
          request={selectedRequest}
          isExecutive={isExecutive}
          onReviewed={fetchAllRequests}
        />
      )}
    </div>
  );
}
