import React, { useState, useEffect } from 'react';
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

// Public Career & Talent Application Page
import PublicCareersPage from './pages/public/PublicCareersPage';

export default function App() {
  const [pausedMessage, setPausedMessage] = useState(null);

  useEffect(() => {
    const handlePaused = (e) => {
      setPausedMessage(
        e.detail ||
          'The system encountered an unusual problem. There may be unauthorized or malicious activity detected, or the server contract has been paused.'
      );
    };
    window.addEventListener('vector:system-paused', handlePaused);
    return () => window.removeEventListener('vector:system-paused', handlePaused);
  }, []);

  if (pausedMessage) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#070b12] text-white p-6">
        <div className="max-w-md w-full rounded-3xl bg-[#0e1626] border border-slate-800 p-8 text-center space-y-5 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/15 text-rose-500 flex items-center justify-center mx-auto text-2xl font-black">
            !
          </div>
          <h1 className="text-xl font-black text-rose-400">System Access Suspended</h1>
          <p className="text-sm text-slate-300 leading-relaxed">{pausedMessage}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 rounded-xl bg-[#00ced1] hover:bg-[#00b5b8] text-slate-950 font-black text-xs cursor-pointer transition-all"
          >
            Check Status &amp; Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <SidebarProvider>
          <BrowserRouter>
            {/* Fixed Viewport Root Shell */}
            <div className="h-screen w-screen overflow-hidden flex flex-col bg-slate-50 dark:bg-[#070b12] text-slate-800 dark:text-slate-100">
              {/* Header: Fixed permanently at top */}
              <Navbar />

              {/* Body flex container below fixed Header */}
              <div className="flex-1 flex min-h-0 w-full overflow-hidden relative">
                {/* Sidebar: Fixed on left directly under Header */}
                <Sidebar />

                {/* Main Content Area to the right of Sidebar */}
                <main className="flex-1 min-w-0 flex flex-col h-full min-h-0 overflow-hidden relative">
                  <Routes>
                    {/* Public Auth Routes */}
                    <Route
                      path="/careers"
                      element={
                        <div className="flex-1 w-full h-full min-h-0 overflow-y-auto">
                          <PublicCareersPage />
                        </div>
                      }
                    />
                    <Route
                      path="/careers/:id"
                      element={
                        <div className="flex-1 w-full h-full min-h-0 overflow-y-auto">
                          <PublicCareersPage />
                        </div>
                      }
                    />
                    <Route
                      path="/login"
                      element={
                        <div className="flex-1 w-full h-full min-h-0 overflow-y-auto">
                          <Login />
                        </div>
                      }
                    />
                    <Route
                      path="/forgot-password"
                      element={
                        <div className="flex-1 w-full h-full min-h-0 overflow-y-auto">
                          <ForgotPassword />
                        </div>
                      }
                    />
                    <Route
                      path="/reset-password"
                      element={
                        <div className="flex-1 w-full h-full min-h-0 overflow-y-auto">
                          <ResetPassword />
                        </div>
                      }
                    />

                    {/* Forced password change route for users with temporary password */}
                    <Route
                      path="/change-password"
                      element={
                        <ProtectedRoute>
                          <div className="flex-1 w-full h-full min-h-0 overflow-y-auto">
                            <ChangePassword />
                          </div>
                        </ProtectedRoute>
                      }
                    />

                    {/* Executive / HR User Registration Portal (Only authorized roles) */}
                    <Route
                      path="/register"
                      element={
                        <ProtectedRoute>
                          <div className="flex-1 w-full h-full min-h-0 overflow-y-auto">
                            <Register />
                          </div>
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
