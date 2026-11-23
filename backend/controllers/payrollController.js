import PayrollConfig, { DEFAULT_INCOME_TAX_SLABS } from '../models/PayrollConfig.js';
import SalaryStructure from '../models/SalaryStructure.js';
import PayrollRun from '../models/PayrollRun.js';
import Payslip from '../models/Payslip.js';
import SalaryAdvanceLoan from '../models/SalaryAdvanceLoan.js';
import Employee from '../models/Employee.js';
import User from '../models/User.js';
import {
  calculatePayslipData,
  renderHtmlPayslip
} from '../utils/payrollCalculator.js';
import {
  ROLES,
  HR_ADMIN_ROLES,
  EXECUTIVE_ROLES,
  MANAGEMENT_ROLES
} from '../constants/roles.js';
import { notifyUser, notifyRoles } from '../utils/notificationHub.js';

// ==========================================
// 1. PAYROLL CONFIGURATION
// ==========================================

/**
 * @desc    Get active payroll configuration (or seed default if none exists)
 * @route   GET /api/payroll/config
 * @access  Private (Authenticated)
 */
export const getPayrollConfig = async (req, res) => {
  try {
    let config = await PayrollConfig.findOne({ isActive: true });
    if (!config) {
      config = await PayrollConfig.create({
        companyName: 'Vector Advert ERP',
        currency: 'ETB',
        payFrequency: 'monthly',
        standardWorkingDaysPerMonth: 22,
        standardWorkingHoursPerDay: 8,
        payrollCutoffDay: 25,
        pensionContribution: {
          employeePensionRate: 7,
          employerPensionRate: 11,
          isPensionMandatory: true
        },
        incomeTaxSlabs: DEFAULT_INCOME_TAX_SLABS,
        overtimeMultipliers: {
          normalDayMultiplier: 1.5,
          nightShiftMultiplier: 1.75,
          weekendMultiplier: 2.0,
          publicHolidayMultiplier: 2.5
        },
        taxExemptAllowanceLimits: {
          transportAllowanceLimit: 2200,
          foodAllowanceLimit: 0,
          mobileAllowanceLimit: 0
        },
        isActive: true
      });
    }

    return res.status(200).json({
      success: true,
      data: config
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update payroll configuration
 * @route   PUT /api/payroll/config
 * @access  Private (HR Manager, Finance, Executives)
 */
export const updatePayrollConfig = async (req, res) => {
  try {
    let config = await PayrollConfig.findOne({ isActive: true });
    if (!config) {
      config = new PayrollConfig();
    }

    const {
      companyName,
      currency,
      payFrequency,
      standardWorkingDaysPerMonth,
      standardWorkingHoursPerDay,
      payrollCutoffDay,
      pensionContribution,
      incomeTaxSlabs,
      overtimeMultipliers,
      taxExemptAllowanceLimits,
      latePenalty
    } = req.body;

    if (companyName) config.companyName = companyName;
    if (currency) config.currency = currency;
    if (payFrequency) config.payFrequency = payFrequency;
    if (standardWorkingDaysPerMonth) config.standardWorkingDaysPerMonth = standardWorkingDaysPerMonth;
    if (standardWorkingHoursPerDay) config.standardWorkingHoursPerDay = standardWorkingHoursPerDay;
    if (payrollCutoffDay) config.payrollCutoffDay = payrollCutoffDay;
    if (pensionContribution) config.pensionContribution = pensionContribution;
    if (incomeTaxSlabs) config.incomeTaxSlabs = incomeTaxSlabs;
    if (overtimeMultipliers) config.overtimeMultipliers = overtimeMultipliers;
    if (taxExemptAllowanceLimits) config.taxExemptAllowanceLimits = taxExemptAllowanceLimits;
    if (latePenalty) config.latePenalty = latePenalty;

    config.updatedBy = req.user._id;
    await config.save();

    return res.status(200).json({
      success: true,
      message: 'Payroll configuration updated successfully',
      data: config
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 2. SALARY STRUCTURES
// ==========================================

/**
 * @desc    List employee salary structures
 * @route   GET /api/payroll/structures
 * @access  Private (HR, Finance, Executives)
 */
export const getSalaryStructures = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status) query.status = status;

    let employeeIds = null;
    if (search) {
      const matchedEmployees = await Employee.find({
        $or: [
          { 'name.first': { $regex: search, $options: 'i' } },
          { 'name.last': { $regex: search, $options: 'i' } },
          { employeeNumber: { $regex: search, $options: 'i' } },
          { department: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      employeeIds = matchedEmployees.map((e) => e._id);
      query.employee = { $in: employeeIds };
    }

    const total = await SalaryStructure.countDocuments(query);
    const structures = await SalaryStructure.find(query)
      .populate('employee', 'name employeeNumber department jobTitle basicSalary bankAccounts')
      .populate('approvedBy', 'email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    return res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: structures
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get salary structure for specific employee
 * @route   GET /api/payroll/structures/employee/:employeeId
 * @access  Private (HR, Finance, Self)
 */
export const getEmployeeSalaryStructure = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    let structure = await SalaryStructure.findOne({
      employee: employeeId,
      status: 'active'
    }).populate('approvedBy', 'email');

    // If no custom structure yet, return default preview built from Employee basicSalary
    if (!structure) {
      const primaryBank = (employee.bankAccounts && employee.bankAccounts.find((b) => b.isPrimary)) ||
        (employee.bankAccounts && employee.bankAccounts[0]) ||
        {};

      return res.status(200).json({
        success: true,
        isDefaultPreview: true,
        data: {
          employee: employee._id,
          employeeDetails: {
            employeeNumber: employee.employeeNumber,
            fullName: employee.fullName,
            department: employee.department,
            jobTitle: employee.jobTitle
          },
          baseSalary: employee.basicSalary || 0,
          paymentMethod: 'bank_transfer',
          bankAccount: primaryBank,
          isOvertimeEligible: true,
          isPensionEligible: true,
          isTaxExempt: false,
          earnings: [],
          deductions: [],
          status: 'draft'
        }
      });
    }

    return res.status(200).json({
      success: true,
      isDefaultPreview: false,
      data: structure
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Create or update employee salary structure
 * @route   POST /api/payroll/structures
 * @access  Private (HR Manager, Finance, Executives)
 */
export const upsertSalaryStructure = async (req, res) => {
  try {
    const {
      employeeId,
      baseSalary,
      paymentMethod = 'bank_transfer',
      bankAccount,
      isOvertimeEligible = true,
      isPensionEligible = true,
      isTaxExempt = false,
      earnings = [],
      deductions = [],
      notes
    } = req.body;

    if (!employeeId || baseSalary === undefined) {
      return res.status(400).json({
        success: false,
        message: 'employeeId and baseSalary are required'
      });
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Deactivate previous active structures for this employee
    await SalaryStructure.updateMany(
      { employee: employeeId, status: 'active' },
      { status: 'superseded', effectiveTo: new Date() }
    );

    const newStructure = await SalaryStructure.create({
      employee: employeeId,
      effectiveFrom: new Date(),
      status: 'active',
      baseSalary: Number(baseSalary),
      paymentMethod,
      bankAccount: bankAccount || (employee.bankAccounts && employee.bankAccounts[0]) || {},
      isOvertimeEligible,
      isPensionEligible,
      isTaxExempt,
      earnings,
      deductions,
      approvedBy: req.user._id,
      approvedAt: new Date(),
      notes
    });

    // Also keep Employee.basicSalary in sync for consistency across HR
    employee.basicSalary = Number(baseSalary);
    await employee.save();

    const populated = await SalaryStructure.findById(newStructure._id)
      .populate('employee', 'name employeeNumber department jobTitle')
      .populate('approvedBy', 'email');

    return res.status(201).json({
      success: true,
      message: 'Salary structure updated successfully',
      data: populated
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 3. PAYROLL RUNS (BATCHES)
// ==========================================

/**
 * @desc    List all payroll runs
 * @route   GET /api/payroll/runs
 * @access  Private (HR, Finance, Executives)
 */
export const getPayrollRuns = async (req, res) => {
  try {
    const { year, month, status, page = 1, limit = 20 } = req.query;
    const query = {};

    if (year) query.periodYear = Number(year);
    if (month) query.periodMonth = Number(month);
    if (status) query.payrollStatus = status;

    const total = await PayrollRun.countDocuments(query);
    const runs = await PayrollRun.find(query)
      .populate('approvals.preparedBy.user', 'email roles')
      .populate('approvals.hrApproval.approvedBy', 'email')
      .populate('approvals.financeApproval.approvedBy', 'email')
      .populate('approvals.executiveApproval.approvedBy', 'email')
      .populate('disbursementDetails.disbursedBy', 'email')
      .sort({ periodYear: -1, periodMonth: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    return res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: runs
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get payroll run by ID with all child payslips
 * @route   GET /api/payroll/runs/:id
 * @access  Private (HR, Finance, Executives)
 */
export const getPayrollRunById = async (req, res) => {
  try {
    const run = await PayrollRun.findById(req.params.id)
      .populate('approvals.preparedBy.user', 'email roles')
      .populate('approvals.hrApproval.approvedBy', 'email')
      .populate('approvals.financeApproval.approvedBy', 'email')
      .populate('approvals.executiveApproval.approvedBy', 'email')
      .populate('disbursementDetails.disbursedBy', 'email');

    if (!run) {
      return res.status(404).json({ success: false, message: 'Payroll run not found' });
    }

    const payslips = await Payslip.find({ payrollRun: run._id })
      .populate('employee', 'name employeeNumber department jobTitle')
      .sort({ 'employeeSnapshot.department': 1, 'employeeSnapshot.employeeNumber': 1 });

    return res.status(200).json({
      success: true,
      data: {
        run,
        payslips
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Generate / Calculate Payroll Run for a month/year
 * @route   POST /api/payroll/runs/generate
 * @access  Private (HR Manager, HR Officer, Finance, Super Admin)
 */
export const generatePayrollRun = async (req, res) => {
  try {
    const { periodMonth, periodYear, title, startDate, endDate, paymentDate, notes } = req.body;

    if (!periodMonth || !periodYear) {
      return res.status(400).json({
        success: false,
        message: 'periodMonth (1-12) and periodYear are required'
      });
    }

    const monthNum = Number(periodMonth);
    const yearNum = Number(periodYear);

    // Check if non-cancelled run already exists for this period
    const existingRun = await PayrollRun.findOne({
      periodMonth: monthNum,
      periodYear: yearNum,
      payrollStatus: { $ne: 'cancelled' }
    });

    if (existingRun) {
      return res.status(400).json({
        success: false,
        message: `A payroll run for ${monthNum}/${yearNum} already exists (${existingRun.payrollCode}, Status: ${existingRun.payrollStatus}). Recalculate or cancel it first.`
      });
    }

    // Determine start & end date of month if not provided
    const periodStart = startDate ? new Date(startDate) : new Date(yearNum, monthNum - 1, 1);
    const periodEnd = endDate ? new Date(endDate) : new Date(yearNum, monthNum, 0, 23, 59, 59, 999);
    const payDate = paymentDate ? new Date(paymentDate) : new Date(yearNum, monthNum - 1, 28);

    // Get active config
    let config = await PayrollConfig.findOne({ isActive: true });
    if (!config) {
      config = await PayrollConfig.create({
        companyName: 'Vector Advert ERP',
        currency: 'ETB',
        payFrequency: 'monthly',
        standardWorkingDaysPerMonth: 22,
        standardWorkingHoursPerDay: 8,
        payrollCutoffDay: 25,
        incomeTaxSlabs: DEFAULT_INCOME_TAX_SLABS
      });
    }

    // Find eligible employees (active or probation, not terminated or resigned)
    const employees = await Employee.find({
      employmentStatus: { $in: ['active', 'probation', 'on_leave'] }
    });

    if (employees.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No active employees found to generate payroll'
      });
    }

    const monthPadded = String(monthNum).padStart(2, '0');
    const payrollCode = `PR-${yearNum}-${monthPadded}`;
    const runTitle = title || `Payroll for ${new Date(yearNum, monthNum - 1).toLocaleString('default', { month: 'long' })} ${yearNum}`;

    // Create draft run
    const payrollRun = await PayrollRun.create({
      payrollCode,
      title: runTitle,
      periodMonth: monthNum,
      periodYear: yearNum,
      startDate: periodStart,
      endDate: periodEnd,
      paymentDate: payDate,
      payrollStatus: 'pending_hr_review',
      totalEmployees: employees.length,
      approvals: {
        preparedBy: {
          user: req.user._id,
          at: new Date(),
          comments: notes || 'Generated automatically by HR Payroll calculation engine'
        }
      },
      notes
    });

    // Process each employee
    let totalBasicSalary = 0;
    let totalAllowances = 0;
    let totalOvertimePay = 0;
    let totalGrossPay = 0;
    let totalTaxableIncome = 0;
    let totalIncomeTax = 0;
    let totalEmployeePension = 0;
    let totalEmployerPension = 0;
    let totalLoanDeductions = 0;
    let totalOtherDeductions = 0;
    let totalDeductions = 0;
    let totalNetPay = 0;
    let totalCompanyCost = 0;

    let index = 1;
    for (const employee of employees) {
      // Find active SalaryStructure
      const salaryStructure = await SalaryStructure.findOne({
        employee: employee._id,
        status: 'active'
      });

      // Find active Loans / Advances
      const activeLoans = await SalaryAdvanceLoan.find({
        employee: employee._id,
        repaymentStatus: 'active',
        remainingBalance: { $gt: 0 }
      });

      // Calculate payslip data
      const payslipPayload = await calculatePayslipData({
        employee,
        salaryStructure,
        config,
        payrollRun,
        activeLoans
      });

      const seqPadded = String(index).padStart(4, '0');
      payslipPayload.payslipNumber = `PS-${yearNum}${monthPadded}-${seqPadded}`;

      await Payslip.create(payslipPayload);
      index++;

      // Aggregate totals
      const e = payslipPayload.earnings;
      const d = payslipPayload.deductions;
      const s = d.statutoryDeductions;
      const ns = d.nonStatutoryDeductions;

      totalBasicSalary += e.basicSalary || 0;
      totalAllowances += (e.allowances || []).reduce((acc, curr) => acc + (curr.amount || 0), 0);
      totalOvertimePay += e.overtimePay || 0;
      totalGrossPay += e.grossEarnings || 0;
      totalTaxableIncome += e.taxableIncome || 0;
      totalIncomeTax += s.incomeTax || 0;
      totalEmployeePension += s.employeePension || 0;
      totalEmployerPension += s.employerPension || 0;
      totalLoanDeductions += (ns.loanRepayment || 0) + (ns.salaryAdvanceDeduction || 0);
      totalOtherDeductions += (ns.attendancePenaltyDeduction || 0) + (ns.costSharing || 0) + (ns.unionDues || 0);
      totalDeductions += d.totalEmployeeDeductions || 0;
      totalNetPay += payslipPayload.netSalary || 0;
      totalCompanyCost += (e.grossEarnings || 0) + (s.employerPension || 0);
    }

    // Update financial summary on payroll run
    payrollRun.financialSummary = {
      totalBasicSalary: Math.round(totalBasicSalary * 100) / 100,
      totalAllowances: Math.round(totalAllowances * 100) / 100,
      totalOvertimePay: Math.round(totalOvertimePay * 100) / 100,
      totalGrossPay: Math.round(totalGrossPay * 100) / 100,
      totalTaxableIncome: Math.round(totalTaxableIncome * 100) / 100,
      totalIncomeTax: Math.round(totalIncomeTax * 100) / 100,
      totalEmployeePension: Math.round(totalEmployeePension * 100) / 100,
      totalEmployerPension: Math.round(totalEmployerPension * 100) / 100,
      totalLoanDeductions: Math.round(totalLoanDeductions * 100) / 100,
      totalOtherDeductions: Math.round(totalOtherDeductions * 100) / 100,
      totalDeductions: Math.round(totalDeductions * 100) / 100,
      totalNetPay: Math.round(totalNetPay * 100) / 100,
      totalCompanyCost: Math.round(totalCompanyCost * 100) / 100
    };

    await payrollRun.save();

    // Notify HR Managers and Finance about generated run
    await notifyRoles([ROLES.HR_MANAGER, ROLES.FINANCE, ROLES.SUPER_ADMIN], {
      subject: `New Payroll Run Generated: ${payrollRun.payrollCode}`,
      message: `A new payroll run for ${runTitle} has been generated with ${employees.length} employees. Total Net Pay: ${config.currency} ${payrollRun.financialSummary.totalNetPay.toLocaleString()}. Please review and approve.`
    });

    return res.status(201).json({
      success: true,
      message: `Payroll run ${payrollRun.payrollCode} successfully generated with ${employees.length} payslips`,
      data: payrollRun
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Recalculate a pending or draft payroll run
 * @route   POST /api/payroll/runs/:id/recalculate
 * @access  Private (HR Manager, Finance, Super Admin)
 */
export const recalculatePayrollRun = async (req, res) => {
  try {
    const run = await PayrollRun.findById(req.params.id);
    if (!run) {
      return res.status(404).json({ success: false, message: 'Payroll run not found' });
    }

    if (run.payrollStatus === 'disbursed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot recalculate a payroll run that has already been disbursed'
      });
    }

    // Delete existing payslips for this run
    await Payslip.deleteMany({ payrollRun: run._id });

    const config = (await PayrollConfig.findOne({ isActive: true })) || {
      standardWorkingDaysPerMonth: 22,
      standardWorkingHoursPerDay: 8,
      incomeTaxSlabs: DEFAULT_INCOME_TAX_SLABS
    };

    const employees = await Employee.find({
      employmentStatus: { $in: ['active', 'probation', 'on_leave'] }
    });

    const monthPadded = String(run.periodMonth).padStart(2, '0');
    let totalBasicSalary = 0;
    let totalAllowances = 0;
    let totalOvertimePay = 0;
    let totalGrossPay = 0;
    let totalTaxableIncome = 0;
    let totalIncomeTax = 0;
    let totalEmployeePension = 0;
    let totalEmployerPension = 0;
    let totalLoanDeductions = 0;
    let totalOtherDeductions = 0;
    let totalDeductions = 0;
    let totalNetPay = 0;
    let totalCompanyCost = 0;

    let index = 1;
    for (const employee of employees) {
      const salaryStructure = await SalaryStructure.findOne({
        employee: employee._id,
        status: 'active'
      });

      const activeLoans = await SalaryAdvanceLoan.find({
        employee: employee._id,
        repaymentStatus: 'active',
        remainingBalance: { $gt: 0 }
      });

      const payslipPayload = await calculatePayslipData({
        employee,
        salaryStructure,
        config,
        payrollRun: run,
        activeLoans
      });

      const seqPadded = String(index).padStart(4, '0');
      payslipPayload.payslipNumber = `PS-${run.periodYear}${monthPadded}-${seqPadded}`;

      await Payslip.create(payslipPayload);
      index++;

      const e = payslipPayload.earnings;
      const d = payslipPayload.deductions;
      const s = d.statutoryDeductions;
      const ns = d.nonStatutoryDeductions;

      totalBasicSalary += e.basicSalary || 0;
      totalAllowances += (e.allowances || []).reduce((acc, curr) => acc + (curr.amount || 0), 0);
      totalOvertimePay += e.overtimePay || 0;
      totalGrossPay += e.grossEarnings || 0;
      totalTaxableIncome += e.taxableIncome || 0;
      totalIncomeTax += s.incomeTax || 0;
      totalEmployeePension += s.employeePension || 0;
      totalEmployerPension += s.employerPension || 0;
      totalLoanDeductions += (ns.loanRepayment || 0) + (ns.salaryAdvanceDeduction || 0);
      totalOtherDeductions += (ns.attendancePenaltyDeduction || 0) + (ns.costSharing || 0) + (ns.unionDues || 0);
      totalDeductions += d.totalEmployeeDeductions || 0;
      totalNetPay += payslipPayload.netSalary || 0;
      totalCompanyCost += (e.grossEarnings || 0) + (s.employerPension || 0);
    }

    run.totalEmployees = employees.length;
    run.financialSummary = {
      totalBasicSalary: Math.round(totalBasicSalary * 100) / 100,
      totalAllowances: Math.round(totalAllowances * 100) / 100,
      totalOvertimePay: Math.round(totalOvertimePay * 100) / 100,
      totalGrossPay: Math.round(totalGrossPay * 100) / 100,
      totalTaxableIncome: Math.round(totalTaxableIncome * 100) / 100,
      totalIncomeTax: Math.round(totalIncomeTax * 100) / 100,
      totalEmployeePension: Math.round(totalEmployeePension * 100) / 100,
      totalEmployerPension: Math.round(totalEmployerPension * 100) / 100,
      totalLoanDeductions: Math.round(totalLoanDeductions * 100) / 100,
      totalOtherDeductions: Math.round(totalOtherDeductions * 100) / 100,
      totalDeductions: Math.round(totalDeductions * 100) / 100,
      totalNetPay: Math.round(totalNetPay * 100) / 100,
      totalCompanyCost: Math.round(totalCompanyCost * 100) / 100
    };

    run.payrollStatus = 'pending_hr_review';
    await run.save();

    return res.status(200).json({
      success: true,
      message: `Payroll run ${run.payrollCode} recalculated successfully with ${employees.length} payslips`,
      data: run
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Approve or reject a payroll run stage (HR -> Finance -> Executive)
 * @route   POST /api/payroll/runs/:id/approve
 * @access  Private (Authorized Approvers)
 */
export const approvePayrollRunStage = async (req, res) => {
  try {
    const { stage, decision, comments } = req.body;
    const run = await PayrollRun.findById(req.params.id);
    if (!run) {
      return res.status(404).json({ success: false, message: 'Payroll run not found' });
    }

    if (run.payrollStatus === 'disbursed' || run.payrollStatus === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: `Cannot approve run with status: ${run.payrollStatus}`
      });
    }

    const userRoles = req.user.roles || [];
    const isApproved = decision === 'approved';

    if (stage === 'hrApproval') {
      const hasHRRole = userRoles.some((r) => HR_ADMIN_ROLES.includes(r));
      if (!hasHRRole) {
        return res.status(403).json({
          success: false,
          message: 'Only HR Managers or HR Officers can sign off HR approval'
        });
      }

      run.approvals.hrApproval = {
        status: isApproved ? 'approved' : 'rejected',
        approvedBy: req.user._id,
        approvedAt: new Date(),
        comments
      };

      run.payrollStatus = isApproved ? 'pending_finance_approval' : 'draft';
    } else if (stage === 'financeApproval') {
      const hasFinanceRole = userRoles.includes(ROLES.FINANCE) || userRoles.some((r) => EXECUTIVE_ROLES.includes(r));
      if (!hasFinanceRole) {
        return res.status(403).json({
          success: false,
          message: 'Only Finance or Executives can approve the Finance stage'
        });
      }

      run.approvals.financeApproval = {
        status: isApproved ? 'approved' : 'rejected',
        approvedBy: req.user._id,
        approvedAt: new Date(),
        comments
      };

      run.payrollStatus = isApproved ? 'pending_executive_approval' : 'draft';
    } else if (stage === 'executiveApproval') {
      const hasExecRole = userRoles.some((r) => EXECUTIVE_ROLES.includes(r));
      if (!hasExecRole) {
        return res.status(403).json({
          success: false,
          message: 'Only Executives (CEO, CAO, COO, HR Manager) can sign off Executive approval'
        });
      }

      run.approvals.executiveApproval = {
        status: isApproved ? 'approved' : 'rejected',
        approvedBy: req.user._id,
        approvedAt: new Date(),
        comments
      };

      run.payrollStatus = isApproved ? 'approved' : 'draft';
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid stage. Expected hrApproval, financeApproval, or executiveApproval'
      });
    }

    await run.save();

    return res.status(200).json({
      success: true,
      message: `Payroll run stage ${stage} marked as ${decision}`,
      data: run
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Disburse Payroll Run (Final payout execution)
 * @route   POST /api/payroll/runs/:id/disburse
 * @access  Private (Finance, Super Admin, CEO)
 */
export const disbursePayrollRun = async (req, res) => {
  try {
    const { sourceBankAccount, paymentReference, paymentDate, proofDocumentUrl, notes } = req.body;
    const run = await PayrollRun.findById(req.params.id);
    if (!run) {
      return res.status(404).json({ success: false, message: 'Payroll run not found' });
    }

    if (run.payrollStatus === 'disbursed') {
      return res.status(400).json({
        success: false,
        message: 'This payroll run is already marked as disbursed'
      });
    }

    const payDate = paymentDate ? new Date(paymentDate) : new Date();

    run.payrollStatus = 'disbursed';
    run.paymentDate = payDate;
    run.disbursementDetails = {
      disbursedBy: req.user._id,
      disbursedAt: new Date(),
      sourceBankAccount: sourceBankAccount || 'Company Payroll Account',
      paymentReference: paymentReference || `DISB-${run.payrollCode}`,
      proofDocumentUrl
    };
    if (notes) run.notes = notes;

    await run.save();

    // Update child Payslips to paid & process loan deductions
    const payslips = await Payslip.find({ payrollRun: run._id });
    for (const ps of payslips) {
      ps.paymentStatus = 'paid';
      ps.disbursement = {
        paymentDate: payDate,
        transactionReference: paymentReference || `DISB-${run.payrollCode}`,
        disbursedBy: req.user._id,
        notes: 'Disbursed via batch payroll'
      };
      await ps.save();

      // Decrement active loan balances
      const nonStatutory = ps.deductions?.nonStatutoryDeductions || {};
      const loanDeduction = (nonStatutory.loanRepayment || 0) + (nonStatutory.salaryAdvanceDeduction || 0);

      if (loanDeduction > 0) {
        const activeLoans = await SalaryAdvanceLoan.find({
          employee: ps.employee,
          repaymentStatus: 'active',
          remainingBalance: { $gt: 0 }
        });

        let remainingToDeduct = loanDeduction;
        for (const loan of activeLoans) {
          if (remainingToDeduct <= 0) break;
          const deductAmount = Math.min(loan.monthlyDeductionAmount || remainingToDeduct, loan.remainingBalance, remainingToDeduct);
          loan.remainingBalance = Math.max(0, loan.remainingBalance - deductAmount);
          remainingToDeduct -= deductAmount;

          loan.repaymentHistory.push({
            payrollRun: run._id,
            payslip: ps._id,
            installmentNumber: (loan.repaymentHistory?.length || 0) + 1,
            amountPaid: deductAmount,
            paymentDate: payDate,
            balanceAfterPayment: loan.remainingBalance
          });

          if (loan.remainingBalance === 0) {
            loan.repaymentStatus = 'repaid';
          }
          await loan.save();
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: `Payroll run ${run.payrollCode} successfully disbursed to ${payslips.length} employees`,
      data: run
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Cancel a payroll run
 * @route   DELETE /api/payroll/runs/:id
 * @access  Private (HR Manager, Finance, Super Admin)
 */
export const cancelPayrollRun = async (req, res) => {
  try {
    const run = await PayrollRun.findById(req.params.id);
    if (!run) {
      return res.status(404).json({ success: false, message: 'Payroll run not found' });
    }

    if (run.payrollStatus === 'disbursed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a payroll run that has already been disbursed'
      });
    }

    // Delete associated payslips
    await Payslip.deleteMany({ payrollRun: run._id });

    run.payrollStatus = 'cancelled';
    await run.save();

    return res.status(200).json({
      success: true,
      message: `Payroll run ${run.payrollCode} has been cancelled and associated payslips removed`
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 4. PAYSLIP CONTROLLERS
// ==========================================

/**
 * @desc    List payslips across runs
 * @route   GET /api/payroll/payslips
 * @access  Private (HR, Finance, Executives)
 */
export const getPayslips = async (req, res) => {
  try {
    const { payrollRunId, employeeId, paymentStatus, page = 1, limit = 20 } = req.query;
    const query = {};

    if (payrollRunId) query.payrollRun = payrollRunId;
    if (employeeId) query.employee = employeeId;
    if (paymentStatus) query.paymentStatus = paymentStatus;

    const total = await Payslip.countDocuments(query);
    const payslips = await Payslip.find(query)
      .populate('employee', 'name employeeNumber department jobTitle')
      .populate('payrollRun', 'payrollCode title periodMonth periodYear payrollStatus')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    return res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: payslips
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get currently logged-in employee's payslips
 * @route   GET /api/payroll/payslips/my-payslips
 * @access  Private (Any authenticated employee)
 */
export const getMyPayslips = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'No employee profile linked to your user account'
      });
    }

    const payslips = await Payslip.find({ employee: employee._id })
      .populate('payrollRun', 'payrollCode title periodMonth periodYear payrollStatus paymentDate')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      total: payslips.length,
      data: payslips
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get payslip by ID
 * @route   GET /api/payroll/payslips/:id
 * @access  Private (Owner Employee or HR/Finance/Executives)
 */
export const getPayslipById = async (req, res) => {
  try {
    const payslip = await Payslip.findById(req.params.id)
      .populate('employee', 'name employeeNumber department jobTitle user')
      .populate('payrollRun', 'payrollCode title periodMonth periodYear payrollStatus paymentDate');

    if (!payslip) {
      return res.status(404).json({ success: false, message: 'Payslip not found' });
    }

    // Permission check: owner employee or HR/Finance/Executive
    const userRoles = req.user.roles || [];
    const isOwner = payslip.employee?.user && String(payslip.employee.user) === String(req.user._id);
    const hasPrivilege = userRoles.some((r) =>
      [...HR_ADMIN_ROLES, ROLES.FINANCE, ...EXECUTIVE_ROLES].includes(r)
    );

    if (!isOwner && !hasPrivilege) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this payslip'
      });
    }

    return res.status(200).json({
      success: true,
      data: payslip
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get printable / formatted HTML payslip view
 * @route   GET /api/payroll/payslips/:id/html
 * @access  Private
 */
export const getPayslipHtml = async (req, res) => {
  try {
    const payslip = await Payslip.findById(req.params.id).populate('employee');
    if (!payslip) {
      return res.status(404).send('Payslip not found');
    }

    const config = (await PayrollConfig.findOne({ isActive: true })) || {
      currency: 'ETB',
      companyName: 'Vector Advert ERP'
    };

    const html = renderHtmlPayslip(payslip, config);
    res.setHeader('Content-Type', 'text/html');
    return res.send(html);
  } catch (error) {
    return res.status(500).send(`Error generating payslip: ${error.message}`);
  }
};

// ==========================================
// 5. SALARY ADVANCES & STAFF LOANS
// ==========================================

/**
 * @desc    List all salary advances and staff loans
 * @route   GET /api/payroll/loans
 * @access  Private (HR, Finance, Executives)
 */
export const getLoans = async (req, res) => {
  try {
    const { status, type, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status) query.repaymentStatus = status;
    if (type) query.requestType = type;

    const total = await SalaryAdvanceLoan.countDocuments(query);
    const loans = await SalaryAdvanceLoan.find(query)
      .populate('employee', 'name employeeNumber department jobTitle basicSalary')
      .populate('approvals.managerApproval.approvedBy', 'email')
      .populate('approvals.hrApproval.approvedBy', 'email')
      .populate('approvals.financeApproval.approvedBy', 'email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    return res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: loans
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get currently logged-in employee's loan & advance requests
 * @route   GET /api/payroll/loans/my-loans
 * @access  Private (Any authenticated employee)
 */
export const getMyLoans = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'No employee profile linked to your user account'
      });
    }

    const loans = await SalaryAdvanceLoan.find({ employee: employee._id })
      .populate('approvals.managerApproval.approvedBy', 'email')
      .populate('approvals.hrApproval.approvedBy', 'email')
      .populate('approvals.financeApproval.approvedBy', 'email')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      total: loans.length,
      data: loans
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Apply for salary advance or staff loan
 * @route   POST /api/payroll/loans
 * @access  Private (Employee or HR on behalf)
 */
export const applyForLoan = async (req, res) => {
  try {
    const {
      employeeId,
      requestType = 'salary_advance',
      amountRequested,
      totalInstallments = 1,
      reason
    } = req.body;

    if (!amountRequested || !reason) {
      return res.status(400).json({
        success: false,
        message: 'amountRequested and reason are required'
      });
    }

    let targetEmployeeId = employeeId;
    if (!targetEmployeeId) {
      const emp = await Employee.findOne({ user: req.user._id });
      if (!emp) {
        return res.status(404).json({
          success: false,
          message: 'No employee profile linked to your user account'
        });
      }
      targetEmployeeId = emp._id;
    }

    const employee = await Employee.findById(targetEmployeeId);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const installments = Math.max(1, Number(totalInstallments) || 1);
    const amount = Number(amountRequested);
    const monthlyDeduction = Math.round((amount / installments) * 100) / 100;

    const count = await SalaryAdvanceLoan.countDocuments();
    const loanCode = `LN-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const loan = await SalaryAdvanceLoan.create({
      loanCode,
      employee: employee._id,
      requestType,
      amountRequested: amount,
      amountApproved: amount,
      totalInstallments: installments,
      monthlyDeductionAmount: monthlyDeduction,
      reason,
      remainingBalance: amount,
      repaymentStatus: 'pending_approval'
    });

    const populated = await SalaryAdvanceLoan.findById(loan._id)
      .populate('employee', 'name employeeNumber department jobTitle basicSalary');

    return res.status(201).json({
      success: true,
      message: 'Loan application submitted successfully and is pending review',
      data: populated
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Approve / reject a loan stage (Manager -> HR -> Finance)
 * @route   POST /api/payroll/loans/:id/approve
 * @access  Private (Managers, HR, Finance)
 */
export const approveLoanStage = async (req, res) => {
  try {
    const { stage, decision, approvedAmount, comments } = req.body;
    const loan = await SalaryAdvanceLoan.findById(req.params.id);
    if (!loan) {
      return res.status(404).json({ success: false, message: 'Loan request not found' });
    }

    const isApproved = decision === 'approved';

    if (approvedAmount && Number(approvedAmount) > 0) {
      loan.amountApproved = Number(approvedAmount);
      loan.monthlyDeductionAmount = Math.round((loan.amountApproved / loan.totalInstallments) * 100) / 100;
      loan.remainingBalance = loan.amountApproved;
    }

    if (stage === 'managerApproval') {
      loan.approvals.managerApproval = {
        status: isApproved ? 'approved' : 'rejected',
        approvedBy: req.user._id,
        approvedAt: new Date(),
        comments
      };
    } else if (stage === 'hrApproval') {
      loan.approvals.hrApproval = {
        status: isApproved ? 'approved' : 'rejected',
        approvedBy: req.user._id,
        approvedAt: new Date(),
        comments
      };
    } else if (stage === 'financeApproval') {
      loan.approvals.financeApproval = {
        status: isApproved ? 'approved' : 'rejected',
        approvedBy: req.user._id,
        approvedAt: new Date(),
        comments
      };
    }

    if (!isApproved) {
      loan.repaymentStatus = 'rejected';
    } else if (
      loan.approvals.hrApproval?.status === 'approved' &&
      loan.approvals.financeApproval?.status === 'approved'
    ) {
      loan.repaymentStatus = 'approved';
    }

    await loan.save();

    return res.status(200).json({
      success: true,
      message: `Loan application stage ${stage} updated`,
      data: loan
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Disburse loan to employee (activates deductions in upcoming payroll runs)
 * @route   POST /api/payroll/loans/:id/disburse
 * @access  Private (Finance, Super Admin)
 */
export const disburseLoan = async (req, res) => {
  try {
    const { disbursementReference, disbursementDate } = req.body;
    const loan = await SalaryAdvanceLoan.findById(req.params.id);
    if (!loan) {
      return res.status(404).json({ success: false, message: 'Loan not found' });
    }

    if (loan.repaymentStatus !== 'approved' && loan.repaymentStatus !== 'pending_approval') {
      return res.status(400).json({
        success: false,
        message: `Cannot disburse loan with status: ${loan.repaymentStatus}`
      });
    }

    const payDate = disbursementDate ? new Date(disbursementDate) : new Date();
    loan.disbursementDate = payDate;
    loan.disbursementReference = disbursementReference || `LOAN-DISB-${loan.loanCode}`;
    loan.repaymentStatus = 'active';
    loan.deductionStartMonth = payDate.getMonth() + 1;
    loan.deductionStartYear = payDate.getFullYear();
    loan.remainingBalance = loan.amountApproved || loan.amountRequested;

    await loan.save();

    return res.status(200).json({
      success: true,
      message: `Loan ${loan.loanCode} has been disbursed and marked active for monthly payroll deductions`,
      data: loan
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 6. ANALYTICS & REPORTS
// ==========================================

/**
 * @desc    Get high-level Payroll analytics & departmental summaries
 * @route   GET /api/payroll/analytics/summary
 * @access  Private (HR, Finance, Executives)
 */
export const getPayrollAnalytics = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();

    const runsThisYear = await PayrollRun.find({
      periodYear: currentYear,
      payrollStatus: { $in: ['approved', 'disbursed'] }
    });

    let totalDisbursedYTD = 0;
    let totalTaxYTD = 0;
    let totalPensionYTD = 0;

    runsThisYear.forEach((r) => {
      totalDisbursedYTD += r.financialSummary?.totalNetPay || 0;
      totalTaxYTD += r.financialSummary?.totalIncomeTax || 0;
      totalPensionYTD += (r.financialSummary?.totalEmployeePension || 0) + (r.financialSummary?.totalEmployerPension || 0);
    });

    // Active employees count
    const activeEmployeesCount = await Employee.countDocuments({
      employmentStatus: { $in: ['active', 'probation', 'on_leave'] }
    });

    // Recent 6 payroll runs
    const recentRuns = await PayrollRun.find()
      .sort({ periodYear: -1, periodMonth: -1 })
      .limit(6);

    return res.status(200).json({
      success: true,
      data: {
        currentYear,
        activeEmployeesCount,
        totalDisbursedYTD: Math.round(totalDisbursedYTD * 100) / 100,
        totalTaxYTD: Math.round(totalTaxYTD * 100) / 100,
        totalPensionYTD: Math.round(totalPensionYTD * 100) / 100,
        recentRuns
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
