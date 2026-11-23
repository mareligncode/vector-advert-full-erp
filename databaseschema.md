# MongoDB Data Model Architecture

This section explains, in plain language, what information the HR system stores and how its main records are organized in MongoDB.

---

## 1. Data Models

The lists below show the information stored in each part of the system.

### Users

- Email
- Password hash
- Role: [string]
- Account status
- Password reset code
- Password reset code expiry
- Last login time

### Employees

- Employee number
- Linked user account
- Name
    - First
    - Middle
    - Last
- Date of birth
- Email
- Primary phone number
- Alternative phone number
- Profile photo
- National ID:
    - FAN number
    - FIN number
    - Front image url
    - Back image url
    - Approved By
    - Approved at
- Date of birth
- Gender
- Marital status
- Nationality
- Home address
- Emergency Contact: []
    - Name
    - Phone
    - Relationship
- Guarantor: []
    - Name
    - Phone
    - National ID:
        - FAN number
        - FIN number
        - Front image url
        - Back image url
        - Approved By
        - Approved at
- Bank Account: []
    - Band name
    - Holder name
    - Account number
    - Is primary
- Basic salary
- Department
- Job title
- Manager
- Employment status
- Hire date
- Contract end date
- Probation end date
- Work location
- Branch
- Employment type
- Employee document: []
    - Title
    - Type
    - File url
    - Uploaded at
    - Approved By
    - Approved at

### **Leave Balances**

- Employee
- Year
- **Annual Leave**
    - `annualTotalEntitlement`: Number (Default: 16, Max: 16)
    - `annualAccruedDays`: Number (Default: 0, Min: 0, Max: 16)
    - `annualUsedDays`: Number (Default: 0, Min: 0)
    - `annualRemainingDays`: Number (Default: 0, Min: 0)
- **Sick Leave**
    - `sickEntitlement`: Number (Default: 15, Min: 0)
    - `sickUsedDays`: Number (Default: 0, Min: 0)
    - `sickRemainingDays`: Number (Default: 15, Min: 0)
- **Casual Leave**
    - `casualEntitlement`: Number (Default: 5, Min: 0)
    - `casualUsedDays`: Number (Default: 0, Min: 0)
    - `casualRemainingDays`: Number (Default: 5, Min: 0)
- **Maternity Leave**
    - `maternityEntitlement`: Number (Default: 120, Min: 0)
    - `maternityUsedDays`: Number (Default: 0, Min: 0)
    - `maternityRemainingDays`: Number (Default: 120, Min: 0)
- **Paternity Leave**
    - `paternityEntitlement`: Number (Default: 10, Min: 0)
    - `paternityUsedDays`: Number (Default: 0, Min: 0)
    - `paternityRemainingDays`: Number (Default: 10, Min: 0)
- `carriedForwardDays`: Number (Default: 0, Min: 0)
- `lastRecalculatedAt`: Date
- `createdAt`: Date
- `updatedAt`: Date

### Leave Requests

- Employee: ObjectId (ref to Employee)
- Associated leave balance: ObjectId (ref to LeaveBalance)
- Leave type: String ('annual', 'sick', 'casual', 'maternity', 'paternity', 'unpaid', 'other')
- Start date: Date
- Start day period: String ('morning', 'afternoon', 'full_day')
- End date: Date
- End day period: String ('morning', 'afternoon', 'full_day')
- Total leave days: Number
- Request reason: String
- Supporting attachments: [String, urls]
- Request status: String ('pending_manager', 'pending_hr', 'approved', 'rejected', 'cancelled')
- Manager approval:
    - Status: String ('pending', 'approved', 'rejected')
    - Approved by: ObjectId (ref to User)
    - Approved at: Date
    - Comments: String
- HR approval:
    - Status: String ('pending', 'approved', 'rejected')
    - Approved by: ObjectId (ref to User)
    - Approved at: Date
    - Comments: String
- Reviewer: ObjectId (ref to User)
- Review comments: String
- Review date: Date
- Approval history: []
    - Reviewer: ObjectId (ref to User)
    - Stage: String ('manager', 'hr', 'executive', 'general')
    - Action: String ('approved', 'rejected', 'escalated')
    - Comments: String
    - Decided at: Date

### Professional Upgrades

- Employee
- Upgrade type
- Upgrade title
- Institution
- Field of study
- Start date
- Expected completion date
- Completion date
- Estimated cost
- Whether company sponsorship is requested
- Supporting documents
- Request status
- Reviewer
- Review notes

### Job Postings

- Job title
- Department
- Location
- Employment type
- Experience level
- Job description
- Job requirements: [string]
- Posting status
- Number of openings
- Application deadline
- Person who created the posting

### Job Applications

- Related job posting
- Applicant name
- Applicant Contact
    - Email
    - Phone number
    - Telegram username
- Resume
- Portfolio link
- LinkedIn link
- Cover letter
- Years of experience
- Application status
- Applicant rating
- Application notes
- Interviews:
    - Interview format
    - Scheduled date and time
    - Interview location
    - Online meeting link
    - Meeting link sending status
    - Interviewer
    - Interview status
    - Interview feedback
    - Hiring decision
    - Interview score

### Attendance Config

- Location references: []
    - Office name
    - Address
    - Location: lat, long
- Morning time:
    - start time
    - end time
- Afternoon time:
    - start time
    - end time
- is selfie required
- is location required
- auto overtime allow
- late allowed minutes

### Attendance

- Employee
- Internship
- Attendance date
- Morning Check
    - Location Ref
    - Check-in
        - Time
        - Selfie
        - Location: lat, long
        - Status
    - Check-out
        - Time
        - Selfie
        - Location: lat, long
- Afternoon Check
    - Location Ref
    - Check-in
        - Time
        - Selfie
        - Location: lat, long
        - Status
    - Check-out
        - Time
        - Selfie
        - Location: lat, long
- Attendance status
- Late:
    - Is late
    - Minutes late
- Overtime
    - Has overtime
    - Number of hour

### Overtime Requests

- Employee: ObjectId (ref to Employee)
- Attendance: ObjectId (ref to Attendance, nullable)
- Request date: Date
- Start time: String (HH:mm)
- End time: String (HH:mm)
- Total hours: Number
- Request reason: String
- Advance approval required: Boolean
- Request status: String ('pending_manager', 'pending_hr', 'approved', 'rejected', 'cancelled')
- Manager approval:
    - Status: String ('pending', 'approved', 'rejected')
    - Approved by: ObjectId (ref to User)
    - Approved at: Date
    - Comments: String
- HR approval:
    - Status: String ('pending', 'approved', 'rejected')
    - Approved by: ObjectId (ref to User)
    - Approved at: Date
    - Comments: String
- Approve decisions: []
    - Approver type: String ('Manager', 'HR Officer', 'HR Manager', 'Executive')
    - Approver: ObjectId (ref to User)
    - Decision: String ('approved', 'rejected')
    - Comments: String
    - Decided at: Date

### Employee Clearances

- Employee
- Resignation date
- Last working day
- Reason for leaving
- Clearance
    - Type: Department-head, Store, IT, Finance, HR
    - Status
    - Approved by
    - Approved at
    - Note
- Overall clearance status
- Clearance certificate file url

### Field Visits

- Visit purpose
- Visit date
- Visit start time
- Visit end time
- Visit address
- Location: lat, long
- Employees: [ObjectId]
- Leader
- Visit report notes
- Visit status

### Internships

- Internship number
- Linked user account
- Name:
    - First
    - Middle
    - Last
- Gender
- Phone
- Email
- Address
- Emergency contact
- Type: tutorial, paid
- Academic Profile
    - University
    - Faculty
    - Department of study
    - Year of study
    - Student ID
        - ID number
        - Front image url
        - Back image url
    - Placement
        - Internship position
        - Assigned department
        - Supervisor ID
        - Start date
        - End date
        - Status
    - Documents
        - Application letter url
        - Recommendation letter url
        - Cv url
    - Note

### Training’s

- Title
- Description
- Training type
- Trainer name
- Provider
- Department: [string]
- Location
- Start date
- End date
- Duration
- Budget
- Status
- Attachments
- Note
- Participants: []
    - Employee
    - Attendance:
        - date
        - status
    - Completion status
    - Certificate url
    - Score
    - Remarks
    - Joined at
    - Completed at

### Plans

- Name
- Parent plan: null
- Type: yearly, half yearly, quarterly, monthly, weekly, daily
- Department
- Key goal
- Expected output
- Priority
- Description
- KPIs: Mixed
- Target
- Budget
- Leader
- Teams: []
    - Employee
    - Role
    - Performance
- Tasks: []
    - Title
    - Description
    - Checklist:
        - Name
        - Description
        - is Checked
    - Assigned employee
    - Done by
- Plan Date
- Start Date
- End date
- Approved by
- Approved at
- Support teams:
    - Employee
    - Role
    - Performance
- Note
- Documents: []
    - Title
    - Type: SOP, Milestone
    - Url
    - Uploaded by
    - Uploaded at

### Evidences (Universal Multi-File Attachment System)

The `Evidence` model serves as the unified, polymorphic attachment store for **every table/entity in the ERP** (e.g. `PayrollRun`, `Payslip`, `SalaryAdvanceLoan`, `SalaryStructure`, `Employee`, `LeaveRequest`, `OvertimeRequest`, `Clearance`, `Training`, `Plan`, `JobPosting`, `JobApplication`, `Internship`, `FieldVisit`). Whenever a user clicks **"Add Attachment"** on any record, files are dynamically appended into the `attachments` array.

- `entityType`: String (registered model name, e.g. 'PayrollRun', 'Payslip', 'SalaryAdvanceLoan', 'SalaryStructure', 'Employee', 'LeaveRequest', etc.)
- `entityId`: ObjectId (refPath to entityType)
- `entityOwner`: ObjectId (ref to User, auto-inferred or explicitly specified)
- `attachments`: [] (Dynamic array of multiple file attachments added via "Add Attachment" button)
    - `title`: String
    - `description`: String
    - `fileUrl`: String
    - `fileName`: String
    - `mimeType`: String
    - `fileSize`: Number (in bytes)
    - `uploadedBy`: ObjectId (ref to User)
    - `status`: String ('pending', 'verified', 'rejected')
    - `reviewedBy`: ObjectId (ref to User)
    - `reviewedAt`: Date
    - `rejectionReason`: String
    - `createdAt`: Date
    - `updatedAt`: Date
- `notes`: [] (Audit trail and commentary notes for the entity's files)
    - `content`: String
    - `author`: ObjectId (ref to User)
    - `createdAt`: Date
    - `updatedAt`: Date
- `createdAt`: Date
- `updatedAt`: Date

### Payroll Config

- `companyName`: String
- `currency`: String (Default: 'ETB')
- `payFrequency`: String ('monthly', 'bi_weekly', 'weekly', Default: 'monthly')
- `standardWorkingDaysPerMonth`: Number (Default: 22)
- `standardWorkingHoursPerDay`: Number (Default: 8)
- `payrollCutoffDay`: Number (Day of month, e.g. 25)
- `pensionContribution`:
    - `employeePensionRate`: Number (Percentage, e.g. 7%)
    - `employerPensionRate`: Number (Percentage, e.g. 11%)
    - `isPensionMandatory`: Boolean (Default: true)
- `incomeTaxSlabs`: []
    - `slabName`: String
    - `minIncome`: Number
    - `maxIncome`: Number (Nullable for highest bracket)
    - `taxRate`: Number (Percentage, e.g. 0%, 10%, 15%, 20%, 25%, 30%, 35%)
    - `deductibleAmount`: Number
- `overtimeMultipliers`:
    - `normalDayMultiplier`: Number (Default: 1.5)
    - `nightShiftMultiplier`: Number (Default: 1.75)
    - `weekendMultiplier`: Number (Default: 2.0)
    - `publicHolidayMultiplier`: Number (Default: 2.5)
- `taxExemptAllowanceLimits`:
    - `transportAllowanceLimit`: Number
    - `foodAllowanceLimit`: Number
    - `mobileAllowanceLimit`: Number
- `isActive`: Boolean (Default: true)
- `updatedBy`: ObjectId (ref to User)
- `createdAt`: Date
- `updatedAt`: Date

### Salary Structures

- `employee`: ObjectId (ref to Employee)
- `effectiveFrom`: Date
- `effectiveTo`: Date (Nullable if currently active)
- `status`: String ('active', 'inactive', 'draft', 'superseded')
- `baseSalary`: Number (Basic Monthly Salary)
- `paymentMethod`: String ('bank_transfer', 'cash', 'cheque')
- `bankAccount`:
    - `bankName`: String
    - `holderName`: String
    - `accountNumber`: String
    - `branch`: String
- `isOvertimeEligible`: Boolean (Default: true)
- `isPensionEligible`: Boolean (Default: true)
- `isTaxExempt`: Boolean (Default: false)
- `earnings`: []
    - `title`: String ('Transport Allowance', 'Housing Allowance', 'Position Allowance', 'Communication Allowance', 'Hardship Allowance', 'Other Allowance')
    - `amount`: Number
    - `isTaxable`: Boolean
    - `taxExemptLimit`: Number
    - `isRecurring`: Boolean (Default: true)
- `deductions`: []
    - `title`: String ('Cost Sharing', 'Union Dues', 'Provident Fund', 'Health Insurance', 'Other')
    - `amount`: Number
    - `deductionType`: String ('fixed', 'percentage')
    - `percentageRate`: Number
    - `isPreTax`: Boolean (Default: false)
    - `isRecurring`: Boolean (Default: true)
- `approvedBy`: ObjectId (ref to User)
- `approvedAt`: Date
- `notes`: String
- `createdAt`: Date
- `updatedAt`: Date

### Payroll Runs

- `payrollCode`: String (Unique, e.g. 'PR-2026-11')
- `title`: String (e.g. 'November 2026 Monthly Payroll')
- `periodMonth`: Number (1 - 12)
- `periodYear`: Number
- `startDate`: Date
- `endDate`: Date
- `paymentDate`: Date
- `payrollStatus`: String ('draft', 'calculating', 'pending_manager_approval', 'pending_finance_approval', 'pending_executive_approval', 'approved', 'disbursed', 'cancelled')
- `totalEmployees`: Number
- `financialSummary`:
    - `totalBasicSalary`: Number
    - `totalAllowances`: Number
    - `totalOvertimePay`: Number
    - `totalGrossPay`: Number
    - `totalTaxableIncome`: Number
    - `totalIncomeTax`: Number (Total PAYE)
    - `totalEmployeePension`: Number (e.g. 7%)
    - `totalEmployerPension`: Number (e.g. 11%)
    - `totalLoanDeductions`: Number
    - `totalOtherDeductions`: Number
    - `totalDeductions`: Number
    - `totalNetPay`: Number
    - `totalCompanyCost`: Number (Gross Pay + Employer Pension + Employer Benefits)
- `approvals`:
    - `preparedBy`:
        - `user`: ObjectId (ref to User)
        - `at`: Date
        - `comments`: String
    - `hrApproval`:
        - `status`: String ('pending', 'approved', 'rejected')
        - `approvedBy`: ObjectId (ref to User)
        - `approvedAt`: Date
        - `comments`: String
    - `financeApproval`:
        - `status`: String ('pending', 'approved', 'rejected')
        - `approvedBy`: ObjectId (ref to User)
        - `approvedAt`: Date
        - `comments`: String
    - `executiveApproval`:
        - `status`: String ('pending', 'approved', 'rejected')
        - `approvedBy`: ObjectId (ref to User)
        - `approvedAt`: Date
        - `comments`: String
- `disbursementDetails`:
    - `disbursedBy`: ObjectId (ref to User)
    - `disbursedAt`: Date
    - `sourceBankAccount`: String
    - `paymentReference`: String
    - `proofDocumentUrl`: String
- `notes`: String
- `createdAt`: Date
- `updatedAt`: Date

### Payslips

- `payslipNumber`: String (Unique, e.g. 'PS-2026-11-001')
- `payrollRun`: ObjectId (ref to PayrollRun)
- `employee`: ObjectId (ref to Employee)
- `employeeSnapshot`:
    - `employeeNumber`: String
    - `fullName`: String
    - `department`: String
    - `jobTitle`: String
    - `employmentType`: String ('full-time', 'part-time', 'contract', 'internship')
    - `bankAccount`:
        - `bankName`: String
        - `holderName`: String
        - `accountNumber`: String
- `attendanceSummary`:
    - `calendarDays`: Number
    - `expectedWorkingDays`: Number
    - `daysWorked`: Number
    - `paidLeaveDays`: Number
    - `unpaidLeaveDays`: Number
    - `absentDays`: Number
    - `lateArrivalPenaltyHours`: Number
- `overtimeSummary`:
    - `normalOvertimeHours`: Number
    - `normalOvertimeAmount`: Number
    - `nightOvertimeHours`: Number
    - `nightOvertimeAmount`: Number
    - `weekendOvertimeHours`: Number
    - `weekendOvertimeAmount`: Number
    - `holidayOvertimeHours`: Number
    - `holidayOvertimeAmount`: Number
    - `totalOvertimeHours`: Number
    - `totalOvertimeAmount`: Number
- `earnings`:
    - `basicSalary`: Number (Contracted)
    - `earnedBasicSalary`: Number (Pro-rated for absent/unpaid days)
    - `allowances`: []
        - `title`: String
        - `amount`: Number
        - `isTaxable`: Boolean
        - `taxableAmount`: Number
        - `exemptAmount`: Number
    - `overtimePay`: Number
    - `bonuses`: Number
    - `commissions`: Number
    - `grossEarnings`: Number
    - `taxableIncome`: Number
- `deductions`:
    - `statutoryDeductions`:
        - `incomeTax`: Number (PAYE)
        - `employeePension`: Number (e.g. 7%)
        - `employerPension`: Number (e.g. 11%)
    - `nonStatutoryDeductions`:
        - `loanRepayment`: Number
        - `salaryAdvanceDeduction`: Number
        - `attendancePenaltyDeduction`: Number
        - `costSharing`: Number
        - `unionDues`: Number
        - `disciplinaryDeductions`: Number
        - `customDeductions`: []
            - `title`: String
            - `amount`: Number
            - `reason`: String
    - `totalEmployeeDeductions`: Number
    - `totalEmployerContributions`: Number
- `netSalary`: Number (Gross Earnings - Total Employee Deductions)
- `paymentStatus`: String ('pending', 'ready', 'paid', 'hold', 'failed')
- `paymentMethod`: String ('bank_transfer', 'cash', 'cheque')
- `disbursement`:
    - `paymentDate`: Date
    - `transactionReference`: String
    - `disbursedBy`: ObjectId (ref to User)
    - `notes`: String
- `pdfUrl`: String (Link to generated payslip document)
- `sentToEmployeeAt`: Date
- `createdAt`: Date
- `updatedAt`: Date

### Salary Advances & Loans

- `loanCode`: String (Unique, e.g. 'LN-2026-001')
- `employee`: ObjectId (ref to Employee)
- `requestType`: String ('salary_advance', 'staff_loan', 'emergency_loan', 'education_loan')
- `amountRequested`: Number
- `amountApproved`: Number
- `disbursementDate`: Date
- `reason`: String
- `totalInstallments`: Number (Number of months)
- `monthlyDeductionAmount`: Number
- `deductionStartMonth`: Number (1 - 12)
- `deductionStartYear`: Number
- `remainingBalance`: Number
- `repaymentStatus`: String ('pending_approval', 'approved', 'active', 'repaid', 'suspended', 'rejected', 'written_off')
- `repaymentHistory`: []
    - `payrollRun`: ObjectId (ref to PayrollRun)
    - `payslip`: ObjectId (ref to Payslip)
    - `installmentNumber`: Number
    - `amountPaid`: Number
    - `paymentDate`: Date
    - `balanceAfterPayment`: Number
- `approvals`:
    - `managerApproval`:
        - `status`: String ('pending', 'approved', 'rejected')
        - `approvedBy`: ObjectId (ref to User)
        - `approvedAt`: Date
        - `comments`: String
    - `hrApproval`:
        - `status`: String ('pending', 'approved', 'rejected')
        - `approvedBy`: ObjectId (ref to User)
        - `approvedAt`: Date
        - `comments`: String
    - `financeApproval`:
        - `status`: String ('pending', 'approved', 'rejected')
        - `approvedBy`: ObjectId (ref to User)
        - `approvedAt`: Date
        - `comments`: String
- `disbursementReference`: String
- `createdAt`: Date
- `updatedAt`: Date
