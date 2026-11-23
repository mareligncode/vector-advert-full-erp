import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  X
} from 'lucide-react';
import { employeeService } from '../../../services/hrService';
import { useAuth } from '../../../context/AuthContext';
import StatusBadge from '../../../components/hr/StatusBadge';
import EvidenceDrawer from '../../../components/hr/EvidenceDrawer';

export default function EmployeeList() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [evidenceTarget, setEvidenceTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');

  const isManagement = user?.roles?.some((r) =>
    ['superadmin', 'ceo', 'cao', 'coo', 'hrmanager', 'hrofficer'].includes(r)
  );

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.employmentStatus = statusFilter;
      if (departmentFilter) params.department = departmentFilter;

      const res = await employeeService.getEmployees(params);
      if (res.success && res.data) {
        setEmployees(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch employees:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchEmployees();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [search, statusFilter, departmentFilter]);

  const handleApproveNationalId = async (employeeId) => {
    try {
      setActionLoading(true);
      const res = await employeeService.approveNationalId(employeeId);
      if (res.success) {
        setMessage('Fayda National ID approved successfully!');
        fetchEmployees();
        if (selectedEmployee?._id === employeeId) {
          setSelectedEmployee(res.data);
        }
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve National ID');
    } finally {
      setActionLoading(false);
    }
  };

  const departments = [
    'Executive Leadership',
    'Human Resources',
    'Finance & Accounting',
    'Purchasing & Logistics',
    'Creative & Design',
    'Printing & Production',
    'Operations & Quality',
    'Sales & Marketing',
    'Front Desk & Customer Support'
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Users className="w-6 h-6 text-[#00ced1]" />
            <span>Employee Master Directory</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage company personnel records, Fayda National ID verifications, and department assignments.
          </p>
        </div>

        {isManagement && (
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all hover:brightness-95 cursor-pointer whitespace-nowrap self-start sm:self-auto"
            style={{ backgroundColor: '#00ced1', color: '#020617' }}
          >
            <Plus className="w-4 h-4" style={{ color: '#020617' }} />
            <span style={{ color: '#020617' }}>Add Employee / User</span>
          </Link>
        )}
      </div>

      {message && (
        <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, employee #, phone, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#152238] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#00ced1]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#152238] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#00ced1] cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="probation">Probation</option>
            <option value="suspended">Suspended</option>
            <option value="on_leave">On Leave</option>
            <option value="terminated">Terminated</option>
            <option value="resigned">Resigned</option>
          </select>

          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#152238] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#00ced1] cursor-pointer"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={fetchEmployees}
            disabled={loading}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Refresh Directory"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Employees Directory Table */}
      <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading directory...</div>
        ) : employees.length === 0 ? (
          <div className="py-16 px-4 text-center space-y-3">
            <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No personnel records found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No employees matched the query. Click "Add Employee / User" to register personnel into the ERP.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 dark:bg-[#152238]/60 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Department & Role</th>
                  <th className="py-3 px-4">Fayda National ID</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {employees.map((emp) => {
                  const fullName = emp.name
                    ? `${emp.name.first || ''} ${emp.name.middle || ''} ${emp.name.last || ''}`.trim()
                    : 'Unnamed';

                  const isIdApproved = !!emp.nationalId?.approvedBy;

                  return (
                    <tr
                      key={emp._id}
                      className="hover:bg-slate-50/80 dark:hover:bg-[#152238]/40 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#00ced1]/15 text-[#00ced1] font-black flex items-center justify-center shrink-0 text-xs">
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
                            <span className="font-bold text-slate-900 dark:text-white block hover:text-[#00ced1] transition-colors cursor-pointer" onClick={() => setSelectedEmployee(emp)}>
                              {fullName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              #{emp.employeeNumber || 'NO-ID'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                          {emp.jobTitle || 'Staff Member'}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          {emp.department || 'General'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {emp.nationalId?.finNumber || emp.nationalId?.fanNumber ? (
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isIdApproved
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border border-emerald-200 dark:border-emerald-800'
                                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 border border-amber-200 dark:border-amber-800'
                              }`}
                            >
                              {isIdApproved ? 'Verified' : 'Pending Verification'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400">Not Uploaded</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <StatusBadge status={emp.employmentStatus || 'active'} />
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        <div className="space-y-0.5">
                          {emp.email && (
                            <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                              <Mail className="w-3 h-3 text-[#00ced1] shrink-0" />
                              <span className="truncate max-w-[160px]">{emp.email}</span>
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

                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setSelectedEmployee(emp)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#00ced1] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="View Full Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setEvidenceTarget(emp)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#00ced1] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Universal Attachments / Evidence"
                          >
                            <Paperclip className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Employee Detail Modal */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white dark:bg-[#0e1626] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#00ced1]/15 text-[#00ced1] flex items-center justify-center font-black text-lg">
                  {selectedEmployee.name?.first?.charAt(0) || 'E'}
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    {`${selectedEmployee.name?.first || ''} ${selectedEmployee.name?.middle || ''} ${selectedEmployee.name?.last || ''}`}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    #{selectedEmployee.employeeNumber} &bull; {selectedEmployee.jobTitle} ({selectedEmployee.department})
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedEmployee(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs">
              {/* Status and Job Overview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#152238] border border-slate-200 dark:border-slate-700/60">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Status</span>
                  <StatusBadge status={selectedEmployee.employmentStatus || 'active'} />
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#152238] border border-slate-200 dark:border-slate-700/60">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Employment Type</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 capitalize">
                    {selectedEmployee.employmentType || 'Full-Time'}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#152238] border border-slate-200 dark:border-slate-700/60">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Basic Salary</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {selectedEmployee.basicSalary ? `${selectedEmployee.basicSalary.toLocaleString()} ETB` : 'Not Set'}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#152238] border border-slate-200 dark:border-slate-700/60">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Hire Date</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {selectedEmployee.hireDate ? new Date(selectedEmployee.hireDate).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Fayda National ID Section */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#152238]/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-[#00ced1]" />
                    <span>Fayda Ethiopian National ID</span>
                  </h4>
                  {selectedEmployee.nationalId?.approvedBy ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400">
                      HR Verified
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400">
                      Verification Pending
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 text-[11px]">
                  <div>
                    <span className="text-slate-400 block">FAN (Fayda Identification Number):</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {selectedEmployee.nationalId?.fanNumber || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">FIN (Fayda Individual Number):</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {selectedEmployee.nationalId?.finNumber || 'N/A'}
                    </span>
                  </div>
                </div>

                {/* ID Images */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-2 bg-white dark:bg-[#0e1626] text-center">
                    <span className="text-[10px] text-slate-400 block mb-1">Front Image</span>
                    {selectedEmployee.nationalId?.frontImageUrl ? (
                      <a href={selectedEmployee.nationalId.frontImageUrl} target="_blank" rel="noreferrer">
                        <img
                          src={selectedEmployee.nationalId.frontImageUrl}
                          alt="ID Front"
                          className="h-28 w-full object-cover rounded-lg"
                        />
                      </a>
                    ) : (
                      <div className="h-28 flex items-center justify-center text-slate-400 text-[10px]">No image</div>
                    )}
                  </div>

                  <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-2 bg-white dark:bg-[#0e1626] text-center">
                    <span className="text-[10px] text-slate-400 block mb-1">Back Image</span>
                    {selectedEmployee.nationalId?.backImageUrl ? (
                      <a href={selectedEmployee.nationalId.backImageUrl} target="_blank" rel="noreferrer">
                        <img
                          src={selectedEmployee.nationalId.backImageUrl}
                          alt="ID Back"
                          className="h-28 w-full object-cover rounded-lg"
                        />
                      </a>
                    ) : (
                      <div className="h-28 flex items-center justify-center text-slate-400 text-[10px]">No image</div>
                    )}
                  </div>
                </div>

                {isManagement && !selectedEmployee.nationalId?.approvedBy && (
                  <button
                    type="button"
                    onClick={() => handleApproveNationalId(selectedEmployee._id)}
                    disabled={actionLoading}
                    className="w-full mt-2 py-2 px-3 rounded-xl text-xs font-bold text-slate-950 flex items-center justify-center gap-1.5 shadow-sm hover:brightness-95 transition-all cursor-pointer"
                    style={{ backgroundColor: '#00ced1' }}
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Approve & Verify Fayda National ID</span>
                  </button>
                )}
              </div>

              {/* Bank Accounts */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Bank Account Details</h4>
                {selectedEmployee.bankAccount?.length > 0 ? (
                  selectedEmployee.bankAccount.map((ba, i) => (
                    <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-[#152238] flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-100">{ba.bankName}</p>
                        <p className="text-[11px] font-mono text-slate-500">{ba.accountNumber}</p>
                      </div>
                      <span className="text-[10px] text-slate-400">{ba.holderName}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 text-xs">No bank account registered yet.</p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <button
                type="button"
                onClick={() => {
                  setEvidenceTarget(selectedEmployee);
                }}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 text-xs font-bold flex items-center gap-1.5"
              >
                <Paperclip className="w-3.5 h-3.5" />
                <span>Attachments ({selectedEmployee.employeeDocument?.length || 0})</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedEmployee(null)}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Universal Evidence Drawer */}
      <EvidenceDrawer
        isOpen={!!evidenceTarget}
        onClose={() => setEvidenceTarget(null)}
        entityType="Employee"
        entityId={evidenceTarget?._id}
        entityTitle={
          evidenceTarget?.name
            ? `${evidenceTarget.name.first || ''} ${evidenceTarget.name.last || ''}`.trim()
            : 'Employee'
        }
      />
    </div>
  );
}
