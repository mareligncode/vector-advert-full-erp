import assert from 'assert';
import {
  calculateIncomeTax,
  calculatePension,
  renderHtmlPayslip
} from '../utils/payrollCalculator.js';
import { DEFAULT_INCOME_TAX_SLABS } from '../models/PayrollConfig.js';

console.log('🧪 Running Payroll Calculation Engine Unit Tests...\n');

// 1. Test Income Tax Slabs (Ethiopian Standard PAYE)
// Tier 1: 0 - 600 ETB (0%)
assert.strictEqual(calculateIncomeTax(500, DEFAULT_INCOME_TAX_SLABS), 0);
assert.strictEqual(calculateIncomeTax(600, DEFAULT_INCOME_TAX_SLABS), 0);

// Tier 2: 601 - 1,650 ETB (10% - 60)
// e.g. 1000 ETB: 1000 * 0.10 - 60 = 40 ETB
assert.strictEqual(calculateIncomeTax(1000, DEFAULT_INCOME_TAX_SLABS), 40);

// Tier 3: 1,651 - 3,200 ETB (15% - 142.50)
// e.g. 2000 ETB: 2000 * 0.15 - 142.5 = 157.50 ETB
assert.strictEqual(calculateIncomeTax(2000, DEFAULT_INCOME_TAX_SLABS), 157.5);

// Tier 4: 3,201 - 5,250 ETB (20% - 302.50)
// e.g. 4000 ETB: 4000 * 0.20 - 302.5 = 497.50 ETB
assert.strictEqual(calculateIncomeTax(4000, DEFAULT_INCOME_TAX_SLABS), 497.5);

// Tier 5: 5,251 - 7,800 ETB (25% - 565)
// e.g. 6000 ETB: 6000 * 0.25 - 565 = 935 ETB
assert.strictEqual(calculateIncomeTax(6000, DEFAULT_INCOME_TAX_SLABS), 935);

// Tier 6: 7,801 - 10,900 ETB (30% - 955)
// e.g. 10,000 ETB: 10000 * 0.30 - 955 = 2045 ETB
assert.strictEqual(calculateIncomeTax(10000, DEFAULT_INCOME_TAX_SLABS), 2045);

// Tier 7: > 10,900 ETB (35% - 1500)
// e.g. 20,000 ETB: 20000 * 0.35 - 1500 = 5500 ETB
assert.strictEqual(calculateIncomeTax(20000, DEFAULT_INCOME_TAX_SLABS), 5500);

console.log('✅ Progressive Income Tax (PAYE) calculation matches all Ethiopian tax slabs perfectly!');

// 2. Test Pension (7% employee, 11% employer)
const { employeePension, employerPension } = calculatePension(25000, {
  employeePensionRate: 7,
  employerPensionRate: 11,
  isPensionMandatory: true
});
assert.strictEqual(employeePension, 1750); // 25000 * 0.07 = 1750
assert.strictEqual(employerPension, 2750); // 25000 * 0.11 = 2750

console.log('✅ Statutory Pension calculations (7% employee = 1,750, 11% employer = 2,750 on 25,000 ETB) verified!');

// 3. Test HTML Payslip Template Renderer
const mockPayslip = {
  payslipNumber: 'PS-202611-0001',
  paymentMethod: 'bank_transfer',
  paymentStatus: 'paid',
  employeeSnapshot: {
    fullName: 'Abebe Kebede',
    employeeNumber: 'EMP-001',
    department: 'Marketing',
    jobTitle: 'Designer',
    employmentType: 'full-time',
    bankAccount: {
      bankName: 'CBE',
      holderName: 'Abebe Kebede',
      accountNumber: '1000123456789'
    }
  },
  attendanceSummary: {
    expectedWorkingDays: 22,
    daysWorked: 22,
    paidLeaveDays: 0,
    unpaidLeaveDays: 0,
    absentDays: 0
  },
  overtimeSummary: {
    totalOvertimeHours: 4,
    totalOvertimeAmount: 852.27
  },
  earnings: {
    basicSalary: 25000,
    earnedBasicSalary: 25000,
    allowances: [{ title: 'Transport', amount: 3000 }],
    overtimePay: 852.27,
    grossEarnings: 28852.27
  },
  deductions: {
    statutoryDeductions: {
      incomeTax: 5880.8,
      employeePension: 1750,
      employerPension: 2750
    },
    nonStatutoryDeductions: {
      loanRepayment: 1000,
      costSharing: 500
    },
    totalEmployeeDeductions: 9130.8
  },
  netSalary: 19721.47
};

const html = renderHtmlPayslip(mockPayslip, { currency: 'ETB', companyName: 'Vector Advert Full ERP' });
assert.ok(html.includes('PS-202611-0001'));
assert.ok(html.includes('Abebe Kebede'));
assert.ok(html.includes('19,721.47'));
assert.ok(html.includes('NET TAKE-HOME PAY'));

console.log('✅ HTML Payslip rendering verified!');
console.log('\n🎉 ALL PAYROLL UNIT TESTS PASSED SUCCESSFULLY!\n');
