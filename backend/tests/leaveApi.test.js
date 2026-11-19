import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import authRoutes from '../routes/authRoutes.js';
import employeeRoutes from '../routes/employeeRoutes.js';
import leaveRoutes from '../routes/leaveRoutes.js';
import User from '../models/User.js';
import Employee from '../models/Employee.js';
import LeaveBalance from '../models/LeaveBalance.js';
import LeaveRequest from '../models/LeaveRequest.js';
import { ROLES } from '../constants/roles.js';

const PORT = 5097;
const BASE_URL = `http://localhost:${PORT}`;

async function runLeaveTests() {
  console.log('🚀 Starting Leave Management Integration Tests...\n');

  // Connect to DB
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vector_advert_full_erp_test';
  await mongoose.connect(mongoURI);
  console.log('Connected to test MongoDB database');

  // Setup Express App
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/employees', employeeRoutes);
  app.use('/api/leave', leaveRoutes);

  const server = app.listen(PORT);
  console.log(`Test server running at ${BASE_URL}\n`);

  let hrToken = '';
  let employeeToken = '';
  let employeeId = '';
  let leaveBalanceId = '';
  let leaveRequestId = '';

  try {
    // Clean test DB
    await User.deleteMany({ email: { $regex: /@leavetest\.vector/ } });
    await Employee.deleteMany({ email: { $regex: /@leavetest\.vector/ } });
    await LeaveBalance.deleteMany({});
    await LeaveRequest.deleteMany({});

    // 1. Register HR Manager
    console.log('Test 1: Register HR Manager');
    const hrRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'hr.director@leavetest.vector',
        password: 'Password123!',
        roles: [ROLES.HR_MANAGER]
      })
    });
    const hrData = await hrRes.json();
    if (!hrData.success) throw new Error(`HR Registration failed: ${hrData.message}`);
    hrToken = hrData.data.token;
    console.log('✅ HR Manager registered and token obtained.');

    // 2. Create Employee profile with linked User account
    console.log('\nTest 2: Create Employee and provision user account');
    const empRes = await fetch(`${BASE_URL}/api/employees`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hrToken}`
      },
      body: JSON.stringify({
        name: { first: 'Selamawit', last: 'Tilahun' },
        email: 'selamawit.tilahun@leavetest.vector',
        primaryPhone: '+251911889900',
        department: 'Finance & Accounts',
        jobTitle: 'Senior Accountant',
        createUser: {
          password: 'EmployeePassword123!',
          roles: [ROLES.EMPLOYEE]
        }
      })
    });
    const empData = await empRes.json();
    if (!empData.success) throw new Error(`Employee creation failed: ${empData.message}`);
    employeeId = empData.data._id;
    console.log(`✅ Employee created: ${empData.data.fullName} (${empData.data.employeeNumber})`);

    // 3. Login as the newly created Employee
    console.log('\nTest 3: Login as Employee');
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'selamawit.tilahun@leavetest.vector',
        password: 'EmployeePassword123!'
      })
    });
    const loginData = await loginRes.json();
    if (!loginData.success) throw new Error(`Login failed: ${loginData.message}`);
    employeeToken = loginData.data.token;
    console.log('✅ Logged in as Employee.');

    // 4. Fetch Leave Balance for Employee (Auto-initialization of statutory balances)
    console.log('\nTest 4: Get Leave Balance (/api/leave/balances/me)');
    const balRes = await fetch(`${BASE_URL}/api/leave/balances/me`, {
      headers: { Authorization: `Bearer ${employeeToken}` }
    });
    const balData = await balRes.json();
    if (!balData.success) throw new Error('Failed to get leave balance');
    leaveBalanceId = balData.data._id;
    console.log(`✅ Leave balance initialized for year ${balData.data.year}:`);
    console.log(`   Annual: ${balData.data.annualLeave.annualRemainingDays} days remaining`);
    console.log(`   Sick: ${balData.data.sickLeave.sickRemainingDays} days remaining`);
    console.log(`   Casual: ${balData.data.casualLeave.casualRemainingDays} days remaining`);
    console.log(`   Maternity: ${balData.data.maternityLeave.maternityRemainingDays} days remaining`);
    console.log(`   Paternity: ${balData.data.paternityLeave.paternityRemainingDays} days remaining`);

    // 5. Test validation: Reject request exceeding remaining balance (e.g. requesting 25 days annual leave)
    console.log('\nTest 5: Reject leave request exceeding remaining balance (25 days requested, 16 available)');
    const overRes = await fetch(`${BASE_URL}/api/leave/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${employeeToken}`
      },
      body: JSON.stringify({
        leaveType: 'annual',
        startDate: '2026-12-01',
        endDate: '2026-12-25',
        totalLeaveDays: 25,
        requestReason: 'Extended overseas vacation'
      })
    });
    const overData = await overRes.json();
    if (overRes.status !== 400 || !overData.message.includes('Insufficient leave balance')) {
      throw new Error('Over-entitlement check failed!');
    }
    console.log(`✅ Correctly rejected: ${overData.message}`);

    // 6. Test validation: Reject invalid date range (startDate > endDate)
    console.log('\nTest 6: Reject invalid date range (startDate > endDate)');
    const invalidDateRes = await fetch(`${BASE_URL}/api/leave/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${employeeToken}`
      },
      body: JSON.stringify({
        leaveType: 'annual',
        startDate: '2026-12-10',
        endDate: '2026-12-05',
        totalLeaveDays: 5,
        requestReason: 'Typo in dates'
      })
    });
    const invalidDateData = await invalidDateRes.json();
    if (invalidDateRes.status !== 400) {
      throw new Error('Invalid date check failed!');
    }
    console.log(`✅ Correctly rejected: ${invalidDateData.message}`);

    // 7. Successfully submit a valid 3-day Annual Leave request
    console.log('\nTest 7: Submit valid 3-day Annual Leave Request');
    const reqRes = await fetch(`${BASE_URL}/api/leave/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${employeeToken}`
      },
      body: JSON.stringify({
        leaveType: 'annual',
        startDate: '2026-12-01',
        endDate: '2026-12-03',
        startDayPeriod: 'morning',
        endDayPeriod: 'full_day',
        totalLeaveDays: 3,
        requestReason: 'Personal family matters',
        supportingAttachments: ['https://cdn.example.com/attachments/note.pdf']
      })
    });
    const reqData = await reqRes.json();
    if (!reqData.success) throw new Error(`Submit leave request failed: ${reqData.message}`);
    leaveRequestId = reqData.data._id;
    console.log(`✅ Leave Request created: ID ${leaveRequestId}, Status: ${reqData.data.requestStatus}, Days: ${reqData.data.totalLeaveDays}`);

    // 8. Test validation: Block overlapping request during same dates
    console.log('\nTest 8: Block overlapping leave request for same dates');
    const overlapRes = await fetch(`${BASE_URL}/api/leave/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${employeeToken}`
      },
      body: JSON.stringify({
        leaveType: 'casual',
        startDate: '2026-12-02',
        endDate: '2026-12-04',
        totalLeaveDays: 2,
        requestReason: 'Overlapping request'
      })
    });
    const overlapData = await overlapRes.json();
    if (overlapRes.status !== 400 || !overlapData.message.includes('overlapping')) {
      throw new Error('Overlapping request was not blocked!');
    }
    console.log(`✅ Correctly blocked: ${overlapData.message}`);

    // 9. Query Employee's Leave Requests (/api/leave/requests/me)
    console.log('\nTest 9: Query Employee Leave Requests (/api/leave/requests/me)');
    const myReqRes = await fetch(`${BASE_URL}/api/leave/requests/me`, {
      headers: { Authorization: `Bearer ${employeeToken}` }
    });
    const myReqData = await myReqRes.json();
    if (!myReqData.success || myReqData.count < 1) throw new Error('Query my requests failed');
    console.log(`✅ Retrieved ${myReqData.count} request(s) for employee.`);

    // 10. HR / Management Query All Requests with Filters
    console.log('\nTest 10: HR Query All Requests (/api/leave/requests?status=pending)');
    const allReqRes = await fetch(`${BASE_URL}/api/leave/requests?status=pending&department=Finance`, {
      headers: { Authorization: `Bearer ${hrToken}` }
    });
    const allReqData = await allReqRes.json();
    if (!allReqData.success || allReqData.count < 1) throw new Error('HR query requests failed');
    console.log(`✅ HR retrieved ${allReqData.count} pending request(s) matching department filter.`);

    // 11. Sequential Double Approval Workflow (Manager -> HR Officer)
    console.log('\nTest 11a: Stage 1 - Manager Approval (/api/leave/requests/:id/review)');
    const mgrReviewRes = await fetch(`${BASE_URL}/api/leave/requests/${leaveRequestId}/review`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hrToken}`
      },
      body: JSON.stringify({
        action: 'approved',
        comments: 'Endorsed by Department Head / Acting Manager'
      })
    });
    const mgrReviewData = await mgrReviewRes.json();
    if (!mgrReviewData.success || mgrReviewData.data.requestStatus !== 'pending_hr') {
      throw new Error(`Manager approval failed: ${mgrReviewData.message}`);
    }
    if (mgrReviewData.data.managerApproval.status !== 'approved') {
      throw new Error('Manager approval status was not marked approved');
    }
    console.log(`✅ Stage 1 passed: Status is '${mgrReviewData.data.requestStatus}', waiting for HR approval.`);

    // Verify balance is NOT deducted yet after manager approval
    const midBalRes = await fetch(`${BASE_URL}/api/leave/balances/me`, {
      headers: { Authorization: `Bearer ${employeeToken}` }
    });
    const midBalData = await midBalRes.json();
    if (midBalData.data.annualLeave.annualUsedDays !== 0) {
      throw new Error('Leave balance should not be deducted before HR approval!');
    }
    console.log('✅ Verified: Leave balance unchanged during pending_hr state (0 used).');

    // Stage 2: Final HR Approval
    console.log('\nTest 11b: Stage 2 - Final HR Approval (/api/leave/requests/:id/review)');
    const hrReviewRes = await fetch(`${BASE_URL}/api/leave/requests/${leaveRequestId}/review`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hrToken}`
      },
      body: JSON.stringify({
        action: 'approved',
        comments: 'Final policy approval granted by HR Officer'
      })
    });
    const hrReviewData = await hrReviewRes.json();
    if (!hrReviewData.success || hrReviewData.data.requestStatus !== 'approved') {
      throw new Error(`Final HR approval failed: ${hrReviewData.message}`);
    }
    if (hrReviewData.data.hrApproval.status !== 'approved') {
      throw new Error('HR approval status was not marked approved');
    }
    console.log(`✅ Stage 2 passed: Request fully approved. Status: '${hrReviewData.data.requestStatus}'`);

    // Verify balance deduction after HR approval
    const checkBalRes = await fetch(`${BASE_URL}/api/leave/balances/me`, {
      headers: { Authorization: `Bearer ${employeeToken}` }
    });
    const checkBalData = await checkBalRes.json();
    if (checkBalData.data.annualLeave.annualUsedDays !== 3 || checkBalData.data.annualLeave.annualRemainingDays !== 13) {
      throw new Error(`Balance deduction incorrect! Used: ${checkBalData.data.annualLeave.annualUsedDays}, Remaining: ${checkBalData.data.annualLeave.annualRemainingDays}`);
    }
    console.log(`✅ Verified automatic balance deduction: Used 3 days, Remaining ${checkBalData.data.annualLeave.annualRemainingDays} days (was 16).`);

    // 12. Cancel Approved Leave Request (Automatic Balance Credit Restoration)
    console.log('\nTest 12: Cancel Approved Leave Request and restore balance');
    const cancelRes = await fetch(`${BASE_URL}/api/leave/requests/${leaveRequestId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${employeeToken}`
      },
      body: JSON.stringify({
        cancellationReason: 'Family event rescheduled'
      })
    });
    const cancelData = await cancelRes.json();
    if (!cancelData.success || cancelData.data.requestStatus !== 'cancelled') {
      throw new Error('Cancel leave request failed');
    }
    console.log(`✅ Request cancelled: ${cancelData.message}`);

    // Verify balance credit restoration
    const restoredBalRes = await fetch(`${BASE_URL}/api/leave/balances/me`, {
      headers: { Authorization: `Bearer ${employeeToken}` }
    });
    const restoredBalData = await restoredBalRes.json();
    if (restoredBalData.data.annualLeave.annualUsedDays !== 0 || restoredBalData.data.annualLeave.annualRemainingDays !== 16) {
      throw new Error(`Balance rollback failed! Used: ${restoredBalData.data.annualLeave.annualUsedDays}, Remaining: ${restoredBalData.data.annualLeave.annualRemainingDays}`);
    }
    console.log(`✅ Verified balance restoration: Used days rolled back to 0, Remaining restored to 16.`);

    // 13. Manual Balance Adjustment as HR
    console.log('\nTest 13: Manual Leave Balance Adjustment (/api/leave/balances/:id)');
    const adjRes = await fetch(`${BASE_URL}/api/leave/balances/${leaveBalanceId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hrToken}`
      },
      body: JSON.stringify({
        carriedForwardDays: 2
      })
    });
    const adjData = await adjRes.json();
    if (!adjData.success || adjData.data.carriedForwardDays !== 2 || adjData.data.annualLeave.annualRemainingDays !== 18) {
      throw new Error('Manual adjustment failed');
    }
    console.log(`✅ Manual adjustment success: Added 2 carried forward days -> New Annual Remaining: ${adjData.data.annualLeave.annualRemainingDays}`);

    // 14. Batch Year Balance Initialization
    console.log('\nTest 14: Batch Year Balance Initialization (/api/leave/balances/initialize)');
    const nextYear = new Date().getFullYear() + 1;
    const initRes = await fetch(`${BASE_URL}/api/leave/balances/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hrToken}`
      },
      body: JSON.stringify({
        year: nextYear,
        carryForwardMax: 5
      })
    });
    const initData = await initRes.json();
    if (!initData.success) throw new Error('Batch initialization failed');
    console.log(`✅ Successfully batch initialized balances for ${nextYear}: ${initData.createdCount} profile(s) initialized.`);

    // Cleanup
    await User.deleteMany({ email: { $regex: /@leavetest\.vector/ } });
    await Employee.deleteMany({ email: { $regex: /@leavetest\.vector/ } });
    await LeaveBalance.deleteMany({});
    await LeaveRequest.deleteMany({});

    console.log('\n🎉 ALL 14 LEAVE MANAGEMENT INTEGRATION TESTS PASSED! 🎉\n');
  } finally {
    server.close();
    await mongoose.disconnect();
    console.log('Test server and database connection closed.');
  }
}

runLeaveTests().catch((err) => {
  console.error('\n❌ Test failure:', err);
  process.exit(1);
});
