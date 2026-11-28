import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Award,
  Plus,
  Calendar,
  MapPin,
  Users,
  Paperclip,
  Eye,
  X,
  AlertCircle,
  UserPlus,
  Search,
  Clock,
  DollarSign,
  Building,
  CheckSquare
} from 'lucide-react';
import { trainingService, employeeService } from '../../../services/hrService';
import StatusBadge from '../../../components/hr/StatusBadge';
import EvidenceDrawer from '../../../components/hr/EvidenceDrawer';
import { useAuth } from '../../../context/AuthContext';
import { MANAGEMENT_ROLES, DEPARTMENTS, hasAnyRole } from '../../../utils/rbac';

export default function TrainingList() {
  const { t, i18n } = useTranslation();
  const isAmharic = i18n.language === 'am';
  const { user } = useAuth();

  const isManagement = hasAnyRole(user, MANAGEMENT_ROLES);

  const [trainings, setTrainings] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(isManagement ? 'all' : 'my');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState(null);
  const [evidenceTarget, setEvidenceTarget] = useState(null);

  // Create form — ALL Schema Fields
  const [title, setTitle] = useState('');
  const [trainingType, setTrainingType] = useState('internal');
  const [trainerName, setTrainerName] = useState('');
  const [provider, setProvider] = useState('');
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
  const [empSearch, setEmpSearch] = useState('');
  const [location, setLocation] = useState('Vector HQ Training Room');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [duration, setDuration] = useState('');
  const [budget, setBudget] = useState(0);
  const [status, setStatus] = useState('scheduled');
  const [description, setDescription] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Add Participant inside detail modal
  const [enrollEmployeeId, setEnrollEmployeeId] = useState('');

  const fetchTrainings = async () => {
    try {
      setLoading(true);
      const res =
        activeTab === 'all' && isManagement
          ? await trainingService.getTrainings({ limit: 100 })
          : await trainingService.getMyTrainings();
      if (res.success) setTrainings(res.data || []);

      if (isManagement && employees.length === 0) {
        const empRes = await employeeService.getEmployees({ limit: 200, status: 'active' });
        if (empRes.success) setEmployees(empRes.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainings();
  }, [activeTab]);

  const toggleDepartment = (dept) => {
    setSelectedDepartments((prev) =>
      prev.includes(dept) ? prev.filter((d) => d !== dept) : [...prev, dept]
    );
  };

  const toggleEmployee = (empId) => {
    setSelectedEmployeeIds((prev) =>
      prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
    );
  };

  const selectEmployeesByDept = () => {
    if (selectedDepartments.length === 0) return;
    const matchingIds = employees
      .filter((e) => selectedDepartments.includes(e.department))
      .map((e) => e._id);
    setSelectedEmployeeIds((prev) => Array.from(new Set([...prev, ...matchingIds])));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError('');
      const res = await trainingService.createTraining({
        title: title.trim(),
        trainingType,
        trainerName: trainerName.trim(),
        provider: provider.trim(),
        department: selectedDepartments,
        location: location.trim(),
        startDate,
        endDate,
        duration: duration.trim(),
        budget: Number(budget) || 0,
        status,
        description: description.trim(),
        note: note.trim(),
        participants: selectedEmployeeIds.map((id) => ({ employee: id }))
      });
      if (res.success) {
        setIsCreateOpen(false);
        setTitle('');
        setDescription('');
        setNote('');
        setSelectedDepartments([]);
        setSelectedEmployeeIds([]);
        fetchTrainings();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create training');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateTrainingStatus = async (newStatus) => {
    if (!selectedTraining) return;
    try {
      const res = await trainingService.updateTraining(selectedTraining._id, { status: newStatus });
      if (res.success) {
        setSelectedTraining(res.data);
        fetchTrainings();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update training status');
    }
  };

  const handleEnroll = async () => {
    if (!enrollEmployeeId || !selectedTraining) return;
    try {
      const res = await trainingService.addParticipant(selectedTraining._id, {
        employeeId: enrollEmployeeId
      });
      if (res.success) {
        const updated = await trainingService.getTrainingById(selectedTraining._id);
        if (updated.success) setSelectedTraining(updated.data);
        setEnrollEmployeeId('');
        fetchTrainings();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to enroll participant');
    }
  };

  const handleUpdateParticipant = async (participantId, updates) => {
    try {
      const res = await trainingService.updateParticipant(selectedTraining._id, participantId, updates);
      if (res.success) {
        const updated = await trainingService.getTrainingById(selectedTraining._id);
        if (updated.success) setSelectedTraining(updated.data);
        fetchTrainings();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Update failed');
    }
  };

  const filteredModalEmployees = employees.filter((e) => {
    const q = empSearch.toLowerCase();
    const name = [e.name?.first, e.name?.last].filter(Boolean).join(' ').toLowerCase();
    return (
      !q ||
      name.includes(q) ||
      e.department?.toLowerCase().includes(q) ||
      e.employeeNumber?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="w-6 h-6 text-[#00ced1]" />
            <span>{t('hrPages.training.title')}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {t('hrPages.training.subtitle')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isManagement && (
            <>
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-[#00ced1] text-white'
                    : 'bg-white dark:bg-[#0e1626] border border-slate-200 dark:border-slate-800'
                }`}
              >
                {isAmharic ? 'ሁሉም ስልጠናዎች' : 'All Programs'}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('my')}
                className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                  activeTab === 'my'
                    ? 'bg-[#00ced1] text-white'
                    : 'bg-white dark:bg-[#0e1626] border border-slate-200 dark:border-slate-800'
                }`}
              >
                {isAmharic ? 'የእኔ ስልጠናዎች' : 'My Trainings'}
              </button>
              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#00ced1] hover:bg-[#00b5b8] text-white text-xs font-black shadow-lg shadow-[#00ced1]/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{isAmharic ? 'አዲስ ስልጠና' : 'New Training'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Cards Grid */}
      <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 shadow-xs p-6">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">{t('hrPages.training.loading')}</div>
        ) : trainings.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 space-y-2">
            <Award className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
            <p className="font-bold text-slate-600 dark:text-slate-300">{t('hrPages.training.empty')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trainings.map((tr) => (
              <div
                key={tr._id}
                className="p-5 rounded-2xl bg-slate-50 dark:bg-[#152238] border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between gap-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-black text-sm text-slate-900 dark:text-white">{tr.title}</h3>
                    <StatusBadge status={tr.status} />
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                    {tr.trainingType?.replace('_', ' ')} • {tr.trainerName || 'Trainer N/A'}
                    {tr.provider && ` (${tr.provider})`}
                  </div>
                  {Array.isArray(tr.department) && tr.department.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {tr.department.map((d) => (
                        <span
                          key={d}
                          className="px-2 py-0.5 rounded-md bg-[#00ced1]/10 text-[#00ced1] text-[10px] font-bold"
                        >
                          {d}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="text-[11px] text-slate-400 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>
                        {new Date(tr.startDate).toLocaleDateString()} →{' '}
                        {new Date(tr.endDate).toLocaleDateString()}
                        {tr.duration && ` (${tr.duration})`}
                      </span>
                    </div>
                    {tr.location && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{tr.location}</span>
                      </div>
                    )}
                    {tr.budget > 0 && (
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>
                          {Number(tr.budget).toLocaleString()} {isAmharic ? 'ብር' : 'ETB'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-500 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-[#00ced1]" />
                    <span>
                      {tr.participants?.length || 0} {isAmharic ? 'ተሳታፊዎች' : 'Participants'}
                    </span>
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEvidenceTarget(tr)}
                      title={isAmharic ? 'ሰነዶች' : 'Evidence'}
                      className="p-1.5 text-slate-400 hover:text-[#00ced1] rounded-lg cursor-pointer"
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedTraining(tr)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#00ced1]/10 text-[#00ced1] font-black cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{isAmharic ? 'ዝርዝር' : 'Manage'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Training Modal (Comprehensive Schema + Department & Employee Checklists) */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0e1626] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-[#152238]/50 shrink-0">
              <h2 className="font-black text-base text-slate-900 dark:text-white">
                {isAmharic ? 'አዲስ የስልጠና ፕሮግራም መመዝገቢያ' : 'Create Training Program'}
              </h2>
              <button type="button" onClick={() => setIsCreateOpen(false)} className="p-1 text-slate-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 text-rose-500 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}

              {/* Title & Type & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold mb-1">{isAmharic ? 'የስልጠና ርዕስ *' : 'Training Title *'}</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Advanced Large-Format Printing Safety"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238]"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">{isAmharic ? 'የስልጠና ዓይነት' : 'Training Type'}</label>
                  <select
                    value={trainingType}
                    onChange={(e) => setTrainingType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238]"
                  >
                    <option value="internal">Internal</option>
                    <option value="external">External</option>
                    <option value="online">Online</option>
                    <option value="workshop">Workshop</option>
                    <option value="on_the_job">On The Job</option>
                    <option value="certification">Certification</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-1">{isAmharic ? 'ሁኔታ' : 'Status'}</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238]"
                  >
                    <option value="planned">Planned</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="in_progress">In Progress</option>
                  </select>
                </div>
              </div>

              {/* Trainer, Provider, Location, Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-bold mb-1">{isAmharic ? 'አሰልጣኝ' : 'Trainer Name'}</label>
                  <input
                    type="text"
                    value={trainerName}
                    onChange={(e) => setTrainerName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238]"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">{isAmharic ? 'አቅራቢ ተቋም' : 'Training Provider'}</label>
                  <input
                    type="text"
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    placeholder="e.g. Ethiopian Management Inst."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238]"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">{isAmharic ? 'ቦታ' : 'Location'}</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238]"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">{isAmharic ? 'ቆይታ' : 'Duration'}</label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="e.g. 3 Days / 18 Hours"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238]"
                  />
                </div>
              </div>

              {/* Dates & Budget */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold mb-1">{isAmharic ? 'መጀመሪያ ቀን *' : 'Start Date *'}</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238]"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">{isAmharic ? 'ማብቂያ ቀን *' : 'End Date *'}</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238]"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">{isAmharic ? 'በጀት (ብር)' : 'Budget (ETB)'}</label>
                  <input
                    type="number"
                    min="0"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238]"
                  />
                </div>
              </div>

              {/* Target Departments Checklist */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#152238] border border-slate-200/80 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-black text-[#00ced1] flex items-center gap-1.5 uppercase text-[11px]">
                    <Building className="w-3.5 h-3.5" />
                    <span>{isAmharic ? 'የታለሙ ዲፓርትመንቶች (Check List)' : 'Target Departments (Checklist)'}</span>
                  </span>
                  {selectedDepartments.length > 0 && (
                    <button
                      type="button"
                      onClick={selectEmployeesByDept}
                      className="text-[11px] font-black text-[#00ced1] hover:underline cursor-pointer"
                    >
                      {isAmharic
                        ? 'የተመረጡ ዲፓርትመንት ሰራተኞችን በሙሉ ምረጥ'
                        : 'Auto-Check Employees in Selected Depts'}
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {DEPARTMENTS.map((dept) => (
                    <label
                      key={dept}
                      className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-[#0e1626] border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-[#00ced1]"
                    >
                      <input
                        type="checkbox"
                        checked={selectedDepartments.includes(dept)}
                        onChange={() => toggleDepartment(dept)}
                        className="accent-[#00ced1] w-3.5 h-3.5"
                      />
                      <span className="truncate font-medium">{dept}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Target Employees Checklist */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#152238] border border-slate-200/80 dark:border-slate-800 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-black text-[#00ced1] flex items-center gap-1.5 uppercase text-[11px]">
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>
                      {isAmharic ? 'ተሳታፊ ሰራተኞችን ይምረጡ' : 'Select Employees to Enroll'} (
                      {selectedEmployeeIds.length})
                    </span>
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder={isAmharic ? 'ሰራተኛ ፈልግ...' : 'Search employee...'}
                        value={empSearch}
                        onChange={(e) => setEmpSearch(e.target.value)}
                        className="pl-8 pr-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0e1626] text-[11px]"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedEmployeeIds(
                          selectedEmployeeIds.length === employees.length
                            ? []
                            : employees.map((e) => e._id)
                        )
                      }
                      className="text-[11px] font-bold text-slate-500 hover:text-[#00ced1] cursor-pointer"
                    >
                      {selectedEmployeeIds.length === employees.length
                        ? isAmharic
                          ? 'ሁሉንም አንሳ'
                          : 'Uncheck All'
                        : isAmharic
                        ? 'ሁሉንም ምረጥ'
                        : 'Check All'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
                  {filteredModalEmployees.map((emp) => {
                    const name = [emp.name?.first, emp.name?.last].filter(Boolean).join(' ');
                    return (
                      <label
                        key={emp._id}
                        className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-[#0e1626] border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-[#00ced1]"
                      >
                        <input
                          type="checkbox"
                          checked={selectedEmployeeIds.includes(emp._id)}
                          onChange={() => toggleEmployee(emp._id)}
                          className="accent-[#00ced1] w-3.5 h-3.5 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 dark:text-white truncate">{name}</div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {emp.employeeNumber} • {emp.department}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Description & Note */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">{isAmharic ? 'የስልጠና መግለጫ' : 'Description / Syllabus'}</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238] resize-none"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">{isAmharic ? 'ተጨማሪ ማስታወሻ' : 'Internal Notes'}</label>
                  <textarea
                    rows={2}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238] resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 font-bold cursor-pointer"
                >
                  {isAmharic ? 'ሰርዝ' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-[#00ced1] text-white font-black cursor-pointer"
                >
                  {submitting ? '...' : isAmharic ? 'ስልጠና ፍጠር' : 'Create Training'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Training Detail & Participants Modal */}
      {selectedTraining && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0e1626] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-[#152238]/50">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-black text-base text-slate-900 dark:text-white">
                    {selectedTraining.title}
                  </h2>
                  <StatusBadge status={selectedTraining.status} />
                </div>
                <p className="text-xs text-slate-400">
                  {selectedTraining.trainerName} • {selectedTraining.provider || 'Internal'} •{' '}
                  {selectedTraining.location}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTraining(null)}
                className="p-2 text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {isManagement && (
                <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 dark:bg-[#152238]">
                  <span className="font-bold">{isAmharic ? 'የፕሮግራሙ ሁኔታ፡' : 'Program Status:'}</span>
                  <select
                    value={selectedTraining.status}
                    onChange={(e) => handleUpdateTrainingStatus(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0e1626] font-bold"
                  >
                    <option value="planned">Planned</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              )}

              {selectedTraining.description && (
                <p className="text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-[#152238] p-3 rounded-xl">
                  {selectedTraining.description}
                </p>
              )}

              {isManagement && (
                <div className="flex gap-2">
                  <select
                    value={enrollEmployeeId}
                    onChange={(e) => setEnrollEmployeeId(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238]"
                  >
                    <option value="">
                      -- {isAmharic ? 'ተጨማሪ ሰራተኛ ለመመዝገብ ይምረጡ' : 'Add Employee to Training'} --
                    </option>
                    {employees.map((e) => (
                      <option key={e._id} value={e._id}>
                        {[e.name?.first, e.name?.last].filter(Boolean).join(' ')} ({e.department})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleEnroll}
                    disabled={!enrollEmployeeId}
                    className="px-4 py-2 rounded-xl bg-[#00ced1] text-white font-black flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>{isAmharic ? 'መዝግብ' : 'Enroll'}</span>
                  </button>
                </div>
              )}

              <div className="space-y-2">
                <h3 className="font-black text-slate-400 uppercase tracking-wider text-[11px]">
                  {isAmharic ? 'ተሳታፊ ሰራተኞች እና ውጤት' : 'Participants & Scores'} (
                  {selectedTraining.participants?.length || 0})
                </h3>
                {(selectedTraining.participants || []).map((p) => {
                  const name = p.employee
                    ? [p.employee.name?.first, p.employee.name?.last].filter(Boolean).join(' ')
                    : 'Participant';
                  return (
                    <div
                      key={p._id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-[#152238] flex flex-wrap items-center justify-between gap-2"
                    >
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{name}</div>
                        <div className="text-[11px] text-slate-400">{p.employee?.department}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isManagement ? (
                          <>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              placeholder="Score"
                              defaultValue={p.score ?? ''}
                              onBlur={(e) => {
                                if (e.target.value !== '') {
                                  handleUpdateParticipant(p._id, { score: Number(e.target.value) });
                                }
                              }}
                              className="w-16 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0e1626] font-bold"
                            />
                            <select
                              value={p.completionStatus}
                              onChange={(e) =>
                                handleUpdateParticipant(p._id, { completionStatus: e.target.value })
                              }
                              className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0e1626] font-bold"
                            >
                              <option value="enrolled">Enrolled</option>
                              <option value="in_progress">In Progress</option>
                              <option value="completed">Completed</option>
                              <option value="failed">Failed</option>
                              <option value="dropped">Dropped</option>
                            </select>
                          </>
                        ) : (
                          <>
                            {p.score !== undefined && (
                              <span className="font-black text-[#00ced1]">{p.score}/100</span>
                            )}
                            <StatusBadge status={p.completionStatus} />
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {evidenceTarget && (
        <EvidenceDrawer
          isOpen={Boolean(evidenceTarget)}
          onClose={() => setEvidenceTarget(null)}
          entityType="Training"
          entityId={evidenceTarget._id}
          entityTitle={evidenceTarget.title}
        />
      )}
    </div>
  );
}
