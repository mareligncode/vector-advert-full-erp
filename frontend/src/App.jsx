import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { SidebarProvider } from './context/SidebarContext';
import Navbar from './components/Navbar';
import Sidebar, { ERP_MODULES } from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import ChangePassword from './pages/auth/ChangePassword';
import Dashboard from './pages/Dashboard';

// Enterprise Modules Placeholder
import ModulePlaceholder from './pages/modules/ModulePlaceholder';

// HR Subsystem Pages
import HRLayout from './pages/hr/HRLayout';
import HRDashboard from './pages/hr/HRDashboard';
import EmployeeList from './pages/hr/employees/EmployeeList';
import AttendancePunch from './pages/hr/attendance/AttendancePunch';
import LeaveDashboard from './pages/hr/leave/LeaveDashboard';
import OvertimeList from './pages/hr/overtime/OvertimeList';
import FieldVisitList from './pages/hr/field-visits/FieldVisitList';
import JobPostingsList from './pages/hr/recruitment/JobPostingsList';
import InternshipList from './pages/hr/internships/InternshipList';
import PayrollDashboard from './pages/hr/payroll/PayrollDashboard';
import ClearanceList from './pages/hr/clearance/ClearanceList';
import TrainingList from './pages/hr/training/TrainingList';
import ProfessionalUpgradeList from './pages/hr/professional-upgrades/ProfessionalUpgradeList';
import PlanList from './pages/hr/plans/PlanList';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SidebarProvider>
          <BrowserRouter>
            <div className="min-h-screen flex flex-col transition-colors duration-200 overflow-x-hidden w-full max-w-[100vw] bg-slate-50 dark:bg-[#070b12]">
              <Navbar />
              <div className="flex-1 flex w-full min-h-0 relative">
                <Sidebar />
                <main className="flex-1 min-w-0 flex flex-col overflow-x-hidden">
                  <Routes>
                    {/* Public Auth Routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />

                    {/* Forced password change route for users with temporary password */}
                    <Route
                      path="/change-password"
                      element={
                        <ProtectedRoute>
                          <ChangePassword />
                        </ProtectedRoute>
                      }
                    />

                    {/* Executive / HR User Registration Portal (Only authorized roles) */}
                    <Route
                      path="/register"
                      element={
                        <ProtectedRoute>
                          <Register />
                        </ProtectedRoute>
                      }
                    />

                    {/* Protected Dashboard Route */}
                    <Route
                      path="/dashboard"
                      element={
                        <ProtectedRoute>
                          <Dashboard />
                        </ProtectedRoute>
                      }
                    />

                    {/* Protected HR Subsystem Routes (Module 01) */}
                    <Route
                      path="/hr"
                      element={
                        <ProtectedRoute>
                          <HRLayout />
                        </ProtectedRoute>
                      }
                    >
                      <Route index element={<HRDashboard />} />
                      <Route path="employees" element={<EmployeeList />} />
                      <Route path="attendance" element={<AttendancePunch />} />
                      <Route path="leave" element={<LeaveDashboard />} />
                      <Route path="overtime" element={<OvertimeList />} />
                      <Route path="field-visits" element={<FieldVisitList />} />
                      <Route path="recruitment" element={<JobPostingsList />} />
                      <Route path="internships" element={<InternshipList />} />
                      <Route path="payroll" element={<PayrollDashboard />} />
                      <Route path="clearance" element={<ClearanceList />} />
                      <Route path="training" element={<TrainingList />} />
                      <Route path="upgrades" element={<ProfessionalUpgradeList />} />
                      <Route path="plans" element={<PlanList />} />
                    </Route>

                    {/* Protected ERP Modules Routes (Modules 02 - 12) */}
                    {ERP_MODULES.filter((m) => m.path !== '/hr').map((mod) => (
                      <React.Fragment key={mod.id}>
                        <Route
                          path={mod.path}
                          element={
                            <ProtectedRoute>
                              <ModulePlaceholder />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path={`${mod.path}/*`}
                          element={
                            <ProtectedRoute>
                              <ModulePlaceholder />
                            </ProtectedRoute>
                          }
                        />
                      </React.Fragment>
                    ))}

                    {/* Fallbacks */}
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </main>
              </div>
            </div>
          </BrowserRouter>
        </SidebarProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
