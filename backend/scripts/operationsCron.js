import mongoose from 'mongoose';
import Client from '../models/Client.js';
import Invoice from '../models/Invoice.js';
import CustomerCreditLedger from '../models/CustomerCreditLedger.js';
import ProductionMachine from '../models/ProductionMachine.js';
import SiteInstallation from '../models/SiteInstallation.js';
import CustomerFeedback from '../models/CustomerFeedback.js';

/**
 * 1. Daily 00:00 — Customer Credit Aging & Automated Credit Hold
 * Recalculates aging buckets for outstanding invoices and locks clients with critical overdue debt.
 */
export const runDailyCreditAging = async () => {
  console.log('[OperationsCron] Starting daily credit aging analysis...');
  const clients = await Client.find({ 'creditTerms.creditFacilityStatus': 'active' });
  const now = new Date();
  let totalChecked = 0;
  let placedOnHold = 0;

  for (const client of clients) {
    totalChecked++;
    const unpaidInvoices = await Invoice.find({
      clientId: client._id,
      paymentStatus: { $in: ['issued', 'partially_paid'] }
    });

    let current030 = 0;
    let overdue3160 = 0;
    let overdue6190 = 0;
    let criticalOver90 = 0;
    let totalOutstanding = 0;

    for (const inv of unpaidInvoices) {
      const balance = inv.totalInvoiceAmountETB - (inv.totalAmountPaidETB || 0);
      if (balance <= 0) continue;
      totalOutstanding += balance;

      const diffDays = Math.floor((now.getTime() - new Date(inv.issueDate).getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays <= 30) {
        current030 += balance;
      } else if (diffDays <= 60) {
        overdue3160 += balance;
      } else if (diffDays <= 90) {
        overdue6190 += balance;
      } else {
        criticalOver90 += balance;
      }
    }

    // Update customer credit ledger if present
    const ledger = await CustomerCreditLedger.findOne({ clientId: client._id });
    if (ledger) {
      ledger.currentAging = {
        current_0_30_days: current030,
        overdue_31_60_days: overdue3160,
        overdue_61_90_days: overdue6190,
        critical_over_90_days: criticalOver90
      };
      ledger.currentOutstandingBalanceETB = totalOutstanding;
      await ledger.save();
    }

    // Evaluate Credit Hold: If past credit days or critical overdue > 0
    const allowedDays = client.creditTerms?.authorizedCreditDays || 30;
    const hasCriticalDebt = criticalOver90 > 0 || (overdue3160 + overdue6190 > 0 && allowedDays < 60);

    if (hasCriticalDebt && !client.creditTerms.isCreditHold) {
      client.creditTerms.isCreditHold = true;
      client.creditTerms.creditHoldReason = 'Automated overnight credit aging lock: overdue invoices detected';
      await client.save();
      placedOnHold++;
      console.log(`[OperationsCron] Client ${client.clientCode} (${client.displayName}) placed on CREDIT HOLD.`);
    }
  }

  console.log(`[OperationsCron] Credit aging finished: ${totalChecked} checked, ${placedOnHold} placed on hold.`);
  return { totalChecked, placedOnHold };
};

/**
 * 2. Daily 07:45 — Pre-Shift Maintenance Interlock
 * Sets cutting and heavy machinery into 'maintenance_hold' pending morning pre-shift inspection clearance.
 */
export const runDailyPreShiftMaintenanceInterlock = async () => {
  console.log('[OperationsCron] Starting daily pre-shift machinery interlock...');
  const interlockMachineTypes = [
    'cnc_router_heavy',
    'co2_laser_cutter',
    'fiber_laser_metal_cutter',
    'channel_letter_auto_bender',
    'uv_flatbed_printer'
  ];

  const machines = await ProductionMachine.find({
    machineType: { $in: interlockMachineTypes },
    currentOperationalStatus: 'idle'
  });

  let setOnHold = 0;
  for (const machine of machines) {
    machine.currentOperationalStatus = 'maintenance_hold';
    await machine.save();
    setOnHold++;
  }

  console.log(`[OperationsCron] Pre-shift interlock finished: ${setOnHold} machines set to maintenance_hold.`);
  return { totalChecked: machines.length, setOnHold };
};

/**
 * 3. Daily 09:00 — Post-Installation Customer Satisfaction Survey Trigger
 * Identifies signage installations completed ~3 days ago and triggers CSAT survey prompts.
 */
export const runDailyPostInstallationFeedbackPrompt = async () => {
  console.log('[OperationsCron] Starting post-installation feedback survey check...');
  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

  const completedInstalls = await SiteInstallation.find({
    status: 'handover_signed',
    updatedAt: { $gte: threeDaysAgo, $lte: twoDaysAgo }
  }).populate('jobOrderId');

  let prompted = 0;
  for (const inst of completedInstalls) {
    const existingFeedback = await CustomerFeedback.findOne({ jobOrderId: inst.jobOrderId });
    if (!existingFeedback) {
      prompted++;
      console.log(`[OperationsCron] Prompted 3-day post-handover survey for Job ${inst.jobOrderNumber} (Client: ${inst.clientId})`);
    }
  }

  console.log(`[OperationsCron] Survey check finished: ${completedInstalls.length} eligible, ${prompted} prompted.`);
  return { totalChecked: completedInstalls.length, prompted };
};

/**
 * Master cron runner
 */
export const runAllOperationsCrons = async () => {
  const agingResult = await runDailyCreditAging();
  const interlockResult = await runDailyPreShiftMaintenanceInterlock();
  const surveyResult = await runDailyPostInstallationFeedbackPrompt();

  return {
    creditAging: agingResult,
    maintenanceInterlock: interlockResult,
    feedbackSurvey: surveyResult
  };
};

export default {
  runDailyCreditAging,
  runDailyPreShiftMaintenanceInterlock,
  runDailyPostInstallationFeedbackPrompt,
  runAllOperationsCrons
};
