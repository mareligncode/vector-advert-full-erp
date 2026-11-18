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

- Employee
- Associated leave balance
- Leave type
- Start date
- Start day period: Morning, Afternoon
- End date
- End day period: Morning, Afternoon
- Total leave days
- Request reason
- Supporting attachments: [string, urls]
- Request status
- Reviewer
- Review comments
- Review date

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

- Employee
- Attendance: null
- Request date
- Start time
- End time
- Total hours
- Request reason
- Advance approval required
- Request status
- Approve decisions: []
    - approver type: Manager, HR Officer
    - Decision
    - Comments

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

### Evidences

- `entityType`: String (registered model name)
- `entityId`: ObjectId (refPath to entityType)
- `entityOwner`: ObjectId (ref to User)
- `attachments`: []
    - `title`: String
    - `description`: String
    - `fileUrl`: String
    - `fileName`: String
    - `mimeType`: String
    - `fileSize`: Number
    - `uploadedBy`: ObjectId (ref to User)
    - `status`: String (pending, verified, rejected)
    - `reviewedBy`: ObjectId (ref to User)
    - `reviewedAt`: Date
    - `rejectionReason`: String
    - `createdAt`: Date
    - `updatedAt`: Date
- `notes`: []
    - `content`: String
    - `author`: ObjectId (ref to User)
    - `createdAt`: Date
    - `updatedAt`: Date
- `createdAt`: Date
- `updatedAt`: Date
