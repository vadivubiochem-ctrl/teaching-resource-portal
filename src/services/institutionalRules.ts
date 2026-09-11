export interface InstitutionalRule {
  id: string;
  code: string;
  title: string;
  targetRole: 'admin' | 'multi_user';
  category: 'Access Control' | 'Storage Governance' | 'Security & Audit' | 'Data Isolation' | 'Workflow Policy';
  description: string;
  enforcementMechanism: string;
  status: 'ACTIVE_ENFORCED';
  iconName: string;
}

export const ADMIN_RULES: InstitutionalRule[] = [
  {
    id: 'adm_01',
    code: 'RULE_ADM_01',
    title: 'Single Sovereign Master Administrator',
    targetRole: 'admin',
    category: 'Access Control',
    description: 'Exactly ONE Master Administrator exists in the institution (pssofttech@gmail.com). Sovereign root authority cannot be duplicated, demoted, suspended, or deleted.',
    enforcementMechanism: 'Hardened at the database and API layer. The single administrator identity is permanently safeguarded.',
    status: 'ACTIVE_ENFORCED',
    iconName: 'Shield',
  },
  {
    id: 'adm_02',
    code: 'RULE_ADM_02',
    title: 'No Multi-User Admin Elevation Mandate',
    targetRole: 'admin',
    category: 'Access Control',
    description: 'Admin rights cannot be enabled for multi-user accounts. Faculty members must strictly remain in the Teacher role without privilege escalation.',
    enforcementMechanism: 'Account creation and user edit APIs reject any attempt to grant admin privileges to multi-user accounts.',
    status: 'ACTIVE_ENFORCED',
    iconName: 'Lock',
  },
  {
    id: 'adm_03',
    code: 'RULE_ADM_03',
    title: '100 GB Master Storage Pool & Quota Authority',
    targetRole: 'admin',
    category: 'Storage Governance',
    description: 'The Administrator commands a 100 GB Master Storage pool and retains sovereign authority to inspect, increase, or adjust individual teacher quotas.',
    enforcementMechanism: 'Quota management module allows dynamic adjustments per faculty account, with real-time recalculation.',
    status: 'ACTIVE_ENFORCED',
    iconName: 'HardDrive',
  },
  {
    id: 'adm_04',
    code: 'RULE_ADM_04',
    title: 'Granular Access Rights Governance',
    targetRole: 'admin',
    category: 'Workflow Policy',
    description: 'The Administrator holds exclusive discretion to configure, toggle, or revoke high-impact permissions (Upload, Delete, Share, Create Folders, Download, Rename) per teacher.',
    enforcementMechanism: 'One-click permission matrices and security presets (Full, Standard, Read-Only, Submitter) enforced immediately.',
    status: 'ACTIVE_ENFORCED',
    iconName: 'Sliders',
  },
  {
    id: 'adm_05',
    code: 'RULE_ADM_05',
    title: 'Centralized Security Audit Stream',
    targetRole: 'admin',
    category: 'Security & Audit',
    description: 'Unrestricted visibility over the institutional audit stream recording all faculty logins, file modifications, device fingerprints, and IP addresses.',
    enforcementMechanism: 'Audit log queries are restricted to the verified Administrator session; logs cannot be altered by multi-user accounts.',
    status: 'ACTIVE_ENFORCED',
    iconName: 'Eye',
  },
  {
    id: 'adm_06',
    code: 'RULE_ADM_06',
    title: 'Cross-Department Resource Supervision',
    targetRole: 'admin',
    category: 'Data Isolation',
    description: 'Administrator maintains institutional continuity by inspecting and supervising teaching resources across all departmental directories.',
    enforcementMechanism: 'Global file search, folder inspection, and orphaned asset recovery tools in the Admin Console.',
    status: 'ACTIVE_ENFORCED',
    iconName: 'FolderTree',
  },
];

export const MULTI_USER_RULES: InstitutionalRule[] = [
  {
    id: 'usr_01',
    code: 'RULE_USR_01',
    title: 'Zero Admin Rights Enforcement',
    targetRole: 'multi_user',
    category: 'Access Control',
    description: 'Multi-user accounts operate strictly as faculty/teachers with NO admin rights. Access to the Admin Dashboard, system settings, or security policies is strictly barred.',
    enforcementMechanism: 'Navigation routes and API endpoints enforce strict role checks; multi-user accounts attempting admin access are blocked.',
    status: 'ACTIVE_ENFORCED',
    iconName: 'ShieldAlert',
  },
  {
    id: 'usr_02',
    code: 'RULE_USR_02',
    title: 'Isolated Private Workspace',
    targetRole: 'multi_user',
    category: 'Data Isolation',
    description: 'Each multi-user account has an isolated personal storage environment. Faculty members cannot view, browse, or edit another teacher\'s private files.',
    enforcementMechanism: 'Database and storage queries filter strictly by authenticated user_id, ensuring zero unauthorized cross-visibility.',
    status: 'ACTIVE_ENFORCED',
    iconName: 'Layers',
  },
  {
    id: 'usr_03',
    code: 'RULE_USR_03',
    title: 'Mandatory Permission Compliance',
    targetRole: 'multi_user',
    category: 'Workflow Policy',
    description: 'Every high-impact file operation (Upload, Delete, Share, Folders, Download, Rename) is checked against the access rights set by the Administrator.',
    enforcementMechanism: 'If an action is disabled (e.g. can_delete = false), the UI disables the action and the API rejects the request with an institutional notice.',
    status: 'ACTIVE_ENFORCED',
    iconName: 'CheckCircle2',
  },
  {
    id: 'usr_04',
    code: 'RULE_USR_04',
    title: 'Strict Storage Quota Boundary (15 GB Default)',
    targetRole: 'multi_user',
    category: 'Storage Governance',
    description: 'Each multi-user account operates within an assigned quota boundary. Uploads exceeding available storage space are immediately prevented.',
    enforcementMechanism: 'Pre-flight storage checks block uploads when user storage exceeds the assigned quota limit.',
    status: 'ACTIVE_ENFORCED',
    iconName: 'Database',
  },
  {
    id: 'usr_05',
    code: 'RULE_USR_05',
    title: 'Authorized Peer Collaboration',
    targetRole: 'multi_user',
    category: 'Workflow Policy',
    description: 'Teachers may share materials only when granted sharing privileges (can_share = true), and only with verified institutional colleagues or departments.',
    enforcementMechanism: 'Sharing engine creates auditable share records with granular read/edit permissions.',
    status: 'ACTIVE_ENFORCED',
    iconName: 'Share2',
  },
  {
    id: 'usr_06',
    code: 'RULE_USR_06',
    title: 'Immutable Activity Accountability',
    targetRole: 'multi_user',
    category: 'Security & Audit',
    description: 'All operations executed by multi-user accounts (logins, uploads, deletions, shares) are automatically logged with device details, timestamps, and client IP.',
    enforcementMechanism: 'Background audit collector registers every action; records cannot be cleared or tampered with by multi-user accounts.',
    status: 'ACTIVE_ENFORCED',
    iconName: 'Clock',
  },
];
