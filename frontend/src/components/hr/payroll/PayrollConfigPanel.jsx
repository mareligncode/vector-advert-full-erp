import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Settings,
  Save,
  CheckCircle2,
  AlertCircle,
  Percent,
  Clock,
  Shield
} from 'lucide-react';
import { payrollService } from '../../../services/hrService';

export default function PayrollConfigPanel() {
  const { i18n } = useTranslation();
  const isAmharic = i18n.language === 'am';

  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true);
        const res = await payrollService.getConfig();
        if (res.success && res.data) {
          setConfig(res.data);
        }
      } catch (err) {
        setError('Failed to load statutory payroll configuration');
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      const res = await payrollService.updateConfig(config);
      if (res.success) {
        setConfig(res.data);
        setSuccess(isAmharic ? 'የደመወዝ ፖሊሲው ተዘምኗል!' : 'Statutory payroll configuration saved!');
        setTimeout(() => setSuccess(''), 3500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-slate-400">
        Loading Ethiopian statutory payroll rules...
      </div>
    );
  }

  if (!config) return null;

  const updateTaxSlab = (idx, field, value) => {
    const slabs = [...(config.incomeTaxSlabs || [])];
    slabs[idx] = {
      ...slabs[idx],
      [field]: field === 'slabName' ? value : value === '' ? null : Number(value)
    };
    setConfig({ ...config, incomeTaxSlabs: slabs });
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 text-xs">
      {error && (
        <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center gap-2 font-bold">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* General & Working Calendar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-5 rounded-3xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 space-y-4">
          <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#00ced1]" />
            <span>{isAmharic ? 'የስራ ቀናት እና አጠቃላይ ቅንብሮች' : 'Working Calendar & General'}</span>
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-500 mb-1">
                {isAmharic ? 'የኩባንያ ስም' : 'Company Name'}
              </label>
              <input
                type="text"
                value={config.companyName || ''}
                onChange={(e) => setConfig({ ...config, companyName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#152238]"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-500 mb-1">
                {isAmharic ? 'ምንዛሪ' : 'Currency'}
              </label>
              <input
                type="text"
                value={config.currency || 'ETB'}
                onChange={(e) => setConfig({ ...config, currency: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#152238] font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-500 mb-1">
                {isAmharic ? 'በወር የስራ ቀናት' : 'Working Days / Month'}
              </label>
              <input
                type="number"
                value={config.standardWorkingDaysPerMonth || 22}
                onChange={(e) =>
                  setConfig({ ...config, standardWorkingDaysPerMonth: Number(e.target.value) })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#152238] font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-500 mb-1">
                {isAmharic ? 'የደመወዝ መዝጊያ ቀን' : 'Payroll Cutoff Day'}
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={config.payrollCutoffDay || 25}
                onChange={(e) =>
                  setConfig({ ...config, payrollCutoffDay: Number(e.target.value) })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#152238] font-bold"
              />
            </div>
          </div>
        </div>

        {/* Pension & Tax-Exempt Limits */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 space-y-4">
          <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#00ced1]" />
            <span>{isAmharic ? 'የጡረታ እና ከግብር ነጻ ገደቦች' : 'Pension & Allowance Exemptions'}</span>
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-500 mb-1">
                {isAmharic ? 'የሰራተኛ ጡረታ (%)' : 'Employee Pension (%)'}
              </label>
              <input
                type="number"
                step="0.5"
                value={config.pensionContribution?.employeePensionRate ?? 7}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    pensionContribution: {
                      ...config.pensionContribution,
                      employeePensionRate: Number(e.target.value)
                    }
                  })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#152238] font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-500 mb-1">
                {isAmharic ? 'የአሰሪ ጡረታ (%)' : 'Employer Pension (%)'}
              </label>
              <input
                type="number"
                step="0.5"
                value={config.pensionContribution?.employerPensionRate ?? 11}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    pensionContribution: {
                      ...config.pensionContribution,
                      employerPensionRate: Number(e.target.value)
                    }
                  })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#152238] font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-500 mb-1">
                {isAmharic ? 'የትራንስፖርት ከግብር ነጻ ገደብ' : 'Transport Tax-Exempt Limit'}
              </label>
              <input
                type="number"
                value={config.taxExemptAllowanceLimits?.transportAllowanceLimit ?? 2200}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    taxExemptAllowanceLimits: {
                      ...config.taxExemptAllowanceLimits,
                      transportAllowanceLimit: Number(e.target.value)
                    }
                  })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#152238] font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-500 mb-1">
                {isAmharic ? 'መደበኛ የትርፍ ሰዓት ብዜት' : 'Normal OT Multiplier'}
              </label>
              <input
                type="number"
                step="0.05"
                value={config.overtimeMultipliers?.normalDayMultiplier ?? 1.5}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    overtimeMultipliers: {
                      ...config.overtimeMultipliers,
                      normalDayMultiplier: Number(e.target.value)
                    }
                  })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#152238] font-bold"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Ethiopian PAYE Tax Brackets Table */}
      <div className="p-5 rounded-3xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Percent className="w-4 h-4 text-[#00ced1]" />
            <span>{isAmharic ? 'የኢትዮጵያ የገቢ ግብር (PAYE) ሰንጠረዥ' : 'Ethiopian PAYE Income Tax Brackets'}</span>
          </h3>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#00ced1] hover:bg-[#00b5b8] text-white font-black shadow-lg shadow-[#00ced1]/20 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? (isAmharic ? 'በማስቀመጥ ላይ...' : 'Saving...') : (isAmharic ? 'ህጎችን አስቀምጥ' : 'Save Statutory Rules')}</span>
          </button>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-[#152238] text-[11px] uppercase font-black text-slate-500 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">{isAmharic ? 'የደረጃ ስም' : 'Bracket Name'}</th>
                <th className="py-3 px-4">{isAmharic ? 'ዝቅተኛ ገቢ (ብር)' : 'Min Income (ETB)'}</th>
                <th className="py-3 px-4">{isAmharic ? 'ከፍተኛ ገቢ (ብር)' : 'Max Income (ETB)'}</th>
                <th className="py-3 px-4">{isAmharic ? 'የግብር መጠን (%)' : 'Tax Rate (%)'}</th>
                <th className="py-3 px-4">{isAmharic ? 'ተቀናሽ (ብር)' : 'Deductible (ETB)'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {(config.incomeTaxSlabs || []).map((slab, idx) => (
                <tr key={slab._id || idx}>
                  <td className="py-2.5 px-4">
                    <input
                      type="text"
                      value={slab.slabName}
                      onChange={(e) => updateTaxSlab(idx, 'slabName', e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#152238] font-bold"
                    />
                  </td>
                  <td className="py-2.5 px-4">
                    <input
                      type="number"
                      value={slab.minIncome}
                      onChange={(e) => updateTaxSlab(idx, 'minIncome', e.target.value)}
                      className="w-28 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#152238]"
                    />
                  </td>
                  <td className="py-2.5 px-4">
                    <input
                      type="number"
                      placeholder="∞ (Unlimited)"
                      value={slab.maxIncome ?? ''}
                      onChange={(e) => updateTaxSlab(idx, 'maxIncome', e.target.value)}
                      className="w-28 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#152238]"
                    />
                  </td>
                  <td className="py-2.5 px-4">
                    <input
                      type="number"
                      value={slab.taxRate}
                      onChange={(e) => updateTaxSlab(idx, 'taxRate', e.target.value)}
                      className="w-20 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#152238] font-black text-[#00ced1]"
                    />
                  </td>
                  <td className="py-2.5 px-4">
                    <input
                      type="number"
                      step="0.5"
                      value={slab.deductibleAmount}
                      onChange={(e) => updateTaxSlab(idx, 'deductibleAmount', e.target.value)}
                      className="w-24 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#152238]"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </form>
  );
}
