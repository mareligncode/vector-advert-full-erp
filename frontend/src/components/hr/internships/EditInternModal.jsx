import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  GraduationCap,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { internshipService, employeeService } from '../../../services/hrService';
import { DEPARTMENTS } from '../../../utils/rbac';

export default function EditInternModal({ isOpen, onClose, intern, onSuccess }) {
  const { i18n } = useTranslation();
  const isAmharic = i18n.language === 'am';

  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  const [type, setType] = useState('tutorial');
  const [stipendAmount, setStipendAmount] = useState(0);

  const [university, setUniversity] = useState('');
  const [faculty, setFaculty] = useState('');
  const [departmentOfStudy, setDepartmentOfStudy] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState(4);
  const [studentIdNumber, setStudentIdNumber] = useState('');

  const [internshipPosition, setInternshipPosition] = useState('');
  const [assignedDepartment, setAssignedDepartment] = useState('');
  const [supervisor, setSupervisor] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('active');
  const [notes, setNotes] = useState('');

  const [employees, setEmployees] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && intern) {
      setFirstName(intern.name?.first || '');
      setMiddleName(intern.name?.middle || '');
      setLastName(intern.name?.last || '');
      setPhone(intern.phone || '');
      setEmail(intern.email || '');
      setAddress(intern.address || '');

      setType(intern.type || 'tutorial');
      setStipendAmount(intern.stipendAmount || 0);

      setUniversity(intern.academicProfile?.university || '');
      setFaculty(intern.academicProfile?.faculty || '');
      setDepartmentOfStudy(intern.academicProfile?.departmentOfStudy || '');
      setYearOfStudy(intern.academicProfile?.yearOfStudy || 4);
      setStudentIdNumber(intern.academicProfile?.studentId?.idNumber || '');

      setInternshipPosition(intern.placement?.internshipPosition || '');
      setAssignedDepartment(intern.placement?.assignedDepartment || DEPARTMENTS[0]);
      setSupervisor(intern.placement?.supervisor?._id || intern.placement?.supervisor || '');
      setStartDate(
        intern.placement?.startDate
          ? new Date(intern.placement.startDate).toISOString().split('T')[0]
          : ''
      );
      setEndDate(
        intern.placement?.endDate
          ? new Date(intern.placement.endDate).toISOString().split('T')[0]
          : ''
      );
      setStatus(intern.placement?.status || 'active');
      setNotes(intern.notes || '');
      setError('');

      const fetchStaff = async () => {
        try {
          const res = await employeeService.getEmployees({ limit: 150, status: 'active' });
          if (res.success) setEmployees(res.data || []);
        } catch (err) {
          console.error(err);
        }
      };
      fetchStaff();
    }
  }, [isOpen, intern]);

  if (!isOpen || !intern) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError('');

      const payload = {
        name: {
          first: firstName.trim(),
          middle: middleName.trim(),
          last: lastName.trim()
        },
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        type,
        stipendAmount: type === 'paid' ? Number(stipendAmount) || 0 : 0,
        academicProfile: {
          university: university.trim(),
          faculty: faculty.trim(),
          departmentOfStudy: departmentOfStudy.trim(),
          yearOfStudy: Number(yearOfStudy) || undefined,
          studentId: { idNumber: studentIdNumber.trim() }
        },
        placement: {
          internshipPosition: internshipPosition.trim(),
          assignedDepartment,
          supervisor: supervisor || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          status
        },
        notes: notes.trim()
      };

      const res = await internshipService.updateInternship(intern._id, payload);
      if (res.success) {
        if (onSuccess) onSuccess(res.data);
        onClose();
      } else {
        setError(res.message || 'Failed to update intern');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Error updating intern');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0e1626] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-[#152238]/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#00ced1]/15 text-[#00ced1] flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                {isAmharic ? 'የተለማማጅ መረጃ ማሻሻያ' : 'Edit Intern Profile'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {intern.internshipNumber} • {intern.fullName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">First Name *</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238] text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Middle Name</label>
              <input
                type="text"
                value={middleName}
                onChange={(e) => setMiddleName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238] text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Last Name *</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238] text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Phone *</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238] text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Email *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238] text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">University</label>
              <input
                type="text"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238] text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Field of Study</label>
              <input
                type="text"
                value={departmentOfStudy}
                onChange={(e) => setDepartmentOfStudy(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238] text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Student ID</label>
              <input
                type="text"
                value={studentIdNumber}
                onChange={(e) => setStudentIdNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238] text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Position</label>
              <input
                type="text"
                value={internshipPosition}
                onChange={(e) => setInternshipPosition(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238] text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Assigned Department</label>
              <select
                value={assignedDepartment}
                onChange={(e) => setAssignedDepartment(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238] text-slate-900 dark:text-white"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Supervisor</label>
              <select
                value={supervisor}
                onChange={(e) => setSupervisor(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238] text-slate-900 dark:text-white"
              >
                <option value="">-- Select Supervisor --</option>
                {employees.map((emp) => {
                  const name = [emp.name?.first, emp.name?.last].filter(Boolean).join(' ');
                  return (
                    <option key={emp._id} value={emp._id}>
                      {name} ({emp.department})
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238] text-slate-900 dark:text-white"
              >
                <option value="tutorial">Tutorial</option>
                <option value="paid">Paid</option>
              </select>
            </div>
            {type === 'paid' && (
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Stipend (ETB)</label>
                <input
                  type="number"
                  value={stipendAmount}
                  onChange={(e) => setStipendAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238] text-slate-900 dark:text-white"
                />
              </div>
            )}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238] text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238] text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238] text-slate-900 dark:text-white resize-none"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold cursor-pointer"
            >
              {isAmharic ? 'ሰርዝ' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 rounded-xl bg-[#00ced1] hover:bg-[#00b5b8] text-white font-black shadow-lg shadow-[#00ced1]/20 cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? 'Saving...' : isAmharic ? 'ለውጦችን መዝግብ' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
