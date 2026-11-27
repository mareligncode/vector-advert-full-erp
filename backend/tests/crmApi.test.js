import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import authRoutes from '../routes/authRoutes.js';
import crmRoutes, {
  leadRoutes,
  clientRoutes,
  followUpRoutes,
  siteSurveyRoutes
} from '../routes/crmRoutes.js';
import User from '../models/User.js';
import Employee from '../models/Employee.js';
import Lead from '../models/Lead.js';
import Client from '../models/Client.js';
import FollowUp from '../models/FollowUp.js';
import SiteSurvey from '../models/SiteSurvey.js';
import { ROLES } from '../constants/roles.js';
import { generateToken } from '../middleware/authMiddleware.js';

dotenv.config();

const PORT = 5098;
const BASE_URL = `http://localhost:${PORT}`;

async function runTests() {
  console.log('🚀 Starting CRM & Pre-Sales Engineering (Phase 1) Integration Tests...\n');

  const mongoURI =
    process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vector_advert_full_erp_test';
  await mongoose.connect(mongoURI);
  console.log('Connected to MongoDB test database');

  const app = express();
  app.use(cors());
  app.use(express.json());

  app.use('/api/auth', authRoutes);
  app.use('/api/crm', crmRoutes);
  app.use('/api/leads', leadRoutes);
  app.use('/api/clients', clientRoutes);
  app.use('/api/follow-ups', followUpRoutes);
  app.use('/api/site-surveys', siteSurveyRoutes);

  // Central error handler
  app.use((err, req, res, next) => {
    console.error('Unhandled Test Error:', err);
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  });

  const server = app.listen(PORT);
  console.log(`Test server running on ${BASE_URL}\n`);

  let salesToken = '';
  let financeToken = '';
  let employeeToken = '';
  let salesUser = null;
  let testEmployee = null;
  let createdLeadId = '';
  let createdClientId = '';
  let createdFollowUpId = '';
  let createdSurveyId = '';

  try {
    // 0. Clean DB test records
    await Promise.all([
      User.deleteMany({ email: { $regex: /@crmtest\.vector/ } }),
      Employee.deleteMany({ email: { $regex: /@crmtest\.vector/ } }),
      Lead.deleteMany({ 'phone.primary': { $regex: /^\+25191188/ } }),
      Client.deleteMany({ primaryPhone: { $regex: /^\+25191188/ } }),
      FollowUp.deleteMany({ 'targetEntity.clientOrLeadName': 'Awash Commercial Bank Test' }),
      SiteSurvey.deleteMany({ surveyTitle: { $regex: /Test Facade/ } })
    ]);

    // Seed test users
    salesUser = await User.create({
      name: 'Sales Rep Test',
      email: 'sales@crmtest.vector',
      password: 'Password123!',
      roles: [ROLES.FRONTDESK, ROLES.EMPLOYEE],
      accountStatus: 'active'
    });
    salesToken = generateToken(salesUser._id);

    const financeUser = await User.create({
      name: 'Finance Officer Test',
      email: 'finance@crmtest.vector',
      password: 'Password123!',
      roles: [ROLES.FINANCE],
      accountStatus: 'active'
    });
    financeToken = generateToken(financeUser._id);

    const basicEmployeeUser = await User.create({
      name: 'Basic Employee Test',
      email: 'employee@crmtest.vector',
      password: 'Password123!',
      roles: [ROLES.EMPLOYEE],
      accountStatus: 'active'
    });
    employeeToken = generateToken(basicEmployeeUser._id);

    const managerUser = await User.create({
      name: 'Operations Manager Test',
      email: 'manager@crmtest.vector',
      password: 'Password123!',
      roles: [ROLES.MANAGER, ROLES.COO],
      accountStatus: 'active'
    });
    const managerToken = generateToken(managerUser._id);

    testEmployee = await Employee.create({
      employeeNumber: 'EMP-SRV-01',
      name: {
        first: 'Alemayehu',
        last: 'Surveyor'
      },
      email: 'surveyor@crmtest.vector',
      primaryPhone: '+251911999888',
      department: new mongoose.Types.ObjectId(),
      position: 'Senior Site Surveyor',
      hireDate: new Date(),
      employmentStatus: 'active'
    });

    console.log('✓ Seeded test credentials and surveyor employee\n');

    // ==========================================
    // 1. Lead Lifecycle Tests
    // ==========================================
    console.log('--- Testing Lead Lifecycle ---');

    // 1.1 Validation error on missing fields
    const invalidLeadRes = await fetch(`${BASE_URL}/api/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${salesToken}`
      },
      body: JSON.stringify({
        companyName: 'No Name Co'
      })
    });
    const invalidLeadData = await invalidLeadRes.json();
    if (invalidLeadRes.status !== 400 || !invalidLeadData.errors) {
      throw new Error(`Expected 400 on invalid lead payload, got ${invalidLeadRes.status}`);
    }
    console.log('✓ Rejected invalid lead payload with 400');

    // 1.2 Create valid lead
    const leadPayload = {
      name: 'Awash Bank Branch Project',
      companyName: 'Awash International Bank SC',
      pointOfContact: {
        name: 'Tewodros Kassahun',
        jobTitle: 'Branch Facilities Manager',
        isDecisionMaker: true
      },
      phone: {
        primary: '+251911880001',
        alternative: '+251911880002',
        hasTelegram: true
      },
      email: 'facilities@awashbank.test',
      address: {
        city: 'Addis Ababa',
        subcity: 'Kirkos',
        woreda: '04',
        specificLocation: 'Mexico Square, Behind Commercial Building'
      },
      source: 'walk_in',
      manufacturingInterests: [
        {
          productCategory: '3d_channel_letters_acrylic',
          estimatedDimensions: { width: 4.5, height: 1.2, depth: 0.12, unit: 'meter' },
          illuminationType: 'front_and_back_lit',
          specificationsSummary: '3D Cast Acrylic Letters with Ice Blue Trim and Samsung 1.2W LEDs'
        }
      ],
      estimatedValue: {
        amount: 280000,
        currency: 'ETB',
        isFlexibleBudget: true
      },
      qualificationRating: 'hot'
    };

    const createLeadRes = await fetch(`${BASE_URL}/api/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${salesToken}`
      },
      body: JSON.stringify(leadPayload)
    });
    const createLeadData = await createLeadRes.json();
    if (createLeadRes.status !== 201 || !createLeadData.data?.leadNumber) {
      throw new Error(`Failed to create lead: ${JSON.stringify(createLeadData)}`);
    }
    createdLeadId = createLeadData.data._id;
    console.log(`✓ Created lead successfully: ${createLeadData.data.leadNumber}`);

    // 1.3 Duplicate primary phone rejection
    const duplicateLeadRes = await fetch(`${BASE_URL}/api/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${salesToken}`
      },
      body: JSON.stringify(leadPayload)
    });
    if (duplicateLeadRes.status !== 409) {
      throw new Error(`Expected 409 conflict for duplicate lead phone, got ${duplicateLeadRes.status}`);
    }
    console.log('✓ Duplicate phone rejected with 409 Conflict');

    // 1.4 Get leads list with search
    const getLeadsRes = await fetch(`${BASE_URL}/api/leads?search=Awash&qualificationRating=hot`, {
      headers: { Authorization: `Bearer ${salesToken}` }
    });
    const getLeadsData = await getLeadsRes.json();
    if (getLeadsRes.status !== 200 || getLeadsData.data.length === 0) {
      throw new Error(`Failed to query leads with search filter`);
    }
    console.log(`✓ Queried leads with search filter (Count: ${getLeadsData.meta.total})`);

    // 1.5 Get lead by ID
    const getLeadByIdRes = await fetch(`${BASE_URL}/api/leads/${createdLeadId}`, {
      headers: { Authorization: `Bearer ${salesToken}` }
    });
    const getLeadByIdData = await getLeadByIdRes.json();
    if (getLeadByIdRes.status !== 200 || getLeadByIdData.data.name !== leadPayload.name) {
      throw new Error(`Failed to get lead by ID`);
    }
    console.log('✓ Retrieved lead by ID with populated references');

    // 1.6 Update lead
    const updateLeadRes = await fetch(`${BASE_URL}/api/leads/${createdLeadId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${salesToken}`
      },
      body: JSON.stringify({
        estimatedValue: { amount: 320000, currency: 'ETB', isFlexibleBudget: false }
      })
    });
    const updateLeadData = await updateLeadRes.json();
    if (updateLeadRes.status !== 200 || updateLeadData.data.estimatedValue.amount !== 320000) {
      throw new Error(`Failed to update lead: ${JSON.stringify(updateLeadData)}`);
    }
    console.log('✓ Updated lead estimated value successfully');

    // 1.7 Convert lead to client
    const convertLeadRes = await fetch(`${BASE_URL}/api/leads/${createdLeadId}/convert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${salesToken}`
      },
      body: JSON.stringify({
        displayName: 'Awash International Bank SC',
        legalName: 'Awash International Bank Share Company',
        clientType: 'corporate',
        industry: 'banking_finance',
        businessCompliance: {
          tin: '0012345678',
          vatRegistrationNumber: 'VAT-998877',
          isVatRegistered: true
        },
        address: {
          subcity: 'Kirkos',
          landmark: 'Mexico Square HQ'
        }
      })
    });
    const convertLeadData = await convertLeadRes.json();
    if (convertLeadRes.status !== 201 || !convertLeadData.data?.clientCode) {
      throw new Error(`Failed to convert lead to client: ${JSON.stringify(convertLeadData)}`);
    }
    createdClientId = convertLeadData.data._id;
    console.log(`✓ Converted lead to client: ${convertLeadData.data.clientCode}`);

    // Verify converted lead state
    const verifiedLead = await Lead.findById(createdLeadId);
    if (!verifiedLead.convertedClient.isConverted || verifiedLead.status !== 'won_converted') {
      throw new Error('Lead state was not properly updated to won_converted after conversion');
    }
    console.log('✓ Verified lead converted status is "won_converted"');

    // ==========================================
    // 2. Client Profile & Credit Terms Tests
    // ==========================================
    console.log('\n--- Testing Client Profile & Credit Terms ---');

    // 2.1 Get client by ID
    const getClientRes = await fetch(`${BASE_URL}/api/clients/${createdClientId}`, {
      headers: { Authorization: `Bearer ${salesToken}` }
    });
    const getClientData = await getClientRes.json();
    if (getClientRes.status !== 200 || getClientData.data.clientCode !== convertLeadData.data.clientCode) {
      throw new Error(`Failed to fetch client by ID`);
    }
    console.log('✓ Retrieved newly converted client profile');

    // 2.2 Direct client registration
    const directClientPayload = {
      displayName: 'Dashen Bank SC',
      legalName: 'Dashen Bank Share Company',
      clientType: 'corporate',
      industry: 'banking_finance',
      primaryPhone: '+251911880099',
      address: {
        city: 'Addis Ababa',
        subcity: 'Kirkos',
        landmark: 'Dashen Head Office, Soudan St'
      },
      businessCompliance: {
        tin: '0098765432',
        isVatRegistered: true
      }
    };
    const createDirectClientRes = await fetch(`${BASE_URL}/api/clients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${salesToken}`
      },
      body: JSON.stringify(directClientPayload)
    });
    const createDirectClientData = await createDirectClientRes.json();
    if (createDirectClientRes.status !== 201 || !createDirectClientData.data.clientCode) {
      throw new Error(`Failed to create direct client: ${JSON.stringify(createDirectClientData)}`);
    }
    console.log(`✓ Created direct client: ${createDirectClientData.data.clientCode}`);

    // 2.3 Attempt to update credit terms as non-finance user (Should be 403 Forbidden)
    const unauthorizedCreditRes = await fetch(`${BASE_URL}/api/clients/${createdClientId}/credit-terms`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${employeeToken}`
      },
      body: JSON.stringify({
        allowCredit: true,
        creditLimit: 1000000
      })
    });
    if (unauthorizedCreditRes.status !== 403) {
      throw new Error(`Expected 403 when updating credit terms without finance role, got ${unauthorizedCreditRes.status}`);
    }
    console.log('✓ Non-finance role blocked from credit terms update with 403');

    // 2.4 Update credit terms with finance role
    const authorizedCreditRes = await fetch(`${BASE_URL}/api/clients/${createdClientId}/credit-terms`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${financeToken}`
      },
      body: JSON.stringify({
        allowCredit: true,
        creditLimit: 500000,
        creditPeriodDays: 30,
        gracePeriodDays: 5,
        creditStatus: 'active_good_standing'
      })
    });
    const authorizedCreditData = await authorizedCreditRes.json();
    if (authorizedCreditRes.status !== 200 || !authorizedCreditData.data.creditTerms.allowCredit) {
      throw new Error(`Failed to update credit terms with finance role: ${JSON.stringify(authorizedCreditData)}`);
    }
    console.log('✓ Authorized credit terms updated: Limit 500,000 ETB, Net 30 Days');

    // ==========================================
    // 3. Follow-Up Touchpoint Tests
    // ==========================================
    console.log('\n--- Testing Follow-Up Touchpoints ---');

    // 3.1 Record follow-up interaction
    const followUpPayload = {
      targetEntity: {
        entityType: 'Client',
        entityId: createdClientId,
        clientOrLeadName: 'Awash Commercial Bank Test'
      },
      interaction: {
        channel: 'phone_call',
        conductedBy: testEmployee._id,
        summary: 'Discussed 3D illuminated letters size and fascia depth for Mexico branch',
        detailedNotes: 'Client confirmed fascia depth is 25cm. Ready for site survey.',
        clientSentiment: 'very_positive'
      },
      hasScheduledTask: true,
      task: {
        actionType: 'schedule_site_survey',
        scheduledDateTime: new Date(Date.now() + 86400000),
        title: 'Conduct site measurements at Mexico Square branch',
        assignedTo: testEmployee._id,
        status: 'scheduled'
      }
    };

    const recordFollowUpRes = await fetch(`${BASE_URL}/api/follow-ups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${salesToken}`
      },
      body: JSON.stringify(followUpPayload)
    });
    const recordFollowUpData = await recordFollowUpRes.json();
    if (recordFollowUpRes.status !== 201 || !recordFollowUpData.data.followUpCode) {
      throw new Error(`Failed to log follow-up: ${JSON.stringify(recordFollowUpData)}`);
    }
    createdFollowUpId = recordFollowUpData.data._id;
    console.log(`✓ Logged follow-up interaction: ${recordFollowUpData.data.followUpCode}`);

    // 3.2 Query follow-ups by targetEntity
    const queryFollowUpsRes = await fetch(
      `${BASE_URL}/api/follow-ups?entityType=Client&entityId=${createdClientId}`,
      { headers: { Authorization: `Bearer ${salesToken}` } }
    );
    const queryFollowUpsData = await queryFollowUpsRes.json();
    if (queryFollowUpsRes.status !== 200 || queryFollowUpsData.data.length === 0) {
      throw new Error(`Failed to query follow-ups by client`);
    }
    console.log(`✓ Queried follow-up history (Found ${queryFollowUpsData.meta.total} records)`);

    // 3.3 Complete scheduled follow-up task
    const completeTaskRes = await fetch(`${BASE_URL}/api/follow-ups/${createdFollowUpId}/complete`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${salesToken}`
      },
      body: JSON.stringify({
        notes: 'Site survey successfully coordinated with branch facilities manager'
      })
    });
    const completeTaskData = await completeTaskRes.json();
    if (completeTaskRes.status !== 200 || completeTaskData.data.task.status !== 'completed') {
      throw new Error(`Failed to mark follow-up task completed`);
    }
    console.log('✓ Marked scheduled follow-up task completed');

    // ==========================================
    // 4. Site Feasibility Survey Tests
    // ==========================================
    console.log('\n--- Testing Technical Site Survey ---');

    // 4.1 Schedule site survey
    const surveyPayload = {
      targetEntity: {
        entityType: 'Client',
        entityId: createdClientId,
        clientName: 'Awash International Bank'
      },
      surveyTitle: 'Mexico Branch Facade Test Survey',
      assignedSurveyor: testEmployee._id,
      scheduledDate: new Date(Date.now() + 43200000),
      siteAddress: {
        city: 'Addis Ababa',
        subcity: 'Kirkos',
        specificLocation: 'Mexico Square, Main Entrance Facade',
        gpsCoordinates: {
          latitude: 9.0105,
          longitude: 38.7495
        }
      },
      siteContactPerson: {
        name: 'Tewodros Kassahun',
        phone: '+251911880001'
      }
    };

    const scheduleSurveyRes = await fetch(`${BASE_URL}/api/site-surveys`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${salesToken}`
      },
      body: JSON.stringify(surveyPayload)
    });
    const scheduleSurveyData = await scheduleSurveyRes.json();
    if (scheduleSurveyRes.status !== 201 || !scheduleSurveyData.data.surveyCode) {
      throw new Error(`Failed to schedule site survey: ${JSON.stringify(scheduleSurveyData)}`);
    }
    createdSurveyId = scheduleSurveyData.data._id;
    console.log(`✓ Scheduled site survey: ${scheduleSurveyData.data.surveyCode} (Status: ${scheduleSurveyData.data.status})`);

    // 4.2 Query site surveys
    const getSurveysRes = await fetch(`${BASE_URL}/api/site-surveys?status=scheduled`, {
      headers: { Authorization: `Bearer ${salesToken}` }
    });
    const getSurveysData = await getSurveysRes.json();
    if (getSurveysRes.status !== 200 || getSurveysData.data.length === 0) {
      throw new Error(`Failed to query scheduled surveys`);
    }
    console.log(`✓ Queried site surveys (Count: ${getSurveysData.meta.total})`);

    // 4.3 Validation error when completing survey with missing measurements
    const invalidCompletionRes = await fetch(`${BASE_URL}/api/site-surveys/${createdSurveyId}/complete`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${salesToken}`
      },
      body: JSON.stringify({
        wallSurfaceType: 'reinforced_concrete'
        // Missing measurements and electrical inspection
      })
    });
    if (invalidCompletionRes.status !== 400) {
      throw new Error(`Expected 400 when completing survey with missing measurements, got ${invalidCompletionRes.status}`);
    }
    console.log('✓ Incomplete technical survey rejected with 400 validation error');

    // 4.4 Complete survey with full technical specifications
    const completeSurveyPayload = {
      measurements: {
        facadeWidthMeters: 8.5,
        facadeHeightMeters: 2.2,
        installationHeightFromGround: 4.8,
        fasciaDepthCm: 25,
        viewingDistanceMeters: 35
      },
      wallSurfaceType: 'reinforced_concrete',
      wallConditionRating: 'sound_solid',
      electricalInspection: {
        powerSourceAvailable: true,
        powerSourceDistanceMeters: 6.5,
        supplyVoltage: '220V_single_phase',
        cableRoutingPath: 'surface_mounted_pvc_conduit',
        breakerDedicated: true,
        transformerMountingLocation: 'Inside ceiling plenum above main entrance'
      },
      accessEquipmentRequired: 'scaffolding_tower',
      scaffoldingHeightMeters: 6,
      sketchesAndNotes: 'Solid concrete backing. Mounting with M8 stainless steel drop-in anchors.'
    };

    const completeSurveyRes = await fetch(`${BASE_URL}/api/site-surveys/${createdSurveyId}/complete`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${salesToken}`
      },
      body: JSON.stringify(completeSurveyPayload)
    });
    const completeSurveyData = await completeSurveyRes.json();
    if (completeSurveyRes.status !== 200 || completeSurveyData.data.status !== 'completed') {
      throw new Error(`Failed to complete site survey: ${JSON.stringify(completeSurveyData)}`);
    }
    console.log('✓ Submitted on-site measurements and specs (Survey status: completed)');

    // 4.5 Supervisor approves survey
    const approveSurveyRes = await fetch(`${BASE_URL}/api/site-surveys/${createdSurveyId}/approve`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${managerToken}`
      },
      body: JSON.stringify({
        supervisorEmployeeId: testEmployee._id
      })
    });
    const approveSurveyData = await approveSurveyRes.json();
    if (approveSurveyRes.status !== 200 || !approveSurveyData.data.approvedBySupervisor) {
      throw new Error(`Failed to approve site survey: ${JSON.stringify(approveSurveyData)}`);
    }
    console.log('✓ Site survey certified and approved by supervisor');

    console.log('\n🎉 ALL PHASE 1 CRM & PRE-SALES TESTS PASSED WITH 100% SUCCESS!\n');
  } catch (error) {
    console.error('\n❌ Test run failed:', error);
    process.exitCode = 1;
  } finally {
    server.close();
    await mongoose.disconnect();
    console.log('Closed server and disconnected test MongoDB connection');
  }
}

runTests();
