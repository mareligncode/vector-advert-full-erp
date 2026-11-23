import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import authRoutes from '../routes/authRoutes.js';
import employeeRoutes from '../routes/employeeRoutes.js';
import attendanceRoutes from '../routes/attendanceRoutes.js';
import overtimeRoutes from '../routes/overtimeRoutes.js';
import payrollRoutes from '../routes/payrollRoutes.js';
import User from '../models/User.js';
import Employee from '../models/Employee.js';
import Attendance from '../models/Attendance.js';
import OvertimeRequest from '../models/OvertimeRequest.js';
import PayrollConfig from '../models/PayrollConfig.js';
import PayrollRun from '../models/PayrollRun.js';
import Payslip from '../models/Payslip.js';
import SalaryStructure from '../models/SalaryStructure.js';
import SalaryAdvanceLoan from '../models/SalaryAdvanceLoan.js';
import { ROLES } from '../constants/roles.js';

const PORT = 5097;
const BASE_URL = `http://localhost:${PORT}`;

async function runPayrollTests() {
  console.log('🚀 Starting Comprehensive Payroll & HR Integration Tests...\n');

  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vector_advert_full_erp';
  await mongoose.connect(mongoURI);
  console.log('✅ Connected to MongoDB');

  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use('/api/auth', authRoutes);
  app.use('/api/employees', employeeRoutes);
  app.use('/api/attendance', attendanceRoutes);
  app.use('/api/overtime', overtimeRoutes);
  app.use('/api/payroll', payrollRoutes);

  const server = app.listen(PORT);
  console.log(`✅ Test server running at ${BASE_URL}\n`);

  let hrToken = '';
  let financeToken = '';
  let employeeToken = '';
  let testEmployee = null;
  let testUserId = null;
  let testPayrollRunId = null;
  let testPayslipId = null;
  let testLoanId = null;

  try {
    // Clean previous test records
    await User.deleteMany({ email: { $regex: /@payrolltest\.vector/ } });
    await Employee.deleteMany({ email: { $regex: /@payrolltest\.vector/ } });
    await PayrollRun.deleteMany({ payrollCode: { $regex: /PR-2026/ } });
    await Payslip.deleteMany({ payslipNumber: { $regex: /PS-2026/ } });
    await SalaryAdvanceLoan.deleteMany({ reason: { $regex: /test/i } });

    // 1. Register HR Manager
    console.log('Test 1: Register HR Manager');
    const hrUserRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'hrmanager@payrolltest.vector',
        password: 'password123',
        roles: [ROLES.HR_MANAGER]
      })
    });
    const hrUserData = await hrUserRes.json();
    if (!hrUserData.success) throw new Error(`HR Reg failed: ${hrUserData.message}`);
    hrToken = hrUserData.data.token;
    console.log('✅ HR Manager registered');

    // 2. Register Finance User
    console.log('\nTest 2: Register Finance User');
    const finUserRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'finance@payrolltest.vector',
        password: 'password123',
        roles: [ROLES.FINANCE]
      })
    });
    const finUserData = await finUserRes.json();
    if (!finUserData.success) throw new Error(`Finance Reg failed: ${finUserData.message}`);
    financeToken = finUserData.data.token;
    console.log('✅ Finance User registered');

    // 3. Register Employee User & Profile
    console.log('\nTest 3: Register Employee User & HR Employee Profile');
    const empUserRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'employee@payrolltest.vector',
        password: 'password123',
        roles: [ROLES.EMPLOYEE]
      })
    });
    const empUserData = await empUserRes.json();
    if (!empUserData.success) throw new Error(`Employee Reg failed: ${empUserData.message}`);
    employeeToken = empUserData.data.token;
    testUserId = empUserData.data.user._id;

    // Create Employee record connected to user
    testEmployee = await Employee.create({
      employeeNumber: 'EMP-PAY-001',
      user: testUserId,
      name: { first: 'Abebe', middle: 'Kebede', last: 'Tesfaye' },
      email: 'employee@payrolltest.vector',
      primaryPhone: '+251911223344',
      department: 'Marketing & Design',
      jobTitle: 'Senior Graphics Designer',
      employmentStatus: 'active',
      basicSalary: 25000,
      bankAccounts: [
        {
          bankName: 'Commercial Bank of Ethiopia (CBE)',
          holderName: 'Abebe Kebede Tesfaye',
          accountNumber: '1000123456789',
          isPrimary: true
        }
      ]
    });
    console.log('✅ Employee profile created with basic salary: 25,000 ETB');

    // 4. Test Payroll Config Endpoint
    console.log('\nTest 4: Get and Update Payroll Configuration');
    const configRes = await fetch(`${BASE_URL}/api/payroll/config`, {
      headers: { Authorization: `Bearer ${hrToken}` }
    });
    const configData = await configRes.json();
    if (!configData.success) throw new Error(`Config fetch failed: ${configData.message}`);
    console.log(`✅ Active Config retrieved. Currency: ${configData.data.currency}, Working Days: ${configData.data.standardWorkingDaysPerMonth}`);

    // Update config
    const updateConfigRes = await fetch(`${BASE_URL}/api/payroll/config`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hrToken}`
      },
      body: JSON.stringify({
        companyName: 'Vector Advert Full ERP',
        currency: 'ETB',
        standardWorkingDaysPerMonth: 22,
        standardWorkingHoursPerDay: 8
      })
    });
    const updateConfigData = await updateConfigRes.json();
    if (!updateConfigData.success) throw new Error(`Config update failed: ${updateConfigData.message}`);
    console.log('✅ Config updated successfully');

    // 5. Test Salary Structure Creation
    console.log('\nTest 5: Create Employee Salary Structure with Allowances and Deductions');
    const structRes = await fetch(`${BASE_URL}/api/payroll/structures`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hrToken}`
      },
      body: JSON.stringify({
        employeeId: testEmployee._id,
        baseSalary: 25000,
        paymentMethod: 'bank_transfer',
        earnings: [
          { title: 'Transport Allowance', amount: 3000, isTaxable: true, isRecurring: true },
          { title: 'Position Allowance', amount: 2000, isTaxable: true, isRecurring: true }
        ],
        deductions: [
          { title: 'Cost Sharing', amount: 500, deductionType: 'fixed', isRecurring: true }
        ]
      })
    });
    const structData = await structRes.json();
    if (!structData.success) throw new Error(`Salary structure failed: ${structData.message}`);
    console.log('✅ Salary structure created with base 25,000 + 5,000 allowances');

    // 6. Connect with HR Modules: Attendance & Approved Overtime
    console.log('\nTest 6: Connect with existing HR Attendance and Approved Overtime');
    // Create attendance for this month
    const attendanceDate = new Date(2026, 10, 15); // Nov 15, 2026
    await Attendance.create({
      employee: testEmployee._id,
      attendanceDate,
      attendanceStatus: 'present',
      late: { isLate: false, minutesLate: 0 }
    });
    console.log('✅ Recorded Attendance entry');

    // Create approved overtime request
    const otRequest = await OvertimeRequest.create({
      employee: testEmployee._id,
      requestDate: new Date(2026, 10, 20),
      startTime: '18:00',
      endTime: '22:00',
      totalHours: 4,
      requestReason: 'Vector Advert Urgent Campaign Launch Overtime',
      requestStatus: 'approved'
    });
    console.log(`✅ Recorded Approved Overtime of ${otRequest.totalHours} hours`);

    // 7. Apply for Staff Loan / Advance
    console.log('\nTest 7: Apply, Approve, and Disburse Staff Salary Advance');
    const loanRes = await fetch(`${BASE_URL}/api/payroll/loans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${employeeToken}`
      },
      body: JSON.stringify({
        requestType: 'salary_advance',
        amountRequested: 3000,
        totalInstallments: 3,
        reason: 'Emergency Medical Expense Test'
      })
    });
    const loanData = await loanRes.json();
    if (!loanData.success) throw new Error(`Loan request failed: ${loanData.message}`);
    testLoanId = loanData.data._id;
    console.log(`✅ Loan requested: ${loanData.data.amountRequested} ETB, monthly deduction: ${loanData.data.monthlyDeductionAmount} ETB`);

    // Approve loan
    await fetch(`${BASE_URL}/api/payroll/loans/${testLoanId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hrToken}`
      },
      body: JSON.stringify({
        stage: 'hrApproval',
        decision: 'approved',
        comments: 'Verified with HR department'
      })
    });

    await fetch(`${BASE_URL}/api/payroll/loans/${testLoanId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${financeToken}`
      },
      body: JSON.stringify({
        stage: 'financeApproval',
        decision: 'approved',
        comments: 'Funds approved'
      })
    });

    // Disburse loan to activate deductions
    const disburseLoanRes = await fetch(`${BASE_URL}/api/payroll/loans/${testLoanId}/disburse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${financeToken}`
      },
      body: JSON.stringify({
        disbursementReference: 'CBE-TRANS-TEST-0099'
      })
    });
    const disburseLoanData = await disburseLoanRes.json();
    if (!disburseLoanData.success) throw new Error(`Loan disburse failed: ${disburseLoanData.message}`);
    console.log('✅ Loan approved and disbursed, status is active');

    // 8. Generate Monthly Payroll Run
    console.log('\nTest 8: Generate Monthly Payroll Run (November 2026)');
    const genRunRes = await fetch(`${BASE_URL}/api/payroll/runs/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hrToken}`
      },
      body: JSON.stringify({
        periodMonth: 11,
        periodYear: 2026,
        title: 'November 2026 Main Payroll Run',
        notes: 'Monthly batch execution test'
      })
    });
    const genRunData = await genRunRes.json();
    if (!genRunData.success) throw new Error(`Payroll generation failed: ${genRunData.message}`);
    testPayrollRunId = genRunData.data._id;
    console.log(`✅ Payroll run generated: ${genRunData.data.payrollCode}`);
    console.log(`   - Total Employees: ${genRunData.data.totalEmployees}`);
    console.log(`   - Total Basic Salary: ${genRunData.data.financialSummary.totalBasicSalary} ETB`);
    console.log(`   - Total Overtime Pay: ${genRunData.data.financialSummary.totalOvertimePay} ETB`);
    console.log(`   - Total Gross Pay: ${genRunData.data.financialSummary.totalGrossPay} ETB`);
    console.log(`   - Total PAYE Tax: ${genRunData.data.financialSummary.totalIncomeTax} ETB`);
    console.log(`   - Total Employee Pension (7%): ${genRunData.data.financialSummary.totalEmployeePension} ETB`);
    console.log(`   - Total Employer Pension (11%): ${genRunData.data.financialSummary.totalEmployerPension} ETB`);
    console.log(`   - Total Loan Deductions: ${genRunData.data.financialSummary.totalLoanDeductions} ETB`);
    console.log(`   - Total Net Pay: ${genRunData.data.financialSummary.totalNetPay} ETB`);

    // 9. Inspect Generated Payslip
    console.log('\nTest 9: Inspect Employee Payslip Details');
    const runDetailsRes = await fetch(`${BASE_URL}/api/payroll/runs/${testPayrollRunId}`, {
      headers: { Authorization: `Bearer ${hrToken}` }
    });
    const runDetailsData = await runDetailsRes.json();
    if (!runDetailsData.success || runDetailsData.data.payslips.length === 0) {
      throw new Error('No payslips found in run');
    }
    const empPayslip = runDetailsData.data.payslips.find((p) => String(p.employee._id) === String(testEmployee._id));
    if (!empPayslip) throw new Error('Employee payslip missing from run');
    testPayslipId = empPayslip._id;
    console.log(`✅ Payslip ${empPayslip.payslipNumber} for ${empPayslip.employeeSnapshot.fullName}:`);
    console.log(`   - Gross Earnings: ${empPayslip.earnings.grossEarnings} ETB`);
    console.log(`   - Income Tax (PAYE): ${empPayslip.deductions.statutoryDeductions.incomeTax} ETB`);
    console.log(`   - Employee Pension (7%): ${empPayslip.deductions.statutoryDeductions.employeePension} ETB`);
    console.log(`   - Salary Advance Deduction: ${empPayslip.deductions.nonStatutoryDeductions.salaryAdvanceDeduction} ETB`);
    console.log(`   - Cost Sharing Deduction: ${empPayslip.deductions.nonStatutoryDeductions.costSharing} ETB`);
    console.log(`   - Net Take-Home Salary: ${empPayslip.netSalary} ETB`);

    // Verify loan deduction was applied
    if (empPayslip.deductions.nonStatutoryDeductions.salaryAdvanceDeduction !== 1000) {
      throw new Error(`Expected 1000 ETB loan deduction, got: ${empPayslip.deductions.nonStatutoryDeductions.salaryAdvanceDeduction}`);
    }

    // 10. Test Printable HTML Payslip
    console.log('\nTest 10: Fetch Printable HTML Payslip');
    const htmlRes = await fetch(`${BASE_URL}/api/payroll/payslips/${testPayslipId}/html`, {
      headers: { Authorization: `Bearer ${employeeToken}` }
    });
    const htmlContent = await htmlRes.text();
    if (!htmlContent.includes('NET TAKE-HOME PAY') || !htmlContent.includes(empPayslip.payslipNumber)) {
      throw new Error('HTML payslip format invalid');
    }
    console.log('✅ HTML payslip template rendered successfully');

    // 11. Multi-stage Approval Workflow
    console.log('\nTest 11: Multi-stage Approval Workflow (HR -> Finance)');
    // Stage 1: HR Approval
    const hrApproveRes = await fetch(`${BASE_URL}/api/payroll/runs/${testPayrollRunId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hrToken}`
      },
      body: JSON.stringify({
        stage: 'hrApproval',
        decision: 'approved',
        comments: 'HR checks passed'
      })
    });
    const hrApproveData = await hrApproveRes.json();
    if (!hrApproveData.success) throw new Error(`HR run approval failed: ${hrApproveData.message}`);
    console.log(`✅ HR Approval passed. Status: ${hrApproveData.data.payrollStatus}`);

    // Stage 2: Finance Approval
    const finApproveRes = await fetch(`${BASE_URL}/api/payroll/runs/${testPayrollRunId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${financeToken}`
      },
      body: JSON.stringify({
        stage: 'financeApproval',
        decision: 'approved',
        comments: 'Budget and accounts verified'
      })
    });
    const finApproveData = await finApproveRes.json();
    if (!finApproveData.success) throw new Error(`Finance run approval failed: ${finApproveData.message}`);
    console.log(`✅ Finance Approval passed. Status: ${finApproveData.data.payrollStatus}`);

    // 12. Disburse Payroll Run
    console.log('\nTest 12: Disburse Payroll Run');
    const disbRes = await fetch(`${BASE_URL}/api/payroll/runs/${testPayrollRunId}/disburse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${financeToken}`
      },
      body: JSON.stringify({
        sourceBankAccount: 'CBE Corporate Account 10000000123',
        paymentReference: 'PAYROLL-DISB-NOV-2026',
        paymentDate: new Date()
      })
    });
    const disbData = await disbRes.json();
    if (!disbData.success) throw new Error(`Disbursement failed: ${disbData.message}`);
    console.log(`✅ Payroll run successfully disbursed! Status: ${disbData.data.payrollStatus}`);

    // Verify loan balance was updated
    const updatedLoan = await SalaryAdvanceLoan.findById(testLoanId);
    console.log(`✅ Loan remaining balance after deduction: ${updatedLoan.remainingBalance} ETB (from 3,000 ETB)`);
    if (updatedLoan.remainingBalance !== 2000) {
      throw new Error(`Expected remaining balance 2000, got: ${updatedLoan.remainingBalance}`);
    }

    // 13. Employee Self-Service: View My Payslips
    console.log('\nTest 13: Employee Self-Service (View My Payslips & Loans)');
    const myPayslipsRes = await fetch(`${BASE_URL}/api/payroll/payslips/my-payslips`, {
      headers: { Authorization: `Bearer ${employeeToken}` }
    });
    const myPayslipsData = await myPayslipsRes.json();
    if (!myPayslipsData.success || myPayslipsData.data.length === 0) {
      throw new Error('Employee could not fetch their payslip');
    }
    console.log(`✅ Employee retrieved their ${myPayslipsData.total} payslips successfully`);

    // 14. Analytics Summary
    console.log('\nTest 14: Payroll Analytics & Summary Dashboard API');
    const analyticsRes = await fetch(`${BASE_URL}/api/payroll/analytics/summary`, {
      headers: { Authorization: `Bearer ${hrToken}` }
    });
    const analyticsData = await analyticsRes.json();
    if (!analyticsData.success) throw new Error(`Analytics failed: ${analyticsData.message}`);
    console.log(`✅ Analytics retrieved: Total Disbursed YTD = ${analyticsData.data.totalDisbursedYTD} ETB, Active Employees = ${analyticsData.data.activeEmployeesCount}`);

    console.log('\n🎉 ALL 14 PAYROLL & HR INTEGRATION TESTS PASSED PERFECTLY!\n');
  } catch (err) {
    console.error('❌ Test failed with error:', err);
    process.exitCode = 1;
  } finally {
    server.close();
    await mongoose.disconnect();
    console.log('Test server and database disconnected.');
  }
}

runPayrollTests();
