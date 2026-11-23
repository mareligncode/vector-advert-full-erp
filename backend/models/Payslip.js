import mongoose from 'mongoose';

const payslipSchema = new mongoose.Schema(
  {
    payslipNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    payrollRun: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PayrollRun',
      required: true,
      index: true
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true
    },
    employeeSnapshot: {
      employeeNumber: { type: String, trim: true },
      fullName: { type: String, trim: true },
      department: { type: String, trim: true },
      jobTitle: { type: String, trim: true },
      employmentType: { type: String, trim: true },
      bankAccount: {
        bankName: { type: String, trim: true },
        holderName: { type: String, trim: true },
        accountNumber: { type: String, trim: true },
        branch: { type: String, trim: true }
      }
    },
    attendanceSummary: {
      calendarDays: { type: Number, default: 0 },
      expectedWorkingDays: { type: Number, default: 0 },
      daysWorked: { type: Number, default: 0 },
      paidLeaveDays: { type: Number, default: 0 },
      unpaidLeaveDays: { type: Number, default: 0 },
      absentDays: { type: Number, default: 0 },
      lateArrivalPenaltyHours: { type: Number, default: 0 }
    },
    overtimeSummary: {
      normalOvertimeHours: { type: Number, default: 0 },
      normalOvertimeAmount: { type: Number, default: 0 },
      nightOvertimeHours: { type: Number, default: 0 },
      nightOvertimeAmount: { type: Number, default: 0 },
      weekendOvertimeHours: { type: Number, default: 0 },
      weekendOvertimeAmount: { type: Number, default: 0 },
      holidayOvertimeHours: { type: Number, default: 0 },
      holidayOvertimeAmount: { type: Number, default: 0 },
      totalOvertimeHours: { type: Number, default: 0 },
      totalOvertimeAmount: { type: Number, default: 0 }
    },
    earnings: {
      basicSalary: { type: Number, default: 0 },
      earnedBasicSalary: { type: Number, default: 0 },
      allowances: [
        {
          title: { type: String, trim: true },
          amount: { type: Number, default: 0 },
          isTaxable: { type: Boolean, default: true },
          taxableAmount: { type: Number, default: 0 },
          exemptAmount: { type: Number, default: 0 }
        }
      ],
      overtimePay: { type: Number, default: 0 },
      bonuses: { type: Number, default: 0 },
      commissions: { type: Number, default: 0 },
      grossEarnings: { type: Number, default: 0 },
      taxableIncome: { type: Number, default: 0 }
    },
    deductions: {
      statutoryDeductions: {
        incomeTax: { type: Number, default: 0 },
        employeePension: { type: Number, default: 0 },
        employerPension: { type: Number, default: 0 }
      },
      nonStatutoryDeductions: {
        loanRepayment: { type: Number, default: 0 },
        salaryAdvanceDeduction: { type: Number, default: 0 },
        attendancePenaltyDeduction: { type: Number, default: 0 },
        costSharing: { type: Number, default: 0 },
        unionDues: { type: Number, default: 0 },
        disciplinaryDeductions: { type: Number, default: 0 },
        customDeductions: [
          {
            title: { type: String, trim: true },
            amount: { type: Number, default: 0 },
            reason: { type: String, trim: true }
          }
        ]
      },
      totalEmployeeDeductions: { type: Number, default: 0 },
      totalEmployerContributions: { type: Number, default: 0 }
    },
    netSalary: {
      type: Number,
      default: 0
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'ready', 'paid', 'hold', 'failed'],
      default: 'pending',
      index: true
    },
    paymentMethod: {
      type: String,
      enum: ['bank_transfer', 'cash', 'cheque'],
      default: 'bank_transfer'
    },
    disbursement: {
      paymentDate: { type: Date },
      transactionReference: { type: String, trim: true },
      disbursedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      notes: { type: String, trim: true }
    },
    pdfUrl: {
      type: String,
      trim: true
    },
    sentToEmployeeAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

payslipSchema.index({ payrollRun: 1, employee: 1 }, { unique: true });

const Payslip = mongoose.model('Payslip', payslipSchema);
export default Payslip;
