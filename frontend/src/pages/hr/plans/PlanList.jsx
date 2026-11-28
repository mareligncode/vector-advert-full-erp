import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FileSpreadsheet,
  Plus,
  Building,
  Paperclip,
  Eye,
  X,
  AlertCircle,
  CheckSquare,
  UploadCloud,
  CheckCircle2,
  Trash2,
  TrendingUp,
  Flag,
  Target,
  Activity,
  Wrench
} from 'lucide-react';
import { planService, employeeService, evidenceService } from '../../../services/hrService';
import StatusBadge from '../../../components/hr/StatusBadge';
import EvidenceDrawer from '../../../components/hr/EvidenceDrawer';
import { useAuth } from '../../../context/AuthContext';
import { MANAGEMENT_ROLES, EXECUTIVE_ROLES, DEPARTMENTS, hasAnyRole } from '../../../utils/rbac';

export default function PlanList() {
  const { t, i18n } = useTranslation();
  const isAmharic = i18n.language === 'am';
  const { user } = useAuth();

  const isManagement = hasAnyRole(user, MANAGEMENT_ROLES);
  const isExecutive = hasAnyRole(user, EXECUTIVE_ROLES);

  const [plans, setPlans] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [evidenceTarget, setEvidenceTarget] = useState(null);

  // Create Form — 100% Matching Screenshot + Schema
  // 1. Basic Information
  const [name, setName] = useState('');
  const [type, setType] = useState('daily'); // Division: Daily, Weekly, Monthly, Quarterly, Half Yearly, Yearly
  const [periodLabel, setPeriodLabel] = useState('');
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [parentPlan, setParentPlan] = useState('');
  const [leader, setLeader] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // 2. Key Goal & Strategy
  const [keyGoal, setKeyGoal] = useState('');
  const [description, setDescription] = useState('');

  // 3. Task Details & Metrics
  const [taskDetail, setTaskDetail] = useState('');
  const [kpiText, setKpiText] = useState('');
  const [target, setTarget] = useState('');
  const [budget, setBudget] = useState('');
  const [supportTeamText, setSupportTeamText] = useState('');
  const [selectedTeamIds, setSelectedTeamIds] = useState([]);
  const [remark, setRemark] = useState('');

  // 4. Activity & Output
  const [activity, setActivity] = useState('');
  const [expectedOutput, setExpectedOutput] = useState('');
  const [priority, setPriority] = useState('medium');
  const [correctiveAction, setCorrectiveAction] = useState('');

  // 5. Progress & Status
  const [progress, setProgress] = useState(0);

  // 6. Documents (Evidence Table)
  const [selectedFiles, setSelectedFiles] = useState([]);
  const fileInputRef = useRef(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // New Task Form inside Plan Detail
  const [taskTitle, setTaskTitle] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskChecklistText, setTaskChecklistText] = useState('');

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await planService.getPlans({ limit: 100 });
      if (res.success) setPlans(res.data || []);

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
    fetchPlans();
  }, []);

  const toggleTeamMember = (id) => {
    setSelectedTeamIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleFilesChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setSelectedFiles((prev) => [...prev, ...files]);
    }
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length > 0) {
      setSelectedFiles((prev) => [...prev, ...files]);
    }
  };

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    if (!name.trim() || !periodLabel.trim()) {
      setError(
        isAmharic
          ? 'እባክዎ የእቅዱን ስም እና የጊዜ መለያ (Period label) ያስገቡ'
          : 'Plan name and Period label are required'
      );
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const res = await planService.createPlan({
        name: name.trim(),
        parentPlan: parentPlan || null,
        type,
        department,
        periodLabel: periodLabel.trim(),
        keyGoal: keyGoal.trim(),
        description: description.trim(),
        taskDetail: taskDetail.trim(),
        kpis: kpiText.trim() ? [{ metric: kpiText.trim(), targetValue: target.trim(), unit: '%' }] : [],
        target: target.trim(),
        budget: Number(budget) || 0,
        supportTeamText: supportTeamText.trim(),
        remark: remark.trim(),
        activity: activity.trim(),
        expectedOutput: expectedOutput.trim(),
        priority,
        correctiveAction: correctiveAction.trim(),
        progress: Number(progress) || 0,
        leader: leader || undefined,
        teams: selectedTeamIds.map((id) => ({ employee: id, role: 'Member' })),
        startDate: startDate || undefined,
        endDate: endDate || undefined
      });

      if (res.success && res.data) {
        if (selectedFiles.length > 0) {
          try {
            await evidenceService.addAttachment('Plan', res.data._id, selectedFiles, {
              title: `${name.trim()} Documents`,
              description: 'Supporting plan documents uploaded on creation'
            });
          } catch (uploadErr) {
            console.error('Plan created, evidence upload failed:', uploadErr);
          }
        }

        setIsCreateOpen(false);
        setName('');
        setPeriodLabel('');
        setKeyGoal('');
        setDescription('');
        setTaskDetail('');
        setKpiText('');
        setTarget('');
        setBudget('');
        setSupportTeamText('');
        setSelectedTeamIds([]);
        setRemark('');
        setActivity('');
        setExpectedOutput('');
        setCorrectiveAction('');
        setProgress(0);
        setSelectedFiles([]);
        fetchPlans();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create operational plan');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePlanApproval = async (planId, status) => {
    try {
      const res = await planService.updateApproval(planId, status, `${status} via Plans Hub`);
      if (res.success) {
        setSelectedPlan(res.data);
        fetchPlans();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Approval update failed');
    }
  };

  const handleUpdateProgress = async (planId, newProgress) => {
    try {
      const res = await planService.updatePlan(planId, {
        progress: Number(newProgress),
        status: Number(newProgress) >= 100 ? 'completed' : Number(newProgress) > 0 ? 'in_progress' : 'draft'
      });
      if (res.success) {
        setSelectedPlan(res.data);
        fetchPlans();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update progress');
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!taskTitle.trim() || !selectedPlan) return;
    try {
      const checklist = taskChecklistText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((itemName) => ({ name: itemName, isChecked: false }));

      const res = await planService.addTask(selectedPlan._id, {
        title: taskTitle.trim(),
        assignedEmployee: taskAssignee || undefined,
        dueDate: taskDueDate || undefined,
        checklist
      });
      if (res.success) {
        const updated = await planService.getPlanById(selectedPlan._id);
        if (updated.success) setSelectedPlan(updated.data);
        setTaskTitle('');
        setTaskChecklistText('');
        fetchPlans();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add task');
    }
  };

  const handleTaskUpdate = async (taskId, updates) => {
    try {
      const res = await planService.updateTask(selectedPlan._id, taskId, updates);
      if (res.success) {
        const updated = await planService.getPlanById(selectedPlan._id);
        if (updated.success) setSelectedPlan(updated.data);
        fetchPlans();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update task');
    }
  };

  const derivedProgressStatus =
    Number(progress) >= 100
      ? isAmharic
        ? 'ተጠናቋል (Completed)'
        : 'Completed'
      : Number(progress) > 0
      ? isAmharic
        ? 'በሂደት ላይ (In progress)'
        : 'In progress'
      : isAmharic
      ? 'አልተጀመረም (Not started)'
      : 'Not started';

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-[#00ced1]" />
            <span>{t('hrPages.plans.title')}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {t('hrPages.plans.subtitle')}
          </p>
        </div>

        {isManagement && (
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#00ced1] hover:bg-[#00b5b8] text-white text-xs font-black shadow-lg shadow-[#00ced1]/20 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>{isAmharic ? 'አዲስ እቅድ ፍጠር' : 'Create New Plan'}</span>
          </button>
        )}
      </div>

      {/* Plans Grid */}
      <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 shadow-xs p-6">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">{t('hrPages.plans.loading')}</div>
        ) : plans.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 space-y-2">
            <FileSpreadsheet className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
            <p className="font-bold text-slate-600 dark:text-slate-300">{t('hrPages.plans.empty')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map((p) => {
              const completedTasks = (p.tasks || []).filter((tk) => tk.status === 'completed').length;
              const totalTasks = (p.tasks || []).length;
              return (
                <div
                  key={p._id}
                  className="p-5 rounded-2xl bg-slate-50 dark:bg-[#152238] border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-black text-sm text-slate-900 dark:text-white">{p.name}</h3>
                        {p.periodLabel && (
                          <div className="text-[11px] font-bold text-[#00ced1]">{p.periodLabel}</div>
                        )}
                      </div>
                      <StatusBadge status={p.status || 'draft'} />
                    </div>
                    <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2">
                      <span className="flex items-center gap-1">
                        <Building className="w-3.5 h-3.5" />
                        {p.department}
                      </span>
                      <span>•</span>
                      <span className="capitalize font-bold">{p.type?.replace('_', ' ')}</span>
                      <span>•</span>
                      <span className="uppercase text-[10px] font-black text-amber-500">{p.priority}</span>
                    </div>
                    {p.keyGoal && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">{p.keyGoal}</p>
                    )}

                    {/* Progress Bar */}
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[11px] font-bold text-slate-500">
                        <span>{isAmharic ? 'ሂደት' : 'Progress'}</span>
                        <span>{p.progress ?? 0}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div
                          className="h-full bg-[#00ced1] rounded-full transition-all"
                          style={{ width: `${Math.min(100, p.progress ?? 0)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-500 flex items-center gap-1">
                      <CheckSquare className="w-3.5 h-3.5 text-[#00ced1]" />
                      <span>
                        {completedTasks}/{totalTasks} {isAmharic ? 'ተግባራት' : 'Tasks'}
                      </span>
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setEvidenceTarget(p)}
                        className="p-1.5 text-slate-400 hover:text-[#00ced1] rounded-lg cursor-pointer"
                      >
                        <Paperclip className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedPlan(p)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#00ced1]/10 text-[#00ced1] font-black cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{isAmharic ? 'ዝርዝር' : 'Inspect'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE NEW PLAN MODAL (Matching All Screenshot Sections & Fields) */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0e1626] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[93vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-[#152238]/50 shrink-0">
              <div>
                <h2 className="font-black text-base text-slate-900 dark:text-white">
                  {isAmharic ? 'አዲስ እቅድ ፍጠር' : 'Create New Plan'}
                </h2>
                <p className="text-[11px] text-slate-400">
                  {isAmharic
                    ? 'ግብ፣ መለኪያዎች፣ ክፍል እና ሰነዶችን ይግለጹ (በጀት በብር ETB)'
                    : 'Define goal, metrics, division and attachments (Budgets in ETB)'}
                </p>
              </div>
              <button type="button" onClick={() => setIsCreateOpen(false)} className="p-1 text-slate-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePlan} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 text-rose-500 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* 1. BASIC INFORMATION */}
              <div className="space-y-3">
                <div className="text-[11px] font-black uppercase tracking-wider text-[#00ced1] flex items-center gap-1.5">
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>{isAmharic ? '1. መሰረታዊ መረጃ (BASIC INFORMATION)' : 'BASIC INFORMATION'}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1">
                      {isAmharic ? 'የእቅዱ ስም *' : 'Plan name *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Inventory sync"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">
                      {isAmharic ? 'ክፍል / ጊዜ (Division) *' : 'Division *'}
                    </label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238] font-bold"
                    >
                      <option value="daily">{isAmharic ? 'ዕለታዊ (Daily)' : 'Daily'}</option>
                      <option value="weekly">{isAmharic ? 'ሳምንታዊ (Weekly)' : 'Weekly'}</option>
                      <option value="monthly">{isAmharic ? 'ወርሃዊ (Monthly)' : 'Monthly'}</option>
                      <option value="quarterly">{isAmharic ? 'ሩብ ዓመት (Quarterly)' : 'Quarterly'}</option>
                      <option value="half_yearly">{isAmharic ? 'ግማሽ ዓመት (Half Yearly)' : 'Half Yearly'}</option>
                      <option value="yearly">{isAmharic ? 'ዓመታዊ (Yearly)' : 'Yearly'}</option>
                      <option value="custom">{isAmharic ? 'ልዩ የቀን ገደብ (Custom Range)' : 'Custom Date Range'}</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1">
                      {isAmharic ? 'መጀመሪያ ቀን' : 'Start Date'} {type === 'custom' && '*'}
                    </label>
                    <input
                      type="date"
                      required={type === 'custom'}
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        if (type === 'custom' && e.target.value && endDate) {
                          setPeriodLabel(`${e.target.value} → ${endDate}`);
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">
                      {isAmharic ? 'ማብቂያ ቀን' : 'End Date'} {type === 'custom' && '*'}
                    </label>
                    <input
                      type="date"
                      required={type === 'custom'}
                      value={endDate}
                      min={startDate || undefined}
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        if (type === 'custom' && startDate && e.target.value) {
                          setPeriodLabel(`${startDate} → ${e.target.value}`);
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold mb-1">
                    {isAmharic ? 'የጊዜ መለያ (Period label) *' : 'Period label *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={periodLabel}
                    onChange={(e) => setPeriodLabel(e.target.value)}
                    placeholder="e.g. Mar 17, 2025, Q2 2025 (Apr–Jun), or Jan–Dec 2025"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold mb-1">{isAmharic ? 'ዲፓርትመንት *' : 'Department *'}</label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238]"
                    >
                      {DEPARTMENTS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold mb-1">{isAmharic ? 'የእቅድ መሪ' : 'Plan Leader'}</label>
                    <select
                      value={leader}
                      onChange={(e) => setLeader(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238]"
                    >
                      <option value="">-- {isAmharic ? 'መሪ ይምረጡ' : 'Select Leader'} --</option>
                      {employees.map((e) => (
                        <option key={e._id} value={e._id}>
                          {[e.name?.first, e.name?.last].filter(Boolean).join(' ')}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold mb-1">{isAmharic ? 'ዋና እቅድ' : 'Parent Plan'}</label>
                    <select
                      value={parentPlan}
                      onChange={(e) => setParentPlan(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238]"
                    >
                      <option value="">-- {isAmharic ? 'የለም' : 'None'} --</option>
                      {plans.map((pl) => (
                        <option key={pl._id} value={pl._id}>
                          {pl.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* 2. KEY GOAL & STRATEGY */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <div className="text-[11px] font-black uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5" />
                  <span>{isAmharic ? '2. ዋና ግብ እና ስትራቴጂ (KEY GOAL & STRATEGY)' : 'KEY GOAL & STRATEGY'}</span>
                </div>

                <div>
                  <label className="block font-bold mb-1">{isAmharic ? 'ዋና ግብ (Key Goal)' : 'Key Goal'}</label>
                  <textarea
                    rows={2}
                    value={keyGoal}
                    onChange={(e) => setKeyGoal(e.target.value)}
                    placeholder="e.g. Achieve 100% inventory accuracy across all warehouses by Q2 2025"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238] resize-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {isAmharic ? 'ይህ እቅድ ሊያሳካው ያለመው ዋና ዓላማ።' : 'The primary objective this plan aims to achieve.'}
                  </p>
                </div>

                <div>
                  <label className="block font-bold mb-1">{isAmharic ? 'መግለጫ (Description)' : 'Description'}</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Short description of the plan — goals, scope, notes..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238] resize-none"
                  />
                </div>
              </div>

              {/* 3. TASK DETAILS & METRICS */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <div className="text-[11px] font-black uppercase tracking-wider text-blue-500 flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>{isAmharic ? '3. የተግባር ዝርዝር እና መለኪያዎች (TASK DETAILS & METRICS)' : 'TASK DETAILS & METRICS'}</span>
                </div>

                <div>
                  <label className="block font-bold mb-1">{isAmharic ? 'የተግባር ዝርዝር (Task Detail)' : 'Task Detail'}</label>
                  <textarea
                    rows={2}
                    value={taskDetail}
                    onChange={(e) => setTaskDetail(e.target.value)}
                    placeholder="Describe tasks involved — steps, milestones, deliverables..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238] resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1">{isAmharic ? 'መለኪያ (KPI)' : 'KPI'}</label>
                    <input
                      type="text"
                      value={kpiText}
                      onChange={(e) => setKpiText(e.target.value)}
                      placeholder="e.g. Stock accuracy %, order fulfillment rate"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">{isAmharic ? 'ዒላማ (Target %)' : 'Target (%)'}</label>
                    <input
                      type="text"
                      value={target}
                      onChange={(e) => setTarget(e.target.value)}
                      placeholder="e.g. 95"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">{isAmharic ? 'በጀት (ETB)' : 'Budget (ETB)'}</label>
                    <input
                      type="number"
                      min="0"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      placeholder="e.g. 25,000 ETB"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">{isAmharic ? 'ደጋፊ ቡድን (Support Team)' : 'Support Team'}</label>
                    <input
                      type="text"
                      value={supportTeamText}
                      onChange={(e) => setSupportTeamText(e.target.value)}
                      placeholder="e.g. Operations, IT, Finance"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold mb-1">{isAmharic ? 'አስተያየት (Remark)' : 'Remark'}</label>
                  <textarea
                    rows={2}
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    placeholder="Additional notes about task, team, budget, etc."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238] resize-none"
                  />
                </div>
              </div>

              {/* 4. ACTIVITY & OUTPUT */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <div className="text-[11px] font-black uppercase tracking-wider text-purple-500 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  <span>{isAmharic ? '4. እንቅስቃሴ እና ውጤት (ACTIVITY & OUTPUT)' : 'ACTIVITY & OUTPUT'}</span>
                </div>

                <div>
                  <label className="block font-bold mb-1">{isAmharic ? 'እንቅስቃሴ (Activity)' : 'Activity'}</label>
                  <textarea
                    rows={2}
                    value={activity}
                    onChange={(e) => setActivity(e.target.value)}
                    placeholder="Ongoing activities — recurring tasks, meetings, reviews..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238] resize-none"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">{isAmharic ? 'የሚጠበቅ ውጤት (Expected Output)' : 'Expected Output'}</label>
                  <textarea
                    rows={2}
                    value={expectedOutput}
                    onChange={(e) => setExpectedOutput(e.target.value)}
                    placeholder="Tangible results — reports, systems, deliverables..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238] resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1">{isAmharic ? 'ቅድሚያ (Priority)' : 'Priority'}</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238] font-bold"
                    >
                      <option value="low">{isAmharic ? 'ዝቅተኛ (Low)' : 'Low'}</option>
                      <option value="medium">{isAmharic ? 'መካከለኛ (Medium)' : 'Medium'}</option>
                      <option value="high">{isAmharic ? 'ከፍተኛ (High)' : 'High'}</option>
                      <option value="urgent">{isAmharic ? 'አስቸኳይ (Urgent)' : 'Urgent'}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold mb-1">{isAmharic ? 'የእርምት እርምጃ (Corrective Action)' : 'Corrective Action'}</label>
                    <input
                      type="text"
                      value={correctiveAction}
                      onChange={(e) => setCorrectiveAction(e.target.value)}
                      placeholder="e.g. Weekly review, escalate to PMO"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238]"
                    />
                  </div>
                </div>
              </div>

              {/* 5. PROGRESS & STATUS */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <div className="text-[11px] font-black uppercase tracking-wider text-emerald-500 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>{isAmharic ? '5. ሂደት እና ሁኔታ (PROGRESS & STATUS)' : 'PROGRESS & STATUS'}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  <div>
                    <label className="block font-bold mb-1">{isAmharic ? 'ሂደት (Progress %)' : 'Progress (%)'}</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={progress}
                      onChange={(e) => setProgress(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238] font-bold"
                    />
                  </div>
                  <div className="pt-4 flex items-center gap-2">
                    <span className="text-slate-400 font-bold">{isAmharic ? 'ሁኔታ፡' : 'Status:'}</span>
                    <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 font-bold text-slate-600 dark:text-slate-300">
                      {derivedProgressStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* 6. DOCUMENTS */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <div className="text-[11px] font-black uppercase tracking-wider text-[#00ced1] flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5" />
                  <span>{isAmharic ? '6. ሰነዶች (DOCUMENTS)' : 'DOCUMENTS'}</span>
                </div>

                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="p-6 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-[#00ced1] bg-slate-50/70 dark:bg-[#152238]/60 text-center cursor-pointer transition-colors"
                >
                  <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <div className="font-bold text-slate-700 dark:text-slate-200">
                    {isAmharic
                      ? 'ፋይሎችን እዚህ ይጎትቱ ወይም ለመምረጥ ይጫኑ'
                      : 'Drag & drop files here or click to browse'}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Supports PDF, Word, Excel, PowerPoint, Zip, Images, Text
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.jpg,.jpeg,.png,.webp,.txt"
                    onChange={handleFilesChange}
                    className="hidden"
                  />
                </div>

                <div className="text-[11px] font-bold text-slate-500">
                  {isAmharic ? 'የተመረጡ ፋይሎች' : 'Selected files'} ({selectedFiles.length})
                </div>

                {selectedFiles.length === 0 ? (
                  <div className="text-center text-[11px] text-slate-400 italic py-1">
                    {isAmharic ? 'እስካሁን ምንም ፋይል አልተመረጠም።' : 'No files selected yet.'}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {selectedFiles.map((f, idx) => (
                      <div
                        key={`${f.name}-${idx}`}
                        className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#152238] border border-slate-200 dark:border-slate-700"
                      >
                        <span className="truncate font-medium">
                          {f.name} ({(f.size / 1024).toFixed(0)} KB)
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedFiles((prev) => prev.filter((_, i) => i !== idx))
                          }
                          className="text-rose-500 font-bold ml-2 cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
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
                  className="px-5 py-2 rounded-xl bg-[#00ced1] hover:bg-[#00b5b8] text-white font-black cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{submitting ? '...' : isAmharic ? 'እቅዱን ፍጠር' : 'Create plan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Plan Detail & Task Checklist Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0e1626] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-[#152238]/50">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-black text-base text-slate-900 dark:text-white">{selectedPlan.name}</h2>
                  <StatusBadge status={selectedPlan.status} />
                </div>
                <p className="text-xs text-slate-400">
                  {selectedPlan.department} • {selectedPlan.type} • {selectedPlan.periodLabel || ''}
                </p>
              </div>
              <button type="button" onClick={() => setSelectedPlan(null)} className="p-2 text-slate-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {isExecutive && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#152238] flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold">{isAmharic ? 'የአመራር ውሳኔ፡' : 'Executive Status Control:'}</span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => handlePlanApproval(selectedPlan._id, 'approved')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white font-bold cursor-pointer"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePlanApproval(selectedPlan._id, 'in_progress')}
                      className="px-3 py-1.5 rounded-lg bg-blue-500 text-white font-bold cursor-pointer"
                    >
                      In Progress
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePlanApproval(selectedPlan._id, 'completed')}
                      className="px-3 py-1.5 rounded-lg bg-[#00ced1] text-white font-bold cursor-pointer"
                    >
                      Complete
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePlanApproval(selectedPlan._id, 'rejected')}
                      className="px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-500 font-bold cursor-pointer"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              )}

              {/* Progress Slider */}
              {isManagement && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#152238] flex items-center gap-4">
                  <span className="font-bold">{isAmharic ? 'ሂደት (%):' : 'Progress (%):'}</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={selectedPlan.progress ?? 0}
                    onChange={(e) => handleUpdateProgress(selectedPlan._id, e.target.value)}
                    className="flex-1 accent-[#00ced1]"
                  />
                  <span className="font-black text-[#00ced1]">{selectedPlan.progress ?? 0}%</span>
                </div>
              )}

              {/* Comprehensive Plan Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#152238]">
                  <div className="font-black text-slate-400 uppercase text-[10px]">Key Goal & Strategy</div>
                  <div className="mt-1 font-medium">{selectedPlan.keyGoal || 'N/A'}</div>
                  {selectedPlan.description && (
                    <div className="mt-1 text-slate-400">{selectedPlan.description}</div>
                  )}
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#152238]">
                  <div className="font-black text-slate-400 uppercase text-[10px]">Task Detail & Support</div>
                  <div className="mt-1 font-medium">{selectedPlan.taskDetail || 'N/A'}</div>
                  <div className="mt-1 text-slate-400">
                    Support: {selectedPlan.supportTeamText || 'N/A'} • Budget:{' '}
                    {Number(selectedPlan.budget || 0).toLocaleString()} ETB
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#152238]">
                  <div className="font-black text-slate-400 uppercase text-[10px]">Activity & Expected Output</div>
                  <div className="mt-1 font-medium">{selectedPlan.activity || 'N/A'}</div>
                  <div className="mt-1 text-slate-400">Output: {selectedPlan.expectedOutput || 'N/A'}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#152238]">
                  <div className="font-black text-slate-400 uppercase text-[10px]">Corrective Action & Remark</div>
                  <div className="mt-1 font-medium">{selectedPlan.correctiveAction || 'N/A'}</div>
                  {selectedPlan.remark && <div className="mt-1 text-slate-400">{selectedPlan.remark}</div>}
                </div>
              </div>

              {/* Add Task with Checklist */}
              {isManagement && (
                <form
                  onSubmit={handleAddTask}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-[#152238] border border-slate-200 dark:border-slate-700 space-y-2.5"
                >
                  <div className="font-black text-[#00ced1] uppercase text-[10px]">
                    {isAmharic ? 'አዲስ ተግባር ከቼክሊስት ጋር ጨምር' : 'Add Task with Checklist'}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      required
                      placeholder={isAmharic ? 'የተግባሩ ርዕስ *' : 'Task Title *'}
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0e1626]"
                    />
                    <select
                      value={taskAssignee}
                      onChange={(e) => setTaskAssignee(e.target.value)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0e1626]"
                    >
                      <option value="">-- {isAmharic ? 'ተጠሪ ሰራተኛ' : 'Assignee'} --</option>
                      {employees.map((e) => (
                        <option key={e._id} value={e._id}>
                          {[e.name?.first, e.name?.last].filter(Boolean).join(' ')}
                        </option>
                      ))}
                    </select>
                    <input
                      type="date"
                      value={taskDueDate}
                      onChange={(e) => setTaskDueDate(e.target.value)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0e1626]"
                    />
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Checklist items (one item per line)..."
                    value={taskChecklistText}
                    onChange={(e) => setTaskChecklistText(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0e1626] resize-none"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-xl bg-[#00ced1] text-white font-black cursor-pointer"
                    >
                      {isAmharic ? 'ተግባሩን ጨምር' : 'Add Task'}
                    </button>
                  </div>
                </form>
              )}

              {/* Tasks List */}
              <div className="space-y-2.5">
                <h3 className="font-black text-slate-400 uppercase text-[11px]">
                  {isAmharic ? 'የእቅዱ ተግባራት' : 'Plan Tasks'} ({selectedPlan.tasks?.length || 0})
                </h3>
                {(selectedPlan.tasks || []).map((tk) => (
                  <div
                    key={tk._id}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#152238] border border-slate-200/80 dark:border-slate-800 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{tk.title}</div>
                        <div className="text-[11px] text-slate-400">
                          {tk.assignedEmployee
                            ? [tk.assignedEmployee.name?.first, tk.assignedEmployee.name?.last]
                                .filter(Boolean)
                                .join(' ')
                            : 'Unassigned'}
                        </div>
                      </div>
                      <select
                        value={tk.status}
                        onChange={(e) => handleTaskUpdate(tk._id, { status: e.target.value })}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0e1626] font-bold"
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="blocked">Blocked</option>
                      </select>
                    </div>

                    {Array.isArray(tk.checklist) && tk.checklist.length > 0 && (
                      <div className="pl-2 space-y-1 border-l-2 border-[#00ced1]/30">
                        {tk.checklist.map((item, idx) => (
                          <label key={item._id || idx} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={item.isChecked}
                              onChange={() => {
                                const updatedChecklist = tk.checklist.map((c, i) =>
                                  i === idx ? { ...c, isChecked: !c.isChecked } : c
                                );
                                handleTaskUpdate(tk._id, { checklist: updatedChecklist });
                              }}
                              className="accent-[#00ced1]"
                            />
                            <span className={item.isChecked ? 'line-through text-slate-400' : ''}>
                              {item.name}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {evidenceTarget && (
        <EvidenceDrawer
          isOpen={Boolean(evidenceTarget)}
          onClose={() => setEvidenceTarget(null)}
          entityType="Plan"
          entityId={evidenceTarget._id}
          entityTitle={evidenceTarget.name}
        />
      )}
    </div>
  );
}
