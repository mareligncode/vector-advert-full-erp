import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import authRoutes from '../routes/authRoutes.js';
import employeeRoutes from '../routes/employeeRoutes.js';
import clearanceRoutes from '../routes/clearanceRoutes.js';
import User from '../models/User.js';
import Employee from '../models/Employee.js';
import Clearance from '../models/Clearance.js';
import { ROLES, ACCOUNT_STATUS } from '../constants/roles.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 5095;
const BASE_URL = `http://localhost:${PORT}`;

async function runClearanceTests() {
  console.log('🚀 Starting Offboarding & Clearance Management Integration Tests...\n');

  // Connect to DB
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vector_advert_full_erp_test';
  await mongoose.connect(mongoURI);
  console.log('Connected to test MongoDB database');

  // Setup Express App
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));
  app.use('/api/auth', authRoutes);
  app.use('/api/employees', employeeRoutes);
  app.use('/api/clearances', clearanceRoutes);

  const server = app.listen(PORT);
  console.log(`Test server running at ${BASE_URL}\n`);

  let hrToken = '';
  let deptHeadToken = '';
  let storeToken = '';
  let financeToken = '';
  let employeeToken = '';

  let employeeId = '';
  let clearanceId = '';

  try {
    // Clean test DB
    await User.deleteMany({ email: { $regex: /@clearancetest\.vector/ } });
    await Employee.deleteMany({ email: { $regex: /@clearancetest\.vector/ } });
    await Clearance.deleteMany({});

    // 1. Register Role Users
    console.log('Test 1: Register Department Reviewers & Employee');

    // HR Manager
    const hrRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'hr.head@clearancetest.vector',
        password: 'Password123!',
        roles: [ROLES.HR_MANAGER]
      })
    });
    hrToken = (await hrRes.json()).data.token;

    // Department Head
    const dhRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'creative.lead@clearancetest.vector',
        password: 'Password123!',
        roles: [ROLES.DEPARTMENT_HEAD]
      })
    });
    deptHeadToken = (await dhRes.json()).data.token;

    // Storekeeper
    const storeRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'store.keeper@clearancetest.vector',
        password: 'Password123!',
        roles: [ROLES.STOREKEEPER]
      })
    });
    storeToken = (await storeRes.json()).data.token;

    // Finance Officer
    const finRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'finance.lead@clearancetest.vector',
        password: 'Password123!',
        roles: [ROLES.FINANCE]
      })
    });
    financeToken = (await finRes.json()).data.token;

    // 2. Create Employee profile with linked User account
    console.log('\nTest 2: Create resigning Employee and provision user account');
    const empRes = await fetch(`${BASE_URL}/api/employees`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hrToken}`
      },
      body: JSON.stringify({
        name: { first: 'Ermias', last: 'Tesfaye' },
        email: 'ermias.tesfaye@clearancetest.vector',
        primaryPhone: '+251911447788',
        department: 'Creative & Design',
        jobTitle: 'Senior 3D Visualizer',
        createUser: {
          password: 'EmployeePassword123!',
          roles: [ROLES.EMPLOYEE]
        }
      })
    });
    const empData = await empRes.json();
    if (!empData.success) throw new Error(`Create employee failed: ${empData.message}`);
    employeeId = empData.data._id;

    // Login as employee
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'ermias.tesfaye@clearancetest.vector',
        password: 'EmployeePassword123!'
      })
    });
    employeeToken = (await loginRes.json()).data.token;
    console.log(`✅ Employee created & logged in: ${empData.data.fullName} (${empData.data.employeeNumber})`);

    // 3. Employee initiates clearance (resignation submission)
    console.log('\nTest 3: Employee initiates clearance & submits resignation');
    const initRes = await fetch(`${BASE_URL}/api/clearances`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${employeeToken}`
      },
      body: JSON.stringify({
        resignationDate: '2026-11-15',
        lastWorkingDay: '2026-12-15',
        reasonForLeaving: 'Pursuing international master studies in animation'
      })
    });
    const initData = await initRes.json();
    if (!initData.success) throw new Error(`Initiate clearance failed: ${initData.message}`);
    clearanceId = initData.data._id;
    console.log(`✅ Clearance initiated: ID ${clearanceId}, Status: '${initData.data.overallClearanceStatus}'`);
    console.log(`   Initialized ${initData.data.clearances.length} departments: ${initData.data.clearances.map(c => c.department).join(', ')}`);

    // 4. Department Head reviews and approves department_head clearance
    console.log('\nTest 4: Department Head signs off on department_head clearance');
    const dhClearRes = await fetch(`${BASE_URL}/api/clearances/${clearanceId}/department/department_head`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${deptHeadToken}`
      },
      body: JSON.stringify({
        status: 'approved',
        note: 'All client projects handed over to senior team',
        items: [
          { name: 'Operational Handover of Tasks & Active Projects', cleared: true },
          { name: 'Handover of Physical & Digital Files/Client Assets', cleared: true },
          { name: 'Knowledge Transfer & Delegation of Responsibilities', cleared: true }
        ]
      })
    });
    const dhClearData = await dhClearRes.json();
    if (!dhClearData.success) throw new Error(`DH clearance failed: ${dhClearData.message}`);
    console.log(`✅ Department Head sign-off successful. Overall status transitioned to: '${dhClearData.overallClearanceStatus}'`);

    // 5. Unauthorized access check: Department Head tries to sign off Store clearance
    console.log('\nTest 5: Department Head forbidden from signing off on Store clearance');
    const forbiddenRes = await fetch(`${BASE_URL}/api/clearances/${clearanceId}/department/store`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${deptHeadToken}`
      },
      body: JSON.stringify({ status: 'approved' })
    });
    if (forbiddenRes.status !== 403) {
      throw new Error('Department authorization check failed to block unauthorized role!');
    }
    console.log('✅ Correctly blocked: Department Head cannot sign off Store clearance (403 Forbidden).');

    // 6. Storekeeper approves Store clearance
    console.log('\nTest 6: Storekeeper signs off on Store clearance');
    const storeClearRes = await fetch(`${BASE_URL}/api/clearances/${clearanceId}/department/store`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${storeToken}`
      },
      body: JSON.stringify({
        status: 'approved',
        note: 'Keys, badges, and work gear returned in good condition'
      })
    });
    const storeClearData = await storeClearRes.json();
    if (!storeClearData.success) throw new Error(`Store clearance failed: ${storeClearData.message}`);
    console.log(`✅ Storekeeper sign-off successful: ${storeClearData.data.clearances.find(c => c.department === 'store').status}`);

    // 7. IT clearance signed off by HR/Admin
    console.log('\nTest 7: IT clearance sign-off by Admin/HR');
    const itClearRes = await fetch(`${BASE_URL}/api/clearances/${clearanceId}/department/it`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hrToken}`
      },
      body: JSON.stringify({
        status: 'approved',
        note: 'MacBook Pro and monitors received. Email and domain accounts deactivated.'
      })
    });
    const itClearData = await itClearRes.json();
    if (!itClearData.success) throw new Error(`IT clearance failed: ${itClearData.message}`);
    console.log(`✅ IT sign-off successful: ${itClearData.data.clearances.find(c => c.department === 'it').status}`);

    // 8. Finance Officer rejects Finance clearance initially (pending advance loan)
    console.log('\nTest 8: Finance Officer rejects Finance clearance due to unsettled advance');
    const finRejectRes = await fetch(`${BASE_URL}/api/clearances/${clearanceId}/department/finance`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${financeToken}`
      },
      body: JSON.stringify({
        status: 'rejected',
        note: 'Employee has 5,000 ETB outstanding salary advance to settle',
        items: [
          { name: 'Settlement of Salary Advance & Company Loans', cleared: false, remarks: '5000 ETB outstanding' },
          { name: 'Petty Cash & Expense Reports Reconciliation', cleared: true },
          { name: 'Final Severance & Leave Encashment Calculation', cleared: true }
        ]
      })
    });
    const finRejectData = await finRejectRes.json();
    if (!finRejectData.success || finRejectData.overallClearanceStatus !== 'rejected') {
      throw new Error('Finance rejection failed to update overall status to rejected');
    }
    console.log(`✅ Finance clearance rejected: Overall status properly transitioned to '${finRejectData.overallClearanceStatus}'`);

    // 9. Attempt to finalize clearance while finance is rejected
    console.log('\nTest 9: Attempting to finalize clearance while departments are unapproved');
    const preFinalizeRes = await fetch(`${BASE_URL}/api/clearances/${clearanceId}/finalize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hrToken}`
      },
      body: JSON.stringify({
        certificateUrl: 'https://cdn.example.com/clearance-cert.pdf'
      })
    });
    const preFinalizeData = await preFinalizeRes.json();
    if (preFinalizeRes.status !== 400 || !preFinalizeData.message.includes('not yet approved')) {
      throw new Error('Finalize was allowed with unapproved departments!');
    }
    console.log(`✅ Correctly blocked early finalization: ${preFinalizeData.message}`);

    // 10. Finance approves after settlement
    console.log('\nTest 10: Finance Officer approves after salary advance settlement');
    const finApproveRes = await fetch(`${BASE_URL}/api/clearances/${clearanceId}/department/finance`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${financeToken}`
      },
      body: JSON.stringify({
        status: 'approved',
        note: 'Advance deducted from final pay slip. All dues clear.',
        items: [
          { name: 'Settlement of Salary Advance & Company Loans', cleared: true },
          { name: 'Petty Cash & Expense Reports Reconciliation', cleared: true },
          { name: 'Final Severance & Leave Encashment Calculation', cleared: true }
        ]
      })
    });
    const finApproveData = await finApproveRes.json();
    if (!finApproveData.success) throw new Error('Finance re-approval failed');
    console.log(`✅ Finance sign-off now approved. Status: ${finApproveData.data.clearances.find(c => c.department === 'finance').status}`);

    // 11. HR signs off on final HR clearance
    console.log('\nTest 11: HR signs off on final HR department clearance');
    const hrClearRes = await fetch(`${BASE_URL}/api/clearances/${clearanceId}/department/hr`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hrToken}`
      },
      body: JSON.stringify({
        status: 'approved',
        note: 'Exit interview conducted. Company ID card returned.'
      })
    });
    const hrClearData = await hrClearRes.json();
    if (!hrClearData.success || hrClearData.overallClearanceStatus !== 'approved') {
      throw new Error(`All 5 depts approved, but overall status is '${hrClearData.overallClearanceStatus}'`);
    }
    console.log(`✅ All 5 departments approved! Overall status reached: '${hrClearData.overallClearanceStatus}'`);

    // 12. Finalize clearance with certificate upload
    console.log('\nTest 12: Finalize Clearance, issue certificate & deprovision employee user');
    const certFilePath = path.join(__dirname, 'test_certificate.pdf');
    fs.writeFileSync(certFilePath, 'PDF-Vector-Clearance-Certificate-Test-Content');

    const formData = new FormData();
    formData.append('certificate', new Blob([fs.readFileSync(certFilePath)], { type: 'application/pdf' }), 'clearance_cert_ermias.pdf');

    const finalizeRes = await fetch(`${BASE_URL}/api/clearances/${clearanceId}/finalize`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${hrToken}`
      },
      body: formData
    });
    const finalizeData = await finalizeRes.json();
    if (!finalizeData.success || finalizeData.data.overallClearanceStatus !== 'completed') {
      throw new Error(`Finalization failed: ${finalizeData.message}`);
    }
    console.log(`✅ Clearance completed successfully! Status: '${finalizeData.data.overallClearanceStatus}'`);
    console.log(`   Certificate attached: ${finalizeData.data.clearanceCertificateUrl}`);

    // Clean up temporary local test cert file
    if (fs.existsSync(certFilePath)) fs.unlinkSync(certFilePath);

    // 13. Verify employee employmentStatus updated to 'resigned' and User is inactive
    console.log('\nTest 13: Verify Employee status is resigned and User account is inactive');
    const checkEmp = await Employee.findById(employeeId);
    if (checkEmp.employmentStatus !== 'resigned') {
      throw new Error(`Employee status was not updated to resigned (actual: ${checkEmp.employmentStatus})`);
    }

    const checkUser = await User.findById(checkEmp.user);
    if (checkUser.accountStatus !== ACCOUNT_STATUS.INACTIVE) {
      throw new Error(`User account status was not set to inactive (actual: ${checkUser.accountStatus})`);
    }
    console.log(`✅ Verified Employee employmentStatus = '${checkEmp.employmentStatus}'`);
    console.log(`✅ Verified User accountStatus = '${checkUser.accountStatus}' (deprovisioned)`);

    // 14. Query My Clearance (/api/clearances/me)
    console.log('\nTest 14: Query Employee clearance details (/api/clearances/:id)');
    const getRes = await fetch(`${BASE_URL}/api/clearances/${clearanceId}`, {
      headers: { Authorization: `Bearer ${hrToken}` }
    });
    const getData = await getRes.json();
    if (!getData.success || getData.data._id !== clearanceId) throw new Error('Get clearance failed');
    console.log(`✅ Retrieved clearance for: ${getData.data.employee.fullName}, Reason: ${getData.data.reasonForLeaving}`);

    // Cleanup
    await User.deleteMany({ email: { $regex: /@clearancetest\.vector/ } });
    await Employee.deleteMany({ email: { $regex: /@clearancetest\.vector/ } });
    await Clearance.deleteMany({});

    console.log('\n🎉 ALL 14 OFFBOARDING & CLEARANCE INTEGRATION TESTS PASSED! 🎉\n');
  } finally {
    server.close();
    await mongoose.disconnect();
    console.log('Test server and database connection closed.');
  }
}

runClearanceTests().catch((err) => {
  console.error('\n❌ Test failure:', err);
  process.exit(1);
});
