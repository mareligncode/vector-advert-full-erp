import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Clock,
  CalendarCheck,
  Users,
  Settings,
  RefreshCw,
  Building2,
  MapPin,
  CalendarDays
} from 'lucide-react';
import { attendanceService } from '../../../services/hrService';
import { useAuth } from '../../../context/AuthContext';
import {
  canViewAllAttendance,
  canAdjustAttendance,
  canConfigureAttendance
} from '../../../utils/rbac';

// Subcomponents
import TodayPunchTab from '../../../components/hr/attendance/TodayPunchTab';
import MyAttendanceTab from '../../../components/hr/attendance/MyAttendanceTab';
import AttendanceRegistryTab from '../../../components/hr/attendance/AttendanceRegistryTab';
import AttendanceConfigTab from '../../../components/hr/attendance/AttendanceConfigTab';

export default function AttendancePunch() {
  const { t } = useTranslation();
  const { user } = useAuth();

  // Active Tab: 'punch' | 'my-records' | 'registry' | 'config'
  const [activeTab, setActiveTab] = useState('punch');

  // Shared Data
  const [config, setConfig] = useState(null);
  const [todayLog, setTodayLog] = useState(null);
  const [loading, setLoading] = useState(true);

  // RBAC Privileges
  const isManager = canViewAllAttendance(user);
  const isHrAdmin = canAdjustAttendance(user);
  const canConfig = canConfigureAttendance(user);

  // Fetch initial config and today's attendance record
  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [configRes, todayRes] = await Promise.allSettled([
        attendanceService.getConfig(),
        attendanceService.getTodayAttendance()
      ]);

      if (configRes.status === 'fulfilled' && configRes.value.success) {
        setConfig(configRes.value.data);
      }
      if (todayRes.status === 'fulfilled' && todayRes.value.success) {
        setTodayLog(todayRes.value.data);
      }
    } catch (err) {
      console.error('Failed to load initial attendance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#00ced1]/15 text-[#00ced1] flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <span>{t('hrPages.attendance.title')}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {t('hrPages.attendance.subtitle')}
          </p>
        </div>

        <button
          type="button"
          onClick={fetchInitialData}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer self-start sm:self-auto"
          title={t('common.refresh')}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#00ced1]' : ''}`} />
        </button>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-1 scrollbar-none">
        {/* Tab 1: Today's Punch */}
        <button
          type="button"
          onClick={() => setActiveTab('punch')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'punch'
              ? 'bg-[#00ced1] text-slate-950 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>{t('hrPages.attendance.tabPunch')}</span>
        </button>

        {/* Tab 2: My Records */}
        <button
          type="button"
          onClick={() => setActiveTab('my-records')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'my-records'
              ? 'bg-[#00ced1] text-slate-950 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          <span>{t('hrPages.attendance.tabMyAttendance')}</span>
        </button>

        {/* Tab 3: Attendance Registry (Managers / HR) */}
        {isManager && (
          <button
            type="button"
            onClick={() => setActiveTab('registry')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'registry'
                ? 'bg-[#00ced1] text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{t('hrPages.attendance.tabRegistry')}</span>
          </button>
        )}

        {/* Tab 4: Settings & Geofence (HR Admin) */}
        {canConfig && (
          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'config'
                ? 'bg-[#00ced1] text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>{t('hrPages.attendance.tabConfig')}</span>
          </button>
        )}
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'punch' && (
          <TodayPunchTab
            config={config}
            todayLog={todayLog}
            onAttendanceChanged={fetchInitialData}
            onNavigateToConfig={() => setActiveTab('config')}
            canConfig={canConfig}
          />
        )}

        {activeTab === 'my-records' && <MyAttendanceTab />}

        {activeTab === 'registry' && isManager && (
          <AttendanceRegistryTab canEdit={isHrAdmin} />
        )}

        {activeTab === 'config' && canConfig && (
          <AttendanceConfigTab
            initialConfig={config}
            onConfigUpdated={(updated) => setConfig(updated)}
          />
        )}
      </div>
    </div>
  );
}
