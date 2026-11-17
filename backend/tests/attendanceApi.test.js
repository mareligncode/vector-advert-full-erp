import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import authRoutes from '../routes/authRoutes.js';
import employeeRoutes from '../routes/employeeRoutes.js';
import attendanceRoutes from '../routes/attendanceRoutes.js';
import overtimeRoutes from '../routes/overtimeRoutes.js';
import fieldVisitRoutes from '../routes/fieldVisitRoutes.js';
import User from '../models/User.js';
import Employee from '../models/Employee.js';
import Attendance from '../models/Attendance.js';
import AttendanceConfig from '../models/AttendanceConfig.js';
import OvertimeRequest from '../models/OvertimeRequest.js';
import FieldVisit from '../models/FieldVisit.js';
import { ROLES } from '../constants/roles.js';

const PORT = 5098;
const BASE_URL = `http://localhost:${PORT}`;

// Office Coordinates: Bole Road, Addis Ababa
const OFFICE_LAT = 9.005401;
const OFFICE_LONG = 38.784015;

async function runAttendanceTests() {
  console.log('🚀 Starting Attendance & Field Tracking Integration Tests...\n');

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
  app.use('/api/attendance', attendanceRoutes);
  app.use('/api/overtime', overtimeRoutes);
  app.use('/api/field-visits', fieldVisitRoutes);

  const server = app.listen(PORT);
  console.log(`Test server running at ${BASE_URL}\n`);

  let hrToken = '';
  let employeeToken = '';
  let employeeId = '';
  let overtimeId = '';
  let fieldVisitId = '';

  try {
    // Clean test DB
    await User.deleteMany({ email: { $regex: /@attendancetest\.vector/ } });
    await Employee.deleteMany({ email: { $regex: /@attendancetest\.vector/ } });
    await Attendance.deleteMany({});
    await AttendanceConfig.deleteMany({});
    await OvertimeRequest.deleteMany({});
    await FieldVisit.deleteMany({});

    // 1. Register HR Manager
    console.log('Test 1: Register HR Manager');
    const hrRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'hr.manager@attendancetest.vector',
        password: 'Password123!',
        roles: [ROLES.HR_MANAGER]
      })
    });
    const hrData = await hrRes.json();
    if (!hrData.success) throw new Error(`HR Registration failed: ${hrData.message}`);
    hrToken = hrData.data.token;
    console.log('✅ HR Manager registered and token obtained.');

    // 2. Create Employee profile and provision linked User account
    console.log('\nTest 2: Create Employee and provision user account');
    const empRes = await fetch(`${BASE_URL}/api/employees`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hrToken}`
      },
      body: JSON.stringify({
        name: { first: 'Dawit', last: 'Alemu' },
        email: 'dawit.alemu@attendancetest.vector',
        primaryPhone: '+251911334455',
        department: 'Production & Field Ops',
        jobTitle: 'Field Installation Technician',
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
        email: 'dawit.alemu@attendancetest.vector',
        password: 'EmployeePassword123!'
      })
    });
    const loginData = await loginRes.json();
    if (!loginData.success) throw new Error(`Login failed: ${loginData.message}`);
    employeeToken = loginData.data.token;
    console.log('✅ Logged in as Employee.');

    // 4. Get active Attendance Configuration
    console.log('\nTest 4: Get Active Attendance Config');
    const configRes = await fetch(`${BASE_URL}/api/attendance/config`, {
      headers: { Authorization: `Bearer ${employeeToken}` }
    });
    const configData = await configRes.json();
    if (!configData.success) throw new Error('Failed to get attendance config');
    console.log(`✅ Retrieved config: ${configData.data.locationReferences.length} office(s), Late grace period: ${configData.data.lateAllowedMinutes}m`);

    // 5. Update Attendance Config as HR (set shift timings & geofence radius)
    console.log('\nTest 5: Update Attendance Config (Shift timings & 300m radius)');
    const updateConfRes = await fetch(`${BASE_URL}/api/attendance/config`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hrToken}`
      },
      body: JSON.stringify({
        morningTime: { startTime: '08:00', endTime: '12:00' },
        afternoonTime: { startTime: '13:00', endTime: '17:00' },
        lateAllowedMinutes: 10,
        maxAllowedDistanceMeters: 300,
        isSelfieRequired: true,
        isLocationRequired: true,
        autoOvertimeAllow: true,
        locationReferences: [
          {
            officeName: 'Vector Advert Headquarters',
            address: 'Bole Road, Addis Ababa',
            location: { lat: OFFICE_LAT, long: OFFICE_LONG },
            radiusMeters: 300
          }
        ]
      })
    });
    const updateConfData = await updateConfRes.json();
    if (!updateConfData.success) throw new Error('Update config failed');
    console.log('✅ Configuration successfully updated with strict geofence.');

    // 6. Test check-in rejection when selfie is missing
    console.log('\nTest 6: Reject check-in when selfie is missing');
    const noSelfieRes = await fetch(`${BASE_URL}/api/attendance/check-in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${employeeToken}`
      },
      body: JSON.stringify({
        lat: OFFICE_LAT,
        long: OFFICE_LONG,
        shift: 'morning'
        // selfie omitted
      })
    });
    const noSelfieData = await noSelfieRes.json();
    if (noSelfieRes.status !== 400 || !noSelfieData.message.includes('Selfie')) {
      throw new Error('Selfie requirement was not enforced!');
    }
    console.log('✅ Correctly rejected check-in missing selfie verification.');

    // 7. Test check-in rejection when outside geofence (e.g. 10km away)
    console.log('\nTest 7: Reject check-in when outside geofence boundary');
    const farAwayRes = await fetch(`${BASE_URL}/api/attendance/check-in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${employeeToken}`
      },
      body: JSON.stringify({
        lat: 9.145000, // ~16km away
        long: 38.750000,
        selfie: 'https://cdn.example.com/selfies/far-away.jpg',
        shift: 'morning'
      })
    });
    const farAwayData = await farAwayRes.json();
    if (farAwayRes.status !== 400 || !farAwayData.message.includes('Location verification failed')) {
      throw new Error('Geofence boundary check failed to reject out-of-bounds check-in!');
    }
    console.log(`✅ Correctly rejected: Out of bounds (${farAwayData.distanceMeters}m away from office).`);

    // 8. Successful Morning check-in within office coordinates
    console.log('\nTest 8: Successful Morning Check-In within office radius');
    const checkInRes = await fetch(`${BASE_URL}/api/attendance/check-in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${employeeToken}`
      },
      body: JSON.stringify({
        lat: OFFICE_LAT + 0.0001, // ~11 meters from office center
        long: OFFICE_LONG + 0.0001,
        selfie: 'https://cdn.example.com/selfies/morning-valid.jpg',
        shift: 'morning',
        notes: 'Arrived at HQ'
      })
    });
    const checkInData = await checkInRes.json();
    if (!checkInData.success) throw new Error(`Check-in failed: ${checkInData.message}`);
    console.log(`✅ Morning Check-in success: Status '${checkInData.checkInStatus}', Distance: ${checkInData.data.morningCheck.checkIn.distanceMeters}m`);

    // 9. Prevent duplicate check-in for the same shift
    console.log('\nTest 9: Prevent duplicate check-in for morning shift');
    const dupCheckInRes = await fetch(`${BASE_URL}/api/attendance/check-in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${employeeToken}`
      },
      body: JSON.stringify({
        lat: OFFICE_LAT,
        long: OFFICE_LONG,
        selfie: 'https://cdn.example.com/selfies/duplicate.jpg',
        shift: 'morning'
      })
    });
    const dupCheckInData = await dupCheckInRes.json();
    if (dupCheckInRes.status !== 400 || !dupCheckInData.message.includes('already checked in')) {
      throw new Error('Duplicate check-in was allowed!');
    }
    console.log('✅ Correctly blocked duplicate check-in for the same shift.');

    // 10. Morning Check-Out
    console.log('\nTest 10: Morning Check-Out');
    const checkOutRes = await fetch(`${BASE_URL}/api/attendance/check-out`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${employeeToken}`
      },
      body: JSON.stringify({
        lat: OFFICE_LAT,
        long: OFFICE_LONG,
        selfie: 'https://cdn.example.com/selfies/morning-out.jpg',
        shift: 'morning'
      })
    });
    const checkOutData = await checkOutRes.json();
    if (!checkOutData.success) throw new Error(`Check-out failed: ${checkOutData.message}`);
    console.log(`✅ Morning Check-out success: Status '${checkOutData.checkOutStatus}', Attendance status: ${checkOutData.data.attendanceStatus}`);

    // 11. Afternoon Check-In and Check-Out with Overtime
    console.log('\nTest 11: Afternoon Check-In and Check-Out');
    const pmInRes = await fetch(`${BASE_URL}/api/attendance/check-in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${employeeToken}`
      },
      body: JSON.stringify({
        lat: OFFICE_LAT,
        long: OFFICE_LONG,
        selfie: 'https://cdn.example.com/selfies/pm-in.jpg',
        shift: 'afternoon'
      })
    });
    const pmInData = await pmInRes.json();
    if (!pmInData.success) throw new Error(`Afternoon check-in failed: ${pmInData.message}`);

    const pmOutRes = await fetch(`${BASE_URL}/api/attendance/check-out`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${employeeToken}`
      },
      body: JSON.stringify({
        lat: OFFICE_LAT,
        long: OFFICE_LONG,
        selfie: 'https://cdn.example.com/selfies/pm-out.jpg',
        shift: 'afternoon'
      })
    });
    const pmOutData = await pmOutRes.json();
    if (!pmOutData.success) throw new Error(`Afternoon check-out failed: ${pmOutData.message}`);
    console.log(`✅ Full day attendance complete. Status: '${pmOutData.data.attendanceStatus}'`);

    // 12. Query Today's Attendance and Summary
    console.log("\nTest 12: Query Today's Attendance (/api/attendance/today)");
    const todayRes = await fetch(`${BASE_URL}/api/attendance/today`, {
      headers: { Authorization: `Bearer ${employeeToken}` }
    });
    const todayData = await todayRes.json();
    if (!todayData.success || !todayData.data) throw new Error("Failed to get today's attendance");
    console.log(`✅ Verified today's record: Date ${todayData.data.attendanceDate.substring(0, 10)}, Status: ${todayData.data.attendanceStatus}`);

    console.log('\nTest 13: Query Attendance Summary (/api/attendance/summary)');
    const sumRes = await fetch(`${BASE_URL}/api/attendance/summary`, {
      headers: { Authorization: `Bearer ${employeeToken}` }
    });
    const sumData = await sumRes.json();
    if (!sumData.success) throw new Error('Failed to get attendance summary');
    console.log(`✅ Summary: Logged days: ${sumData.data.totalLoggedDays}, Present: ${sumData.data.presentDays}`);

    // 14. Management Attendance Listing with Filters
    console.log('\nTest 14: HR Query All Attendance (/api/attendance)');
    const allAttRes = await fetch(`${BASE_URL}/api/attendance?department=Production`, {
      headers: { Authorization: `Bearer ${hrToken}` }
    });
    const allAttData = await allAttRes.json();
    if (!allAttData.success || allAttData.count < 1) throw new Error('HR attendance query failed');
    console.log(`✅ HR retrieved ${allAttData.count} attendance record(s) matching department filter.`);

    // 15. Submit Overtime Request
    console.log('\nTest 15: Submit Overtime Request (/api/overtime)');
    const otRes = await fetch(`${BASE_URL}/api/overtime`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${employeeToken}`
      },
      body: JSON.stringify({
        requestDate: new Date().toISOString(),
        startTime: '18:00',
        endTime: '21:00',
        totalHours: 3,
        requestReason: 'Billboard installation campaign at Meskel Square'
      })
    });
    const otData = await otRes.json();
    if (!otRes.ok || !otData.success) throw new Error(`Overtime submission failed: ${otData.message}`);
    overtimeId = otData.data._id;
    console.log(`✅ Overtime request submitted: ID ${overtimeId}, Hours: ${otData.data.totalHours}, Status: ${otData.data.requestStatus}`);

    // 16. Decide Overtime Request as HR / Management
    console.log('\nTest 16: Approve Overtime Request (/api/overtime/:id/decision)');
    const otDecRes = await fetch(`${BASE_URL}/api/overtime/${overtimeId}/decision`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hrToken}`
      },
      body: JSON.stringify({
        decision: 'approved',
        comments: 'Verified with site supervisor'
      })
    });
    const otDecData = await otDecRes.json();
    if (!otDecData.success || otDecData.data.requestStatus !== 'approved') {
      throw new Error('Overtime decision failed');
    }
    console.log(`✅ Overtime request approved. Decisions logged: ${otDecData.data.approveDecisions.length}`);

    // 17. Create Field Visit
    console.log('\nTest 17: Schedule Field Visit (/api/field-visits)');
    const FIELD_LAT = 9.010500;
    const FIELD_LONG = 38.761500; // Meskel Square, Addis Ababa

    const fvRes = await fetch(`${BASE_URL}/api/field-visits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hrToken}`
      },
      body: JSON.stringify({
        visitPurpose: 'LED Screen Billboard Maintenance',
        visitDate: new Date().toISOString(),
        visitStartTime: '10:00',
        visitEndTime: '14:00',
        visitAddress: 'Meskel Square LED Screen Site, Addis Ababa',
        location: { lat: FIELD_LAT, long: FIELD_LONG },
        radiusMeters: 300,
        employees: [employeeId],
        leader: employeeId,
        visitReportNotes: 'Quarterly display calibration'
      })
    });
    const fvData = await fvRes.json();
    if (!fvData.success) throw new Error(`Create field visit failed: ${fvData.message}`);
    fieldVisitId = fvData.data._id;
    console.log(`✅ Field Visit created: '${fvData.data.visitPurpose}', Status: ${fvData.data.visitStatus}`);

    // 18. On-site Field Visit Check-In by Assigned Employee
    console.log('\nTest 18: On-site Check-in for Field Visit (/api/field-visits/:id/check-in)');
    const fvCheckInRes = await fetch(`${BASE_URL}/api/field-visits/${fieldVisitId}/check-in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${employeeToken}`
      },
      body: JSON.stringify({
        lat: FIELD_LAT + 0.0002, // ~22m away
        long: FIELD_LONG + 0.0001,
        selfie: 'https://cdn.example.com/field/onsite-selfie.jpg',
        notes: 'Arrived at Meskel Square site with tool kit'
      })
    });
    const fvCheckInData = await fvCheckInRes.json();
    if (!fvCheckInData.success) throw new Error(`Field check-in failed: ${fvCheckInData.message}`);
    console.log(`✅ On-site check-in successful: Distance: ${fvCheckInData.distanceMeters}m, Visit status updated to: ${fvCheckInData.visitStatus}`);

    // 19. Update Field Visit / Submit Report Notes
    console.log('\nTest 19: Complete Field Visit & Submit Report');
    const fvUpdateRes = await fetch(`${BASE_URL}/api/field-visits/${fieldVisitId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${employeeToken}`
      },
      body: JSON.stringify({
        visitStatus: 'completed',
        visitReportNotes: 'Calibration completed successfully. Screen firmware updated to v2.4.'
      })
    });
    const fvUpdateData = await fvUpdateRes.json();
    if (!fvUpdateData.success || fvUpdateData.data.visitStatus !== 'completed') {
      throw new Error('Update field visit failed');
    }
    console.log(`✅ Field visit completed and report saved.`);

    // Cleanup
    await User.deleteMany({ email: { $regex: /@attendancetest\.vector/ } });
    await Employee.deleteMany({ email: { $regex: /@attendancetest\.vector/ } });
    await Attendance.deleteMany({});
    await AttendanceConfig.deleteMany({});
    await OvertimeRequest.deleteMany({});
    await FieldVisit.deleteMany({});

    console.log('\n🎉 ALL 19 ATTENDANCE & FIELD TRACKING INTEGRATION TESTS PASSED! 🎉\n');
  } finally {
    server.close();
    await mongoose.disconnect();
    console.log('Test server and database connection closed.');
  }
}

runAttendanceTests().catch((err) => {
  console.error('\n❌ Test failure:', err);
  process.exit(1);
});
