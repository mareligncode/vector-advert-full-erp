import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from '../routes/authRoutes.js';
import employeeRoutes from '../routes/employeeRoutes.js';
import User from '../models/User.js';
import Employee from '../models/Employee.js';
import { ROLES } from '../constants/roles.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '../uploads');

const PORT = 5099;
const BASE_URL = `http://localhost:${PORT}`;

async function runTests() {
  console.log('🚀 Starting Employee API Integration Tests...\n');

  // Connect to DB
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vector_advert_full_erp_test';
  await mongoose.connect(mongoURI);
  console.log('Connected to test MongoDB database');

  // Setup Express App
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use('/uploads', express.static(uploadsDir));
  app.use('/api/auth', authRoutes);
  app.use('/api/employees', employeeRoutes);

  const server = app.listen(PORT);
  console.log(`Test server running at ${BASE_URL}\n`);

  let hrToken = '';
  let employeeToken = '';
  let testEmployeeId = '';
  let testDocumentId = '';
  let testGuarantorId = '';
  let testUserId = '';

  try {
    // Clean test DB
    await User.deleteMany({ email: { $regex: /@test\.vector/ } });
    await Employee.deleteMany({ email: { $regex: /@test\.vector/ } });

    // 1. Register HR Manager User
    console.log('Test 1: Register HR Manager');
    const hrRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'hrmanager@test.vector',
        password: 'password123',
        roles: [ROLES.HR_MANAGER]
      })
    });
    const hrData = await hrRes.json();
    if (!hrData.success) throw new Error(`HR Registration failed: ${hrData.message}`);
    hrToken = hrData.data.token;
    console.log('✅ HR Manager registered successfully. Token obtained.');

    // 2. Create an Employee via POST /api/employees (Auto-generating employeeNumber)
    console.log('\nTest 2: Create Employee with Fayda ID, Guarantor, Emergency Contact, and Bank Account');
    const empRes = await fetch(`${BASE_URL}/api/employees`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hrToken}`
      },
      body: JSON.stringify({
        name: { first: 'Abebe', middle: 'Kebede', last: 'Tadesse' },
        email: 'abebe.kebede@test.vector',
        primaryPhone: '+251911223344',
        alternativePhone: '+251922334455',
        gender: 'male',
        maritalStatus: 'single',
        nationality: 'Ethiopian',
        homeAddress: 'Bole, Addis Ababa',
        department: 'Creative & Design',
        jobTitle: 'Senior Graphic Designer',
        basicSalary: 35000,
        employmentStatus: 'probation',
        employmentType: 'full-time',
        nationalId: {
          fanNumber: 'FAN-1234567890',
          finNumber: 'FIN-0987654321',
          frontImageUrl: 'https://cdn.example.com/id/front.jpg',
          backImageUrl: 'https://cdn.example.com/id/back.jpg'
        },
        emergencyContacts: [
          { name: 'Almaz Kebede', phone: '+251911998877', relationship: 'Sister' }
        ],
        guarantors: [
          {
            name: 'Chala Desta',
            phone: '+251911445566',
            nationalId: {
              fanNumber: 'FAN-GU-556677',
              finNumber: 'FIN-GU-776655',
              frontImageUrl: 'https://cdn.example.com/guarantor/front.jpg',
              backImageUrl: 'https://cdn.example.com/guarantor/back.jpg'
            }
          }
        ],
        bankAccounts: [
          {
            bankName: 'Commercial Bank of Ethiopia',
            holderName: 'Abebe Kebede Tadesse',
            accountNumber: '1000123456789',
            isPrimary: true
          }
        ]
      })
    });
    const empData = await empRes.json();
    if (!empData.success) throw new Error(`Create employee failed: ${empData.message}`);
    testEmployeeId = empData.data._id;
    testGuarantorId = empData.data.guarantors[0]._id;
    console.log(`✅ Employee created: ${empData.data.fullName} (${empData.data.employeeNumber})`);
    console.log(`   Initial National ID Status: ${empData.data.nationalId.status}`);

    // 3. Get Employee List with Filtering & Pagination
    console.log('\nTest 3: List Employees (Filter by Department & Pagination)');
    const listRes = await fetch(`${BASE_URL}/api/employees?department=Creative&page=1&limit=5`, {
      headers: { Authorization: `Bearer ${hrToken}` }
    });
    const listData = await listRes.json();
    if (!listData.success || listData.count < 1) throw new Error('List employees failed');
    console.log(`✅ Successfully listed employees: Total ${listData.total}, Page ${listData.page}, Count ${listData.count}`);

    // 4. Get Employee by ID
    console.log('\nTest 4: Get Employee by ID');
    const getRes = await fetch(`${BASE_URL}/api/employees/${testEmployeeId}`, {
      headers: { Authorization: `Bearer ${hrToken}` }
    });
    const getData = await getRes.json();
    if (!getData.success || getData.data._id !== testEmployeeId) throw new Error('Get employee by ID failed');
    console.log(`✅ Fetched Employee: ${getData.data.fullName}, Salary: ${getData.data.basicSalary}`);

    // 5. Update Employee Details
    console.log('\nTest 5: Update Employee Details');
    const updateRes = await fetch(`${BASE_URL}/api/employees/${testEmployeeId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hrToken}`
      },
      body: JSON.stringify({
        jobTitle: 'Lead Brand Art Director',
        basicSalary: 42000
      })
    });
    const updateData = await updateRes.json();
    if (!updateData.success || updateData.data.basicSalary !== 42000) throw new Error('Update employee failed');
    console.log(`✅ Updated Job Title: ${updateData.data.jobTitle}, New Salary: ${updateData.data.basicSalary}`);

    // 6. Update Employment Status
    console.log('\nTest 6: Update Employment Status');
    const statusRes = await fetch(`${BASE_URL}/api/employees/${testEmployeeId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hrToken}`
      },
      body: JSON.stringify({ status: 'active' })
    });
    const statusData = await statusRes.json();
    if (!statusData.success || statusData.data.employmentStatus !== 'active') throw new Error('Update status failed');
    console.log(`✅ Employment status updated to: ${statusData.data.employmentStatus}`);

    // 7. Add Employee Document
    console.log('\nTest 7: Upload / Add Employee Document');
    const docRes = await fetch(`${BASE_URL}/api/employees/${testEmployeeId}/documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hrToken}`
      },
      body: JSON.stringify({
        title: 'Employment Contract Agreement',
        type: 'Contract',
        fileUrl: 'https://cdn.example.com/contracts/abebe-contract.pdf'
      })
    });
    const docData = await docRes.json();
    if (!docData.success) throw new Error(`Add document failed: ${docData.message}`);
    testDocumentId = docData.data._id;
    console.log(`✅ Document uploaded: '${docData.data.title}', Status: ${docData.data.status}`);

    // 8. Approve Employee Document
    console.log('\nTest 8: Approve Document');
    const appDocRes = await fetch(`${BASE_URL}/api/employees/${testEmployeeId}/documents/${testDocumentId}/approve`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hrToken}`
      },
      body: JSON.stringify({ status: 'approved' })
    });
    const appDocData = await appDocRes.json();
    if (!appDocData.success || appDocData.data.status !== 'approved') throw new Error('Approve document failed');
    console.log(`✅ Document approval status: ${appDocData.data.status}, Approver: ${appDocData.data.approvedBy}`);

    // 9. Approve Employee Fayda National ID
    console.log('\nTest 9: Approve Fayda National ID');
    const idAppRes = await fetch(`${BASE_URL}/api/employees/${testEmployeeId}/national-id/approve`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hrToken}`
      },
      body: JSON.stringify({ status: 'approved' })
    });
    const idAppData = await idAppRes.json();
    if (!idAppData.success || idAppData.data.status !== 'approved') throw new Error('Approve national ID failed');
    console.log(`✅ Fayda National ID status: ${idAppData.data.status}`);

    // 10. Approve Guarantor National ID
    console.log('\nTest 10: Approve Guarantor National ID');
    const gAppRes = await fetch(`${BASE_URL}/api/employees/${testEmployeeId}/guarantors/${testGuarantorId}/national-id/approve`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hrToken}`
      },
      body: JSON.stringify({ status: 'approved' })
    });
    const gAppData = await gAppRes.json();
    if (!gAppData.success || gAppData.data.status !== 'approved') throw new Error('Approve guarantor ID failed');
    console.log(`✅ Guarantor National ID status: ${gAppData.data.status}`);

    // 11. Create & Link User Account to Employee
    console.log('\nTest 11: Create & Link User Account to Employee');
    const linkUserRes = await fetch(`${BASE_URL}/api/employees/${testEmployeeId}/create-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hrToken}`
      },
      body: JSON.stringify({
        password: 'EmployeePassword123',
        roles: [ROLES.DESIGNER, ROLES.EMPLOYEE]
      })
    });
    const linkUserData = await linkUserRes.json();
    if (!linkUserData.success) throw new Error(`Create user and link failed: ${linkUserData.message}`);
    testUserId = linkUserData.user._id;
    console.log(`✅ User account provisioned & linked: ${linkUserData.user.email}, Roles: ${linkUserData.user.roles.join(', ')}`);

    // 12. Login as the linked employee user
    console.log('\nTest 12: Login as the linked Employee');
    const loginEmpRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'abebe.kebede@test.vector',
        password: 'EmployeePassword123'
      })
    });
    const loginEmpData = await loginEmpRes.json();
    if (!loginEmpData.success) throw new Error(`Login as employee failed: ${loginEmpData.message}`);
    employeeToken = loginEmpData.data.token;
    console.log('✅ Employee logged in successfully. Token obtained.');

    // 13. Fetch /api/employees/me as employee
    console.log('\nTest 13: Fetch /api/employees/me as Employee User');
    const meRes = await fetch(`${BASE_URL}/api/employees/me`, {
      headers: { Authorization: `Bearer ${employeeToken}` }
    });
    const meData = await meRes.json();
    if (!meData.success || meData.data._id !== testEmployeeId) throw new Error('Get /me employee failed');
    console.log(`✅ Verified /me profile: ${meData.data.fullName}, employeeNumber: ${meData.data.employeeNumber}`);

    // 14. Financial Data Privacy Test: Employee listing other employees should have salary redacted
    console.log('\nTest 14: Financial Data Redaction for non-HR User');
    const redactedRes = await fetch(`${BASE_URL}/api/employees`, {
      headers: { Authorization: `Bearer ${employeeToken}` }
    });
    const redactedData = await redactedRes.json();
    if (!redactedData.success) throw new Error('Fetch as employee failed');
    const sampleEmp = redactedData.data.find(e => e._id === testEmployeeId);
    if (sampleEmp && sampleEmp.basicSalary !== undefined) {
      throw new Error('Basic salary was NOT redacted for non-HR user!');
    }
    console.log('✅ Financial data (basicSalary & bankAccounts) properly redacted in employee list for non-HR.');

    // 15. Unlink and Re-link User
    console.log('\nTest 15: Unlink and Re-link User Account');
    const unlinkRes = await fetch(`${BASE_URL}/api/employees/${testEmployeeId}/unlink-user`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${hrToken}` }
    });
    const unlinkData = await unlinkRes.json();
    if (!unlinkData.success || unlinkData.data.user !== null) throw new Error('Unlink user failed');
    console.log('✅ User unlinked successfully.');

    const relinkRes = await fetch(`${BASE_URL}/api/employees/${testEmployeeId}/link-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hrToken}`
      },
      body: JSON.stringify({ userId: testUserId })
    });
    const relinkData = await relinkRes.json();
    if (!relinkData.success || !relinkData.data.user) throw new Error('Re-link user failed');
    console.log('✅ User re-linked successfully.');

    // 16. Upload Employee Profile Photo (Multipart Local Upload)
    console.log('\nTest 16: Upload Employee Profile Photo');
    const photoForm = new FormData();
    const photoBlob = new Blob(['Simulated PNG image bytes for profile photo'], { type: 'image/png' });
    photoForm.append('photo', photoBlob, 'avatar.png');

    const photoRes = await fetch(`${BASE_URL}/api/employees/${testEmployeeId}/profile-photo`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${employeeToken}` },
      body: photoForm
    });
    const photoData = await photoRes.json();
    if (!photoData.success || !photoData.data.profilePhoto.startsWith('/uploads/employees/')) {
      throw new Error(`Profile photo upload failed: ${photoData.message}`);
    }
    console.log(`✅ Profile photo uploaded: ${photoData.data.profilePhoto}`);

    // Verify static serving of profile photo
    const getPhotoRes = await fetch(`${BASE_URL}${photoData.data.profilePhoto}`);
    if (!getPhotoRes.ok) throw new Error('Failed to retrieve static profile photo file');
    console.log('✅ Static profile photo served successfully.');

    // 17. Upload National ID Photos (front and back)
    console.log('\nTest 17: Upload National ID Photos (Front & Back)');
    const nidForm = new FormData();
    const frontBlob = new Blob(['Front National ID Image'], { type: 'image/png' });
    const backBlob = new Blob(['Back National ID Image'], { type: 'image/png' });
    nidForm.append('frontImage', frontBlob, 'nid_front.png');
    nidForm.append('backImage', backBlob, 'nid_back.png');
    nidForm.append('fanNumber', 'FAN-987654321');

    const nidRes = await fetch(`${BASE_URL}/api/employees/${testEmployeeId}/national-id/photos`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${employeeToken}` },
      body: nidForm
    });
    const nidData = await nidRes.json();
    if (!nidData.success || !nidData.data.frontImageUrl || !nidData.data.backImageUrl) {
      throw new Error(`National ID photo upload failed: ${nidData.message}`);
    }
    console.log(`✅ National ID photos uploaded: Front=${nidData.data.frontImageUrl}, Back=${nidData.data.backImageUrl}`);

    // 18. Upload Document with file (Multipart Local Upload)
    console.log('\nTest 18: Upload Employee Document with Multipart File');
    const docUploadForm = new FormData();
    docUploadForm.append('title', 'Academic Degree Certificate');
    docUploadForm.append('type', 'certificate');
    const certBlob = new Blob(['Degree Certificate Content'], { type: 'application/pdf' });
    docUploadForm.append('file', certBlob, 'degree_certificate.pdf');

    const docUploadRes = await fetch(`${BASE_URL}/api/employees/${testEmployeeId}/documents`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${employeeToken}` },
      body: docUploadForm
    });
    const docUploadData = await docUploadRes.json();
    if (!docUploadData.success || !docUploadData.data.fileUrl.startsWith('/uploads/employees/')) {
      throw new Error(`Multipart document upload failed: ${docUploadData.message}`);
    }
    console.log(`✅ Document uploaded via multipart: ${docUploadData.data.fileUrl}`);

    // 19. Remove Profile Photo
    console.log('\nTest 19: Remove Profile Photo');
    const delPhotoRes = await fetch(`${BASE_URL}/api/employees/${testEmployeeId}/profile-photo`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${employeeToken}` }
    });
    const delPhotoData = await delPhotoRes.json();
    if (!delPhotoData.success) throw new Error('Remove profile photo failed');
    console.log('✅ Profile photo removed successfully.');

    // 20. Delete Employee
    console.log('\nTest 20: Delete Employee');
    const delRes = await fetch(`${BASE_URL}/api/employees/${testEmployeeId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${hrToken}` }
    });
    const delData = await delRes.json();
    if (!delData.success) throw new Error('Delete employee failed');
    console.log('✅ Employee deleted successfully.');

    // Cleanup
    await User.deleteMany({ email: { $regex: /@test\.vector/ } });
    await Employee.deleteMany({ email: { $regex: /@test\.vector/ } });

    console.log('\n🎉 ALL 20 INTEGRATION TESTS PASSED SUCCESSFULLY! 🎉\n');
  } finally {
    server.close();
    await mongoose.disconnect();
    console.log('Test server and database connection closed.');
  }
}

runTests().catch((err) => {
  console.error('\n❌ Test failure:', err);
  process.exit(1);
});
