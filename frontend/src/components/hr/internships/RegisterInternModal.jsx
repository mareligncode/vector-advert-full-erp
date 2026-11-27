import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  GraduationCap,
  User,
  Phone,
  Mail,
  MapPin,
  Building,
  Calendar,
  BookOpen,
  DollarSign,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  Shield
} from 'lucide-react';
import { internshipService, employeeService, evidenceService } from '../../../services/hrService';
import { DEPARTMENTS } from '../../../utils/rbac';

export default function RegisterInternModal({ isOpen, onClose, onSuccess }) {
  const { i18n } = useTranslation();
  const isAmharic = i18n.language === 'am';

  // Personal info
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('male');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  // Emergency contact
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [emergencyRel, setEmergencyRel] = useState('');

  // Program & Compensation
  const [type, setType] = useState('tutorial');
  const [stipendAmount, setStipendAmount] = useState(0);
  const [createUserAccount, setCreateUserAccount] = useState(false);

  // Academic Profile
  const [university, setUniversity] = useState('');
  const [faculty, setFaculty] = useState('');
  const [departmentOfStudy, setDepartmentOfStudy] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState(4);
  const [studentIdNumber, setStudentIdNumber] = useState('');

  // Placement
  const [internshipPosition, setInternshipPosition] = useState('');
  const [assignedDepartment, setAssignedDepartment] = useState(DEPARTMENTS[0] || 'Creative & Design');
  const [supervisor, setSupervisor] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('active');
  const [notes, setNotes] = useState('');

  // Supporting Documents (Evidence Table)
  const [selectedFiles, setSelectedFiles] = useState([]);
  const fileInputRef = useRef(null);

  const [employees, setEmployees] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      const fetchStaff = async () => {
        try {
          const res = await employeeService.getEmployees({ limit: 150, status: 'active' });
          if (res.success) setEmployees(res.data || []);
        } catch (err) {
          console.error('Failed to load supervisors:', err);
        }
      };
      fetchStaff();
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFilesChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setSelectedFiles((prev) => [...prev, ...files]);
    }
    e.target.value = '';
  };

  const handleRemoveFile = (idx) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !phone.trim() || !email.trim()) {
      setError(
        isAmharic
          ? 'እባክዎ የሰልጣኙን ሙሉ ስም፣ ስልክ እና ኢሜይል ያስገቡ'
          : 'Please provide intern first/last name, phone, and email'
      );
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const payload = {
        name: {
          first: firstName.trim(),
          middle: middleName.trim(),
          last: lastName.trim()
        },
        gender,
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        emergencyContact: emergencyName.trim()
          ? {
              name: emergencyName.trim(),
              phone: emergencyPhone.trim(),
              relationship: emergencyRel.trim()
            }
          : undefined,
        type,
        stipendAmount: type === 'paid' ? Number(stipendAmount) || 0 : 0,
        createUserAccount,
        academicProfile: {
          university: university.trim(),
          faculty: faculty.trim(),
          departmentOfStudy: departmentOfStudy.trim(),
          yearOfStudy: Number(yearOfStudy) || undefined,
          studentId: studentIdNumber.trim() ? { idNumber: studentIdNumber.trim() } : undefined
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

      const res = await internshipService.createInternship(payload);
      if (res.success && res.data) {
        // Upload attached documents to centralized Evidence table
        if (selectedFiles.length > 0) {
          try {
            await evidenceService.addAttachment('Internship', res.data._id, selectedFiles, {
              title: 'Internship Registration Documents',
              description: 'Initial registration documents (University letter, CV, Student ID)'
            });
          } catch (uploadErr) {
            console.error('Intern created, but evidence upload failed:', uploadErr);
          }
        }
        if (onSuccess) onSuccess(res.data);
        onClose();
      } else {
        setError(res.message || 'Failed to register intern');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Error registering intern');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0e1626] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-[#152238]/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#00ced1]/15 text-[#00ced1] flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                {isAmharic ? 'አዲስ ተለማማጅ (Intern) መመዝገቢያ' : 'Register New Intern'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAmharic
                  ? 'የተለማማጁን የግል፣ የትምህርት እና የምደባ መረጃ ከሰነዶች ጋር ይመዝግቡ'
                  : 'Create an internship placement profile with academic details & evidence documents'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs sm:text-sm">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Personal Details */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#00ced1] flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              <span>{isAmharic ? '1. የግል መረጃ' : '1. Personal Information'}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-xs">
                  {isAmharic ? 'ስም *' : 'First Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238] text-slate-900 dark:text-white text-xs"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-xs">
                  {isAmharic ? 'የአባት ስም' : 'Middle Name'}
                </label>
                <input
                  type="text"
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238] text-slate-900 dark:text-white text-xs"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-xs">
                  {isAmharic ? 'የአያት ስም *' : 'Last Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238] text-slate-900 dark:text-white text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-xs">
                  {isAmharic ? 'ጾታ' : 'Gender'}
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238] text-slate-900 dark:text-white text-xs"
                >
                  <option value="male">{isAmharic ? 'ወንድ (Male)' : 'Male'}</option>
                  <option value="female">{isAmharic ? 'ሴት (Female)' : 'Female'}</option>
                  <option value="other">{isAmharic ? 'ሌላ (Other)' : 'Other'}</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-xs flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span>{isAmharic ? 'ስልክ ቁጥር *' : 'Phone Number *'}</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+251 9..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238] text-slate-900 dark:text-white text-xs"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-xs flex items-center gap-1">
                  <Mail className="w-3 h-3 text-slate-400" />
                  <span>{isAmharic ? 'ኢሜይል *' : 'Email *'}</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="intern@university.edu.et"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238] text-slate-900 dark:text-white text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-xs flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  <span>{isAmharic ? 'አድራሻ' : 'Residential Address'}</span>
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Addis Ababa, Bole..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238] text-slate-900 dark:text-white text-xs"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-xs">
                  {isAmharic ? 'የአደጋ ጊዜ ተጠሪ (ስምና ስልክ)' : 'Emergency Contact (Name & Phone)'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={emergencyName}
                    onChange={(e) => setEmergencyName(e.target.value)}
                    placeholder={isAmharic ? 'ስም' : 'Contact Name'}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238] text-slate-900 dark:text-white text-xs"
                  />
                  <input
                    type="tel"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    placeholder={isAmharic ? 'ስልክ' : 'Phone'}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238] text-slate-900 dark:text-white text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Academic Profile */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#00ced1] flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              <span>{isAmharic ? '2. የትምህርት መረጃ (Academic Profile)' : '2. Academic Profile'}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-xs">
                  {isAmharic ? 'ዩኒቨርሲቲ / ኮሌጅ' : 'University / College'}
                </label>
                <input
                  type="text"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  placeholder="e.g. Addis Ababa University"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238] text-slate-900 dark:text-white text-xs"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-xs">
                  {isAmharic ? 'ፋኩልቲ / ኮሌጅ' : 'Faculty'}
                </label>
                <input
                  type="text"
                  value={faculty}
                  onChange={(e) => setFaculty(e.target.value)}
                  placeholder="e.g. School of Fine Arts / IT"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238] text-slate-900 dark:text-white text-xs"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-xs">
                  {isAmharic ? 'የትምህርት ክፍል' : 'Department of Study'}
                </label>
                <input
                  type="text"
                  value={departmentOfStudy}
                  onChange={(e) => setDepartmentOfStudy(e.target.value)}
                  placeholder="e.g. Graphic Design / CS"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238] text-slate-900 dark:text-white text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-xs">
                  {isAmharic ? 'የትምህርት ዓመት' : 'Year of Study'}
                </label>
                <select
                  value={yearOfStudy}
                  onChange={(e) => setYearOfStudy(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238] text-slate-900 dark:text-white text-xs"
                >
                  {[1, 2, 3, 4, 5, 6, 7].map((yr) => (
                    <option key={yr} value={yr}>
                      Year {yr}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-xs">
                  {isAmharic ? 'የተማሪ መታወቂያ ቁጥር' : 'Student ID Number'}
                </label>
                <input
                  type="text"
                  value={studentIdNumber}
                  onChange={(e) => setStudentIdNumber(e.target.value)}
                  placeholder="e.g. UGR/1234/14"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238] text-slate-900 dark:text-white text-xs"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Placement & Compensation */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#00ced1] flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5" />
              <span>{isAmharic ? '3. የምደባ እና የክፍያ መረጃ' : '3. Placement & Compensation'}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-xs">
                  {isAmharic ? 'የልምምድ የስራ መደብ' : 'Internship Position'}
                </label>
                <input
                  type="text"
                  value={internshipPosition}
                  onChange={(e) => setInternshipPosition(e.target.value)}
                  placeholder="e.g. Junior Design Intern"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238] text-slate-900 dark:text-white text-xs"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-xs">
                  {isAmharic ? 'የተመደበበት ዲፓርትመንት' : 'Assigned Department'}
                </label>
                <select
                  value={assignedDepartment}
                  onChange={(e) => setAssignedDepartment(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238] text-slate-900 dark:text-white text-xs"
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-xs flex items-center gap-1">
                  <UserCheck className="w-3 h-3 text-slate-400" />
                  <span>{isAmharic ? 'ተቆጣጣሪ (Supervisor)' : 'Supervisor'}</span>
                </label>
                <select
                  value={supervisor}
                  onChange={(e) => setSupervisor(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238] text-slate-900 dark:text-white text-xs"
                >
                  <option value="">{isAmharic ? '-- ተቆጣጣሪ ይምረጡ --' : '-- Select Supervisor --'}</option>
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
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-xs">
                  {isAmharic ? 'የልምምድ ዓይነት' : 'Program Type'}
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238] text-slate-900 dark:text-white text-xs"
                >
                  <option value="tutorial">{isAmharic ? 'ያለ ክፍያ (Tutorial)' : 'Tutorial (Unpaid)'}</option>
                  <option value="paid">{isAmharic ? 'በክፍያ (Paid Stipend)' : 'Paid Internship'}</option>
                </select>
              </div>

              {type === 'paid' && (
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-xs flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-emerald-500" />
                    <span>{isAmharic ? 'ወርሃዊ አበል (ETB)' : 'Monthly Stipend (ETB)'}</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={stipendAmount}
                    onChange={(e) => setStipendAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238] text-slate-900 dark:text-white text-xs"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-xs flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>{isAmharic ? 'መጀመሪያ ቀን' : 'Start Date'}</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238] text-slate-900 dark:text-white text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-xs flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>{isAmharic ? 'ማብቂያ ቀን' : 'End Date'}</span>
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238] text-slate-900 dark:text-white text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-xs">
                  {isAmharic ? 'ሁኔታ' : 'Initial Status'}
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238] text-slate-900 dark:text-white text-xs"
                >
                  <option value="active">Active (በልምምድ ላይ)</option>
                  <option value="applied">Applied (አመልካች)</option>
                </select>
              </div>
            </div>

            {/* Optional ERP Portal Account */}
            <label className="inline-flex items-center gap-2 pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={createUserAccount}
                onChange={(e) => setCreateUserAccount(e.target.checked)}
                className="w-4 h-4 rounded accent-[#00ced1]"
              />
              <Shield className="w-3.5 h-3.5 text-[#00ced1]" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {isAmharic
                  ? 'ለተለማማጁ የERP መግቢያ አካውንት ይፍጠሩ (Default password: Intern@Vector2026)'
                  : 'Provision ERP Portal User Account (Default password: Intern@Vector2026)'}
              </span>
            </label>
          </div>

          {/* Section 4: Multiple Documents (Evidence Table) */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#00ced1] flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                <span>
                  {isAmharic
                    ? '4. ደጋፊ ሰነዶች (የዩኒቨርሲቲ ደብዳቤ፣ CV፣ መታወቂያ)'
                    : '4. Supporting Documents (Evidence Table)'}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#00ced1]/10 hover:bg-[#00ced1]/20 text-[#00ced1] text-xs font-black transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{isAmharic ? '+ ሰነዶች ያያይዙ' : '+ Attach Documents'}</span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
                onChange={handleFilesChange}
                className="hidden"
              />
            </div>

            {selectedFiles.length > 0 && (
              <div className="space-y-1.5">
                {selectedFiles.map((f, idx) => (
                  <div
                    key={`${f.name}-${idx}`}
                    className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#152238] border border-slate-200 dark:border-slate-700 text-xs"
                  >
                    <span className="truncate font-medium text-slate-700 dark:text-slate-200">
                      {f.name} ({(f.size / 1024).toFixed(0)} KB)
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(idx)}
                      className="text-rose-500 hover:text-rose-600 font-bold text-[11px] ml-2 cursor-pointer"
                    >
                      {isAmharic ? 'አስወግድ' : 'Remove'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-xs">
              {isAmharic ? 'ተጨማሪ ማስታወሻ' : 'Notes / Remarks'}
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#152238] text-slate-900 dark:text-white text-xs resize-none"
            />
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs cursor-pointer"
            >
              {isAmharic ? 'ሰርዝ' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-[#00ced1] hover:bg-[#00b5b8] text-white font-black text-xs shadow-lg shadow-[#00ced1]/20 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{isAmharic ? 'በመመዝገብ ላይ...' : 'Registering...'}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isAmharic ? 'ተለማማጁን መዝግብ' : 'Register Intern'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
