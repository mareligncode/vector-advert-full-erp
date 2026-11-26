import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Users,
  Search,
  Filter,
  Plus,
  Mail,
  Phone,
  Building,
  CheckCircle,
  AlertCircle,
  Eye,
  Paperclip,
  Shield,
  FileCheck,
  UserCheck,
  RefreshCw,
  X,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Sparkles,
  UserX,
  Clock,
  Briefcase,
  MapPin,
  Building2
} from 'lucide-react';
import { employeeService } from '../../../services/hrService';
import { useAuth } from '../../../context/AuthContext';
import StatusBadge from '../../../components/hr/StatusBadge';
import EvidenceDrawer from '../../../components/hr/EvidenceDrawer';
import EmployeeFormModal from '../../../components/hr/EmployeeFormModal';
import EmployeeDetailModal from '../../../components/hr/EmployeeDetailModal';
import {
  canCreateEmployee,
  canEditEmployee,
  canDeleteEmployee,
  canChangeEmploymentStatus,
  canViewFinancials,
  DEPARTMENTS,
  EMPLOYMENT_STATUSES,
  EMPLOYMENT_TYPES
} from '../../../utils/rbac';

export default function EmployeeList() {
  const { t, i18n } = useTranslation();
  const isAmharic = i18n.language === 'am';
  const { user } = useAuth();

  // Data & Pagination State
  const [employees, setEmployees] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);

  // Filters State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [idFilter, setIdFilter] = useState(''); // 'all', 'verified', 'pending', 'missing'
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'

  // Modals State
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [evidenceTarget, setEvidenceTarget] = useState(null);

  // Notifications
  const [message, setMessage] = useState({ type: '', text: '' });

  // RBAC Permissions
  const userCanCreate = canCreateEmployee(user);
  const userCanEdit = canEditEmployee(user);
  const userCanDelete = canDeleteEmployee(user);
  const userCanChangeStatus = canChangeEmploymentStatus(user);
  const userCanViewFinancials = canViewFinancials(user);

  // Fetch Employees from API
  const fetchEmployees = async (page = pagination.page, limit = pagination.limit) => {
    try {
      setLoading(true);
      const params = { page, limit };
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.employmentStatus = statusFilter;
      if (departmentFilter) params.department = departmentFilter;
      if (typeFilter) params.employmentType = typeFilter;

      const res = await employeeService.getEmployees(params);
      if (res.success && res.data) {
        setEmployees(res.data);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      }
    } catch (err) {
      console.error('Failed to fetch employees:', err);
      setMessage({ type: 'error', text: err.response?.data?.message || t('employee.loadFailed') });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchEmployees(1, pagination.limit);
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [search, statusFilter, departmentFilter, typeFilter]);

  // Client-side filtering for Fayda ID verification status
  const filteredEmployees = useMemo(() => {
    if (!idFilter) return employees;
    return employees.filter((emp) => {
      const isApproved = emp.nationalId?.status === 'approved' || !!emp.nationalId?.approvedBy;
      const hasId = !!(emp.nationalId?.fanNumber || emp.nationalId?.finNumber || emp.nationalId?.frontImageUrl);
      if (idFilter === 'verified') return isApproved;
      if (idFilter === 'pending') return hasId && !isApproved;
      if (idFilter === 'missing') return !hasId;
      return true;
    });
  }, [employees, idFilter]);

  // Metrics computation
  const metrics = useMemo(() => {
    const total = pagination.total || employees.length;
    const active = employees.filter((e) => e.employmentStatus === 'active').length;
    const probation = employees.filter((e) => e.employmentStatus === 'probation').length;
    const verifiedId = employees.filter((e) => e.nationalId?.status === 'approved' || !!e.nationalId?.approvedBy).length;
    return { total, active, probation, verifiedId };
  }, [employees, pagination]);

  // Quick Delete handler
  const handleDeleteEmployee = async (emp) => {
    const fullName = emp.name ? `${emp.name.first || ''} ${emp.name.last || ''}`.trim() : emp.employeeNumber;
    if (!window.confirm(t('employee.deleteConfirmDetailed', { num: emp.employeeNumber, name: fullName }))) return;

    try {
      const res = await employeeService.deleteEmployee(emp._id);
      if (res.success) {
        setMessage({ type: 'success', text: t('employee.deletedSuccess', { num: emp.employeeNumber }) });
        fetchEmployees();
        setTimeout(() => setMessage({ type: '', text: '' }), 4000);
      }
    } catch (err) {
      alert(err.response?.data?.message || t('employee.deleteFailed'));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header & Metrics Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Users className="w-6 h-6 text-[#00ced1]" />
            <span>{t('employee.directory', 'Employee Master Directory')}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {t('employee.directorySubtitle', 'Enterprise workforce management, Fayda ID verification, compliance & organizational structure')}
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start lg:self-auto">
          {userCanCreate && (
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all hover:brightness-95 cursor-pointer whitespace-nowrap"
              style={{ backgroundColor: '#00ced1', color: '#020617' }}
            >
              <Plus className="w-4 h-4" style={{ color: '#020617' }} />
              <span style={{ color: '#020617' }}>{t('employee.registerNew', 'Add New Personnel')}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => fetchEmployees(pagination.page, pagination.limit)}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={t('employee.refreshDirectory')}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#00ced1]/15 text-[#00ced1] flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">{t('employee.totalStaff')}</span>
            <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              {metrics.total}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">{t('employee.activeStaff')}</span>
            <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              {metrics.active}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">{t('employee.onProbation')}</span>
            <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              {metrics.probation}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-500 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">{t('employee.faydaVerified')}</span>
            <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              {metrics.verifiedId}
            </span>
          </div>
        </div>
      </div>

      {/* Message Banner */}
      {message.text && (
        <div
          className={`p-3 rounded-2xl text-xs flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
          }`}
        >
          {message.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={t('employee.searchPlaceholder', 'Search by name, employee #, phone, or email...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#152238] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#00ced1]"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#152238] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#00ced1] cursor-pointer"
          >
            <option value="">{t('employee.allStatuses', 'All Statuses')}</option>
            {EMPLOYMENT_STATUSES.map((st) => (
              <option key={st.value} value={st.value}>
                {isAmharic ? st.amLabel : st.label}
              </option>
            ))}
          </select>

          {/* Department Filter */}
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#152238] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#00ced1] cursor-pointer max-w-[170px]"
          >
            <option value="">{t('employee.allDepartments', 'All Departments')}</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* Employment Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#152238] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#00ced1] cursor-pointer"
          >
            <option value="">{t('employee.allTypes')}</option>
            {EMPLOYMENT_TYPES.map((tItem) => (
              <option key={tItem.value} value={tItem.value}>
                {isAmharic ? tItem.amLabel : tItem.label}
              </option>
            ))}
          </select>

          {/* Fayda ID Verification Filter */}
          <select
            value={idFilter}
            onChange={(e) => setIdFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#152238] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#00ced1] cursor-pointer"
          >
            <option value="">{t('employee.faydaAll')}</option>
            <option value="verified">{t('employee.verifiedId', 'Fayda Verified')}</option>
            <option value="pending">{t('employee.pendingId', 'Verification Pending')}</option>
            <option value="missing">{t('employee.missingId', 'Not Uploaded')}</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-2 transition-colors ${
                viewMode === 'table'
                  ? 'bg-[#00ced1] text-[#020617]'
                  : 'bg-slate-50 dark:bg-[#152238] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title={t('employee.tableView')}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`p-2 transition-colors ${
                viewMode === 'cards'
                  ? 'bg-[#00ced1] text-[#020617]'
                  : 'bg-slate-50 dark:bg-[#152238] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title={t('employee.cardsView')}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Directory Content: Table or Cards */}
      <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400">{t('employee.loadingDirectory')}</div>
        ) : filteredEmployees.length === 0 ? (
          <div className="py-16 px-4 text-center space-y-3">
            <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">{t('employee.noRecordsFoundTitle')}</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {t('employee.noRecordsFoundSub')}
            </p>
            {userCanCreate && (
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#00ced1] text-[#020617] shadow-sm hover:brightness-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{t('employee.registerFirst')}</span>
              </button>
            )}
          </div>
        ) : viewMode === 'table' ? (
          /* TABLE VIEW */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 dark:bg-[#152238]/60 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">{t('employee.details', 'Employee')}</th>
                  <th className="py-3 px-4">{t('employee.jobTitle', 'Role')} & {t('employee.department', 'Dept')}</th>
                  <th className="py-3 px-4">{t('employee.faydaNationalId', 'Fayda National ID')}</th>
                  <th className="py-3 px-4">{t('employee.employmentStatus', 'Status')}</th>
                  <th className="py-3 px-4">{t('employee.systemAccountTab', 'System User')}</th>
                  <th className="py-3 px-4">{t('employee.primaryPhone', 'Contact')}</th>
                  <th className="py-3 px-4 text-right">{t('employee.actionsCol')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredEmployees.map((emp) => {
                  const fullName = emp.name
                    ? `${emp.name.first || ''} ${emp.name.middle || ''} ${emp.name.last || ''}`.trim()
                    : t('employee.unnamed');

                  const isIdApproved = emp.nationalId?.status === 'approved' || !!emp.nationalId?.approvedBy;
                  const hasId = !!(emp.nationalId?.fanNumber || emp.nationalId?.finNumber || emp.nationalId?.frontImageUrl);
                  const isUserLinked = !!emp.user;

                  return (
                    <tr
                      key={emp._id}
                      className="hover:bg-slate-50/80 dark:hover:bg-[#152238]/40 transition-colors"
                    >
                      {/* Avatar & Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#00ced1]/15 text-[#00ced1] font-black flex items-center justify-center shrink-0 text-xs overflow-hidden">
                            {emp.profilePhoto ? (
                              <img
                                src={emp.profilePhoto}
                                alt={fullName}
                                className="w-full h-full object-cover rounded-xl"
                              />
                            ) : (
                              fullName.charAt(0) || 'E'
                            )}
                          </div>
                          <div>
                            <span
                              className="font-bold text-slate-900 dark:text-white block hover:text-[#00ced1] transition-colors cursor-pointer"
                              onClick={() => setSelectedEmployee(emp)}
                            >
                              {fullName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              #{emp.employeeNumber || 'NO-ID'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Department & Role */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                          {emp.jobTitle || t('employee.staffMember')}
                        </span>
                        <div className="flex flex-wrap items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                          <span>{emp.department || t('employee.generalDept')}</span>
                          {emp.branch && (
                            <>
                              <span>&bull;</span>
                              <span className="text-[#00ced1] font-medium">{emp.branch}</span>
                            </>
                          )}
                        </div>
                        {emp.manager && (
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <span className="font-semibold text-slate-500">{t('employee.mgrPrefix')}</span>
                            <span>
                              {typeof emp.manager === 'object'
                                ? `${emp.manager.name?.first || ''} ${emp.manager.name?.last || ''}`.trim() || emp.manager.employeeNumber
                                : emp.manager}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Fayda National ID */}
                      <td className="py-3.5 px-4">
                        {hasId ? (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isIdApproved
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                                : emp.nationalId?.status === 'rejected'
                                ? 'bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400'
                                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                            }`}
                          >
                            {isIdApproved ? t('employee.verified') : emp.nationalId?.status === 'rejected' ? t('employee.rejected') : t('employee.pendingVerification')}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">{t('employee.notUploaded')}</span>
                        )}
                      </td>

                      {/* Employment Status */}
                      <td className="py-3.5 px-4">
                        <StatusBadge status={emp.employmentStatus || 'active'} />
                      </td>

                      {/* System User Account */}
                      <td className="py-3.5 px-4">
                        {isUserLinked ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>{t('employee.linked')}</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">{t('employee.noAccount')}</span>
                        )}
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        <div className="space-y-0.5">
                          {emp.email && (
                            <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                              <Mail className="w-3 h-3 text-[#00ced1] shrink-0" />
                              <span className="truncate max-w-[140px]">{emp.email}</span>
                            </div>
                          )}
                          {emp.primaryPhone && (
                            <div className="flex items-center gap-1 text-[11px]">
                              <Phone className="w-3 h-3 text-[#00ced1] shrink-0" />
                              <span>{emp.primaryPhone}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Action Buttons (RBAC Enforced) */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          {/* View Profile */}
                          <button
                            type="button"
                            onClick={() => setSelectedEmployee(emp)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#00ced1] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title={t('employee.viewProfile')}
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit Employee (HR Admin) */}
                          {userCanEdit && (
                            <button
                              type="button"
                              onClick={() => setEditingEmployee(emp)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-[#00ced1] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title={t('employee.editPersonnelTitle')}
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}

                          {/* Universal Evidence Drawer */}
                          <button
                            type="button"
                            onClick={() => setEvidenceTarget(emp)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#00ced1] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title={t('employee.evidenceTooltip')}
                          >
                            <Paperclip className="w-4 h-4" />
                          </button>

                          {/* Delete Employee (Executive Only) */}
                          {userCanDelete && (
                            <button
                              type="button"
                              onClick={() => handleDeleteEmployee(emp)}
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              title={t('employee.deleteExecutiveTitle')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* CARDS VIEW */
          <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEmployees.map((emp) => {
              const fullName = emp.name
                ? `${emp.name.first || ''} ${emp.name.middle || ''} ${emp.name.last || ''}`.trim()
                : t('employee.unnamed');

              const isIdApproved = emp.nationalId?.status === 'approved' || !!emp.nationalId?.approvedBy;

              return (
                <div
                  key={emp._id}
                  className="p-4 rounded-2xl bg-slate-50/70 dark:bg-[#152238]/60 border border-slate-200/80 dark:border-slate-800 hover:border-[#00ced1]/50 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-[#00ced1]/15 text-[#00ced1] font-black flex items-center justify-center shrink-0 text-sm overflow-hidden">
                          {emp.profilePhoto ? (
                            <img src={emp.profilePhoto} alt={fullName} className="w-full h-full object-cover" />
                          ) : (
                            fullName.charAt(0) || 'E'
                          )}
                        </div>
                        <div>
                          <span
                            className="font-bold text-slate-900 dark:text-white block hover:text-[#00ced1] transition-colors cursor-pointer"
                            onClick={() => setSelectedEmployee(emp)}
                          >
                            {fullName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            #{emp.employeeNumber}
                          </span>
                        </div>
                      </div>
                      <StatusBadge status={emp.employmentStatus || 'active'} />
                    </div>

                    <div className="space-y-1 text-xs">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{emp.jobTitle || t('employee.staffMember')}</p>
                      <div className="flex flex-wrap items-center gap-1 text-[11px] text-slate-500">
                        <span>{emp.department || t('employee.generalDept')}</span>
                        {emp.branch && (
                          <>
                            <span>&bull;</span>
                            <span className="text-[#00ced1] font-medium">{emp.branch}</span>
                          </>
                        )}
                      </div>
                      {emp.manager && (
                        <p className="text-[10px] text-slate-400">
                          <span className="font-medium text-slate-500">{t('employee.mgrPrefix')}</span>{' '}
                          {typeof emp.manager === 'object'
                            ? `${emp.manager.name?.first || ''} ${emp.manager.name?.last || ''}`.trim() || emp.manager.employeeNumber
                            : emp.manager}
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 space-y-1 text-[11px] text-slate-500">
                      {emp.primaryPhone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-[#00ced1]" />
                          <span>{emp.primaryPhone}</span>
                        </div>
                      )}
                      {emp.email && (
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-[#00ced1]" />
                          <span className="truncate">{emp.email}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        isIdApproved
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                          : 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
                      }`}
                    >
                      {isIdApproved ? t('employee.faydaVerified') : t('employee.idPending')}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setSelectedEmployee(emp)}
                        className="p-1 rounded-lg text-slate-500 hover:text-[#00ced1]"
                        title={t('employee.viewDetails')}
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {userCanEdit && (
                        <button
                          type="button"
                          onClick={() => setEditingEmployee(emp)}
                          className="p-1 rounded-lg text-slate-500 hover:text-[#00ced1]"
                          title={t('employee.edit')}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setEvidenceTarget(emp)}
                        className="p-1 rounded-lg text-slate-500 hover:text-[#00ced1]"
                        title={t('employee.evidenceShort')}
                      >
                        <Paperclip className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Bar */}
        <div className="p-3 sm:p-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-[#152238]/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            {t('employee.showingRange', { shown: filteredEmployees.length, total: pagination.total || employees.length })}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">{t('employee.rowsPerPage')}</span>
            <select
              value={pagination.limit}
              onChange={(e) => fetchEmployees(1, Number(e.target.value))}
              className="px-2 py-1 rounded-lg bg-white dark:bg-[#0e1626] border border-slate-200 dark:border-slate-700 text-xs font-bold"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>

            <div className="flex items-center gap-1 ml-2">
              <button
                type="button"
                onClick={() => fetchEmployees(pagination.page - 1, pagination.limit)}
                disabled={pagination.page <= 1}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-bold text-slate-700 dark:text-slate-300">
                {pagination.page} / {pagination.pages || 1}
              </span>
              <button
                type="button"
                onClick={() => fetchEmployees(pagination.page + 1, pagination.limit)}
                disabled={pagination.page >= (pagination.pages || 1)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CREATE Personnel Modal */}
      {isCreateModalOpen && (
        <EmployeeFormModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          employee={null}
          onSuccess={() => {
            fetchEmployees();
            setMessage({ type: 'success', text: t('employee.createdSuccess') });
            setTimeout(() => setMessage({ type: '', text: '' }), 4000);
          }}
        />
      )}

      {/* EDIT Personnel Modal */}
      {editingEmployee && (
        <EmployeeFormModal
          isOpen={!!editingEmployee}
          onClose={() => setEditingEmployee(null)}
          employee={editingEmployee}
          onSuccess={(updated) => {
            setEditingEmployee(null);
            fetchEmployees();
            if (updated) {
              setSelectedEmployee(updated);
            }
            setMessage({ type: 'success', text: t('employee.updatedSuccess', { num: updated?.employeeNumber || '' }) });
            setTimeout(() => setMessage({ type: '', text: '' }), 4000);
          }}
        />
      )}

      {/* VIEW & MANAGE Detail Modal / Drawer */}
      {selectedEmployee && !editingEmployee && (
        <EmployeeDetailModal
          isOpen={!!selectedEmployee && !editingEmployee}
          onClose={() => setSelectedEmployee(null)}
          employee={selectedEmployee}
          onUpdate={(updated) => {
            if (updated) {
              setSelectedEmployee(updated);
            } else {
              setSelectedEmployee(null);
            }
            fetchEmployees();
          }}
          onEdit={(emp) => {
            setEditingEmployee(emp);
          }}
          onOpenEvidence={(emp) => {
            setEvidenceTarget(emp);
          }}
        />
      )}

      {/* Universal Evidence / Attachments Drawer */}
      <EvidenceDrawer
        isOpen={!!evidenceTarget}
        onClose={() => setEvidenceTarget(null)}
        entityType="Employee"
        entityId={evidenceTarget?._id}
        entityTitle={
          evidenceTarget?.name
            ? `${evidenceTarget.name.first || ''} ${evidenceTarget.name.last || ''}`.trim()
            : t('employee.personnelRecord')
        }
      />
    </div>
  );
}
