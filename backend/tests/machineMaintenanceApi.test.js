import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import authRoutes from '../routes/authRoutes.js';
import machineMaintenanceRoutes, { repairRouter as machineRepairRoutes } from '../routes/machineMaintenanceRoutes.js';
import User from '../models/User.js';
import Employee from '../models/Employee.js';
import ProductionMachine from '../models/ProductionMachine.js';
import MachineMaintenanceSchedule from '../models/MachineMaintenanceSchedule.js';
import MachineMaintenanceLog from '../models/MachineMaintenanceLog.js';
import MachineRepairOrder from '../models/MachineRepairOrder.js';
import StockItem from '../models/StockItem.js';
import { generateToken } from '../middleware/authMiddleware.js';
import { ROLES } from '../constants/roles.js';

dotenv.config();

const PORT = 5102;
const BASE_URL = `http://localhost:${PORT}`;

async function runTests() {
  console.log('🚀 Starting Machinery Maintenance & Repair (Phase 7) Integration Tests...\n');

  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vector_advert_full_erp_test';
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB test database');

  const app = express();
  app.use(cors());
  app.use(express.json());

  app.use('/api/auth', authRoutes);
  app.use('/api/machine-maintenance', machineMaintenanceRoutes);
  app.use('/api/machine-repairs', machineRepairRoutes);

  app.use((err, req, res, next) => {
    console.error('Test Server Error:', err);
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  });

  const server = app.listen(PORT, () => {
    console.log(`Test server running on ${BASE_URL}\n`);
  });

  let managerToken = '';
  let technicianToken = '';
  let managerUser = null;
  let technicianUser = null;
  let managerEmployee = null;
  let techEmployee = null;
  let testMachine = null;
  let testSchedule = null;
  let testLog = null;
  let testRepair = null;
  let testStockItem = null;

  try {
    console.log('--- 0. Seeding Authentication, Employees & Production Machine ---');
    await Promise.all([
      User.deleteMany({ email: { $regex: /@p7test\.vector/ } }),
      Employee.deleteMany({ email: { $regex: /@p7test\.vector/ } }),
      ProductionMachine.deleteMany({ machineCode: 'CNC-2026-P7-01' }),
      MachineMaintenanceSchedule.deleteMany({ scheduleCode: { $regex: /MMS-.*P7/ } }),
      MachineMaintenanceLog.deleteMany({ logCode: { $regex: /MML-.*P7/ } }),
      MachineRepairOrder.deleteMany({ repairOrderCode: { $regex: /MRO-.*P7/ } }),
      StockItem.deleteMany({ code: 'PART-P7-BEARING' })
    ]);

    managerEmployee = await Employee.create({
      employeeNumber: 'EMP-P7-MGR',
      name: { first: 'Yared', last: 'Alemu' },
      email: 'yared@p7test.vector',
      primaryPhone: '+251911778899',
      department: new mongoose.Types.ObjectId(),
      position: 'Factory Maintenance Lead & COO',
      employmentStatus: 'active',
      hireDate: new Date()
    });

    techEmployee = await Employee.create({
      employeeNumber: 'EMP-P7-TECH',
      name: { first: 'Mulugeta', last: 'Bekele' },
      email: 'mulugeta@p7test.vector',
      primaryPhone: '+251911778800',
      department: new mongoose.Types.ObjectId(),
      position: 'Senior CNC Precision Technician',
      employmentStatus: 'active',
      hireDate: new Date()
    });

    managerUser = await User.create({
      name: 'Yared Alemu (Maintenance COO)',
      email: 'yared@p7test.vector',
      password: 'Password123!',
      roles: [ROLES.MANAGER, ROLES.COO],
      accountStatus: 'active',
      employeeId: managerEmployee._id
    });

    technicianUser = await User.create({
      name: 'Mulugeta Bekele (Technician)',
      email: 'mulugeta@p7test.vector',
      password: 'Password123!',
      roles: [ROLES.EMPLOYEE],
      accountStatus: 'active',
      employeeId: techEmployee._id
    });

    managerToken = generateToken(managerUser._id);
    technicianToken = generateToken(technicianUser._id);

    // Create test production machine in 'maintenance_hold' (e.g. morning pre-shift state)
    testMachine = await ProductionMachine.create({
      machineCode: 'CNC-2026-P7-01',
      machineName: 'Vector Heavy CNC Router 2040 6kW ATC',
      machineType: 'cnc_router_heavy',
      bedDimensions: {
        bedWidthCm: 200,
        bedLengthCm: 400,
        zAxisClearanceMm: 300
      },
      technicalCapabilities: {
        supportedMaterials: ['Acrylic', 'Alucobond ACP', 'Wood MDF', 'Brass', 'Aluminum'],
        maxCuttingThicknessMm: 30,
        spindleMaxRpm: 24000,
        vacuumBedEquipped: true
      },
      workshopLocationBay: 'Heavy Machining Bay Alpha',
      currentOperationalStatus: 'maintenance_hold',
      assignedLeadOperator: techEmployee._id,
      hourlyCostRateETB: 850,
      totalOperatingHours: 1250
    });

    // Create spare part in inventory
    testStockItem = await StockItem.create({
      code: 'PART-P7-BEARING',
      name: 'NSK Precision Ceramic Spindle Bearing 7005C P4',
      category: 'Machine Spares',
      unit: 'pcs',
      baseUnit: 'pcs',
      averageUnitCost: 4500,
      sellingPrice: 5200,
      stockStatus: 'in_stock'
    });

    console.log('✓ Users, employees, machine, and spare parts initialized');
    console.log(`✓ Machine status initially: ${testMachine.currentOperationalStatus}\n`);

    // --- Test 1: Create Maintenance Schedule Template ---
    console.log('--- Test 1: Create Maintenance Schedule Template ---');
    const scheduleRes = await fetch(`${BASE_URL}/api/machine-maintenance/schedules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${managerToken}`
      },
      body: JSON.stringify({
        scheduleCode: 'MMS-2026-P7-01',
        machineId: testMachine._id,
        machineType: 'cnc_router_heavy',
        frequency: 'daily_pre_shift',
        scheduleTitle: 'Daily Morning Pre-Shift Lubrication & Warmup Interlock',
        estimatedDurationMinutes: 15,
        checklistTemplate: [
          {
            itemCode: 'CHK-01',
            taskName: 'Clean Ball Screws and Linear Rails of Acrylic Debris',
            taskCategory: 'cleaning_dust_removal',
            instructionDetails: 'Wipe with lint-free microfiber and ISO VG 68 oil',
            isSafetyCritical: true
          },
          {
            itemCode: 'CHK-02',
            taskName: 'Verify Chiller Fluid Temperature & Flow Rate',
            taskCategory: 'fluid_coolant_check',
            hasNumericalReading: true,
            expectedRange: { minValue: 18, maxValue: 24, unit: 'celsius' },
            isSafetyCritical: true
          },
          {
            itemCode: 'CHK-03',
            taskName: 'Pneumatic Air Pressure Inspection',
            taskCategory: 'pneumatic_electrical_check',
            hasNumericalReading: true,
            expectedRange: { minValue: 6.0, maxValue: 8.5, unit: 'bar' },
            isSafetyCritical: true
          }
        ]
      })
    });

    const scheduleData = await scheduleRes.json();
    console.log(`✓ Schedule creation response status: ${scheduleRes.status}`);
    if (scheduleRes.status !== 201) throw new Error(scheduleData.message);
    testSchedule = scheduleData.data;
    console.log(`✓ Schedule created: ${testSchedule.scheduleCode} (${testSchedule.scheduleTitle})\n`);

    // --- Test 2: Sensor Range Validation Middleware ---
    console.log('--- Test 2: Sensor Range Validation Middleware ---');
    const invalidSensorRes = await fetch(`${BASE_URL}/api/machine-maintenance/logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${technicianToken}`
      },
      body: JSON.stringify({
        machineId: testMachine._id,
        environmentalParameters: {
          chillerFluidTempCelsius: 85 // Invalid! Max is 60°C
        }
      })
    });

    const invalidSensorData = await invalidSensorRes.json();
    console.log(`✓ Out-of-range sensor rejected with HTTP status: ${invalidSensorRes.status}`);
    console.log(`✓ Validation message: "${invalidSensorData.message}"`);
    if (invalidSensorRes.status !== 400) {
      throw new Error(`Expected 400 for out of bounds sensor, got ${invalidSensorRes.status}`);
    }
    console.log('✓ Sensor validation middleware verified\n');

    // --- Test 3: Submit Daily Pre-Shift Maintenance Log ---
    console.log('--- Test 3: Submit Daily Pre-Shift Maintenance Log ---');
    const logRes = await fetch(`${BASE_URL}/api/machine-maintenance/logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${technicianToken}`
      },
      body: JSON.stringify({
        logCode: 'MML-2026-P7-01',
        machineId: testMachine._id,
        scheduleId: testSchedule._id,
        frequency: 'daily_pre_shift',
        shift: 'morning_pre_shift',
        machineOperatingHoursAtLog: 1250,
        checklistResults: [
          {
            itemCode: 'CHK-01',
            taskName: 'Clean Ball Screws and Linear Rails of Acrylic Debris',
            taskCategory: 'cleaning_dust_removal',
            isSatisfactory: true,
            statusAction: 'cleaned_and_cleared'
          },
          {
            itemCode: 'CHK-02',
            taskName: 'Verify Chiller Fluid Temperature & Flow Rate',
            taskCategory: 'fluid_coolant_check',
            isSatisfactory: true,
            loggedNumericalValue: 20.5,
            statusAction: 'satisfactory_ok'
          },
          {
            itemCode: 'CHK-03',
            taskName: 'Pneumatic Air Pressure Inspection',
            taskCategory: 'pneumatic_electrical_check',
            isSatisfactory: true,
            loggedNumericalValue: 7.2,
            statusAction: 'satisfactory_ok'
          }
        ],
        environmentalParameters: {
          ambientWorkshopTempCelsius: 22.0,
          chillerFluidTempCelsius: 20.5,
          pneumaticAirPressureBar: 7.2,
          spindleWarmupCycleCompleted: true
        },
        overallResult: 'passed_ready_for_production',
        supervisorCertified: false
      })
    });

    const logData = await logRes.json();
    console.log(`✓ Log submission response status: ${logRes.status}`);
    if (logRes.status !== 201) throw new Error(logData.message);
    testLog = logData.data.maintenanceLog;
    console.log(`✓ Log created: ${testLog.logCode} (Overall: ${testLog.overallResult})`);
    console.log(`✓ Next Maintenance Due: ${logData.data.machine.maintenanceSchedule.nextMaintenanceDueDate}\n`);

    // --- Test 4: Supervisor Certification & Machine Status Unlock (Rule 1) ---
    console.log('--- Test 4: Supervisor Certification & Interlock Machine Unlock (Rule 1) ---');
    const certifyRes = await fetch(`${BASE_URL}/api/machine-maintenance/logs/${testLog._id}/certify`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${managerToken}`
      },
      body: JSON.stringify({
        supervisorNotes: 'Pre-shift inspection passed with nominal chiller & air pressure values. Spindle warmup verified.',
        overallResult: 'passed_ready_for_production'
      })
    });

    const certifyData = await certifyRes.json();
    console.log(`✓ Certification response status: ${certifyRes.status}`);
    if (certifyRes.status !== 200) throw new Error(certifyData.message);

    const unlockedMachine = certifyData.data.machine;
    console.log(`✓ Supervisor Certified: ${certifyData.data.maintenanceLog.supervisorCertified}`);
    console.log(`✓ Machine status unlocked from maintenance_hold to: ${unlockedMachine.currentOperationalStatus}`);
    if (unlockedMachine.currentOperationalStatus !== 'idle') {
      throw new Error(`Expected machine status 'idle', got '${unlockedMachine.currentOperationalStatus}'`);
    }
    console.log('✓ Rule 1 verified: Supervisor certification unlocked machine for production\n');

    // --- Test 5: Report Machine Breakdown (Rule 2) ---
    console.log('--- Test 5: Report Machine Breakdown & Immediate Lockout (Rule 2) ---');
    const breakdownTime = new Date(Date.now() - 3.5 * 60 * 60 * 1000); // 3.5 hours ago
    const repairRes = await fetch(`${BASE_URL}/api/machine-repairs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${technicianToken}`
      },
      body: JSON.stringify({
        repairOrderCode: 'MRO-2026-P7-01',
        machineId: testMachine._id,
        breakdownTimestamp: breakdownTime,
        urgency: 'critical_production_halted',
        breakdownSymptoms: 'Severe high-frequency screeching noise from main 6kW spindle during heavy aluminum cutting pass. Excessive spindle vibration.',
        errorCodesLogged: ['VFD_ERR_OVERCURRENT_04', 'SPINDLE_TEMP_WARN_88C'],
        interruptedProduction: {
          activeJobOrderNumber: 'JOB-2026-P7-01',
          damagedWorkpieceScrapped: true,
          scrapCostEstimatedETB: 1250
        }
      })
    });

    const repairData = await repairRes.json();
    console.log(`✓ Repair order response status: ${repairRes.status}`);
    if (repairRes.status !== 201) throw new Error(repairData.message);
    testRepair = repairData.data.repairOrder;

    const lockedMachine = repairData.data.machine;
    console.log(`✓ Repair order generated: ${testRepair.repairOrderCode} (Urgency: ${testRepair.urgency})`);
    console.log(`✓ Machine operational status immediately flipped to: ${lockedMachine.currentOperationalStatus}`);
    if (lockedMachine.currentOperationalStatus !== 'breakdown') {
      throw new Error(`Expected machine status 'breakdown', got '${lockedMachine.currentOperationalStatus}'`);
    }
    console.log('✓ Rule 2 verified: Breakdown immediately switched machine to breakdown status\n');

    // --- Test 6: Update Technical Diagnosis ---
    console.log('--- Test 6: Update Technical Diagnosis ---');
    const diagRes = await fetch(`${BASE_URL}/api/machine-repairs/${testRepair._id}/diagnosis`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${technicianToken}`
      },
      body: JSON.stringify({
        failureCategory: 'spindle_bearing_and_vfd',
        rootCauseSummary: 'Lower front ceramic angular contact bearing cage fatigue due to sustained 24k RPM load with insufficient preload calibration.',
        repairStrategy: 'Disassemble spindle cartridge, extract damaged bearing pair, press-fit new NSK 7005C bearings, and recalibrate preload.',
        leadTechnician: techEmployee._id,
        status: 'repair_in_progress'
      })
    });

    const diagData = await diagRes.json();
    console.log(`✓ Diagnosis updated status: ${diagRes.status}`);
    if (diagRes.status !== 200) throw new Error(diagData.message);
    console.log(`✓ Failure category: ${diagData.data.diagnosis.failureCategory}`);
    console.log(`✓ Repair status advanced to: ${diagData.data.status}\n`);

    // --- Test 7: Requisition and Log Replacement Spare Parts ---
    console.log('--- Test 7: Requisition and Log Replacement Spare Parts ---');
    const partsRes = await fetch(`${BASE_URL}/api/machine-repairs/${testRepair._id}/spare-parts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${technicianToken}`
      },
      body: JSON.stringify({
        sparePartsUsed: [
          {
            stockItemId: testStockItem._id,
            partCode: 'PART-P7-BEARING',
            partName: 'NSK Precision Ceramic Spindle Bearing 7005C P4',
            quantityUsed: 2,
            unitPriceETB: 4500,
            totalPriceETB: 9000
          }
        ],
        status: 'testing_and_calibrating'
      })
    });

    const partsData = await partsRes.json();
    console.log(`✓ Spare parts logged status: ${partsRes.status}`);
    if (partsRes.status !== 200) throw new Error(partsData.message);
    console.log(`✓ Total Spare Parts Cost: ${partsData.data.totalSparePartsCostETB} ETB`);
    console.log(`✓ Total Repair Cost: ${partsData.data.totalRepairCostETB} ETB`);
    if (partsData.data.totalSparePartsCostETB !== 9000) {
      throw new Error(`Expected parts cost 9000 ETB, got ${partsData.data.totalSparePartsCostETB}`);
    }
    console.log('✓ Spare parts cost calculation verified\n');

    // --- Test 8: Post-Repair Calibration & Return-to-Service Certification ---
    console.log('--- Test 8: Post-Repair Calibration & Return-to-Service Certification ---');
    const certifyReturnRes = await fetch(`${BASE_URL}/api/machine-repairs/${testRepair._id}/certify-return`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${managerToken}`
      },
      body: JSON.stringify({
        testRunType: 'high_speed_spindle_runout_and_cut_test',
        calibrationTestPassed: true,
        dimensionalAccuracyVarianceMm: 0.02,
        spindleRunoutDialIndicatorMm: 0.008,
        laborHoursTotal: 3.5,
        repairCompletedAt: new Date()
      })
    });

    const certifyReturnData = await certifyReturnRes.json();
    console.log(`✓ Certify return status: ${certifyReturnRes.status}`);
    if (certifyReturnRes.status !== 200) throw new Error(certifyReturnData.message);

    const finalRepair = certifyReturnData.data.repairOrder;
    const finalMachine = certifyReturnData.data.machine;

    console.log(`✓ Repair Order final status: ${finalRepair.status}`);
    console.log(`✓ Total Downtime Hours computed: ${finalRepair.totalDowntimeHours} hrs`);
    console.log(`✓ Spindle Dial Runout: ${finalRepair.postRepairTesting.spindleRunoutDialIndicatorMm} mm (Tolerance: < 0.015 mm)`);
    console.log(`✓ Dimensional Accuracy Variance: ${finalRepair.postRepairTesting.dimensionalAccuracyVarianceMm} mm`);
    console.log(`✓ Machine status restored to: ${finalMachine.currentOperationalStatus}`);

    if (finalRepair.status !== 'completed_certified') {
      throw new Error(`Expected completed_certified status, got ${finalRepair.status}`);
    }
    if (finalRepair.totalDowntimeHours <= 0) {
      throw new Error(`Expected totalDowntimeHours > 0, got ${finalRepair.totalDowntimeHours}`);
    }
    if (finalMachine.currentOperationalStatus !== 'idle') {
      throw new Error(`Expected machine status 'idle', got ${finalMachine.currentOperationalStatus}`);
    }
    console.log('✓ Post-repair calibration return-to-service verified\n');

    // --- Test 9: Machine Health & OEE Metrics ---
    console.log('--- Test 9: Machine Health & OEE Metrics Query ---');
    const metricsRes = await fetch(`${BASE_URL}/api/machine-maintenance/metrics/${testMachine._id}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${managerToken}`
      }
    });

    const metricsData = await metricsRes.json();
    console.log(`✓ Metrics response status: ${metricsRes.status}`);
    if (metricsRes.status !== 200) throw new Error(metricsData.message);
    console.log(`✓ Machine: ${metricsData.data.machineCode}`);
    console.log(`✓ Total Maintenance Logs: ${metricsData.data.maintenanceStats.totalLogs}`);
    console.log(`✓ Compliance Rate: ${metricsData.data.maintenanceStats.complianceRate}%`);
    console.log(`✓ Total Downtime Hours: ${metricsData.data.repairStats.totalDowntimeHours}`);
    console.log(`✓ MTTR: ${metricsData.data.repairStats.mttrHours} hrs`);
    console.log(`✓ Total Repair Cost: ${metricsData.data.repairStats.totalRepairCostETB} ETB\n`);

    console.log('🎉 ALL PHASE 7 INTEGRATION TESTS PASSED 100% CLEANLY! 🎉\n');
  } catch (error) {
    console.error('❌ Phase 7 Integration Test Failed:', error);
    process.exitCode = 1;
  } finally {
    server.close();
    await mongoose.disconnect();
    console.log('MongoDB disconnected and test server stopped');
  }
}

runTests();
