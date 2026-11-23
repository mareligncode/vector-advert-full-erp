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

# VECTOR ADVERT ERP SYSTEM
## Unified Store & Purchaser Database Schema
**Version:** 3.1 (Production-Ready Mongoose Architecture)

---

# 1. SHARED ENUMS & SYSTEM TYPES

## 1.1 Measurement Units (`UnitEnum`)
`['pcs', 'meter_square', 'roll', 'meter', 'gram', 'liter', 'set', 'pack', 'cm', 'gallon', 'box', 'sheet']`

## 1.2 Request Type (`RequestTypeEnum`)
`['office', 'workshop', 'store_replenishment']`

## 1.3 Item Type (`ItemTypeEnum`)
`['inventory', 'non_inventory', 'service']`
- `inventory`: Physical items tracked in stock balances with dual-quantity conversion and stock movements.
- `non_inventory`: Direct-expense materials (e.g. ad-hoc consumables, single-use office supplies) purchased and expensed immediately without stock balance tracking.
- `service`: Maintenance, repair, outsourced printing, or labor services.

## 1.4 General Document Status (`GeneralStatusEnum`)
`['draft', 'pending', 'approved', 'rejected', 'partially_approved', 'completed', 'cancelled']`

## 1.5 GRV Status (`GRVStatusEnum`)
`['draft', 'pending_store_acceptance', 'partially_accepted', 'accepted', 'rejected', 'cancelled']`
- When Purchaser generates GRV: status is `'pending_store_acceptance'`.
- When Storekeeper reviews:
  - If all items accepted: `'accepted'`.
  - If some items accepted and some rejected: `'partially_accepted'`.
  - If completely refused (damaged/wrong delivery): `'rejected'`.

## 1.6 Delivery Status (`DeliveryStatusEnum`)
`['fully_delivered', 'partially_delivered', 'over_delivered', 'not_delivered']`
- Accompanied by `deliveryStatusRemarks` with placeholder text: *"e.g. Delivered 8 of 10 rolls; vendor promised remaining 2 rolls by Thursday"*.

## 1.7 Stock Item Status (`StockStatusEnum`)
`['in_stock', 'low_stock', 'out_of_stock', 'overstock', 'discontinued']`

## 1.8 Approval Status (`ApprovalStatusEnum`)
`['pending', 'approved', 'rejected', 'returned_for_revision']`

## 1.9 Payment & Credit Status (`PaymentStatusEnum`)
`['unpaid', 'partially_paid', 'paid', 'overdue']`

## 1.10 Item Physical Condition (`ItemConditionEnum`)
`['new', 'good', 'damaged', 'defective', 'expired']`

## 1.11 Stock Movement Type (`StockMovementTypeEnum`)
`['grv_receipt', 'siv_issue', 'staff_return', 'supplier_return', 'transfer_in', 'transfer_out', 'adjustment_plus', 'adjustment_minus', 'waste', 'initial_balance']`

## 1.12 Stock Adjustment Type (`AdjustmentTypeEnum`)
`['damage', 'expiration', 'theft_loss', 'count_discrepancy', 'data_correction', 'revaluation']`

---

# 2. UNIT AND QUANTITY MANAGEMENT (RATIONAL ARITHMETIC)

Every physical inventory transaction operates under a strict **Dual-Quantity Tracking Architecture** using rational arithmetic:

### Mathematical Relationship:
$$\\text{multiplier} = \\frac{\\text{multiplierNumerator}}{\\text{multiplierDenominator}}$$
$$\\text{totalQuantity} = \\text{quantity} \\times \\text{multiplier}$$

### Precision & Safety Rules:
1. `multiplierNumerator` (Number, default 1) and `multiplierDenominator` (Number, default 1) store the exact rational proportion, preventing IEEE-754 binary floating-point rounding errors on fractional conversions (e.g. 1/3 roll or 0.3333...).
2. Quantities and currency amounts are stored with decimal-safe precision (using `Decimal128` or fixed-scale integer cents/thousandths in backend controllers).
3. `multiplier` and `totalQuantity` are **derived and strictly recalculated server-side**. Client-submitted totals must never be trusted without server verification.
4. **Historical Conversion Snapshot:** Every transaction line item (`GRVItem`, `StoreIssueItem`, `StaffRequestItem`, `PurchaseOrderItem`, `StockMovement`) captures a snapshot of `unit`, `baseUnit`, `multiplierNumerator`, `multiplierDenominator`, and `multiplier` at the moment of transaction. Subsequent changes to a master catalog item's default conversion ratio will never corrupt historical records.

---

# 3. SHARED & MASTER COLLECTIONS

## 3.1 Supplier
- `code`: String (unique, indexed, e.g. 'SUP-001')
- `name`: String (required, indexed)
- `contactPerson`: String
- `email`: String (lowercase, trim)
- `phone`: String (required)
- `address`:
    - `street`: String
    - `city`: String
    - `country`: String
- `tin`: String (Tax Identification Number)
- `bankName`: String
- `bankAccountName`: String
- `bankAccountNumber`: String
- `rating`: Number (1.0 to 5.0, default: 5.0)
- `totalOrders`: Number (default: 0)
- `totalValue`: Number (default: 0)
- `onTimeDeliveryRate`: Number (0-100%, default: 100)
- `qualityScore`: Number (0-100%, default: 100)
- `status`: String (enum: ['active', 'inactive', 'blacklisted'], default: 'active')
- `specialties`: [String] (e.g. ['Large Format Vinyl', 'Acrylic Sheets', 'LED Modules'])
- `paymentTerms`: String (e.g. 'Net 30', 'Cash on Delivery', '50% Advance')
- `notes`: String
- `createdAt`: Date
- `updatedAt`: Date

## 3.2 UnitOfMeasure
- `name`: String (required, unique, e.g. 'Meter Square')
- `code`: String (required, unique, enum from UnitEnum, e.g. 'meter_square')
- `symbol`: String (e.g. 'm²')
- `description`: String
- `status`: String (enum: ['active', 'inactive'], default: 'active')
- `createdAt`: Date
- `updatedAt`: Date

## 3.3 Warehouse
- `code`: String (unique, required, indexed, e.g. 'WH-MAIN')
- `name`: String (required, e.g. 'Main Central Warehouse', 'Workshop Floor Store')
- `description`: String
- `warehouseType`: String (enum: ['central', 'workshop', 'office', 'transit'], default: 'central')
- `address`: String
- `managerId`: ObjectId (ref: 'Employee')
- `status`: String (enum: ['active', 'inactive'], default: 'active')
- `createdAt`: Date
- `updatedAt`: Date

## 3.4 WarehouseLocation (Aisles / Racks / Bins)
- `warehouseId`: ObjectId (ref: 'Warehouse', required, indexed)
- `code`: String (required, indexed, e.g. 'RACK-A1', 'SHELF-03')
- `name`: String
- `description`: String
- `locationType`: String (enum: ['aisle', 'rack', 'shelf', 'bin', 'floor_area'], default: 'shelf')
- `status`: String (enum: ['active', 'inactive'], default: 'active')
- `createdAt`: Date
- `updatedAt`: Date

## 3.5 Universal Evidence & Attachment Integration
All file attachments across Store and Purchaser modules utilize the ERP's unified polymorphic **`Evidence`** model (see Section 1 `Evidences`):
- `entityType`: String (e.g. `'StockItem'`, `'GoodsReceivedVoucher'`, `'StoreIssueVoucher'`, `'StaffRequest'`, `'PurchaseRequest'`, `'PurchaseOrder'`, `'Supplier'`, `'AssetRegister'`)
- `entityId`: ObjectId (references the specific document)
- `entityOwner`: ObjectId (ref: 'User')
- `attachments`: Array of uploaded file objects (`title`, `fileUrl`, `fileName`, `mimeType`, `fileSize`, `uploadedBy`, `uploadedAt`, `status`)
- `notes`: Array of audit comments

## 3.6 ApprovalHistory (Audit Trail)
- `documentType`: String (enum: ['StaffRequest', 'PurchaseRequest', 'PurchaseOrder', 'GoodsReceivedVoucher', 'StoreIssueVoucher', 'StockTransfer', 'StockAdjustment', 'CreditPayment'], required, indexed)
- `documentId`: ObjectId (required, indexed)
- `action`: String (enum: ['submitted', 'approved', 'rejected', 'partially_approved', 'returned_for_revision', 'cancelled'], required)
- `previousStatus`: String
- `newStatus`: String (required)
- `performedBy`: ObjectId (ref: 'User', required)
- `role`: String
- `comment`: String
- `timestamp`: Date (default: Date.now)

---

# 4. STORE & INVENTORY MODULE

## 4.1 StockItem (Catalog Master Item)
The single source of truth for item definitions, SKU codes, and default conversion factors. Does not tie stock to a single warehouse.

- `code`: String (required, unique, indexed, e.g. 'STK-VIN-001')
- `name`: String (required, indexed, e.g. 'Glossy White Vinyl Roll 50m')
- `description`: String
- `category`: String (required, indexed, e.g. 'Printing Media', 'Hardware', 'Ink', 'Stationery')
- `itemType`: String (enum: ['inventory', 'non_inventory', 'service'], default: 'inventory', required)
- `unit`: String (enum from UnitEnum, required, transaction unit, e.g. 'roll')
- `baseUnit`: String (enum from UnitEnum, required, storage base unit, e.g. 'meter')
- `multiplierNumerator`: Number (required, default: 1)
- `multiplierDenominator`: Number (required, default: 1)
- `multiplier`: Number (required, default: 1)
- `reorderLevelQuantity`: Number (default: 0, in transaction units)
- `reorderLevelTotalQuantity`: Number (default: 0, in base units)
- `minimumStockQuantity`: Number (default: 0)
- `minimumStockTotalQuantity`: Number (default: 0)
- `maximumStockQuantity`: Number (default: 0)
- `maximumStockTotalQuantity`: Number (default: 0)
- `unitCost`: Number (latest purchase cost per transaction unit, default: 0)
- `averageUnitCost`: Number (moving weighted average cost per base unit, default: 0)
- `defaultWarehouseId`: ObjectId (ref: 'Warehouse')
- `supplierId`: ObjectId (ref: 'Supplier', primary/preferred vendor)
- `stockStatus`: String (enum: ['in_stock', 'low_stock', 'out_of_stock', 'overstock', 'discontinued'], default: 'out_of_stock')
- `autoRegisteredFromGRV`: Boolean (default: false, tracks if item was automatically registered by Storekeeper GRV acceptance)
- `status`: String (enum: ['active', 'inactive'], default: 'active')
- `createdAt`: Date
- `updatedAt`: Date

## 4.2 StockBalance (Per-Warehouse Real-Time Inventory Balance)
Separates warehouse location balances from the item catalog master. Supports multi-warehouse setups, branch stores, and stock transfers.

- `stockItemId`: ObjectId (ref: 'StockItem', required, indexed)
- `warehouseId`: ObjectId (ref: 'Warehouse', required, indexed)
- `locationId`: ObjectId (ref: 'WarehouseLocation', optional, indexed)
- `binLocation`: String (e.g. 'Shelf B-3, Bin 12')
- `balanceQuantity`: Number (default: 0, physical on-hand quantity in transaction unit)
- `balanceTotalQuantity`: Number (default: 0, physical on-hand quantity in base unit)
- `reservedQuantity`: Number (default: 0, allocated to approved Staff Requests awaiting SIV issue)
- `reservedTotalQuantity`: Number (default: 0, allocated in base unit)
- `availableQuantity`: Number (default: 0, calculated as balanceQuantity - reservedQuantity)
- `availableTotalQuantity`: Number (default: 0, calculated as balanceTotalQuantity - reservedTotalQuantity)
- `batchNumber`: String (optional, for lot-controlled goods)
- `lotNumber`: String (optional)
- `expiryDate`: Date (optional)
- `lastMovementDate`: Date
- `updatedAt`: Date

*(Compound unique index on `[stockItemId, warehouseId, locationId, batchNumber]`)*

## 4.3 GoodsReceivedVoucher (GRV) — Unified Purchaser & Storekeeper Lifecycle
This model resolves the dual-GRV conflict. The GRV is **generated by the Purchaser** when goods arrive from the vendor, placing it in `pending_store_acceptance` status. The **Storekeeper then inspects, accepts or rejects quantities, adds comments, and upon acceptance, the system updates stock or registers new stock items automatically**.

- `grvCode`: String (required, unique, indexed, e.g. 'GRV-2026-0001')
- `storeGrvNumber`: String (store acceptance sequence code, generated upon storekeeper confirmation, e.g. 'SGRV-2026-0001')
- `purchaseOrderId`: ObjectId (ref: 'PurchaseOrder', optional for direct un-ordered receipts)
- `supplierId`: ObjectId (ref: 'Supplier', required, indexed)
- `warehouseId`: ObjectId (ref: 'Warehouse', required, destination warehouse where goods are delivered)
- `purchaserId`: ObjectId (ref: 'User', required, purchaser who generated the GRV)
- `purchaserGeneratedDate`: Date (default: Date.now)
- `supplierInvoiceNumber`: String (required)
- `deliveryNoteNumber`: String
- `status`: String (enum: ['draft', 'pending_store_acceptance', 'partially_accepted', 'accepted', 'rejected', 'cancelled'], default: 'pending_store_acceptance', indexed)
- `deliveryStatus`: String (enum: ['fully_delivered', 'partially_delivered', 'over_delivered', 'not_delivered'], default: 'fully_delivered', required)
- `deliveryStatusRemarks`: String (Placeholder: "e.g. Delivered 8 of 10 rolls; vendor promised remaining 2 rolls by Thursday")
- `storeKeeperId`: ObjectId (ref: 'User', assigned when storekeeper inspects and accepts)
- `storeAcceptedAt`: Date
- `storeKeeperComment`: String (Placeholder: "Write store keeper inspection remarks, condition assessment, or storage instructions...")
- `items`: Array of `GRVItem`:
    - `purchaseOrderItemId`: ObjectId (links back to specific PO item)
    - `stockItemId`: ObjectId (ref: 'StockItem', optional/nullable if newly purchased item not yet in catalog)
    - `isNewItem`: Boolean (default: false, indicates item needs auto-registration into StockItem upon store acceptance)
    - `itemCode`: String (SKU code, provided or auto-generated)
    - `itemName`: String (required, e.g. 'Glossy White Vinyl Roll 50m')
    - `description`: String
    - `category`: String (required for new item registration, e.g. 'Printing Media')
    - `orderedQuantity`: Number (from PO, default: 0)
    - `orderedTotalQuantity`: Number
    - `receivedQuantity`: Number (quantity brought in by purchaser/vendor, required)
    - `receivedTotalQuantity`: Number (calculated as receivedQuantity * multiplier)
    - `acceptedQuantity`: Number (quantity accepted by storekeeper into inventory, default: 0)
    - `acceptedTotalQuantity`: Number (acceptedQuantity * multiplier)
    - `rejectedQuantity`: Number (quantity rejected by storekeeper due to defect/damage, default: 0)
    - `rejectedTotalQuantity`: Number (rejectedQuantity * multiplier)
    - `unit`: String (enum from UnitEnum, required)
    - `baseUnit`: String (enum from UnitEnum, required)
    - `multiplierNumerator`: Number (default: 1)
    - `multiplierDenominator`: Number (default: 1)
    - `multiplier`: Number (default: 1)
    - `unitCost`: Number (purchase price per transaction unit, required)
    - `totalCost`: Number (acceptedQuantity * unitCost)
    - `condition`: String (enum: ['new', 'good', 'damaged', 'defective', 'expired'], default: 'good')
    - `batchNumber`: String
    - `lotNumber`: String
    - `expiryDate`: Date
    - `targetLocationId`: ObjectId (ref: 'WarehouseLocation', shelf/rack assigned by storekeeper)
    - `binLocation`: String
    - `storeRemarks`: String (item-specific remarks by storekeeper)
- `totalItems`: Number (default: 0)
- `totalReceivedQuantity`: Number (sum of receivedQuantity)
- `totalAcceptedQuantity`: Number (sum of acceptedQuantity)
- `totalRejectedQuantity`: Number (sum of rejectedQuantity)
- `totalAmount`: Number (total monetary value of accepted items)
- `notes`: String
- `createdAt`: Date
- `updatedAt`: Date

## 4.4 StoreIssueVoucher (SIV)
Issued when storekeeper physically dispenses items against an approved `StaffRequest`.

- `sivCode`: String (required, unique, indexed, e.g. 'SIV-2026-0001')
- `staffRequestId`: ObjectId (ref: 'StaffRequest', required, indexed)
- `warehouseId`: ObjectId (ref: 'Warehouse', required, issuing warehouse)
- `issuedBy`: ObjectId (ref: 'User', storekeeper who dispenses stock)
- `receivedBy`: ObjectId (ref: 'User', employee who collects the goods)
- `issueDate`: Date (default: Date.now)
- `items`: Array of `StoreIssueItem`:
    - `staffRequestItemId`: ObjectId (required)
    - `stockItemId`: ObjectId (ref: 'StockItem', required)
    - `stockBalanceId`: ObjectId (ref: 'StockBalance')
    - `itemCode`: String
    - `itemName`: String
    - `requestedQuantity`: Number
    - `requestedTotalQuantity`: Number
    - `approvedQuantity`: Number
    - `approvedTotalQuantity`: Number
    - `issuedQuantity`: Number (required, actual quantity handed over)
    - `issuedTotalQuantity`: Number (calculated as issuedQuantity * multiplier)
    - `returnedQuantity`: Number (default: 0, tracks later returns)
    - `returnedTotalQuantity`: Number (default: 0)
    - `unit`: String (enum from UnitEnum)
    - `baseUnit`: String (enum from UnitEnum)
    - `multiplierNumerator`: Number (default: 1)
    - `multiplierDenominator`: Number (default: 1)
    - `multiplier`: Number (default: 1)
    - `unitCost`: Number (historical moving average cost at time of issuance)
    - `totalCost`: Number (issuedTotalQuantity * unitCost)
    - `batchNumber`: String
    - `notes`: String
- `totalItems`: Number
- `totalQuantity`: Number
- `totalTotalQuantity`: Number
- `status`: String (enum: ['issued', 'partially_returned', 'fully_returned', 'cancelled'], default: 'issued')
- `notes`: String
- `createdAt`: Date
- `updatedAt`: Date

## 4.5 StaffRequest (Unified Internal Requisition)
Supports both Office and Workshop material requisitions with item-level approval.

- `requestCode`: String (required, unique, indexed, e.g. 'REQ-2026-0001')
- `requestType`: String (enum: ['office', 'workshop'], required, indexed)
- `jobOrderId`: ObjectId (mandatory if requestType === 'workshop'; absent/null for 'office')
- `requestedBy`: ObjectId (ref: 'User', required, indexed)
- `departmentId`: ObjectId (ref: 'Department', required)
- `workshopId`: ObjectId (ref: 'Workshop', optional)
- `warehouseId`: ObjectId (ref: 'Warehouse', target source warehouse)
- `requestDate`: Date (default: Date.now)
- `requiredDate`: Date
- `purpose`: String (required)
- `items`: Array of `StaffRequestItem`:
    - `stockItemId`: ObjectId (ref: 'StockItem', required)
    - `itemCode`: String
    - `itemName`: String
    - `requestedQuantity`: Number (required)
    - `requestedTotalQuantity`: Number
    - `approvedQuantity`: Number (default: 0)
    - `approvedTotalQuantity`: Number (default: 0)
    - `issuedQuantity`: Number (default: 0)
    - `issuedTotalQuantity`: Number (default: 0)
    - `unit`: String (enum from UnitEnum)
    - `baseUnit`: String (enum from UnitEnum)
    - `multiplierNumerator`: Number (default: 1)
    - `multiplierDenominator`: Number (default: 1)
    - `multiplier`: Number (default: 1)
    - `purpose`: String
    - `approvalStatus`: String (enum: ['pending', 'approved', 'rejected'], default: 'pending')
    - `rejectionReason`: String
    - `notes`: String
- `totalItems`: Number
- `totalRequestedQuantity`: Number
- `totalRequestedTotalQuantity`: Number
- `totalApprovedQuantity`: Number
- `totalApprovedTotalQuantity`: Number
- `approvalStatus`: String (enum: ['pending', 'approved', 'partially_approved', 'rejected'], default: 'pending', indexed)
- `approvedBy`: ObjectId (ref: 'User')
- `approvedAt`: Date
- `issuedStatus`: String (enum: ['unissued', 'partially_issued', 'fully_issued'], default: 'unissued')
- `rejectionReason`: String
- `notes`: String
- `createdAt`: Date
- `updatedAt`: Date

## 4.6 StaffReturn (Unused Material Returned from Staff to Store)
- `returnCode`: String (unique, required, indexed, e.g. 'RET-2026-0001')
- `sivId`: ObjectId (ref: 'StoreIssueVoucher', required, indexed)
- `staffRequestId`: ObjectId (ref: 'StaffRequest', required)
- `returnedBy`: ObjectId (ref: 'User', required)
- `receivedBy`: ObjectId (ref: 'User', storekeeper who receives returned stock)
- `warehouseId`: ObjectId (ref: 'Warehouse', required)
- `returnDate`: Date (default: Date.now)
- `items`: Array of `StaffReturnItem`:
    - `stockItemId`: ObjectId (ref: 'StockItem', required)
    - `sivItemId`: ObjectId (required)
    - `returnedQuantity`: Number (required)
    - `returnedTotalQuantity`: Number
    - `acceptedQuantity`: Number (accepted back into stock, increases inventory)
    - `acceptedTotalQuantity`: Number
    - `rejectedQuantity`: Number (e.g. damaged/unusable, does not increase inventory)
    - `rejectedTotalQuantity`: Number
    - `unit`: String
    - `baseUnit`: String
    - `multiplierNumerator`: Number
    - `multiplierDenominator`: Number
    - `multiplier`: Number
    - `condition`: String (enum: ['good', 'damaged', 'defective'], default: 'good')
    - `reason`: String (e.g. 'Job completed with excess vinyl')
    - `notes`: String
- `totalQuantity`: Number
- `totalTotalQuantity`: Number
- `status`: String (enum: ['pending_review', 'accepted', 'partially_accepted', 'rejected'], default: 'accepted')
- `notes`: String
- `createdAt`: Date
- `updatedAt`: Date

## 4.7 GRVReturn (Return Defective/Excess Stock to Supplier)
- `returnCode`: String (unique, required, e.g. 'VRET-2026-0001')
- `originalGrvId`: ObjectId (ref: 'GoodsReceivedVoucher', required, indexed)
- `supplierId`: ObjectId (ref: 'Supplier', required)
- `warehouseId`: ObjectId (ref: 'Warehouse', required)
- `returnedBy`: ObjectId (ref: 'User', storekeeper/purchaser)
- `returnDate`: Date (default: Date.now)
- `reason`: String (required)
- `items`: Array of `GRVReturnItem`:
    - `stockItemId`: ObjectId (ref: 'StockItem', required)
    - `originalGrvItemId`: ObjectId (required)
    - `quantity`: Number (required)
    - `totalQuantity`: Number
    - `unit`: String
    - `baseUnit`: String
    - `multiplier`: Number
    - `unitCost`: Number
    - `totalCost`: Number
    - `reason`: String
    - `condition`: String (enum: ['damaged', 'defective', 'expired', 'wrong_specification'])
- `totalQuantity`: Number
- `totalTotalQuantity`: Number
- `totalAmount`: Number
- `status`: String (enum: ['draft', 'approved', 'dispatched', 'refund_credited'], default: 'draft')
- `approvedBy`: ObjectId (ref: 'User')
- `notes`: String
- `createdAt`: Date
- `updatedAt`: Date

## 4.8 SIVWaste (Damaged, Expired, or Scrap Stock Write-Off)
- `wasteCode`: String (unique, required, e.g. 'WST-2026-0001')
- `warehouseId`: ObjectId (ref: 'Warehouse', required)
- `reportedBy`: ObjectId (ref: 'User', required)
- `approvedBy`: ObjectId (ref: 'User')
- `wasteDate`: Date (default: Date.now)
- `reason`: String (required, e.g. 'Water leak on vinyl roll shelf')
- `items`: Array of `SIVWasteItem`:
    - `stockItemId`: ObjectId (ref: 'StockItem', required)
    - `quantity`: Number (required)
    - `totalQuantity`: Number
    - `unit`: String
    - `baseUnit`: String
    - `multiplier`: Number
    - `unitCost`: Number
    - `totalCost`: Number
    - `condition`: String (enum: ['damaged', 'expired', 'defective'])
    - `reason`: String
- `totalQuantity`: Number
- `totalTotalQuantity`: Number
- `totalCost`: Number
- `status`: String (enum: ['draft', 'approved', 'written_off'], default: 'draft')
- `createdAt`: Date
- `updatedAt`: Date

## 4.9 StockMovement (Universal Immutable Stock Audit Ledger)
Every inventory increase or decrease must record an atomic, immutable entry in this collection. Never updated or deleted.

- `movementCode`: String (required, unique, indexed, e.g. 'MOV-2026-0001')
- `stockItemId`: ObjectId (ref: 'StockItem', required, indexed)
- `warehouseId`: ObjectId (ref: 'Warehouse', required, indexed)
- `locationId`: ObjectId (ref: 'WarehouseLocation', optional, indexed)
- `movementType`: String (enum: ['grv_receipt', 'siv_issue', 'staff_return', 'supplier_return', 'transfer_in', 'transfer_out', 'adjustment_plus', 'adjustment_minus', 'waste', 'initial_balance'], required, indexed)
- `referenceType`: String (enum: ['GoodsReceivedVoucher', 'StoreIssueVoucher', 'StaffReturn', 'GRVReturn', 'StockTransfer', 'StockAdjustment', 'SIVWaste'], required, indexed)
- `referenceId`: ObjectId (refPath: 'referenceType', required, indexed)
- `quantityIn`: Number (default: 0, transaction unit)
- `quantityOut`: Number (default: 0, transaction unit)
- `totalQuantityIn`: Number (default: 0, base unit)
- `totalQuantityOut`: Number (default: 0, base unit)
- `balanceQuantityAfter`: Number (snapshot of post-movement balance in transaction unit)
- `balanceTotalQuantityAfter`: Number (snapshot of post-movement balance in base unit)
- `unit`: String (enum from UnitEnum, required)
- `baseUnit`: String (enum from UnitEnum, required)
- `multiplierNumerator`: Number (default: 1)
- `multiplierDenominator`: Number (default: 1)
- `multiplier`: Number (default: 1)
- `unitCost`: Number (cost per base unit at time of movement)
- `totalCost`: Number
- `batchNumber`: String
- `lotNumber`: String
- `expiryDate`: Date
- `performedBy`: ObjectId (ref: 'User', required)
- `movementDate`: Date (default: Date.now, indexed)
- `notes`: String
- `createdAt`: Date (default: Date.now)

## 4.10 StockTransfer (Inter-Warehouse Transfers)
- `transferCode`: String (unique, required, indexed, e.g. 'TRF-2026-0001')
- `sourceWarehouseId`: ObjectId (ref: 'Warehouse', required, indexed)
- `destinationWarehouseId`: ObjectId (ref: 'Warehouse', required, indexed)
- `requestedBy`: ObjectId (ref: 'User', required)
- `transferredBy`: ObjectId (ref: 'User')
- `receivedBy`: ObjectId (ref: 'User')
- `transferDate`: Date (default: Date.now)
- `receivedDate`: Date
- `items`: Array of `StockTransferItem`:
    - `stockItemId`: ObjectId (ref: 'StockItem', required)
    - `sentQuantity`: Number (required)
    - `sentTotalQuantity`: Number
    - `receivedQuantity`: Number (default: 0)
    - `receivedTotalQuantity`: Number (default: 0)
    - `damagedQuantity`: Number (default: 0)
    - `damagedTotalQuantity`: Number (default: 0)
    - `unit`: String
    - `baseUnit`: String
    - `multiplierNumerator`: Number
    - `multiplierDenominator`: Number
    - `multiplier`: Number
    - `notes`: String
- `totalItems`: Number
- `totalQuantity`: Number
- `totalTotalQuantity`: Number
- `status`: String (enum: ['draft', 'pending_approval', 'in_transit', 'received', 'partially_received', 'cancelled'], default: 'draft')
- `approvedBy`: ObjectId (ref: 'User')
- `notes`: String
- `createdAt`: Date
- `updatedAt`: Date

## 4.11 StockAdjustment (Discrepancy Corrections)
- `adjustmentCode`: String (unique, required, indexed, e.g. 'ADJ-2026-0001')
- `warehouseId`: ObjectId (ref: 'Warehouse', required)
- `adjustmentType`: String (enum from AdjustmentTypeEnum, required)
- `adjustmentDate`: Date (default: Date.now)
- `reason`: String (required)
- `items`: Array of `StockAdjustmentItem`:
    - `stockItemId`: ObjectId (ref: 'StockItem', required)
    - `previousQuantity`: Number (system snapshot before adjustment)
    - `previousTotalQuantity`: Number
    - `adjustedQuantity`: Number (new actual quantity in transaction unit)
    - `adjustedTotalQuantity`: Number
    - `differenceQuantity`: Number (adjustedQuantity - previousQuantity)
    - `differenceTotalQuantity`: Number
    - `unit`: String
    - `baseUnit`: String
    - `multiplier`: Number
    - `reason`: String
- `totalQuantity`: Number
- `totalTotalQuantity`: Number
- `requestedBy`: ObjectId (ref: 'User', required)
- `approvedBy`: ObjectId (ref: 'User')
- `status`: String (enum: ['draft', 'pending_approval', 'approved', 'rejected'], default: 'draft')
- `notes`: String
- `createdAt`: Date
- `updatedAt`: Date

## 4.12 StockCount (Physical Inventory Count / Audit Cycle)
- `countCode`: String (unique, required, indexed, e.g. 'CNT-2026-0001')
- `warehouseId`: ObjectId (ref: 'Warehouse', required)
- `countDate`: Date (default: Date.now)
- `countedBy`: ObjectId (ref: 'User', required)
- `approvedBy`: ObjectId (ref: 'User')
- `items`: Array of `StockCountItem`:
    - `stockItemId`: ObjectId (ref: 'StockItem', required)
    - `systemQuantity`: Number
    - `systemTotalQuantity`: Number
    - `physicalQuantity`: Number (physically counted)
    - `physicalTotalQuantity`: Number
    - `differenceQuantity`: Number (physicalQuantity - systemQuantity)
    - `differenceTotalQuantity`: Number
    - `unit`: String
    - `baseUnit`: String
    - `multiplier`: Number
    - `notes`: String
- `totalItems`: Number
- `status`: String (enum: ['in_progress', 'completed', 'reconciled', 'cancelled'], default: 'in_progress')
- `notes`: String
- `createdAt`: Date
- `updatedAt`: Date

## 4.13 AssetRegister (Fixed Assets & Machinery)
- `assetCode`: String (unique, required, indexed, e.g. 'AST-CNC-001')
- `name`: String (required, e.g. 'Roland VersaCAMM Vinyl Printer')
- `description`: String
- `category`: String (required, e.g. 'Machinery', 'Vehicles', 'IT Equipment', 'Office Furniture')
- `serialNumber`: String
- `purchaseDate`: Date
- `purchaseCost`: Number
- `supplierId`: ObjectId (ref: 'Supplier')
- `warehouseId`: ObjectId (ref: 'Warehouse')
- `locationId`: ObjectId (ref: 'WarehouseLocation')
- `assignedTo`: ObjectId (ref: 'Employee')
- `condition`: String (enum: ['new', 'good', 'fair', 'needs_repair', 'scrapped'], default: 'good')
- `status`: String (enum: ['in_use', 'maintenance', 'idle', 'disposed'], default: 'in_use')
- `warrantyExpiry`: Date
- `notes`: String
- `createdAt`: Date
- `updatedAt`: Date

## 4.14 AssetMaintenance
- `maintenanceCode`: String (unique, required, e.g. 'MNT-2026-0001')
- `assetId`: ObjectId (ref: 'AssetRegister', required, indexed)
- `maintenanceType`: String (enum: ['preventive', 'corrective', 'emergency', 'inspection'], default: 'preventive')
- `description`: String (required)
- `maintenanceDate`: Date (default: Date.now)
- `performedBy`: ObjectId (ref: 'User')
- `serviceProvider`: String (external vendor name if outsourced)
- `cost`: Number (default: 0)
- `nextMaintenanceDate`: Date
- `status`: String (enum: ['scheduled', 'in_progress', 'completed', 'cancelled'], default: 'completed')
- `notes`: String
- `createdAt`: Date
- `updatedAt`: Date

## 4.15 EndOfDayReport (Store Daily Closing Summary)
- `reportCode`: String (unique, required, e.g. 'EOD-2026-03-24')
- `warehouseId`: ObjectId (ref: 'Warehouse', required, indexed)
- `reportDate`: Date (required, indexed)
- `openingTotalQuantity`: Number
- `receivedTotalQuantity`: Number
- `issuedTotalQuantity`: Number
- `returnedTotalQuantity`: Number
- `wasteTotalQuantity`: Number
- `closingTotalQuantity`: Number
- `preparedBy`: ObjectId (ref: 'User', required)
- `approvedBy`: ObjectId (ref: 'User')
- `notes`: String
- `createdAt`: Date
- `updatedAt`: Date

---

# 5. PURCHASER & PROCUREMENT MODULE

## 5.1 PurchaseRequest (PR)
Internal requisition requesting procurement of materials, goods, or external services. Supports requesting items not yet cataloged.

- `requestCode`: String (required, unique, indexed, e.g. 'PR-2026-0001')
- `requestedBy`: ObjectId (ref: 'User', required, indexed)
- `departmentId`: ObjectId (ref: 'Department', required)
- `requestType`: String (enum: ['office', 'workshop', 'store_replenishment'], default: 'office')
- `jobOrderId`: ObjectId (if requested for a specific workshop job)
- `requestDate`: Date (default: Date.now)
- `requiredDate`: Date (required)
- `purpose`: String (required)
- `items`: Array of `PurchaseRequestItem`:
    - `stockItemId`: ObjectId (ref: 'StockItem', optional/nullable — allows ordering items not yet in catalog)
    - `isNewItem`: Boolean (default: false — true when requesting goods not currently registered in inventory)
    - `itemType`: String (enum: ['inventory', 'non_inventory', 'service'], default: 'inventory', required)
    - `itemName`: String (required, e.g. 'Reflective Honeycomb Vinyl 1.24m x 45.7m')
    - `itemDescription`: String (detailed technical specifications)
    - `category`: String (e.g. 'Printing Media', 'Electrical', 'Hardware')
    - `quantity`: Number (required)
    - `unit`: String (enum from UnitEnum, required)
    - `baseUnit`: String (enum from UnitEnum, required)
    - `multiplierNumerator`: Number (default: 1)
    - `multiplierDenominator`: Number (default: 1)
    - `multiplier`: Number (default: 1)
    - `totalQuantity`: Number (calculated as quantity * multiplier)
    - `estimatedUnitCost`: Number (default: 0)
    - `estimatedTotalCost`: Number (default: 0)
    - `preferredSupplierId`: ObjectId (ref: 'Supplier')
    - `notes`: String
- `totalItems`: Number
- `totalQuantity`: Number
- `totalTotalQuantity`: Number
- `estimatedTotalCost`: Number
- `approvalStatus`: String (enum: ['pending', 'approved', 'rejected'], default: 'pending', indexed)
- `approvedBy`: ObjectId (ref: 'User')
- `approvedAt`: Date
- `procurementStatus`: String (enum: ['unassigned', 'assigned', 'in_comparison', 'po_created', 'completed', 'cancelled'], default: 'unassigned')
- `notes`: String
- `createdAt`: Date
- `updatedAt`: Date

## 5.2 ProcurementAssignment (Task Assignment for Purchaser)
Replaces the ambiguously named `PurchaserRequest`. Represents the task dispatch to a specific Procurement Officer.

- `assignmentCode`: String (required, unique, indexed, e.g. 'ASN-2026-0001')
- `purchaseRequestId`: ObjectId (ref: 'PurchaseRequest', required, indexed)
- `assignedTo`: ObjectId (ref: 'User', required, indexed, the assigned Purchaser/Procurement Officer)
- `assignedBy`: ObjectId (ref: 'User', required, Head of Procurement / Department Head)
- `assignedDate`: Date (default: Date.now)
- `priority`: String (enum: ['low', 'medium', 'high', 'urgent'], default: 'medium')
- `status`: String (enum: ['assigned', 'in_progress', 'quoted', 'completed', 'cancelled'], default: 'assigned')
- `dueDate`: Date
- `notes`: String
- `createdAt`: Date
- `updatedAt`: Date

## 5.3 VendorPriceComparison (Quotation Comparison & Analysis)
- `comparisonCode`: String (required, unique, indexed, e.g. 'VPC-2026-0001')
- `purchaseRequestId`: ObjectId (ref: 'PurchaseRequest', required, indexed)
- `comparisonDate`: Date (default: Date.now)
- `suppliers`: [ObjectId] (ref: 'Supplier', list of compared suppliers)
- `quotes`: Array of `VendorQuote`:
    - `supplierId`: ObjectId (ref: 'Supplier', required)
    - `quoteNumber`: String (vendor quote/proforma invoice number)
    - `quoteDate`: Date
    - `validUntil`: Date
    - `subtotal`: Number
    - `taxAmount`: Number
    - `deliveryCost`: Number (default: 0)
    - `totalAmount`: Number (required)
    - `paymentTerms`: String
    - `deliveryTime`: String (e.g. '3 working days')
    - `items`: Array of `VendorQuoteItem`:
        - `purchaseRequestItemId`: ObjectId (required, links to PR item)
        - `stockItemId`: ObjectId (ref: 'StockItem', optional)
        - `itemName`: String (required)
        - `quantity`: Number (required)
        - `unit`: String
        - `baseUnit`: String
        - `multiplier`: Number
        - `totalQuantity`: Number
        - `unitPrice`: Number (required)
        - `taxRate`: Number (default: 0)
        - `taxAmount`: Number (default: 0)
        - `totalWithTax`: Number (required)
        - `availability`: String (enum: ['in_stock', 'requires_order', 'unavailable'], default: 'in_stock')
        - `deliveryTime`: String
        - `notes`: String
    - `notes`: String
- `selectedSupplierId`: ObjectId (ref: 'Supplier')
- `selectedBy`: ObjectId (ref: 'User')
- `selectionReason`: String (e.g. 'Lowest price and immediate delivery')
- `approvalStatus`: String (enum: ['pending', 'approved', 'rejected'], default: 'pending')
- `approvedBy`: ObjectId (ref: 'User')
- `notes`: String
- `createdAt`: Date
- `updatedAt`: Date

## 5.4 PurchaseOrder (PO)
Official legally binding order sent to the chosen vendor.

- `purchaseOrderCode`: String (required, unique, indexed, e.g. 'PO-2026-0001')
- `purchaseRequestId`: ObjectId (ref: 'PurchaseRequest', required, indexed)
- `comparisonId`: ObjectId (ref: 'VendorPriceComparison', optional)
- `supplierId`: ObjectId (ref: 'Supplier', required, indexed)
- `warehouseId`: ObjectId (ref: 'Warehouse', required, receiving warehouse store for the items)
- `orderDate`: Date (default: Date.now)
- `expectedDeliveryDate`: Date (required)
- `items`: Array of `PurchaseOrderItem`:
    - `purchaseRequestItemId`: ObjectId (required, links to PR item to track partial/full fulfillment)
    - `stockItemId`: ObjectId (ref: 'StockItem', optional/nullable if newly cataloged item)
    - `isNewItem`: Boolean (default: false)
    - `itemCode`: String
    - `itemName`: String (required)
    - `description`: String
    - `category`: String
    - `quantity`: Number (required, ordered quantity)
    - `unit`: String (enum from UnitEnum, required)
    - `baseUnit`: String (enum from UnitEnum, required)
    - `multiplierNumerator`: Number (default: 1)
    - `multiplierDenominator`: Number (default: 1)
    - `multiplier`: Number (default: 1)
    - `totalQuantity`: Number (quantity * multiplier)
    - `unitPrice`: Number (required)
    - `subtotal`: Number (quantity * unitPrice)
    - `taxRate`: Number (default: 0)
    - `taxAmount`: Number (default: 0)
    - `totalPrice`: Number (subtotal + taxAmount)
    - `receivedQuantity`: Number (default: 0, updated atomically when store accepts GRV)
    - `receivedTotalQuantity`: Number (default: 0)
    - `remainingQuantity`: Number (calculated as quantity - receivedQuantity)
    - `remainingTotalQuantity`: Number
    - `fulfillmentStatus`: String (enum: ['unfulfilled', 'partially_fulfilled', 'fulfilled', 'over_fulfilled'], default: 'unfulfilled')
    - `notes`: String
- `subtotal`: Number (required)
- `taxAmount`: Number (default: 0)
- `deliveryCost`: Number (default: 0)
- `discount`: Number (default: 0)
- `totalAmount`: Number (required, subtotal + taxAmount + deliveryCost - discount)
- `paymentTerms`: String (e.g. 'Credit - 30 days after GRV')
- `status`: String (enum: ['draft', 'pending_approval', 'approved', 'sent_to_supplier', 'partially_received', 'completed', 'cancelled'], default: 'draft', indexed)
- `approvalStatus`: String (enum: ['pending', 'approved', 'rejected'], default: 'pending')
- `approvedBy`: ObjectId (ref: 'User')
- `approvedAt`: Date
- `createdBy`: ObjectId (ref: 'User', required)
- `notes`: String
- `createdAt`: Date
- `updatedAt`: Date

## 5.5 PurchaserAuction & Bids (Tender / Reverse Auction)
- `auctionCode`: String (unique, required, indexed, e.g. 'AUC-2026-0001')
- `purchaseRequestId`: ObjectId (ref: 'PurchaseRequest', required)
- `auctionTitle`: String (required)
- `description`: String
- `startDate`: Date (required)
- `endDate`: Date (required)
- `items`: Array of `AuctionItem`:
    - `stockItemId`: ObjectId (ref: 'StockItem', optional)
    - `itemName`: String (required)
    - `description`: String
    - `quantity`: Number (required)
    - `unit`: String
    - `baseUnit`: String
    - `multiplier`: Number
    - `totalQuantity`: Number
    - `estimatedUnitPrice`: Number
    - `estimatedTotalPrice`: Number
    - `notes`: String
- `invitedSuppliers`: [ObjectId] (ref: 'Supplier')
- `bids`: Array of `Bid`:
    - `supplierId`: ObjectId (ref: 'Supplier', required)
    - `bidNumber`: String
    - `submissionDate`: Date (default: Date.now)
    - `subtotal`: Number
    - `taxAmount`: Number
    - `deliveryCost`: Number
    - `totalAmount`: Number (required)
    - `deliveryTime`: String
    - `paymentTerms`: String
    - `status`: String (enum: ['submitted', 'shortlisted', 'accepted', 'rejected'], default: 'submitted')
    - `items`: Array of `BidItem`:
        - `auctionItemId`: ObjectId (required)
        - `quantity`: Number
        - `unitPrice`: Number
        - `totalPrice`: Number
        - `taxRate`: Number
        - `taxAmount`: Number
        - `notes`: String
- `status`: String (enum: ['draft', 'open', 'closed', 'awarded', 'cancelled'], default: 'draft')
- `createdBy`: ObjectId (ref: 'User')
- `approvedBy`: ObjectId (ref: 'User')
- `notes`: String
- `createdAt`: Date
- `updatedAt`: Date

---

# 6. CREDIT AND PAYMENT MANAGEMENT (FINANCE INTEGRATION)

## 6.1 CreditTransaction (Vendor Payable Ledger)
Created upon Storekeeper acceptance of `GoodsReceivedVoucher` when purchasing on credit terms.

- `transactionCode`: String (required, unique, indexed, e.g. 'CTX-2026-0001')
- `supplierId`: ObjectId (ref: 'Supplier', required, indexed)
- `purchaseOrderId`: ObjectId (ref: 'PurchaseOrder', required, indexed)
- `grvId`: ObjectId (ref: 'GoodsReceivedVoucher', required, indexed)
- `transactionType`: String (enum: ['invoice_credit', 'payment_debit', 'credit_note_debit', 'debit_note_credit'], required)
- `transactionDate`: Date (default: Date.now)
- `dueDate`: Date (credit maturity date)
- `description`: String
- `debitAmount`: Number (default: 0, payments or returns reducing balance)
- `creditAmount`: Number (default: 0, new bill from accepted GRV)
- `balance`: Number (remaining payable balance on this invoice)
- `paymentStatus`: String (enum: ['unpaid', 'partially_paid', 'paid', 'overdue'], default: 'unpaid', indexed)
- `createdBy`: ObjectId (ref: 'User', required)
- `notes`: String
- `createdAt`: Date
- `updatedAt`: Date

## 6.2 CreditPayment (Payment Execution to Supplier)
- `paymentCode`: String (required, unique, indexed, e.g. 'PAY-2026-0001')
- `creditTransactionId`: ObjectId (ref: 'CreditTransaction', required, indexed)
- `supplierId`: ObjectId (ref: 'Supplier', required, indexed)
- `paymentDate`: Date (default: Date.now)
- `amount`: Number (required, payment amount)
- `paymentMethod`: String (enum: ['bank_transfer', 'cheque', 'cash', 'credit_card'], required)
- `referenceNumber`: String (e.g. Bank transfer transaction ID or cheque number)
- `bankName`: String
- `recordedBy`: ObjectId (ref: 'User', required)
- `approvedBy`: ObjectId (ref: 'User')
- `status`: String (enum: ['pending_clearance', 'completed', 'bounced', 'void'], default: 'completed')
- `notes`: String
- `createdAt`: Date
- `updatedAt`: Date

---

# 7. TAX CONFIGURATION

## 7.1 TaxConfiguration
- `name`: String (required, e.g. 'Standard VAT')
- `code`: String (required, unique, e.g. 'VAT-15')
- `rate`: Number (required, percentage, e.g. 15.0)
- `description`: String
- `effectiveFrom`: Date (required)
- `effectiveUntil`: Date
- `isDefault`: Boolean (default: false)
- `status`: String (enum: ['active', 'inactive'], default: 'active')
- `createdAt`: Date
- `updatedAt`: Date

---

# 8. CORE RELATIONSHIPS & DATA FLOW

```
[PurchaseRequest (PR)] 
       │ (1 to 1)
       ▼
[ProcurementAssignment] (Assigned to Purchaser)
       │ (1 to 1)
       ▼
[VendorPriceComparison] (Compares multiple Vendor Quotes)
       │ (1 to 1)
       ▼
[PurchaseOrder (PO)] (Approved & Sent to Vendor)
       │ (1 to N)
       ▼
[GoodsReceivedVoucher (GRV)]
       ├── (Step 1: Purchaser generates upon delivery, status: 'pending_store_acceptance')
       └── (Step 2: Storekeeper inspects, writes comment, accepts/rejects, status: 'accepted')
             │
             ├── If New Item: Auto-registers new [StockItem] in catalog
             ├── Updates [StockBalance] for target Warehouse/Location
             ├── Updates Moving Weighted Average Cost (MAC) on [StockItem]
             ├── Emits immutable audit log in [StockMovement]
             ├── Updates PO Item received & remaining quantities
             └── Automatically generates [CreditTransaction] payable in Finance
```

---

# 9. CRITICAL BUSINESS RULES FOR THE BACKEND

## 9.1 The GRV Two-Phase Lifecycle: Purchaser Generation $\\rightarrow$ Storekeeper Acceptance
1. **Purchaser Step (Draft to Pending Acceptance):**
   - When goods arrive from the vendor against a PO, the Purchaser creates the `GoodsReceivedVoucher` (GRV).
   - The purchaser inputs `receivedQuantity`, `supplierInvoiceNumber`, `deliveryNoteNumber`, and initial `deliveryStatus` (`'fully_delivered'` or `'partially_delivered'`).
   - The GRV is saved with `status = 'pending_store_acceptance'`.
   - **Crucial Rule:** At this stage, **no stock balances are touched**, and **no StockMovement records are created**. Physical stock remains uncommitted.
2. **Storekeeper Step (Inspection, Acceptance & Stock Upsert):**
   - The Storekeeper receives the GRV in their dashboard under "Pending Incoming Goods".
   - Storekeeper physically inspects items and records:
     - `acceptedQuantity` (quantities meeting quality standards)
     - `rejectedQuantity` (damaged, expired, or defective items)
     - `condition` (`new`, `good`, `damaged`, `defective`, `expired`)
     - `storeKeeperComment`: **Mandatory or encouraged inspection notes / comments** (Placeholder: *"Write store keeper inspection remarks, condition assessment, or storage instructions..."*).
     - `deliveryStatus`: Verified final status (`'fully_delivered'`, `'partially_delivered'`, `'over_delivered'`, `'not_delivered'`) with placeholder: *"e.g. Delivered 8 of 10 rolls; vendor promised remaining 2 rolls by Thursday"*.
     - `storeGrvNumber`: An official Store Acceptance sequence number generated for store records.
3. **Automated Stock Upsert Logic Upon Acceptance:**
   Inside an atomic database transaction:
   - For each accepted item in the GRV:
     - **If item exists in `StockItem` catalog:** 
       - Update existing `StockBalance` for the target `warehouseId` (or create a `StockBalance` record for this warehouse if it's the item's first time in this specific warehouse):
         $$\\text{balanceQuantity} += \\text{item.acceptedQuantity}$$
         $$\\text{balanceTotalQuantity} += \\text{item.acceptedTotalQuantity}$$
         $$\\text{availableQuantity} += \\text{item.acceptedQuantity}$$
         $$\\text{availableTotalQuantity} += \\text{item.acceptedTotalQuantity}$$
       - Recalculate `StockItem.averageUnitCost` using the Moving Weighted Average formula.
     - **If item does NOT exist (`isNewItem === true` or non-existent SKU):**
       - Automatically register a new `StockItem` catalog master record:
         - `code`: Item SKU/Code
         - `name`: `item.itemName`
         - `category`: `item.category`
         - `unit`: `item.unit`
         - `baseUnit`: `item.baseUnit`
         - `multiplierNumerator`: `item.multiplierNumerator`
         - `multiplierDenominator`: `item.multiplierDenominator`
         - `multiplier`: `item.multiplier`
         - `unitCost`: `item.unitCost`
         - `averageUnitCost`: `item.unitCost / item.multiplier`
         - `autoRegisteredFromGRV`: `true`
       - Create the initial `StockBalance` record for the target warehouse.
     - Create an immutable `StockMovement` ledger entry:
       - `movementType = 'grv_receipt'`
       - `referenceType = 'GoodsReceivedVoucher'`, `referenceId = grv._id`
       - `quantityIn = item.acceptedQuantity`, `totalQuantityIn = item.acceptedTotalQuantity`
   - Update `PurchaseOrder.items`:
     - Increment `receivedQuantity` and `receivedTotalQuantity`.
     - Recalculate `remainingQuantity` and `fulfillmentStatus`.
   - If payment terms are on credit, create a `CreditTransaction` record for Finance.

## 9.2 Inventory Costing: Moving Weighted Average Cost (MAC)
When a GRV item is accepted, the inventory service must update the item's moving weighted average cost per base unit:

$$\\text{New Average Cost} = \\frac{(\\text{Current Total Base Qty} \\times \\text{Current Avg Cost}) + (\\text{Accepted Base Qty} \\times \\text{Incoming Unit Cost per Base Unit})}{\\text{Current Total Base Qty} + \\text{Accepted Base Qty}}$$

When issuing stock on a `StoreIssueVoucher`, the system **freezes** the current `averageUnitCost` on the issue line item. Historical issues are never retroactively recalculated.

## 9.3 Stock Reservation vs Physical Issuance
To avoid stockouts and double-allocation:
1. When a `StaffRequest` is **Approved**:
   - Do **NOT** decrease physical `balanceQuantity`.
   - Increase `reservedQuantity`:
     $$\\text{reservedQuantity} += \\text{approvedQuantity}$$
     $$\\text{availableQuantity} = \\text{balanceQuantity} - \\text{reservedQuantity}$$
2. When the Storekeeper generates and issues the **StoreIssueVoucher (SIV)**:
   - Decrease `reservedQuantity`:
     $$\\text{reservedQuantity} -= \\text{issuedQuantity}$$
   - Decrease physical `balanceQuantity`:
     $$\\text{balanceQuantity} -= \\text{issuedQuantity}$$
   - Recalculate `availableQuantity`.
   - Emit `StockMovement` with `movementType = 'siv_issue'`.
3. If an approved request is **Cancelled**:
   - Release the reservation:
     $$\\text{reservedQuantity} -= \\text{approvedQuantity}$$
     $$\\text{availableQuantity} = \\text{balanceQuantity} - \\text{reservedQuantity}$$

## 9.4 Office vs Workshop Requisition Workflow
1. **Office Requisition (`requestType = 'office'`):**
   - Used for stationery, office consumables, general cleaning supplies.
   - `jobOrderId` is not required and must remain `null` or omitted.
2. **Workshop Requisition (`requestType = 'workshop'`):**
   - Used for raw materials (vinyl, acrylic, metal frames, LED drivers) for client advertising jobs.
   - `jobOrderId` is **mandatory**.
   - Enables exact job-costing and margin tracking by tying all issued material costs directly to the job order.

## 9.5 Universal Evidence Polymorphic Attachment Integration
Instead of isolated attachment tables, all documents across Store and Purchaser (`StockItem`, `GoodsReceivedVoucher`, `StoreIssueVoucher`, `StaffRequest`, `PurchaseRequest`, `PurchaseOrder`, `Supplier`, `AssetRegister`) utilize the unified `Evidence` model:
- `entityType`: Document model name (e.g. `'GoodsReceivedVoucher'`)
- `entityId`: Document `_id`
- File uploads directly append to the `attachments` array.

## 9.6 Concurrency and Database Transactions
All stock balance modifications, movement recordings, and PO status updates must execute inside a MongoDB session transaction (`session.startTransaction()`). If any item update fails (e.g. insufficient available stock during SIV issue), the entire operation rolls back.

---

# 10. INDEXING & PERFORMANCE ARCHITECTURE

### Unique Indexes:
- `StockItem.code`
- `Supplier.code`
- `Warehouse.code`
- `GoodsReceivedVoucher.grvCode`
- `GoodsReceivedVoucher.storeGrvNumber` (sparse)
- `StoreIssueVoucher.sivCode`
- `StaffRequest.requestCode`
- `PurchaseRequest.requestCode`
- `ProcurementAssignment.assignmentCode`
- `PurchaseOrder.purchaseOrderCode`
- `StockMovement.movementCode`
- `StockTransfer.transferCode`
- `StockAdjustment.adjustmentCode`
- `StockCount.countCode`
- `CreditTransaction.transactionCode`
- `CreditPayment.paymentCode`

### Performance Compound Indexes:
- `StockBalance`: `[stockItemId, warehouseId]` (unique), `[warehouseId, availableQuantity]`
- `StockMovement`: `[stockItemId, warehouseId, movementDate]`, `[referenceType, referenceId]`
- `GoodsReceivedVoucher`: `[status, warehouseId]`, `[purchaseOrderId, status]`
- `StoreIssueVoucher`: `[staffRequestId, warehouseId]`
- `StaffRequest`: `[requestType, jobOrderId]`, `[requestedBy, approvalStatus]`
- `PurchaseRequest`: `[requestedBy, approvalStatus]`, `[procurementStatus]`
- `PurchaseOrder`: `[supplierId, status]`, `[warehouseId, status]`
- `CreditTransaction`: `[supplierId, paymentStatus]`, `[dueDate, paymentStatus]`
- `ApprovalHistory`: `[documentType, documentId, timestamp]`

---

**End of Schema Version 3.1**
