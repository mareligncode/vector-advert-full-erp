import Attendance from '../models/Attendance.js';
import OvertimeRequest from '../models/OvertimeRequest.js';
import LeaveRequest from '../models/LeaveRequest.js';
import { DEFAULT_INCOME_TAX_SLABS } from '../models/PayrollConfig.js';

/**
 * Calculate Progressive Income Tax (PAYE) based on configured tax brackets
 * @param {number} taxableIncome
 * @param {Array} taxSlabs
 * @returns {number} calculated tax rounded to 2 decimals
 */
export const calculateIncomeTax = (taxableIncome, taxSlabs = DEFAULT_INCOME_TAX_SLABS) => {
  if (!taxableIncome || taxableIncome <= 0) return 0;

  const sortedSlabs = [...taxSlabs].sort((a, b) => a.minIncome - b.minIncome);

  for (const slab of sortedSlabs) {
    const isAboveMin = taxableIncome >= slab.minIncome;
    const isBelowMax = slab.maxIncome === null || slab.maxIncome === undefined || taxableIncome <= slab.maxIncome;

    if (isAboveMin && isBelowMax) {
      const tax = (taxableIncome * (slab.taxRate / 100)) - (slab.deductibleAmount || 0);
      return Math.max(0, Math.round(tax * 100) / 100);
    }
  }

  // Fallback to highest bracket
  const highestSlab = sortedSlabs[sortedSlabs.length - 1];
  if (highestSlab) {
    const tax = (taxableIncome * (highestSlab.taxRate / 100)) - (highestSlab.deductibleAmount || 0);
    return Math.max(0, Math.round(tax * 100) / 100);
  }

  return 0;
};

/**
 * Calculate Employee and Employer pension contributions
 * @param {number} basicSalary
 * @param {Object} pensionConfig
 * @returns {{ employeePension: number, employerPension: number }}
 */
export const calculatePension = (basicSalary, pensionConfig = {}) => {
  const {
    employeePensionRate = 7,
    employerPensionRate = 11,
    isPensionMandatory = true
  } = pensionConfig;

  if (!isPensionMandatory || !basicSalary || basicSalary <= 0) {
    return { employeePension: 0, employerPension: 0 };
  }

  const employeePension = Math.round((basicSalary * (employeePensionRate / 100)) * 100) / 100;
  const employerPension = Math.round((basicSalary * (employerPensionRate / 100)) * 100) / 100;

  return { employeePension, employerPension };
};

/**
 * Fetch and calculate approved overtime for an employee within a period
 * @param {ObjectId} employeeId
 * @param {Date} startDate
 * @param {Date} endDate
 * @param {number} basicSalary
 * @param {Object} config
 */
export const calculateOvertime = async (employeeId, startDate, endDate, basicSalary, config) => {
  const workingDays = config.standardWorkingDaysPerMonth || 22;
  const workingHours = config.standardWorkingHoursPerDay || 8;
  const hourlyWage = basicSalary > 0 ? basicSalary / (workingDays * workingHours) : 0;

  const overtimeRequests = await OvertimeRequest.find({
    employee: employeeId,
    requestDate: { $gte: startDate, $lte: endDate },
    requestStatus: 'approved'
  });

  let totalOvertimeHours = 0;
  let normalHours = 0;
  let nightHours = 0;
  let weekendHours = 0;
  let holidayHours = 0;

  const normalMultiplier = config.overtimeMultipliers?.normalDayMultiplier || 1.5;
  const nightMultiplier = config.overtimeMultipliers?.nightShiftMultiplier || 1.75;
  const weekendMultiplier = config.overtimeMultipliers?.weekendMultiplier || 2.0;
  const holidayMultiplier = config.overtimeMultipliers?.publicHolidayMultiplier || 2.5;

  for (const ot of overtimeRequests) {
    const hours = Number(ot.totalHours) || 0;
    totalOvertimeHours += hours;

    // Check day of week for weekend detection
    const dayOfWeek = new Date(ot.requestDate).getDay(); // 0 is Sunday, 6 is Saturday
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      weekendHours += hours;
    } else {
      // Check start time for night hours (between 22:00 and 06:00)
      const startHour = ot.startTime ? parseInt(ot.startTime.split(':')[0], 10) : 18;
      if (startHour >= 22 || startHour < 6) {
        nightHours += hours;
      } else {
        normalHours += hours;
      }
    }
  }

  const normalOvertimeAmount = Math.round((normalHours * hourlyWage * normalMultiplier) * 100) / 100;
  const nightOvertimeAmount = Math.round((nightHours * hourlyWage * nightMultiplier) * 100) / 100;
  const weekendOvertimeAmount = Math.round((weekendHours * hourlyWage * weekendMultiplier) * 100) / 100;
  const holidayOvertimeAmount = Math.round((holidayHours * hourlyWage * holidayMultiplier) * 100) / 100;

  const totalOvertimeAmount = Math.round(
    (normalOvertimeAmount + nightOvertimeAmount + weekendOvertimeAmount + holidayOvertimeAmount) * 100
  ) / 100;

  return {
    normalOvertimeHours: normalHours,
    normalOvertimeAmount,
    nightOvertimeHours: nightHours,
    nightOvertimeAmount,
    weekendOvertimeHours: weekendHours,
    weekendOvertimeAmount,
    holidayOvertimeHours: holidayHours,
    holidayOvertimeAmount,
    totalOvertimeHours,
    totalOvertimeAmount
  };
};

/**
 * Fetch and calculate attendance summary and absent deductions for an employee
 * @param {ObjectId} employeeId
 * @param {Date} startDate
 * @param {Date} endDate
 * @param {number} basicSalary
 * @param {Object} config
 */
export const calculateAttendanceMetrics = async (employeeId, startDate, endDate, basicSalary, config) => {
  const expectedWorkingDays = config.standardWorkingDaysPerMonth || 22;
  const standardHours = config.standardWorkingHoursPerDay || 8;
  const dailyWage = basicSalary > 0 ? basicSalary / expectedWorkingDays : 0;
  const hourlyWage = dailyWage > 0 ? dailyWage / standardHours : 0;

  // Total calendar days in range
  const oneDayMs = 1000 * 60 * 60 * 24;
  const calendarDays = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / oneDayMs) + 1);

  // Fetch Attendance records in range
  const attendances = await Attendance.find({
    employee: employeeId,
    attendanceDate: { $gte: startDate, $lte: endDate }
  });

  let daysWorked = 0;
  let totalMinutesLate = 0;

  attendances.forEach((att) => {
    if (att.attendanceStatus === 'present' || att.attendanceStatus === 'field_visit') {
      daysWorked += 1;
    } else if (att.attendanceStatus === 'half_day') {
      daysWorked += 0.5;
    }

    if (att.late && att.late.isLate && att.late.minutesLate > 0) {
      totalMinutesLate += att.late.minutesLate;
    }
  });

  // Fetch approved leaves in range
  const leaves = await LeaveRequest.find({
    employee: employeeId,
    requestStatus: 'approved',
    startDate: { $lte: endDate },
    endDate: { $gte: startDate }
  });

  let paidLeaveDays = 0;
  let unpaidLeaveDays = 0;

  leaves.forEach((l) => {
    const days = Number(l.totalLeaveDays) || 0;
    if (l.leaveType === 'unpaid') {
      unpaidLeaveDays += days;
    } else {
      paidLeaveDays += days;
    }
  });

  // Calculate unexcused absences if attendance records were kept
  let absentDays = 0;
  if (attendances.length > 0) {
    const recordedDays = daysWorked + paidLeaveDays + unpaidLeaveDays;
    if (recordedDays < expectedWorkingDays) {
      absentDays = Math.max(0, expectedWorkingDays - recordedDays);
    }
  }

  // Calculate late penalty if enabled
  let latePenaltyHours = 0;
  let latePenaltyDeduction = 0;
  if (config.latePenalty?.enabled && totalMinutesLate > (config.latePenalty.graceMinutes || 15)) {
    latePenaltyHours = Math.round((totalMinutesLate / 60) * 100) / 100;
    const penaltyRate = config.latePenalty.ratePerHour > 0 ? config.latePenalty.ratePerHour : hourlyWage;
    latePenaltyDeduction = Math.round((latePenaltyHours * penaltyRate) * 100) / 100;
  }

  // Calculate pro-rated basic salary deduction for unpaid and absent days
  const unpaidAndAbsentDays = unpaidLeaveDays + absentDays;
  const attendancePenaltyDeduction = Math.round(((unpaidAndAbsentDays * dailyWage) + latePenaltyDeduction) * 100) / 100;
  const earnedBasicSalary = Math.max(0, Math.round((basicSalary - (unpaidAndAbsentDays * dailyWage)) * 100) / 100);

  return {
    calendarDays,
    expectedWorkingDays,
    daysWorked,
    paidLeaveDays,
    unpaidLeaveDays,
    absentDays,
    lateArrivalPenaltyHours: latePenaltyHours,
    earnedBasicSalary,
    attendancePenaltyDeduction
  };
};

/**
 * Calculate complete individual payslip figures
 */
export const calculatePayslipData = async ({
  employee,
  salaryStructure,
  config,
  payrollRun,
  activeLoans = []
}) => {
  const baseSalary = salaryStructure?.baseSalary ?? employee.basicSalary ?? 0;
  const isOvertimeEligible = salaryStructure?.isOvertimeEligible ?? true;
  const isPensionEligible = salaryStructure?.isPensionEligible ?? true;
  const isTaxExempt = salaryStructure?.isTaxExempt ?? false;

  const startDate = new Date(payrollRun.startDate);
  const endDate = new Date(payrollRun.endDate);

  // 1. Attendance Metrics & pro-rated base
  const attendanceMetrics = await calculateAttendanceMetrics(
    employee._id,
    startDate,
    endDate,
    baseSalary,
    config
  );

  // 2. Overtime calculation
  let overtimeSummary = {
    normalOvertimeHours: 0,
    normalOvertimeAmount: 0,
    nightOvertimeHours: 0,
    nightOvertimeAmount: 0,
    weekendOvertimeHours: 0,
    weekendOvertimeAmount: 0,
    holidayOvertimeHours: 0,
    holidayOvertimeAmount: 0,
    totalOvertimeHours: 0,
    totalOvertimeAmount: 0
  };

  if (isOvertimeEligible) {
    overtimeSummary = await calculateOvertime(
      employee._id,
      startDate,
      endDate,
      baseSalary,
      config
    );
  }

  // 3. Allowances
  const allowances = [];
  let totalAllowances = 0;
  let totalTaxableAllowances = 0;

  const structureEarnings = salaryStructure?.earnings || [];
  for (const earn of structureEarnings) {
    if (!earn.isRecurring) continue;
    const amount = Number(earn.amount) || 0;
    totalAllowances += amount;

    let taxableAmount = amount;
    let exemptAmount = 0;

    if (!earn.isTaxable) {
      taxableAmount = 0;
      exemptAmount = amount;
    } else {
      // Check statutory / config tax-exempt limit
      let exemptLimit = earn.taxExemptLimit || 0;
      if (earn.title.toLowerCase().includes('transport') && config.taxExemptAllowanceLimits?.transportAllowanceLimit) {
        exemptLimit = Math.max(exemptLimit, config.taxExemptAllowanceLimits.transportAllowanceLimit);
      } else if (earn.title.toLowerCase().includes('food') && config.taxExemptAllowanceLimits?.foodAllowanceLimit) {
        exemptLimit = Math.max(exemptLimit, config.taxExemptAllowanceLimits.foodAllowanceLimit);
      } else if (earn.title.toLowerCase().includes('mobile') && config.taxExemptAllowanceLimits?.mobileAllowanceLimit) {
        exemptLimit = Math.max(exemptLimit, config.taxExemptAllowanceLimits.mobileAllowanceLimit);
      }

      if (exemptLimit > 0) {
        exemptAmount = Math.min(amount, exemptLimit);
        taxableAmount = Math.max(0, amount - exemptAmount);
      }
    }

    totalTaxableAllowances += taxableAmount;
    allowances.push({
      title: earn.title,
      amount,
      isTaxable: earn.isTaxable,
      taxableAmount,
      exemptAmount
    });
  }

  // 4. Gross Earnings
  const earnedBasic = attendanceMetrics.earnedBasicSalary;
  const overtimePay = overtimeSummary.totalOvertimeAmount;
  const grossEarnings = Math.round((earnedBasic + totalAllowances + overtimePay) * 100) / 100;

  // 5. Pension
  let pensionResult = { employeePension: 0, employerPension: 0 };
  if (isPensionEligible) {
    pensionResult = calculatePension(baseSalary, config.pensionContribution);
  }

  // 6. Taxable Income & PAYE Tax
  let taxableIncome = 0;
  let incomeTax = 0;

  if (!isTaxExempt) {
    // Taxable Income = Earned Basic + Taxable Allowances + Overtime Pay - Employee Pension (statutory pre-tax pension deduction)
    taxableIncome = Math.max(0, Math.round((earnedBasic + totalTaxableAllowances + overtimePay - pensionResult.employeePension) * 100) / 100);
    incomeTax = calculateIncomeTax(taxableIncome, config.incomeTaxSlabs);
  }

  // 7. Loan / Advance Deductions
  let loanRepayment = 0;
  let salaryAdvanceDeduction = 0;

  for (const loan of activeLoans) {
    if (loan.repaymentStatus !== 'active' || loan.remainingBalance <= 0) continue;
    const deduction = Math.min(loan.monthlyDeductionAmount || loan.remainingBalance, loan.remainingBalance);
    if (loan.requestType === 'salary_advance') {
      salaryAdvanceDeduction += deduction;
    } else {
      loanRepayment += deduction;
    }
  }

  // 8. Custom / Recurring Deductions from SalaryStructure
  const customDeductions = [];
  let otherDeductionsTotal = 0;
  let costSharing = 0;
  let unionDues = 0;

  const structureDeductions = salaryStructure?.deductions || [];
  for (const ded of structureDeductions) {
    if (!ded.isRecurring) continue;
    let dedAmount = Number(ded.amount) || 0;
    if (ded.deductionType === 'percentage' && ded.percentageRate > 0) {
      dedAmount = Math.round((baseSalary * (ded.percentageRate / 100)) * 100) / 100;
    }

    if (ded.title.toLowerCase().includes('cost sharing')) {
      costSharing += dedAmount;
    } else if (ded.title.toLowerCase().includes('union')) {
      unionDues += dedAmount;
    } else {
      otherDeductionsTotal += dedAmount;
      customDeductions.push({
        title: ded.title,
        amount: dedAmount,
        reason: 'Recurring salary structure deduction'
      });
    }
  }

  // Total Employee Deductions
  const totalEmployeeDeductions = Math.round(
    (incomeTax +
      pensionResult.employeePension +
      loanRepayment +
      salaryAdvanceDeduction +
      attendanceMetrics.attendancePenaltyDeduction +
      costSharing +
      unionDues +
      otherDeductionsTotal) * 100
  ) / 100;

  // Net Salary
  const netSalary = Math.max(0, Math.round((grossEarnings - totalEmployeeDeductions) * 100) / 100);

  // Bank account snapshot
  const primaryBank = (employee.bankAccounts && employee.bankAccounts.find((b) => b.isPrimary)) ||
    (employee.bankAccounts && employee.bankAccounts[0]) ||
    salaryStructure?.bankAccount ||
    {};

  return {
    employee: employee._id,
    payrollRun: payrollRun._id,
    employeeSnapshot: {
      employeeNumber: employee.employeeNumber,
      fullName: employee.fullName || `${employee.name?.first || ''} ${employee.name?.last || ''}`.trim(),
      department: employee.department,
      jobTitle: employee.jobTitle,
      employmentType: employee.employmentType,
      bankAccount: {
        bankName: primaryBank.bankName || '',
        holderName: primaryBank.holderName || '',
        accountNumber: primaryBank.accountNumber || '',
        branch: primaryBank.branch || ''
      }
    },
    attendanceSummary: {
      calendarDays: attendanceMetrics.calendarDays,
      expectedWorkingDays: attendanceMetrics.expectedWorkingDays,
      daysWorked: attendanceMetrics.daysWorked,
      paidLeaveDays: attendanceMetrics.paidLeaveDays,
      unpaidLeaveDays: attendanceMetrics.unpaidLeaveDays,
      absentDays: attendanceMetrics.absentDays,
      lateArrivalPenaltyHours: attendanceMetrics.lateArrivalPenaltyHours
    },
    overtimeSummary,
    earnings: {
      basicSalary: baseSalary,
      earnedBasicSalary: earnedBasic,
      allowances,
      overtimePay,
      bonuses: 0,
      commissions: 0,
      grossEarnings,
      taxableIncome
    },
    deductions: {
      statutoryDeductions: {
        incomeTax,
        employeePension: pensionResult.employeePension,
        employerPension: pensionResult.employerPension
      },
      nonStatutoryDeductions: {
        loanRepayment,
        salaryAdvanceDeduction,
        attendancePenaltyDeduction: attendanceMetrics.attendancePenaltyDeduction,
        costSharing,
        unionDues,
        disciplinaryDeductions: 0,
        customDeductions
      },
      totalEmployeeDeductions,
      totalEmployerContributions: pensionResult.employerPension
    },
    netSalary,
    paymentMethod: salaryStructure?.paymentMethod || 'bank_transfer',
    paymentStatus: 'pending'
  };
};

/**
 * Generate a beautifully styled, print-ready HTML Payslip document
 */
export const renderHtmlPayslip = (payslip, companyConfig = {}) => {
  const currency = companyConfig.currency || 'ETB';
  const companyName = companyConfig.companyName || 'Vector Advert ERP';

  const earnings = payslip.earnings || {};
  const deductions = payslip.deductions || {};
  const statutory = deductions.statutoryDeductions || {};
  const nonStatutory = deductions.nonStatutoryDeductions || {};
  const emp = payslip.employeeSnapshot || {};
  const bank = emp.bankAccount || {};
  const att = payslip.attendanceSummary || {};
  const ot = payslip.overtimeSummary || {};

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Payslip - ${payslip.payslipNumber}</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      padding: 30px;
      color: #1e293b;
      background: #f8fafc;
    }
    .payslip-container {
      max-width: 850px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 35px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #0284c7;
      padding-bottom: 20px;
      margin-bottom: 25px;
    }
    .company-title {
      font-size: 24px;
      font-weight: 700;
      color: #0f172a;
    }
    .payslip-badge {
      background: #e0f2fe;
      color: #0369a1;
      padding: 6px 14px;
      border-radius: 20px;
      font-weight: 600;
      font-size: 14px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 25px;
      font-size: 14px;
    }
    .info-box {
      background: #f1f5f9;
      padding: 15px;
      border-radius: 8px;
    }
    .info-box div {
      margin-bottom: 6px;
    }
    .tables-container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 25px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    th {
      background: #f8fafc;
      color: #475569;
      font-weight: 600;
      text-align: left;
      padding: 10px;
      border-bottom: 2px solid #cbd5e1;
    }
    td {
      padding: 8px 10px;
      border-bottom: 1px solid #f1f5f9;
    }
    .text-right {
      text-align: right;
    }
    .table-total {
      font-weight: bold;
      background: #f8fafc;
      border-top: 2px solid #cbd5e1;
    }
    .net-pay-banner {
      background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
      color: #ffffff;
      padding: 20px;
      border-radius: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
    }
    .net-pay-label {
      font-size: 16px;
      font-weight: 600;
    }
    .net-pay-amount {
      font-size: 28px;
      font-weight: 800;
    }
    .footer-signatures {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 20px;
      margin-top: 40px;
      text-align: center;
      font-size: 12px;
      color: #64748b;
    }
    .sig-line {
      border-top: 1px dashed #94a3b8;
      margin-top: 40px;
      padding-top: 8px;
    }
    @media print {
      body { background: white; padding: 0; }
      .payslip-container { box-shadow: none; border: none; padding: 10px; }
    }
  </style>
</head>
<body>
  <div class="payslip-container">
    <div class="header">
      <div>
        <div class="company-title">${companyName}</div>
        <div style="font-size: 14px; color: #64748b; margin-top: 4px;">Human Resources & Payroll Department</div>
      </div>
      <div>
        <span class="payslip-badge">PAYSLIP: ${payslip.payslipNumber}</span>
      </div>
    </div>

    <div class="info-grid">
      <div class="info-box">
        <div><strong>Employee Name:</strong> ${emp.fullName || '-'}</div>
        <div><strong>Employee ID:</strong> ${emp.employeeNumber || '-'}</div>
        <div><strong>Department:</strong> ${emp.department || '-'}</div>
        <div><strong>Job Title:</strong> ${emp.jobTitle || '-'}</div>
        <div><strong>Employment Type:</strong> ${emp.employmentType || '-'}</div>
      </div>
      <div class="info-box">
        <div><strong>Bank Name:</strong> ${bank.bankName || 'Not Specified'}</div>
        <div><strong>Account Holder:</strong> ${bank.holderName || '-'}</div>
        <div><strong>Account Number:</strong> ${bank.accountNumber || '-'}</div>
        <div><strong>Payment Method:</strong> ${payslip.paymentMethod || 'Bank Transfer'}</div>
        <div><strong>Payment Status:</strong> <span style="text-transform: uppercase; font-weight: 600; color: #0284c7;">${payslip.paymentStatus}</span></div>
      </div>
    </div>

    <div style="background: #f8fafc; border-radius: 8px; padding: 10px 15px; margin-bottom: 20px; font-size: 12px; color: #475569; display: flex; justify-content: space-between;">
      <span><strong>Expected Days:</strong> ${att.expectedWorkingDays || 0}</span>
      <span><strong>Days Worked:</strong> ${att.daysWorked || 0}</span>
      <span><strong>Paid Leave:</strong> ${att.paidLeaveDays || 0}</span>
      <span><strong>Unpaid / Absent:</strong> ${(att.unpaidLeaveDays || 0) + (att.absentDays || 0)}</span>
      <span><strong>OT Hours:</strong> ${ot.totalOvertimeHours || 0} hrs</span>
    </div>

    <div class="tables-container">
      <!-- Earnings Table -->
      <div>
        <table>
          <thead>
            <tr>
              <th>Earnings</th>
              <th class="text-right">Amount (${currency})</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Basic Salary (Contracted)</td>
              <td class="text-right">${(earnings.basicSalary || 0).toLocaleString()}</td>
            </tr>
            <tr>
              <td>Earned Basic Salary</td>
              <td class="text-right">${(earnings.earnedBasicSalary || 0).toLocaleString()}</td>
            </tr>
            ${(earnings.allowances || []).map(a => `
              <tr>
                <td>${a.title}</td>
                <td class="text-right">${(a.amount || 0).toLocaleString()}</td>
              </tr>
            `).join('')}
            <tr>
              <td>Overtime Pay</td>
              <td class="text-right">${(earnings.overtimePay || 0).toLocaleString()}</td>
            </tr>
            <tr class="table-total">
              <td>Total Gross Earnings</td>
              <td class="text-right">${(earnings.grossEarnings || 0).toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Deductions Table -->
      <div>
        <table>
          <thead>
            <tr>
              <th>Deductions</th>
              <th class="text-right">Amount (${currency})</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Income Tax (PAYE)</td>
              <td class="text-right">${(statutory.incomeTax || 0).toLocaleString()}</td>
            </tr>
            <tr>
              <td>Employee Pension (7%)</td>
              <td class="text-right">${(statutory.employeePension || 0).toLocaleString()}</td>
            </tr>
            ${nonStatutory.loanRepayment > 0 ? `
              <tr>
                <td>Staff Loan Deduction</td>
                <td class="text-right">${nonStatutory.loanRepayment.toLocaleString()}</td>
              </tr>
            ` : ''}
            ${nonStatutory.salaryAdvanceDeduction > 0 ? `
              <tr>
                <td>Salary Advance Deduction</td>
                <td class="text-right">${nonStatutory.salaryAdvanceDeduction.toLocaleString()}</td>
              </tr>
            ` : ''}
            ${nonStatutory.attendancePenaltyDeduction > 0 ? `
              <tr>
                <td>Attendance / Unpaid Deduction</td>
                <td class="text-right">${nonStatutory.attendancePenaltyDeduction.toLocaleString()}</td>
              </tr>
            ` : ''}
            ${nonStatutory.costSharing > 0 ? `
              <tr>
                <td>Cost Sharing</td>
                <td class="text-right">${nonStatutory.costSharing.toLocaleString()}</td>
              </tr>
            ` : ''}
            ${nonStatutory.unionDues > 0 ? `
              <tr>
                <td>Union Dues</td>
                <td class="text-right">${nonStatutory.unionDues.toLocaleString()}</td>
              </tr>
            ` : ''}
            <tr class="table-total">
              <td>Total Deductions</td>
              <td class="text-right">${(deductions.totalEmployeeDeductions || 0).toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Net Pay Banner -->
    <div class="net-pay-banner">
      <div>
        <div class="net-pay-label">NET TAKE-HOME PAY</div>
        <div style="font-size: 12px; opacity: 0.9;">Total Earnings minus Total Deductions</div>
      </div>
      <div class="net-pay-amount">
        ${currency} ${(payslip.netSalary || 0).toLocaleString()}
      </div>
    </div>

    <!-- Company Statutory Contributions Note -->
    <div style="font-size: 11px; color: #64748b; background: #f8fafc; padding: 10px; border-radius: 6px; margin-bottom: 20px;">
      * Employer Pension Contribution (11%): ${currency} ${(statutory.employerPension || 0).toLocaleString()} (Paid directly to pension authority by employer).
    </div>

    <div class="footer-signatures">
      <div>
        <div class="sig-line">Prepared By (HR)</div>
      </div>
      <div>
        <div class="sig-line">Approved By (Finance)</div>
      </div>
      <div>
        <div class="sig-line">Employee Signature</div>
      </div>
    </div>
  </div>
</body>
</html>`;
};
