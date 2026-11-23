import api from './api';

// ============================================================================
// 1. EMPLOYEES SERVICE
// ============================================================================
export const employeeService = {
  getEmployees: async (params = {}) => {
    const res = await api.get('/employees', { params });
    return res.data;
  },

  getMeEmployee: async () => {
    const res = await api.get('/employees/me');
    return res.data;
  },

  getEmployeeById: async (id) => {
    const res = await api.get(`/employees/${id}`);
    return res.data;
  },

  createEmployee: async (data) => {
    const res = await api.post('/employees', data);
    return res.data;
  },

  updateEmployee: async (id, data) => {
    const res = await api.put(`/employees/${id}`, data);
    return res.data;
  },

  updateEmploymentStatus: async (id, status, notes) => {
    const res = await api.patch(`/employees/${id}/status`, { status, notes });
    return res.data;
  },

  deleteEmployee: async (id) => {
    const res = await api.delete(`/employees/${id}`);
    return res.data;
  },

  uploadProfilePhoto: async (id, file) => {
    const formData = new FormData();
    formData.append('photo', file);
    const res = await api.post(`/employees/${id}/profile-photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  removeProfilePhoto: async (id) => {
    const res = await api.delete(`/employees/${id}/profile-photo`);
    return res.data;
  },

  uploadNationalIdPhotos: async (id, frontImageFile, backImageFile) => {
    const formData = new FormData();
    if (frontImageFile) formData.append('frontImage', frontImageFile);
    if (backImageFile) formData.append('backImage', backImageFile);
    const res = await api.post(`/employees/${id}/national-id/photos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  approveNationalId: async (id, status = 'approved', rejectionReason = '') => {
    const res = await api.patch(`/employees/${id}/national-id/approve`, { status, rejectionReason });
    return res.data;
  },

  approveGuarantorNationalId: async (employeeId, guarantorId, status = 'approved', rejectionReason = '') => {
    const res = await api.patch(`/employees/${employeeId}/guarantors/${guarantorId}/national-id/approve`, { status, rejectionReason });
    return res.data;
  },

  addDocument: async (id, file, title, type) => {
    const formData = new FormData();
    formData.append('file', file);
    if (title) formData.append('title', title);
    if (type) formData.append('type', type);
    const res = await api.post(`/employees/${id}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  removeDocument: async (id, documentId) => {
    const res = await api.delete(`/employees/${id}/documents/${documentId}`);
    return res.data;
  },

  approveDocument: async (id, documentId, status = 'approved', rejectionReason = '') => {
    const res = await api.patch(`/employees/${id}/documents/${documentId}/approve`, { status, rejectionReason });
    return res.data;
  },

  createAndLinkUserAccount: async (id, payload) => {
    const res = await api.post(`/employees/${id}/create-user`, payload);
    return res.data;
  },

  linkUserAccount: async (id, userId) => {
    const res = await api.post(`/employees/${id}/link-user`, { userId });
    return res.data;
  },

  unlinkUserAccount: async (id) => {
    const res = await api.post(`/employees/${id}/unlink-user`);
    return res.data;
  }
};

// ============================================================================
// 2. ATTENDANCE SERVICE
// ============================================================================
export const attendanceService = {
  getConfig: async () => {
    const res = await api.get('/attendance/config');
    return res.data;
  },

  updateConfig: async (configData) => {
    const res = await api.put('/attendance/config', configData);
    return res.data;
  },

  checkIn: async (formData) => {
    const res = await api.post('/attendance/check-in', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  checkOut: async (formData) => {
    const res = await api.post('/attendance/check-out', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  getTodayAttendance: async () => {
    const res = await api.get('/attendance/today');
    return res.data;
  },

  getMyAttendance: async (params = {}) => {
    const res = await api.get('/attendance/me', { params });
    return res.data;
  },

  getSummary: async (params = {}) => {
    const res = await api.get('/attendance/summary', { params });
    return res.data;
  },

  getAllAttendance: async (params = {}) => {
    const res = await api.get('/attendance', { params });
    return res.data;
  },

  manualUpdate: async (id, data) => {
    const res = await api.put(`/attendance/${id}`, data);
    return res.data;
  }
};

// ============================================================================
// 3. LEAVE SERVICE
// ============================================================================
export const leaveService = {
  getMyBalance: async () => {
    const res = await api.get('/leave/balances/me');
    return res.data;
  },

  getAllBalances: async (params = {}) => {
    const res = await api.get('/leave/balances', { params });
    return res.data;
  },

  getEmployeeBalances: async (employeeId) => {
    const res = await api.get(`/leave/balances/employee/${employeeId}`);
    return res.data;
  },

  initializeYearBalances: async (year) => {
    const res = await api.post('/leave/balances/initialize', { year });
    return res.data;
  },

  adjustBalance: async (id, adjustments) => {
    const res = await api.put(`/leave/balances/${id}`, adjustments);
    return res.data;
  },

  createRequest: async (data) => {
    const res = await api.post('/leave/requests', data);
    return res.data;
  },

  getMyRequests: async (params = {}) => {
    const res = await api.get('/leave/requests/me', { params });
    return res.data;
  },

  getAllRequests: async (params = {}) => {
    const res = await api.get('/leave/requests', { params });
    return res.data;
  },

  getRequestById: async (id) => {
    const res = await api.get(`/leave/requests/${id}`);
    return res.data;
  },

  reviewRequest: async (id, action, comments) => {
    const res = await api.patch(`/leave/requests/${id}/review`, { action, comments });
    return res.data;
  },

  cancelRequest: async (id) => {
    const res = await api.post(`/leave/requests/${id}/cancel`);
    return res.data;
  }
};

// ============================================================================
// 4. OVERTIME SERVICE
// ============================================================================
export const overtimeService = {
  createRequest: async (data) => {
    const res = await api.post('/overtime', data);
    return res.data;
  },

  getMyRequests: async (params = {}) => {
    const res = await api.get('/overtime/me', { params });
    return res.data;
  },

  getAllRequests: async (params = {}) => {
    const res = await api.get('/overtime', { params });
    return res.data;
  },

  getRequestById: async (id) => {
    const res = await api.get(`/overtime/${id}`);
    return res.data;
  },

  decideRequest: async (id, decision, comments) => {
    const res = await api.patch(`/overtime/${id}/decision`, { decision, comments });
    return res.data;
  }
};

// ============================================================================
// 5. FIELD VISITS SERVICE
// ============================================================================
export const fieldVisitService = {
  createVisit: async (data) => {
    const res = await api.post('/field-visits', data);
    return res.data;
  },

  getVisits: async (params = {}) => {
    const res = await api.get('/field-visits', { params });
    return res.data;
  },

  getMyVisits: async () => {
    const res = await api.get('/field-visits/me');
    return res.data;
  },

  getVisitById: async (id) => {
    const res = await api.get(`/field-visits/${id}`);
    return res.data;
  },

  updateVisit: async (id, data) => {
    const res = await api.patch(`/field-visits/${id}`, data);
    return res.data;
  },

  checkInVisit: async (id, formData) => {
    const res = await api.post(`/field-visits/${id}/check-in`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  }
};

// ============================================================================
// 6. RECRUITMENT SERVICE
// ============================================================================
export const recruitmentService = {
  getJobPostings: async (params = {}) => {
    const res = await api.get('/recruitment/jobs', { params });
    return res.data;
  },

  getJobPostingById: async (id) => {
    const res = await api.get(`/recruitment/jobs/${id}`);
    return res.data;
  },

  createJobPosting: async (data) => {
    const res = await api.post('/recruitment/jobs', data);
    return res.data;
  },

  updateJobPosting: async (id, data) => {
    const res = await api.put(`/recruitment/jobs/${id}`, data);
    return res.data;
  },

  updateJobPostingStatus: async (id, postingStatus) => {
    const res = await api.patch(`/recruitment/jobs/${id}/status`, { postingStatus });
    return res.data;
  },

  deleteJobPosting: async (id) => {
    const res = await api.delete(`/recruitment/jobs/${id}`);
    return res.data;
  },

  getJobApplications: async (params = {}) => {
    const res = await api.get('/recruitment/applications', { params });
    return res.data;
  },

  getJobApplicationById: async (id) => {
    const res = await api.get(`/recruitment/applications/${id}`);
    return res.data;
  },

  updateApplicationStatus: async (id, applicationStatus, rating, notes) => {
    const res = await api.patch(`/recruitment/applications/${id}/status`, {
      applicationStatus,
      rating,
      notes
    });
    return res.data;
  },

  convertToEmployee: async (id, employeeData = {}) => {
    const res = await api.post(`/recruitment/applications/${id}/convert-to-employee`, employeeData);
    return res.data;
  },

  scheduleInterview: async (applicationId, data) => {
    const res = await api.post(`/recruitment/applications/${applicationId}/interviews`, data);
    return res.data;
  },

  submitInterviewFeedback: async (applicationId, interviewId, feedbackData) => {
    const res = await api.patch(
      `/recruitment/applications/${applicationId}/interviews/${interviewId}/feedback`,
      feedbackData
    );
    return res.data;
  }
};

// ============================================================================
// 7. INTERNSHIPS SERVICE
// ============================================================================
export const internshipService = {
  getInternships: async (params = {}) => {
    const res = await api.get('/internships', { params });
    return res.data;
  },

  getInternshipById: async (id) => {
    const res = await api.get(`/internships/${id}`);
    return res.data;
  },

  createInternship: async (data) => {
    const res = await api.post('/internships', data);
    return res.data;
  },

  updateInternship: async (id, data) => {
    const res = await api.put(`/internships/${id}`, data);
    return res.data;
  },

  updateStatus: async (id, status) => {
    const res = await api.patch(`/internships/${id}/status`, { status });
    return res.data;
  },

  addEvaluation: async (id, evaluation) => {
    const res = await api.post(`/internships/${id}/evaluations`, evaluation);
    return res.data;
  },

  convertToEmployee: async (id, payload = {}) => {
    const res = await api.post(`/internships/${id}/convert-to-employee`, payload);
    return res.data;
  },

  deleteInternship: async (id) => {
    const res = await api.delete(`/internships/${id}`);
    return res.data;
  }
};

// ============================================================================
// 8. PAYROLL SERVICE
// ============================================================================
export const payrollService = {
  getAnalytics: async () => {
    const res = await api.get('/payroll/analytics/summary');
    return res.data;
  },

  getConfig: async () => {
    const res = await api.get('/payroll/config');
    return res.data;
  },

  updateConfig: async (configData) => {
    const res = await api.put('/payroll/config', configData);
    return res.data;
  },

  getStructures: async (params = {}) => {
    const res = await api.get('/payroll/structures', { params });
    return res.data;
  },

  getEmployeeStructure: async (employeeId) => {
    const res = await api.get(`/payroll/structures/employee/${employeeId}`);
    return res.data;
  },

  upsertStructure: async (data) => {
    const res = await api.post('/payroll/structures', data);
    return res.data;
  },

  getRuns: async (params = {}) => {
    const res = await api.get('/payroll/runs', { params });
    return res.data;
  },

  getRunById: async (id) => {
    const res = await api.get(`/payroll/runs/${id}`);
    return res.data;
  },

  generateRun: async (data) => {
    const res = await api.post('/payroll/runs/generate', data);
    return res.data;
  },

  recalculateRun: async (id) => {
    const res = await api.post(`/payroll/runs/${id}/recalculate`);
    return res.data;
  },

  approveRunStage: async (id, stage, comments) => {
    const res = await api.post(`/payroll/runs/${id}/approve`, { stage, comments });
    return res.data;
  },

  disburseRun: async (id, disbursementDetails) => {
    const res = await api.post(`/payroll/runs/${id}/disburse`, disbursementDetails);
    return res.data;
  },

  cancelRun: async (id) => {
    const res = await api.delete(`/payroll/runs/${id}`);
    return res.data;
  },

  getPayslips: async (params = {}) => {
    const res = await api.get('/payroll/payslips', { params });
    return res.data;
  },

  getMyPayslips: async () => {
    const res = await api.get('/payroll/payslips/my-payslips');
    return res.data;
  },

  getPayslipById: async (id) => {
    const res = await api.get(`/payroll/payslips/${id}`);
    return res.data;
  },

  getPayslipHtmlUrl: (id) => `/api/payroll/payslips/${id}/html`,

  getLoans: async (params = {}) => {
    const res = await api.get('/payroll/loans', { params });
    return res.data;
  },

  getMyLoans: async () => {
    const res = await api.get('/payroll/loans/my-loans');
    return res.data;
  },

  applyForLoan: async (data) => {
    const res = await api.post('/payroll/loans', data);
    return res.data;
  },

  approveLoanStage: async (id, stage, decision, comments) => {
    const res = await api.post(`/payroll/loans/${id}/approve`, { stage, decision, comments });
    return res.data;
  },

  disburseLoan: async (id, reference) => {
    const res = await api.post(`/payroll/loans/${id}/disburse`, { reference });
    return res.data;
  }
};

// ============================================================================
// 9. CLEARANCE SERVICE
// ============================================================================
export const clearanceService = {
  getClearances: async (params = {}) => {
    const res = await api.get('/clearances', { params });
    return res.data;
  },

  getMyClearance: async () => {
    const res = await api.get('/clearances/me');
    return res.data;
  },

  getClearanceById: async (id) => {
    const res = await api.get(`/clearances/${id}`);
    return res.data;
  },

  initiateClearance: async (data) => {
    const res = await api.post('/clearances', data);
    return res.data;
  },

  updateDepartmentClearance: async (id, department, status, note) => {
    const res = await api.patch(`/clearances/${id}/department/${department}`, { status, note });
    return res.data;
  },

  finalizeClearance: async (id, certificateFile) => {
    const formData = new FormData();
    if (certificateFile) formData.append('certificate', certificateFile);
    const res = await api.post(`/clearances/${id}/finalize`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  }
};

// ============================================================================
// 10. TRAINING SERVICE
// ============================================================================
export const trainingService = {
  getTrainings: async (params = {}) => {
    const res = await api.get('/trainings', { params });
    return res.data;
  },

  getMyTrainings: async () => {
    const res = await api.get('/trainings/my-trainings');
    return res.data;
  },

  getTrainingById: async (id) => {
    const res = await api.get(`/trainings/${id}`);
    return res.data;
  },

  createTraining: async (data) => {
    const res = await api.post('/trainings', data);
    return res.data;
  },

  updateTraining: async (id, data) => {
    const res = await api.patch(`/trainings/${id}`, data);
    return res.data;
  },

  addParticipant: async (id, participantData) => {
    const res = await api.post(`/trainings/${id}/participants`, participantData);
    return res.data;
  },

  updateParticipant: async (id, participantId, updateData) => {
    const res = await api.patch(`/trainings/${id}/participants/${participantId}`, updateData);
    return res.data;
  }
};

// ============================================================================
// 11. PROFESSIONAL UPGRADES SERVICE
// ============================================================================
export const professionalUpgradeService = {
  getUpgrades: async (params = {}) => {
    const res = await api.get('/professional-upgrades', { params });
    return res.data;
  },

  getMyUpgrades: async () => {
    const res = await api.get('/professional-upgrades/me');
    return res.data;
  },

  getUpgradeById: async (id) => {
    const res = await api.get(`/professional-upgrades/${id}`);
    return res.data;
  },

  createUpgrade: async (data) => {
    const res = await api.post('/professional-upgrades', data);
    return res.data;
  },

  reviewUpgrade: async (id, status, notes) => {
    const res = await api.patch(`/professional-upgrades/${id}/review`, { status, notes });
    return res.data;
  }
};

// ============================================================================
// 12. PLANS SERVICE
// ============================================================================
export const planService = {
  getPlans: async (params = {}) => {
    const res = await api.get('/plans', { params });
    return res.data;
  },

  getPlanById: async (id) => {
    const res = await api.get(`/plans/${id}`);
    return res.data;
  },

  createPlan: async (data) => {
    const res = await api.post('/plans', data);
    return res.data;
  },

  updatePlan: async (id, data) => {
    const res = await api.patch(`/plans/${id}`, data);
    return res.data;
  },

  updateApproval: async (id, approvalStatus, comments) => {
    const res = await api.patch(`/plans/${id}/approval`, { approvalStatus, comments });
    return res.data;
  },

  addTask: async (id, taskData) => {
    const res = await api.post(`/plans/${id}/tasks`, taskData);
    return res.data;
  },

  updateTask: async (id, taskId, taskData) => {
    const res = await api.patch(`/plans/${id}/tasks/${taskId}`, taskData);
    return res.data;
  }
};

// ============================================================================
// 13. EVIDENCE & ATTACHMENT SERVICE
// ============================================================================
export const evidenceService = {
  getByEntity: async (entityType, entityId) => {
    const res = await api.get(`/evidence/${entityType}/${entityId}`);
    return res.data;
  },

  addAttachment: async (entityType, entityId, files, metadata = {}) => {
    const formData = new FormData();
    if (Array.isArray(files)) {
      files.forEach((file) => formData.append('files', file));
    } else if (files) {
      formData.append('file', files);
    }
    Object.keys(metadata).forEach((key) => {
      formData.append(key, metadata[key]);
    });
    const res = await api.post(`/evidence/${entityType}/${entityId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  reviewAttachment: async (entityType, entityId, attachmentId, status, rejectionReason) => {
    const res = await api.patch(
      `/evidence/${entityType}/${entityId}/attachments/${attachmentId}/review`,
      { status, rejectionReason }
    );
    return res.data;
  },

  deleteAttachment: async (entityType, entityId, attachmentId) => {
    const res = await api.delete(`/evidence/${entityType}/${entityId}/attachments/${attachmentId}`);
    return res.data;
  },

  addNote: async (entityType, entityId, content) => {
    const res = await api.post(`/evidence/${entityType}/${entityId}/notes`, { content });
    return res.data;
  },

  deleteNote: async (entityType, entityId, noteId) => {
    const res = await api.delete(`/evidence/${entityType}/${entityId}/notes/${noteId}`);
    return res.data;
  }
};
