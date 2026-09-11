import React, { useState } from 'react';
import {
  Shield,
  Lock,
  Layers,
  CheckCircle2,
  HardDrive,
  Sliders,
  Eye,
  FolderTree,
  ShieldAlert,
  Database,
  Share2,
  Clock,
  Scale,
  X,
  UserCheck,
  FileCheck,
} from 'lucide-react';
import {
  ADMIN_RULES,
  MULTI_USER_RULES,
  type InstitutionalRule,
} from '../services/institutionalRules.js';

interface InstitutionalRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'admin' | 'multi_user' | 'comparison';
}

export const InstitutionalRulesModal: React.FC<InstitutionalRulesModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'admin',
}) => {
  const [activeTab, setActiveTab] = useState<'admin' | 'multi_user' | 'comparison'>(initialTab);

  if (!isOpen) return null;

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'Shield':
        return <Shield className="w-5 h-5 text-amber-400" />;
      case 'Lock':
        return <Lock className="w-5 h-5 text-rose-400" />;
      case 'HardDrive':
        return <HardDrive className="w-5 h-5 text-blue-400" />;
      case 'Sliders':
        return <Sliders className="w-5 h-5 text-indigo-400" />;
      case 'Eye':
        return <Eye className="w-5 h-5 text-teal-400" />;
      case 'FolderTree':
        return <FolderTree className="w-5 h-5 text-purple-400" />;
      case 'ShieldAlert':
        return <ShieldAlert className="w-5 h-5 text-amber-400" />;
      case 'Layers':
        return <Layers className="w-5 h-5 text-indigo-400" />;
      case 'CheckCircle2':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case 'Database':
        return <Database className="w-5 h-5 text-cyan-400" />;
      case 'Share2':
        return <Share2 className="w-5 h-5 text-purple-400" />;
      case 'Clock':
        return <Clock className="w-5 h-5 text-slate-300" />;
      default:
        return <FileCheck className="w-5 h-5 text-slate-300" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <span>Institutional Governance &amp; Security Rules</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Separate architectural policies for Single Master Admin vs. Multi-User Accounts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close Rules Explorer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 px-5 sm:px-6 pt-3 bg-slate-900/60 gap-3 text-xs font-semibold overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('admin')}
            className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'admin'
                ? 'border-amber-500 text-amber-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>👑 Administrator Rules (1 Master Admin)</span>
            <span className="px-1.5 py-0.5 rounded-full bg-amber-950/60 text-amber-300 text-[10px] border border-amber-800/60">
              pssofttech@gmail.com
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('multi_user')}
            className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'multi_user'
                ? 'border-indigo-500 text-indigo-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>👥 Multi-User Account Rules (Teachers)</span>
            <span className="px-1.5 py-0.5 rounded-full bg-indigo-950/60 text-indigo-300 text-[10px] border border-indigo-800/60">
              Admin Rights Disabled
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('comparison')}
            className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'comparison'
                ? 'border-emerald-500 text-emerald-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>Matrix Comparison</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {/* TAB 1: ADMINISTRATOR RULES */}
          {activeTab === 'admin' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/40 text-xs text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Shield className="w-5 h-5 text-amber-400 shrink-0" />
                  <div>
                    <span className="font-bold text-amber-300">Single Sovereign Root Authority:</span> Exactly one
                    administrator account is designated across the institution (
                    <span className="font-mono text-white">pssofttech@gmail.com</span>).
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-amber-900/60 text-amber-200 text-[11px] font-semibold uppercase tracking-wider shrink-0">
                  Total System Sovereignty
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ADMIN_RULES.map((rule) => (
                  <div
                    key={rule.id}
                    className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 hover:border-amber-500/50 transition-all flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-900 text-amber-400 border border-slate-700">
                          {rule.code}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                          {rule.category}
                        </span>
                      </div>
                      <div className="flex items-start gap-3 mt-1">
                        <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-700 shrink-0">
                          {renderIcon(rule.iconName)}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white leading-snug">{rule.title}</h3>
                          <p className="text-xs text-slate-300 mt-1 leading-relaxed">{rule.description}</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-slate-700/60 text-[11px] text-slate-400 flex items-start gap-1.5">
                      <span className="text-amber-400 font-semibold shrink-0">Enforcement:</span>
                      <span>{rule.enforcementMechanism}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: MULTI-USER ACCOUNT RULES */}
          {activeTab === 'multi_user' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-800/40 text-xs text-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <UserCheck className="w-5 h-5 text-indigo-400 shrink-0" />
                  <div>
                    <span className="font-bold text-indigo-300">Multi-User Faculty Isolation:</span> Teacher accounts
                    have separate workspaces with admin rights strictly disabled. Actions are subject to Administrator permission controls.
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-indigo-900/60 text-indigo-200 text-[11px] font-semibold uppercase tracking-wider shrink-0">
                  Admin Rights Disabled
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {MULTI_USER_RULES.map((rule) => (
                  <div
                    key={rule.id}
                    className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 hover:border-indigo-500/50 transition-all flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-900 text-indigo-400 border border-slate-700">
                          {rule.code}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                          {rule.category}
                        </span>
                      </div>
                      <div className="flex items-start gap-3 mt-1">
                        <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-700 shrink-0">
                          {renderIcon(rule.iconName)}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white leading-snug">{rule.title}</h3>
                          <p className="text-xs text-slate-300 mt-1 leading-relaxed">{rule.description}</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-slate-700/60 text-[11px] text-slate-400 flex items-start gap-1.5">
                      <span className="text-indigo-400 font-semibold shrink-0">Enforcement:</span>
                      <span>{rule.enforcementMechanism}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: MATRIX COMPARISON */}
          {activeTab === 'comparison' && (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-xl border border-slate-700">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-800/90 text-slate-200 border-b border-slate-700 text-[11px] uppercase font-bold">
                    <tr>
                      <th className="p-3">Capability / Policy Dimension</th>
                      <th className="p-3 text-amber-400 bg-amber-950/20">👑 Master Administrator</th>
                      <th className="p-3 text-indigo-400 bg-indigo-950/20">👥 Multi-User Teachers</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 bg-slate-850/50">
                    <tr>
                      <td className="p-3 font-semibold text-white">Account Cardinality</td>
                      <td className="p-3 text-amber-300 font-mono">Exactly 1 (pssofttech@gmail.com)</td>
                      <td className="p-3 text-indigo-300">Multiple faculty accounts supported</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-white">Administrative Rights</td>
                      <td className="p-3 text-emerald-400 font-bold">Full Sovereign Control</td>
                      <td className="p-3 text-rose-400 font-bold">Strictly Disabled (No Admin Rights)</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-white">Default Storage Quota</td>
                      <td className="p-3 text-amber-300 font-bold">100 GB Master Storage Pool</td>
                      <td className="p-3 text-slate-200">15 GB Standard Storage Pool</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-white">File Space Visibility</td>
                      <td className="p-3 text-slate-200">Institution-Wide Supervisory Oversight</td>
                      <td className="p-3 text-emerald-400 font-semibold">Isolated Workspace (Private to Teacher)</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-white">High-Impact Operations</td>
                      <td className="p-3 text-slate-200">Unrestricted across all modules</td>
                      <td className="p-3 text-slate-200">Governed by Admin Permission Matrix</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-white">Quota Adjustments</td>
                      <td className="p-3 text-emerald-400 font-semibold">Can alter quotas for any faculty</td>
                      <td className="p-3 text-slate-400">Fixed to assigned limit</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-white">Audit Trail Access</td>
                      <td className="p-3 text-emerald-400 font-semibold">Full Centralized Security Stream</td>
                      <td className="p-3 text-slate-400">Personal activity log only</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-white">Account Deletion / Suspension</td>
                      <td className="p-3 text-amber-300 font-semibold">Immune to deletion or suspension</td>
                      <td className="p-3 text-slate-400">Managed by Administrator</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-850 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Rules are programmatically verified and enforced by system kernel</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Acknowledge &amp; Close
          </button>
        </div>
      </div>
    </div>
  );
};
