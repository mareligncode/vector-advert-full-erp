import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  User,
  Mail,
  Phone,
  Building,
  Briefcase,
  Calendar,
  Banknote,
  Shield,
  FileCheck,
  CheckCircle,
  AlertTriangle,
  Upload,
  Trash2,
  Edit,
  ExternalLink,
  Paperclip,
  Key,
  UserCheck,
  RefreshCw,
  Camera,
  HeartHandshake,
  GraduationCap,
  MapPin,
  Building2,
  Users
} from 'lucide-react';
import StatusBadge from './StatusBadge';
import { employeeService } from '../../services/hrService';
import { useAuth } from '../../context/AuthContext';
import {
  canEditEmployee,
  canDeleteEmployee,
  canChangeEmploymentStatus,
  canManageUserAccount,
  canApproveNationalId,
  canApproveDocuments,
  canViewFinancials,
  EMPLOYMENT_STATUSES,
  ALL_ROLES
} from '../../utils/rbac';

export default function EmployeeDetailModal({
  isOpen,
  onClose,
  employee: initialEmployee,
  onUpdate,
  onEdit,
  onOpenEvidence
}) {
  const { t, i18n } = useTranslation();
  const isAmharic = i18n.language === 'am';
  const { user } = useAuth();
  if (!isOpen || !initialEmployee) return null;

  const [currentEmployee, setCurrentEmployee] = useState(initialEmployee);

  useEffect(() => {
    setCurrentEmployee(initialEmployee);
  }, [initialEmployee]);

  // Fetch full populated fresh employee whenever opened or employee id changes
  useEffect(() => {
    let isMounted = true;
    if (isOpen && initialEmployee?._id) {
      employeeService.getEmployeeById(initialEmployee._id)
        .then((res) => {
          if (res.success && res.data && isMounted) {
            setCurrentEmployee(res.data);
            if (onUpdate) onUpdate(res.data);
          }
        })
        .catch((err) => {
          console.error('Failed to load fresh employee details:', err);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen, initialEmployee?._id]);

  const employee = currentEmployee || initialEmployee;

  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState({ type: '', text: '' });

  // Photo upload states
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const [frontIdFile, setFrontIdFile] = useState(null);
  const [backIdFile, setBackIdFile] = useState(null);

  // Document upload state
  const [docFile, setDocFile] = useState(null);
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState('Contract');

  // Status Change state
  const [newStatus, setNewStatus] = useState(employee.employmentStatus || 'active');
  const [statusNotes, setStatusNotes] = useState('');

  // Link user account state
  const [newUserEmail, setNewUserEmail] = useState(employee.email || '');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('employee');

  useEffect(() => {
    if (employee) {
      setNewStatus(employee.employmentStatus || 'active');
      setNewUserEmail(employee.email || '');
    }
  }, [employee]);

  const syncUpdatedEmployee = async (responseData) => {
    let updated = responseData && responseData._id ? responseData : null;
    if (!updated && employee?._id) {
      try {
        const fresh = await employeeService.getEmployeeById(employee._id);
        if (fresh.success && fresh.data) {
          updated = fresh.data;
        }
      } catch (e) {
        console.error('Failed to re-fetch updated employee:', e);
      }
    }
    if (updated) {
      setCurrentEmployee(updated);
      if (onUpdate) onUpdate(updated);
    }
  };

  const fullName = employee.name
    ? `${employee.name.first || ''} ${employee.name.middle || ''} ${employee.name.last || ''}`.trim()
    : t('employee.details');

  const isNationalIdApproved = employee.nationalId?.status === 'approved' || !!employee.nationalId?.approvedBy;

  // Handle Profile Photo Upload
  const handleUploadPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const res = await employeeService.uploadProfilePhoto(employee._id, file);
      if (res.success) {
        setActionMessage({ type: 'success', text: t('employee.photoUpdated') });
        await syncUpdatedEmployee(res.data);
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: err.response?.data?.message || t('employee.photoUploadFailed') });
    } finally {
      setLoading(false);
      setTimeout(() => setActionMessage({ type: '', text: '' }), 3500);
    }
  };

  // Handle Fayda ID Photos Upload
  const handleUploadIdPhotos = async (e) => {
    e.preventDefault();
    if (!frontIdFile && !backIdFile) {
      setActionMessage({ type: 'error', text: t('employee.selectIdPhotoError') });
      return;
    }

    try {
      setLoading(true);
      const res = await employeeService.uploadNationalIdPhotos(employee._id, frontIdFile, backIdFile);
      if (res.success) {
        setActionMessage({ type: 'success', text: t('employee.idPhotosSuccess') });
        setFrontIdFile(null);
        setBackIdFile(null);
        await syncUpdatedEmployee(res.data);
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: err.response?.data?.message || t('employee.idPhotosFailed') });
    } finally {
      setLoading(false);
      setTimeout(() => setActionMessage({ type: '', text: '' }), 3500);
    }
  };

  // Handle Fayda ID Approval / Rejection
  const handleApproveId = async (status) => {
    let rejectionReason = '';
    if (status === 'rejected') {
      rejectionReason = window.prompt(t('employee.rejectIdPrompt'));
      if (rejectionReason === null) return;
    }

    try {
      setLoading(true);
      const res = await employeeService.approveNationalId(employee._id, status, rejectionReason);
      if (res.success) {
        setActionMessage({
          type: 'success',
          text: t('employee.idStatusUpdated', { status: t(`status.${status}`, status) })
        });
        await syncUpdatedEmployee(res.data);
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: err.response?.data?.message || t('employee.idVerifyFailed') });
    } finally {
      setLoading(false);
      setTimeout(() => setActionMessage({ type: '', text: '' }), 3500);
    }
  };

  // Handle Document Upload
  const handleUploadDocument = async (e) => {
    e.preventDefault();
    if (!docFile || !docTitle.trim()) {
      setActionMessage({ type: 'error', text: t('employee.provideDocTitleFile') });
      return;
    }

    try {
      setLoading(true);
      const res = await employeeService.addDocument(employee._id, docFile, docTitle.trim(), docType);
      if (res.success) {
        setActionMessage({ type: 'success', text: t('employee.docUploaded') });
        setDocFile(null);
        setDocTitle('');
        await syncUpdatedEmployee(res.data);
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: err.response?.data?.message || t('employee.docUploadFailed') });
    } finally {
      setLoading(false);
      setTimeout(() => setActionMessage({ type: '', text: '' }), 3500);
    }
  };

  // Handle Document Approval / Rejection
  const handleApproveDocument = async (documentId, status) => {
    let rejectionReason = '';
    if (status === 'rejected') {
      rejectionReason = window.prompt(t('employee.rejectDocPrompt'));
      if (rejectionReason === null) return;
    }

    try {
      setLoading(true);
      const res = await employeeService.approveDocument(employee._id, documentId, status, rejectionReason);
      if (res.success) {
        setActionMessage({ type: 'success', text: t('employee.docReviewed', { status: t(`status.${status}`, status) }) });
        await syncUpdatedEmployee(res.data);
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: err.response?.data?.message || t('employee.docReviewFailed') });
    } finally {
      setLoading(false);
      setTimeout(() => setActionMessage({ type: '', text: '' }), 3500);
    }
  };

  // Handle Document Deletion
  const handleDeleteDocument = async (documentId) => {
    if (!window.confirm(t('employee.docDeleteConfirm'))) return;
    try {
      setLoading(true);
      const res = await employeeService.removeDocument(employee._id, documentId);
      if (res.success) {
        setActionMessage({ type: 'success', text: t('employee.docRemoved') });
        await syncUpdatedEmployee(res.data);
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: err.response?.data?.message || t('employee.docDeleteFailed') });
    } finally {
      setLoading(false);
      setTimeout(() => setActionMessage({ type: '', text: '' }), 3500);
    }
  };

  // Handle Employment Status Update
  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await employeeService.updateEmploymentStatus(employee._id, newStatus, statusNotes);
      if (res.success) {
        setActionMessage({ type: 'success', text: t('employee.statusUpdated', { status: t(`status.${newStatus}`, newStatus) }) });
        setStatusNotes('');
        await syncUpdatedEmployee(res.data);
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: err.response?.data?.message || t('employee.statusUpdateFailed') });
    } finally {
      setLoading(false);
      setTimeout(() => setActionMessage({ type: '', text: '' }), 3500);
    }
  };

  // Handle Create and Link User Account
  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUserEmail.trim() || !newUserPassword.trim()) {
      setActionMessage({ type: 'error', text: t('employee.emailPasswordRequired') });
      return;
    }

    try {
      setLoading(true);
      const res = await employeeService.createAndLinkUserAccount(employee._id, {
        email: newUserEmail.trim().toLowerCase(),
        password: newUserPassword,
        roles: [newUserRole]
      });
      if (res.success) {
        setActionMessage({ type: 'success', text: t('employee.userCreatedLinked') });
        setNewUserPassword('');
        await syncUpdatedEmployee(res.data);
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: err.response?.data?.message || t('employee.userCreateFailed') });
    } finally {
      setLoading(false);
      setTimeout(() => setActionMessage({ type: '', text: '' }), 3500);
    }
  };

  // Handle Unlink User Account
  const handleUnlinkUser = async () => {
    if (!window.confirm(t('employee.unlinkConfirm'))) return;
    try {
      setLoading(true);
      const res = await employeeService.unlinkUserAccount(employee._id);
      if (res.success) {
        setActionMessage({ type: 'success', text: t('employee.userUnlinked') });
        await syncUpdatedEmployee(res.data);
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: err.response?.data?.message || t('employee.userUnlinkFailed') });
    } finally {
      setLoading(false);
      setTimeout(() => setActionMessage({ type: '', text: '' }), 3500);
    }
  };

  // Handle Delete Employee
  const handleDeleteEmployee = async () => {
    if (!window.confirm(t('employee.deletePermanentConfirm', { num: employee.employeeNumber, name: fullName }))) return;
    try {
      setLoading(true);
      const res = await employeeService.deleteEmployee(employee._id);
      if (res.success) {
        alert(t('employee.deletedSuccess', { num: employee.employeeNumber }));
        onClose();
        if (onUpdate) onUpdate(null);
      }
    } catch (err) {
      alert(err.response?.data?.message || t('employee.deleteFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-white dark:bg-[#0e1626] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Profile Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 bg-slate-50/50 dark:bg-[#070b12]/40">
          <div className="flex items-center gap-3.5">
            {/* Avatar & Photo Upload Trigger */}
            <div className="relative group shrink-0">
              <div className="w-14 h-14 rounded-2xl bg-[#00ced1]/15 text-[#00ced1] font-black flex items-center justify-center text-lg overflow-hidden shadow-sm">
                {employee.profilePhoto ? (
                  <img
                    src={employee.profilePhoto}
                    alt={fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  fullName.charAt(0) || 'E'
                )}
              </div>
              {canEditEmployee(user) && (
                <label className="absolute inset-0 bg-black/50 text-white rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                  <Camera className="w-5 h-5" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadPhoto}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {fullName}
                </h3>
                <StatusBadge status={employee.employmentStatus || 'active'} />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                <span className="font-mono font-bold text-[#00ced1]">#{employee.employeeNumber}</span> &bull;{' '}
                {employee.jobTitle || t('employee.staffMember')} &bull; {employee.department || t('employee.generalDept')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {canEditEmployee(user) && (
              <button
                type="button"
                onClick={() => onEdit(employee)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#00ced1] text-[#020617] hover:brightness-95 transition-all shadow-xs cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>{t('employee.editProfile')}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Message Banner */}
        {actionMessage.text && (
          <div
            className={`mx-4 sm:mx-6 mt-3 p-3 rounded-2xl text-xs flex items-center gap-2 shrink-0 ${actionMessage.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
              }`}
          >
            {actionMessage.type === 'success' ? (
              <CheckCircle className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-4 sm:px-6 pt-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto scrollbar-none shrink-0 bg-slate-50/30 dark:bg-[#070b12]/30">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer ${activeTab === 'overview'
                ? 'border-[#00ced1] text-[#00ced1] bg-white dark:bg-[#0e1626]'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
          >
            {t('employee.overviewTab')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('fayda')}
            className={`px-3 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${activeTab === 'fayda'
                ? 'border-[#00ced1] text-[#00ced1] bg-white dark:bg-[#0e1626]'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
          >
            <span>{t('employee.faydaNationalId')}</span>
            {isNationalIdApproved ? (
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-amber-500" />
            )}
          </button>
          {canViewFinancials(user) && (
            <button
              type="button"
              onClick={() => setActiveTab('compensation')}
              className={`px-3 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer ${activeTab === 'compensation'
                  ? 'border-[#00ced1] text-[#00ced1] bg-white dark:bg-[#0e1626]'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
            >
              {t('employee.compensationTab')}
            </button>
          )}
          <button
            type="button"
            onClick={() => setActiveTab('documents')}
            className={`px-3 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${activeTab === 'documents'
                ? 'border-[#00ced1] text-[#00ced1] bg-white dark:bg-[#0e1626]'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
          >
            <span>{t('employee.documentsCount', { count: employee.employeeDocuments?.length || 0 })}</span>
          </button>
          {canManageUserAccount(user) && (
            <button
              type="button"
              onClick={() => setActiveTab('security')}
              className={`px-3 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer ${activeTab === 'security'
                  ? 'border-[#00ced1] text-[#00ced1] bg-white dark:bg-[#0e1626]'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
            >
              {t('employee.systemAccountTab')}
            </button>
          )}
          {canChangeEmploymentStatus(user) && (
            <button
              type="button"
              onClick={() => setActiveTab('lifecycle')}
              className={`px-3 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer ${activeTab === 'lifecycle'
                  ? 'border-[#00ced1] text-[#00ced1] bg-white dark:bg-[#0e1626]'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
            >
              {t('employee.statusLifecycleTab')}
            </button>
          )}
        </div>

        {/* Scrollable Tab Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs">
          {/* TAB 1: Overview & Bio */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#152238] border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">{t('employee.employmentType', 'Employment Type')}</span>
                  <span className="font-bold text-slate-900 dark:text-white capitalize">
                    {employee.employmentType || 'Full-Time'}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#152238] border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#00ced1]" />
                    <span>{t('employee.workLocation', 'Work Location')}</span>
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white truncate block">
                    {employee.workLocation || 'Headquarters (HQ)'}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#152238] border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-[#00ced1]" />
                    <span>{t('employee.branch', 'Branch')}</span>
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white truncate block">
                    {employee.branch || 'Main Branch - Bole'}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#152238] border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block flex items-center gap-1">
                    <Users className="w-3 h-3 text-[#00ced1]" />
                    <span>{t('employee.manager', 'Direct Manager')}</span>
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white truncate block">
                    {employee.manager
                      ? typeof employee.manager === 'object'
                        ? `${employee.manager.name ? employee.manager.name.first + ' ' + (employee.manager.name.last || '') : employee.manager.employeeNumber}`
                        : employee.manager
                      : t('employee.noManager', 'None / Top Executive')}
                  </span>
                </div>
              </div>

              {/* Demographics: Gender, Marital, Religion, Blood Group */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#152238] border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">{t('employee.gender', 'Gender')} & {t('employee.maritalStatus', 'Marital')}</span>
                  <span className="font-bold text-slate-900 dark:text-white capitalize">
                    {employee.gender || 'N/A'}, {employee.maritalStatus || 'Single'}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#152238] border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">{t('employee.religion', 'Religion')}</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {employee.religion || t('employee.notSpecified')}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#152238] border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">{t('employee.bloodGroup', 'Blood Group')}</span>
                  <span className="font-mono font-bold text-[#00ced1]">
                    {employee.bloodGroup || t('employee.unknown')}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#152238] border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">{t('employee.hireDate', 'Hire Date')}</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {employee.hireDate ? new Date(employee.hireDate).toLocaleDateString() : t('common.notAvailable')}
                  </span>
                </div>
              </div>

              {/* Education Level Card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#152238]/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-[#00ced1]" />
                    <span>{t('employee.educationTitle', 'Current Education Level & Qualifications')}</span>
                  </h4>
                  {employee.education?.level && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#00ced1]/15 text-[#00ced1] border border-[#00ced1]/30">
                      {employee.education.level}
                    </span>
                  )}
                </div>
                {employee.education && (employee.education.level || employee.education.institution || employee.education.fieldOfStudy) ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <span className="text-slate-400 text-[10px] block">{t('employee.fieldOfStudy', 'Field of Study / Major')}</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{employee.education.fieldOfStudy || t('common.notAvailable')}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">{t('employee.institution', 'Institution / University')}</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{employee.education.institution || t('common.notAvailable')}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">{t('employee.graduationYear', 'Graduation Date / Year')}</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{employee.education.graduationYear || t('common.notAvailable')}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-400 italic">{t('employee.noEducationRecord')}</p>
                )}
              </div>

              {/* Warranty / Guarantor Card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#152238]/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <HeartHandshake className="w-4 h-4 text-[#00ced1]" />
                    <span>{t('employee.warrantyTitle', 'Warranty / Guarantor')}</span>
                  </h4>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                    {t('employee.legalGuarantee')}
                  </span>
                </div>
                {employee.guarantors && employee.guarantors.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {employee.guarantors.map((g, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-white dark:bg-[#0e1626] border border-slate-200 dark:border-slate-700 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-slate-800 dark:text-slate-200">{g.name}</p>
                          <span className="px-2 py-0.2 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {g.relationship || t('employee.guarantorDefault')}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                          <div>
                            <span className="text-[10px] text-slate-400 block">{t('employee.primaryPhone', 'Phone')}</span>
                            <span className="font-mono text-slate-700 dark:text-slate-300">{g.phone || '—'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">{t('employee.faydaFanShort')}</span>
                            <span className="font-mono font-bold text-[#00ced1] text-[11px] truncate block">
                              {g.nationalId?.fanNumber || '—'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">{t('employee.faydaFinShort')}</span>
                            <span className="font-mono font-bold text-slate-700 dark:text-slate-300 text-[11px] truncate block">
                              {g.nationalId?.finNumber || '—'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic">{t('employee.noGuarantor')}</p>
                )}
              </div>

              {/* Contact Card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#152238]/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-[#00ced1]" />
                  <span>{t('employee.contactInformation')}</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-slate-400 text-[10px] block">{t('employee.primaryPhone')}</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{employee.primaryPhone || t('common.notAvailable')}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">{t('employee.alternativePhone')}</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{employee.alternativePhone || t('common.notAvailable')}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">{t('employee.email')}</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{employee.email || t('common.notAvailable')}</span>
                  </div>
                </div>
                {employee.homeAddress && (
                  <div className="pt-1">
                    <span className="text-slate-400 text-[10px] block">{t('employee.homeAddress')}</span>
                    <span className="text-slate-700 dark:text-slate-300">{employee.homeAddress}</span>
                  </div>
                )}
              </div>

              {/* Emergency Contacts */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#152238]/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-[#00ced1]" />
                  <span>{t('employee.emergencyContacts')}</span>
                </h4>
                {employee.emergencyContacts?.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {employee.emergencyContacts.map((c, i) => (
                      <div key={i} className="p-3 rounded-xl bg-white dark:bg-[#0e1626] border border-slate-200 dark:border-slate-700">
                        <p className="font-bold text-slate-800 dark:text-slate-200">{c.name}</p>
                        <p className="text-[11px] text-slate-500">
                          {c.phone} &bull; <span className="capitalize">{t(`employee.emergencyRelations.${c.relationship}`, c.relationship || t('employee.emergencyDefault'))}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400">{t('employee.noEmergencyContacts')}</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Fayda National ID */}
          {activeTab === 'fayda' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#152238]/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-[#00ced1]" />
                    <span>{t('employee.faydaRecordTitle')}</span>
                  </h4>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${isNationalIdApproved
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                        : employee.nationalId?.status === 'rejected'
                          ? 'bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400'
                          : 'bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400'
                      }`}
                  >
                    {isNationalIdApproved
                      ? t('employee.verifiedId')
                      : employee.nationalId?.status === 'rejected'
                        ? t('employee.rejectedId')
                        : t('employee.pendingId')}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] block">{t('employee.fanNumber')}</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {employee.nationalId?.fanNumber || t('employee.notProvided')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">{t('employee.finNumber')}</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {employee.nationalId?.finNumber || t('employee.notProvided')}
                    </span>
                  </div>
                </div>

                {employee.nationalId?.rejectionReason && (
                  <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
                    <strong>{t('employee.rejectionReason')}</strong> {employee.nationalId.rejectionReason}
                  </div>
                )}

                {/* ID Images Preview */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-3 bg-white dark:bg-[#0e1626] text-center space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{t('employee.idCardFront')}</span>
                    {employee.nationalId?.frontImageUrl ? (
                      <a href={employee.nationalId.frontImageUrl} target="_blank" rel="noreferrer" className="block group relative">
                        <img
                          src={employee.nationalId.frontImageUrl}
                          alt="Fayda Front"
                          className="h-36 w-full object-cover rounded-xl"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold rounded-xl transition-opacity">
                          <ExternalLink className="w-4 h-4 mr-1" /> {t('employee.viewFull')}
                        </div>
                      </a>
                    ) : (
                      <div className="h-36 flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400">
                        {t('employee.noFrontPhoto')}
                      </div>
                    )}
                  </div>

                  <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-3 bg-white dark:bg-[#0e1626] text-center space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{t('employee.idCardBack')}</span>
                    {employee.nationalId?.backImageUrl ? (
                      <a href={employee.nationalId.backImageUrl} target="_blank" rel="noreferrer" className="block group relative">
                        <img
                          src={employee.nationalId.backImageUrl}
                          alt="Fayda Back"
                          className="h-36 w-full object-cover rounded-xl"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold rounded-xl transition-opacity">
                          <ExternalLink className="w-4 h-4 mr-1" /> {t('employee.viewFull')}
                        </div>
                      </a>
                    ) : (
                      <div className="h-36 flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400">
                        {t('employee.noBackPhoto')}
                      </div>
                    )}
                  </div>
                </div>

                {/* Upload ID Photos Form */}
                {canEditEmployee(user) && (
                  <form onSubmit={handleUploadIdPhotos} className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">
                      {t('employee.uploadIdPhotosTitle')}
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">{t('employee.frontImageFile')}</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setFrontIdFile(e.target.files?.[0] || null)}
                          className="brand-input text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">{t('employee.backImageFile')}</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setBackIdFile(e.target.files?.[0] || null)}
                          className="brand-input text-xs"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={loading || (!frontIdFile && !backIdFile)}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition-opacity disabled:opacity-40 cursor-pointer"
                    >
                      {loading ? t('employee.uploading') : t('employee.saveIdPhotos')}
                    </button>
                  </form>
                )}

                {/* Verification Actions (HR Admin RBAC) */}
                {canApproveNationalId(user) && (
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
                    {!isNationalIdApproved && (
                      <button
                        type="button"
                        onClick={() => handleApproveId('approved')}
                        disabled={loading}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 flex items-center gap-1.5 shadow-sm hover:brightness-95 cursor-pointer"
                        style={{ backgroundColor: '#00ced1' }}
                      >
                        <UserCheck className="w-4 h-4" />
                        <span>{t('employee.verifyApproveId')}</span>
                      </button>
                    )}

                    {employee.nationalId?.status !== 'rejected' && (
                      <button
                        type="button"
                        onClick={() => handleApproveId('rejected')}
                        disabled={loading}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 hover:bg-rose-100 transition-colors cursor-pointer"
                      >
                        {t('employee.rejectNationalId')}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Compensation & Bank (RBAC Protected) */}
          {activeTab === 'compensation' && canViewFinancials(user) && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#152238]/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Banknote className="w-4 h-4 text-[#00ced1]" />
                  <span>{t('employee.salaryStructure')}</span>
                </h4>
                <div className="p-4 rounded-2xl bg-white dark:bg-[#0e1626] border border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">{t('employee.basicSalary')}</span>
                    <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                      {employee.basicSalary ? `${employee.basicSalary.toLocaleString()} ${t('common.currencyEtb')}` : `0 ${t('common.currencyEtb')}`}
                    </span>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#00ced1]/10 text-[#00ced1] border border-[#00ced1]/20">
                    {t('employee.grossMonthlyBase')}
                  </span>
                </div>
              </div>

              {/* Bank Accounts */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#152238]/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-white">{t('employee.disbursementBanks')}</h4>
                {employee.bankAccounts?.length > 0 ? (
                  <div className="space-y-2">
                    {employee.bankAccounts.map((b, i) => (
                      <div key={i} className="p-3 rounded-xl bg-white dark:bg-[#0e1626] border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{b.bankName}</p>
                          <p className="text-xs font-mono text-slate-500 mt-0.5">{b.accountNumber}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] text-slate-400 block">{b.holderName}</span>
                          {b.isPrimary && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                              {t('employee.primaryAccount')}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400">{t('employee.noBankAccount')}</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: Documents */}
          {activeTab === 'documents' && (
            <div className="space-y-4">
              {/* Document List */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#152238]/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-[#00ced1]" />
                    <span>{t('employee.complianceFiles')}</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => onOpenEvidence(employee)}
                    className="text-xs font-bold text-[#00ced1] hover:underline flex items-center gap-1"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                    <span>{t('employee.openEvidenceDrawer')}</span>
                  </button>
                </div>

                {employee.employeeDocuments?.length > 0 ? (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {employee.employeeDocuments.map((doc) => (
                      <div key={doc._id} className="py-2.5 flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{doc.title}</span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500">
                              {t(`employee.docCategories.${doc.type}`, doc.type || 'Document')}
                            </span>
                            <span
                              className={`px-2 py-0.2 rounded-full text-[9px] font-bold ${doc.status === 'approved'
                                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                                  : doc.status === 'rejected'
                                    ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
                                    : 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
                                }`}
                            >
                              {t(`status.${doc.status || 'pending'}`, doc.status || 'pending')}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {t('employee.uploadedOn', { date: new Date(doc.uploadedAt).toLocaleDateString() })}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                            title={t('employee.openFile')}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>

                          {canApproveDocuments(user) && doc.status !== 'approved' && (
                            <button
                              type="button"
                              onClick={() => handleApproveDocument(doc._id, 'approved')}
                              className="px-2 py-1 rounded-lg text-[10px] font-bold bg-[#00ced1] text-[#020617] cursor-pointer"
                            >
                              {t('employee.approve')}
                            </button>
                          )}

                          {canEditEmployee(user) && (
                            <button
                              type="button"
                              onClick={() => handleDeleteDocument(doc._id)}
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                              title={t('employee.deleteDocument')}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400">{t('employee.noDocumentsYet')}</p>
                )}
              </div>

              {/* Upload Document Form */}
              {canEditEmployee(user) && (
                <form onSubmit={handleUploadDocument} className="p-4 rounded-2xl bg-slate-50 dark:bg-[#152238]/60 border border-slate-200 dark:border-slate-800 space-y-3">
                  <h4 className="font-bold text-slate-900 dark:text-white">{t('employee.uploadNewDoc')}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">{t('employee.docTitle')}</label>
                      <input
                        type="text"
                        value={docTitle}
                        onChange={(e) => setDocTitle(e.target.value)}
                        placeholder={t('employee.docTitlePlaceholder')}
                        className="brand-input"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">{t('employee.docCategory')}</label>
                      <select value={docType} onChange={(e) => setDocType(e.target.value)} className="brand-input">
                        <option value="Contract">{t('employee.docCategories.Contract')}</option>
                        <option value="Certificate">{t('employee.docCategories.Certificate')}</option>
                        <option value="Guarantor">{t('employee.docCategories.Guarantor')}</option>
                        <option value="CV">{t('employee.docCategories.CV')}</option>
                        <option value="ID">{t('employee.docCategories.ID')}</option>
                        <option value="Other">{t('employee.docCategories.Other')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">{t('employee.fileAttachment')}</label>
                      <input
                        type="file"
                        onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                        className="brand-input text-xs"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !docFile || !docTitle.trim()}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-[#00ced1] text-[#020617] disabled:opacity-40 cursor-pointer shadow-sm hover:brightness-95"
                  >
                    {loading ? t('employee.uploading') : t('employee.uploadDocument')}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 5: System User Account (HR Admin RBAC) */}
          {activeTab === 'security' && canManageUserAccount(user) && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#152238]/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Key className="w-4 h-4 text-[#00ced1]" />
                    <span>{t('employee.erpLoginAccount')}</span>
                  </h4>
                  {employee.user ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                      {t('employee.accountLinked')}
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                      {t('employee.noLoginLinked')}
                    </span>
                  )}
                </div>

                {employee.user ? (
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-xl bg-white dark:bg-[#0e1626] border border-slate-200 dark:border-slate-700/80 space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold">{t('employee.emailLogin')}</span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {typeof employee.user === 'object' ? employee.user.email : employee.email}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold">{t('employee.assignedRoles')}</span>
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {(typeof employee.user === 'object' && employee.user.roles ? employee.user.roles : ['employee']).map(
                              (r) => (
                                <span
                                  key={r}
                                  className="px-2 py-0.2 rounded-full text-[9px] font-bold uppercase bg-[#00ced1]/15 text-[#00ced1]"
                                >
                                  {t(`roles.${r}`, r)}
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleUnlinkUser}
                      disabled={loading}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 hover:bg-rose-100 transition-colors cursor-pointer"
                    >
                      {t('employee.unlinkAccount')}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleCreateUser} className="space-y-3 pt-2">
                    <p className="text-slate-600 dark:text-slate-400 text-xs">
                      {t('employee.noLoginDesc')}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">{t('employee.loginEmail')}</label>
                        <input
                          type="email"
                          required
                          value={newUserEmail}
                          onChange={(e) => setNewUserEmail(e.target.value)}
                          placeholder={t('employee.loginEmailPlaceholder')}
                          className="brand-input"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">{t('employee.tempPassword')}</label>
                        <input
                          type="text"
                          required
                          value={newUserPassword}
                          onChange={(e) => setNewUserPassword(e.target.value)}
                          placeholder={t('employee.tempPasswordPlaceholder')}
                          className="brand-input font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">{t('employee.assignedRole')}</label>
                        <select
                          value={newUserRole}
                          onChange={(e) => setNewUserRole(e.target.value)}
                          className="brand-input"
                        >
                          {ALL_ROLES.map((r) => (
                            <option key={r} value={r}>
                              {t(`roles.${r}`, r.toUpperCase())}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-[#00ced1] text-[#020617] shadow-sm hover:brightness-95 cursor-pointer"
                    >
                      {loading ? t('employee.creating') : t('employee.createLinkAccount')}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: Status & Lifecycle (HR Admin RBAC) */}
          {activeTab === 'lifecycle' && canChangeEmploymentStatus(user) && (
            <div className="space-y-4">
              <form onSubmit={handleStatusUpdate} className="p-4 rounded-2xl bg-slate-50 dark:bg-[#152238]/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <RefreshCw className="w-4 h-4 text-[#00ced1]" />
                  <span>{t('employee.updateEmploymentStatus')}</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">{t('employee.newEmploymentStatus')}</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="brand-input"
                    >
                      {EMPLOYMENT_STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {isAmharic ? s.amLabel : s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">{t('employee.statusNotesLabel')}</label>
                    <input
                      type="text"
                      value={statusNotes}
                      onChange={(e) => setStatusNotes(e.target.value)}
                      placeholder={t('employee.statusNotesPlaceholder')}
                      className="brand-input"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading || newStatus === employee.employmentStatus}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#00ced1] text-[#020617] disabled:opacity-40 cursor-pointer shadow-sm hover:brightness-95"
                >
                  {loading ? t('employee.updating') : t('employee.confirmStatusChange')}
                </button>
              </form>

              {/* Danger Zone: Employee Deletion (Executive Roles Only) */}
              {canDeleteEmployee(user) && (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 space-y-3">
                  <h4 className="font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                    <Trash2 className="w-4 h-4" />
                    <span>{t('employee.dangerZoneTitle')}</span>
                  </h4>
                  <p className="text-xs text-rose-600 dark:text-rose-300">
                    {t('employee.dangerZoneDesc')}
                  </p>
                  <button
                    type="button"
                    onClick={handleDeleteEmployee}
                    disabled={loading}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 transition-colors cursor-pointer shadow-sm"
                  >
                    {t('employee.deletePersonnelRecord')}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-[#070b12]/40">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenEvidence(employee)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Paperclip className="w-3.5 h-3.5" />
              <span>{t('employee.evidenceDrawerBtn')}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            {t('employee.closeProfile')}
          </button>
        </div>
      </div>
    </div>
  );
}
