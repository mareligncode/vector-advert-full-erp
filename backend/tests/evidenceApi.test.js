import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import authRoutes from '../routes/authRoutes.js';
import evidenceRoutes from '../routes/evidenceRoutes.js';
import leaveRoutes from '../routes/leaveRoutes.js';
import employeeRoutes from '../routes/employeeRoutes.js';

import User from '../models/User.js';
import Employee from '../models/Employee.js';
import Evidence from '../models/Evidence.js';
import LeaveRequest from '../models/LeaveRequest.js';
import LeaveBalance from '../models/LeaveBalance.js';
import { ROLES } from '../constants/roles.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '../uploads');

const PORT = 5096;
const BASE_URL = `http://localhost:${PORT}`;

async function runEvidenceTests() {
  console.log('🚀 Starting Evidence Management Integration Tests...\n');

  // Connect to Test DB
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vector_advert_full_erp_test';
  await mongoose.connect(mongoURI);
  console.log('Connected to test MongoDB database');

  // Setup Express App
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Static files serving
  app.use('/uploads', express.static(uploadsDir));

  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/evidence', evidenceRoutes);
  app.use('/api/employees', employeeRoutes);
  app.use('/api/leave', leaveRoutes);

  const server = app.listen(PORT);
  console.log(`Evidence test server running at ${BASE_URL}\n`);

  let hrToken = '';
  let hrUserId = '';
  let employeeToken = '';
  let employeeUserId = '';
  let sampleLeaveRequestId = '';
  let firstAttachmentId = '';
  let secondAttachmentId = '';
  let uploadedFileUrl = '';
  let noteId = '';

  try {
    // 0. Clean test data
    await User.deleteMany({ email: { $regex: /@evidencetest\.vector/ } });
    await Employee.deleteMany({ email: { $regex: /@evidencetest\.vector/ } });
    await Evidence.deleteMany({});
    await LeaveRequest.deleteMany({});
    await LeaveBalance.deleteMany({});

    // 1. Register HR Manager
    console.log('Test 1: Register HR Manager User');
    const hrRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'hr.manager@evidencetest.vector',
        password: 'Password123!',
        roles: [ROLES.HR_MANAGER]
      })
    });
    const hrData = await hrRes.json();
    if (!hrData.success) throw new Error(`HR Registration failed: ${hrData.message}`);
    hrToken = hrData.data.token;
    hrUserId = hrData.data._id;
    console.log('✅ HR Manager registered. Token obtained.\n');

    // 2. Register Employee User
    console.log('Test 2: Register Employee User');
    const empRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'staff.member@evidencetest.vector',
        password: 'Password123!',
        roles: [ROLES.EMPLOYEE]
      })
    });
    const empData = await empRes.json();
    if (!empData.success) throw new Error(`Employee Registration failed: ${empData.message}`);
    employeeToken = empData.data.token;
    employeeUserId = empData.data._id;
    console.log('✅ Employee registered. Token obtained.\n');

    // 3. Create an Employee profile & a sample Leave Request to serve as parent entity
    console.log('Test 3: Setup parent entity (Employee & Leave Request)');
    const employeeDoc = await Employee.create({
      employeeNumber: 'EMP-EVI-001',
      user: employeeUserId,
      name: { first: 'Almaz', middle: 'Ayana', last: 'Dibaba' },
      email: 'staff.member@evidencetest.vector',
      primaryPhone: '+251911223344',
      dateOfBirth: new Date('1995-05-15'),
      gender: 'female',
      maritalStatus: 'single',
      nationality: 'Ethiopian',
      homeAddress: 'Bole, Addis Ababa',
      basicSalary: 30000,
      department: 'Marketing',
      jobTitle: 'Copywriter',
      employmentStatus: 'active',
      hireDate: new Date('2024-01-01'),
      workLocation: 'office',
      employmentType: 'full-time'
    });

    const leaveBalanceDoc = await LeaveBalance.create({
      employee: employeeDoc._id,
      year: 2026,
      annualTotalEntitlement: 16,
      annualRemainingDays: 16,
      sickEntitlement: 15,
      sickRemainingDays: 15,
      casualEntitlement: 5,
      casualRemainingDays: 5
    });

    const leaveRequestDoc = await LeaveRequest.create({
      employee: employeeDoc._id,
      leaveBalance: leaveBalanceDoc._id,
      leaveType: 'sick',
      startDate: new Date('2026-11-20'),
      endDate: new Date('2026-11-22'),
      totalLeaveDays: 2,
      requestReason: 'Medical appointment and recovery'
    });
    sampleLeaveRequestId = leaveRequestDoc._id.toString();
    console.log(`✅ Sample LeaveRequest created: ID ${sampleLeaveRequestId}\n`);

    // 4. Upload Attachment via Multipart Form-Data
    console.log('Test 4: Upload attachment file via multipart form-data to LeaveRequest');
    const formData = new FormData();
    formData.append('title', 'Doctor Medical Certificate');
    formData.append('description', 'Hospital certificate diagnosing flu and bed rest recommendation');
    formData.append('entityOwner', employeeUserId);

    const fileContent = 'Simulated Hospital Medical Certificate Content 2026';
    const blob = new Blob([fileContent], { type: 'text/plain' });
    formData.append('file', blob, 'medical_certificate.txt');

    const uploadRes = await fetch(
      `${BASE_URL}/api/evidence/LeaveRequest/${sampleLeaveRequestId}/attachments`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${employeeToken}`
        },
        body: formData
      }
    );
    const uploadData = await uploadRes.json();
    if (!uploadData.success) throw new Error(`Upload attachment failed: ${uploadData.message}`);
    
    firstAttachmentId = uploadData.data.attachments[0]._id;
    uploadedFileUrl = uploadData.data.attachments[0].fileUrl;

    if (!uploadedFileUrl.startsWith('/uploads/evidence/')) {
      throw new Error(`Unexpected fileUrl: ${uploadedFileUrl}`);
    }
    if (uploadData.data.attachments[0].status !== 'pending') {
      throw new Error(`Expected initial status to be pending, got ${uploadData.data.attachments[0].status}`);
    }
    console.log(`✅ Attachment uploaded successfully. File URL: ${uploadedFileUrl}`);
    console.log(`   Attachment ID: ${firstAttachmentId}, Status: pending\n`);

    // 5. Test Static File Serving
    console.log('Test 5: Verify static file serving via Express /uploads');
    const staticRes = await fetch(`${BASE_URL}${uploadedFileUrl}`);
    if (!staticRes.ok) throw new Error(`Failed to serve static file: HTTP ${staticRes.status}`);
    const textServed = await staticRes.text();
    if (textServed !== fileContent) {
      throw new Error(`File content mismatch: expected "${fileContent}", got "${textServed}"`);
    }
    console.log('✅ File served statically and verified matching exact content.\n');

    // 6. Append Second Attachment to same entity (Verifies 1:1 single document guarantee)
    console.log('Test 6: Add second attachment to ensure it pushes into the SAME Evidence document');
    const form2 = new FormData();
    form2.append('title', 'Pharmacy Medication Receipt');
    form2.append('description', 'Prescription receipt from pharmacy');
    const blob2 = new Blob(['Pharmacy Receipt $45.00'], { type: 'text/plain' });
    form2.append('file', blob2, 'pharmacy_receipt.txt');

    const upload2Res = await fetch(
      `${BASE_URL}/api/evidence/LeaveRequest/${sampleLeaveRequestId}/attachments`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${employeeToken}`
        },
        body: form2
      }
    );
    const upload2Data = await upload2Res.json();
    if (!upload2Data.success) throw new Error(`Second upload failed: ${upload2Data.message}`);
    if (upload2Data.data.attachments.length !== 2) {
      throw new Error(`Expected 2 attachments, found ${upload2Data.data.attachments.length}`);
    }
    secondAttachmentId = upload2Data.data.attachments[1]._id;

    // Check count of Evidence docs in DB for this entity
    const countDocs = await Evidence.countDocuments({
      entityType: 'LeaveRequest',
      entityId: sampleLeaveRequestId
    });
    if (countDocs !== 1) {
      throw new Error(`Expected exactly 1 Evidence document in DB, found ${countDocs}`);
    }
    console.log(`✅ Second attachment pushed. Total attachments in doc: 2. DB count: 1 (Guaranteed 1:1)\n`);

    // 7. Add an Audit Note
    console.log('Test 7: Add Note to Evidence document');
    const noteRes = await fetch(
      `${BASE_URL}/api/evidence/LeaveRequest/${sampleLeaveRequestId}/notes`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${employeeToken}`
        },
        body: JSON.stringify({
          content: 'I submitted both doctor note and prescription receipt as requested by HR.'
        })
      }
    );
    const noteData = await noteRes.json();
    if (!noteData.success) throw new Error(`Add note failed: ${noteData.message}`);
    noteId = noteData.data.notes[0]._id;
    console.log(`✅ Note added successfully. Note ID: ${noteId}\n`);

    // 8. Review First Attachment: Approve (Verify)
    console.log('Test 8: HR reviews and verifies first attachment');
    const review1Res = await fetch(
      `${BASE_URL}/api/evidence/LeaveRequest/${sampleLeaveRequestId}/attachments/${firstAttachmentId}/review`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${hrToken}`
        },
        body: JSON.stringify({
          status: 'verified'
        })
      }
    );
    const review1Data = await review1Res.json();
    if (!review1Data.success) throw new Error(`Review 1 failed: ${review1Data.message}`);
    const att1 = review1Data.data.attachments.find((a) => a._id === firstAttachmentId);
    if (att1.status !== 'verified' || !att1.reviewedBy) {
      throw new Error(`Attachment status not updated properly to verified`);
    }
    console.log(`✅ First attachment verified by HR. Status: ${att1.status}, Reviewer: ${att1.reviewedBy.email}\n`);

    // 9. Review Second Attachment: Reject with reason
    console.log('Test 9: HR reviews and rejects second attachment with reason');
    const review2Res = await fetch(
      `${BASE_URL}/api/evidence/LeaveRequest/${sampleLeaveRequestId}/attachments/${secondAttachmentId}/review`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${hrToken}`
        },
        body: JSON.stringify({
          status: 'rejected',
          rejectionReason: 'Receipt image is blurry and pharmacy stamp is illegible'
        })
      }
    );
    const review2Data = await review2Res.json();
    if (!review2Data.success) throw new Error(`Review 2 failed: ${review2Data.message}`);
    const att2 = review2Data.data.attachments.find((a) => a._id === secondAttachmentId);
    if (att2.status !== 'rejected' || att2.rejectionReason !== 'Receipt image is blurry and pharmacy stamp is illegible') {
      throw new Error(`Attachment 2 rejection verification failed`);
    }
    console.log(`✅ Second attachment rejected with reason: "${att2.rejectionReason}"\n`);

    // 10. Fetch Evidence by Entity & inspect Virtual Summary
    console.log('Test 10: Fetch Evidence document by entity and verify populated fields & virtual summary');
    const getRes = await fetch(
      `${BASE_URL}/api/evidence/LeaveRequest/${sampleLeaveRequestId}`,
      {
        headers: {
          Authorization: `Bearer ${employeeToken}`
        }
      }
    );
    const getData = await getRes.json();
    if (!getData.success) throw new Error(`Get evidence failed: ${getData.message}`);
    
    const summary = getData.data.summary;
    console.log(`   Summary Counts: Total: ${summary.total}, Verified: ${summary.verified}, Rejected: ${summary.rejected}, Pending: ${summary.pending}`);
    if (summary.total !== 2 || summary.verified !== 1 || summary.rejected !== 1 || summary.pending !== 0) {
      throw new Error(`Virtual summary counts did not match expected values`);
    }
    console.log('✅ Evidence retrieved. Dynamic populate & virtual summary verified.\n');

    // 11. List Evidence with Filters (HR view)
    console.log('Test 11: HR query list evidence with status filter');
    const listRes = await fetch(
      `${BASE_URL}/api/evidence?status=verified`,
      {
        headers: {
          Authorization: `Bearer ${hrToken}`
        }
      }
    );
    const listData = await listRes.json();
    if (!listData.success) throw new Error(`List evidence failed: ${listData.message}`);
    if (listData.total < 1) throw new Error(`Expected at least 1 record in filtered evidence list`);
    console.log(`✅ HR retrieved ${listData.total} evidence record(s) matching filter.\n`);

    // 12. Delete Note
    console.log('Test 12: Delete Note');
    const delNoteRes = await fetch(
      `${BASE_URL}/api/evidence/LeaveRequest/${sampleLeaveRequestId}/notes/${noteId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${employeeToken}`
        }
      }
    );
    const delNoteData = await delNoteRes.json();
    if (!delNoteData.success) throw new Error(`Delete note failed: ${delNoteData.message}`);
    if (delNoteData.data.notes.length !== 0) {
      throw new Error(`Expected notes array to be empty after deletion`);
    }
    console.log('✅ Note deleted successfully.\n');

    // 13. Delete Attachment and verify local file removal
    console.log('Test 13: Delete Attachment and confirm physical file unlinking');
    const delAttRes = await fetch(
      `${BASE_URL}/api/evidence/LeaveRequest/${sampleLeaveRequestId}/attachments/${firstAttachmentId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${employeeToken}`
        }
      }
    );
    const delAttData = await delAttRes.json();
    if (!delAttData.success) throw new Error(`Delete attachment failed: ${delAttData.message}`);
    if (delAttData.data.attachments.length !== 1) {
      throw new Error(`Expected 1 attachment remaining, got ${delAttData.data.attachments.length}`);
    }

    // Check that physical file is unlinked
    const physicalPath = path.join(uploadsDir, uploadedFileUrl.replace(/^\/uploads\//, ''));
    if (fs.existsSync(physicalPath)) {
      throw new Error(`Expected physical file at ${physicalPath} to be deleted`);
    }
    console.log('✅ Attachment removed from database and physical file unlinked from disk.\n');

    console.log('🎉 ALL EVIDENCE INTEGRATION TESTS PASSED SUCCESSFULLY! 🎉\n');
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    process.exitCode = 1;
  } finally {
    server.close();
    await mongoose.connection.close();
    console.log('Test server and database connection closed.');
  }
}

runEvidenceTests();
