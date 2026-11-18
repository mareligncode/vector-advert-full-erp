import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import authRoutes from '../routes/authRoutes.js';
import employeeRoutes from '../routes/employeeRoutes.js';
import recruitmentRoutes from '../routes/recruitmentRoutes.js';
import internshipRoutes from '../routes/internshipRoutes.js';
import User from '../models/User.js';
import Employee from '../models/Employee.js';
import JobPosting from '../models/JobPosting.js';
import JobApplication from '../models/JobApplication.js';
import Internship from '../models/Internship.js';
import { ROLES } from '../constants/roles.js';

const PORT = 5098;
const BASE_URL = `http://localhost:${PORT}`;

async function runTests() {
  console.log('🚀 Starting Recruitment & Internship Management Integration Tests...\n');

  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vector_advert_full_erp_test';
  await mongoose.connect(mongoURI);
  console.log('Connected to test MongoDB database');

  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/employees', employeeRoutes);
  app.use('/api/recruitment', recruitmentRoutes);
  app.use('/api/internships', internshipRoutes);

  const server = app.listen(PORT);
  console.log(`Recruitment test server running at ${BASE_URL}\n`);

  let hrToken = '';
  let employeeToken = '';
  let interviewerEmployeeId = '';
  let testJobId = '';
  let testApplicationId = '';
  let testInterviewId = '';
  let testInternshipId = '';

  try {
    // Clean test data
    await User.deleteMany({ email: { $regex: /@recruitment\.test/ } });
    await Employee.deleteMany({ email: { $regex: /@recruitment\.test/ } });
    await JobPosting.deleteMany({ jobTitle: { $regex: /Test/ } });
    await JobApplication.deleteMany({ 'applicantContact.email': { $regex: /@recruitment\.test/ } });
    await Internship.deleteMany({ email: { $regex: /@recruitment\.test/ } });

    // 1. Setup HR Manager & Interviewer Employee
    console.log('1. Setting up HR Manager User...');
    const hrRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'hr.manager@recruitment.test',
        password: 'password123',
        roles: [ROLES.HR_MANAGER]
      })
    });
    const hrData = await hrRes.json();
    if (!hrData.success) throw new Error(`HR Reg failed: ${hrData.message}`);
    hrToken = hrData.data.token;

    console.log('2. Creating Interviewer Employee record...');
    const interviewerRes = await fetch(`${BASE_URL}/api/employees`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hrToken}`
      },
      body: JSON.stringify({
        name: { first: 'Dawit', last: 'Alemu' },
        email: 'dawit.interviewer@recruitment.test',
        primaryPhone: '+251911002233',
        jobTitle: 'Senior Creative Director',
        department: 'Creative & Media',
        basicSalary: 35000,
        workLocation: 'Addis Ababa HQ'
      })
    });
    const interviewerData = await interviewerRes.json();
    interviewerEmployeeId = interviewerData.data._id;
    console.log(`✅ Interviewer Employee created with ID: ${interviewerEmployeeId}`);

    // 3. Create a Job Posting
    console.log('\n3. Creating Job Posting (Graphic Designer / Video Producer)...');
    const jobRes = await fetch(`${BASE_URL}/api/recruitment/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hrToken}`
      },
      body: JSON.stringify({
        jobTitle: 'Senior Test Motion Designer',
        department: 'Creative & Media',
        location: 'Bole Medhanialem, Addis Ababa',
        employmentType: 'full-time',
        experienceLevel: 'senior',
        jobDescription: 'Lead animation, motion design, and video editing for major brand campaigns.',
        jobRequirements: [
          'Proficiency in Adobe After Effects, Premiere, and Cinema 4D',
          'At least 4 years of advertising agency experience'
        ],
        postingStatus: 'published',
        numberOfOpenings: 2,
        applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      })
    });
    const jobData = await jobRes.json();
    if (!jobData.success) throw new Error(`Create job failed: ${jobData.message}`);
    testJobId = jobData.data._id;
    console.log(`✅ Job Posting created with ID: ${testJobId} (Status: ${jobData.data.postingStatus})`);

    // 4. Query Public Job Postings
    console.log('\n4. Verifying Public Job Listing endpoint...');
    const publicJobsRes = await fetch(`${BASE_URL}/api/recruitment/jobs?search=Motion`);
    const publicJobsData = await publicJobsRes.json();
    if (!publicJobsData.success || publicJobsData.data.length === 0) {
      throw new Error('Public job search failed');
    }
    console.log(`✅ Found ${publicJobsData.data.length} published matching job(s)`);

    // 5. Submit Public Candidate Job Application
    console.log('\n5. Candidate Submitting Job Application...');
    const appRes = await fetch(`${BASE_URL}/api/recruitment/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobPostingId: testJobId,
        applicantName: { first: 'Sara', middle: 'Getachew', last: 'Bekele' },
        applicantContact: {
          email: 'sara.candidate@recruitment.test',
          phoneNumber: '+251922334455',
          telegramUsername: '@sarag_design'
        },
        resume: 'https://cdn.vectoradvert.com/resumes/sara_cv.pdf',
        portfolioLink: 'https://behance.net/saradesign',
        coverLetter: 'Excited to bring creative motion design leadership to Vector Advert!',
        yearsOfExperience: 5
      })
    });
    const appData = await appRes.json();
    if (!appData.success) throw new Error(`Submit application failed: ${appData.message}`);
    testApplicationId = appData.data._id;
    console.log(`✅ Application submitted with ID: ${testApplicationId} (Status: ${appData.data.applicationStatus})`);

    // 6. Application Status & Rating Tracking
    console.log('\n6. Updating Candidate Application Status & Rating...');
    const updateAppRes = await fetch(`${BASE_URL}/api/recruitment/applications/${testApplicationId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hrToken}`
      },
      body: JSON.stringify({
        applicationStatus: 'under_review',
        applicantRating: 5,
        applicationNotes: 'Outstanding portfolio and typography skills.'
      })
    });
    const updateAppData = await updateAppRes.json();
    if (!updateAppData.success || updateAppData.data.applicantRating !== 5) {
      throw new Error('Update application status failed');
    }
    console.log(`✅ Application status updated to ${updateAppData.data.applicationStatus}, Rating: 5/5`);

    // 7. Schedule Interview
    console.log('\n7. Scheduling Candidate Interview...');
    const scheduleRes = await fetch(`${BASE_URL}/api/recruitment/applications/${testApplicationId}/interviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hrToken}`
      },
      body: JSON.stringify({
        interviewFormat: 'online',
        scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        onlineMeetingLink: 'https://meet.google.com/xyz-test-vec',
        interviewerId: interviewerEmployeeId,
        interviewNotes: 'Technical portfolio review and motion reel evaluation'
      })
    });
    const scheduleData = await scheduleRes.json();
    if (!scheduleData.success) throw new Error(`Schedule interview failed: ${scheduleData.message}`);
    testInterviewId = scheduleData.data._id;
    console.log(`✅ Interview round scheduled with ID: ${testInterviewId}`);

    // 8. Submit Interview Feedback & Recommendation
    console.log('\n8. Submitting Interview Evaluation & Hiring Recommendation...');
    const feedbackRes = await fetch(
      `${BASE_URL}/api/recruitment/applications/${testApplicationId}/interviews/${testInterviewId}/feedback`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${hrToken}`
        },
        body: JSON.stringify({
          interviewFeedback: 'Demonstrated superior mastery of After Effects and visual storytelling.',
          interviewScore: 94,
          hiringDecision: 'recommended',
          interviewStatus: 'completed'
        })
      }
    );
    const feedbackData = await feedbackRes.json();
    if (!feedbackData.success || feedbackData.data.interviewScore !== 94) {
      throw new Error(`Interview feedback failed: ${feedbackData.message}`);
    }
    console.log(`✅ Feedback recorded. Score: 94/100, Decision: recommended. App status: ${feedbackData.applicationStatus}`);

    // 9. Convert Hired Applicant into Employee
    console.log('\n9. Converting Candidate into full Employee...');
    const convertAppRes = await fetch(
      `${BASE_URL}/api/recruitment/applications/${testApplicationId}/convert-to-employee`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${hrToken}`
        },
        body: JSON.stringify({
          employeeNumber: 'EMP-REC-001',
          basicSalary: 38000,
          managerId: interviewerEmployeeId,
          workLocation: 'Addis Ababa HQ',
          branch: 'Bole',
          createUserAccount: true,
          password: 'Password@2026'
        })
      }
    );
    const convertAppData = await convertAppRes.json();
    if (!convertAppData.success) throw new Error(`Conversion failed: ${convertAppData.message}`);
    console.log(`✅ Hired candidate converted to Employee: ${convertAppData.data.employee.employeeNumber} (${convertAppData.data.employee.fullName})`);

    // 10. Register Internship Profile
    console.log('\n10. Registering Internship Profile...');
    const internRes = await fetch(`${BASE_URL}/api/internships`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hrToken}`
      },
      body: JSON.stringify({
        name: { first: 'Blen', middle: 'Yilma', last: 'Haile' },
        gender: 'female',
        phone: '+251933445566',
        email: 'blen.intern@recruitment.test',
        address: 'Kazanchis, Addis Ababa',
        type: 'paid',
        stipendAmount: 5000,
        academicProfile: {
          university: 'Addis Ababa University',
          faculty: 'School of Commerce / Fine Arts',
          departmentOfStudy: 'Graphic Design & Communication',
          yearOfStudy: 4,
          studentId: { idNumber: 'AAU/ART/2026/088' }
        },
        placement: {
          internshipPosition: 'Junior UI/UX Design Intern',
          assignedDepartment: 'Creative & Media',
          supervisor: interviewerEmployeeId,
          startDate: new Date(),
          endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
        },
        createUserAccount: true,
        password: 'InternPassword@2026'
      })
    });
    const internData = await internRes.json();
    if (!internData.success) throw new Error(`Internship creation failed: ${internData.message}`);
    testInternshipId = internData.data._id;
    console.log(`✅ Internship profile created: ${internData.data.internshipNumber} for ${internData.data.name.first} ${internData.data.name.last}`);

    // 11. Add Internship Evaluation
    console.log('\n11. Adding Internship Performance Review & Evaluation...');
    const evalRes = await fetch(`${BASE_URL}/api/internships/${testInternshipId}/evaluations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hrToken}`
      },
      body: JSON.stringify({
        score: 95,
        feedback: 'Exceptional visual design skills and punctuality throughout the internship program.',
        certificateIssued: true,
        certificateUrl: 'https://cdn.vectoradvert.com/certificates/blen_internship_cert.pdf',
        evaluatedBy: interviewerEmployeeId
      })
    });
    const evalData = await evalRes.json();
    if (!evalData.success || evalData.data.score !== 95) {
      throw new Error(`Intern evaluation failed: ${evalData.message}`);
    }
    console.log(`✅ Intern evaluated: Score: 95/100, Certificate Issued: ${evalData.data.certificateIssued}`);

    // 12. Convert Intern to Permanent Employee
    console.log('\n12. Converting Graduated Intern into Permanent Employee...');
    const convertInternRes = await fetch(
      `${BASE_URL}/api/internships/${testInternshipId}/convert-to-employee`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${hrToken}`
        },
        body: JSON.stringify({
          employeeNumber: 'EMP-INT-001',
          basicSalary: 24000,
          jobTitle: 'Junior UI/UX Designer',
          department: 'Creative & Media',
          managerId: interviewerEmployeeId,
          workLocation: 'Addis Ababa HQ',
          branch: 'Bole'
        })
      }
    );
    const convertInternData = await convertInternRes.json();
    if (!convertInternData.success) throw new Error(`Intern conversion failed: ${convertInternData.message} - ${convertInternData.error}`);
    console.log(`✅ Intern converted to Employee: ${convertInternData.data.employeeNumber} (${convertInternData.data.fullName})`);

    console.log('\n🎉 ALL RECRUITMENT, INTERVIEWS, APPLICATIONS & INTERNSHIP TESTS PASSED PERFECTLY!\n');
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    process.exitCode = 1;
  } finally {
    server.close();
    await mongoose.connection.close();
    process.exit(process.exitCode || 0);
  }
}

runTests();
