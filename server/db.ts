import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import type { User, TeachingFile, Folder, SharingRecord, AuditLog, School } from '../src/types.ts';

const DATA_DIR = path.join(process.cwd(), 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export interface StoredUser extends User {
  password_hash: string;
}

export interface DatabaseSchema {
  schools?: School[];
  users: StoredUser[];
  files: TeachingFile[];
  folders: Folder[];
  sharing: SharingRecord[];
  auditLogs: AuditLog[];
}

function getInitialDatabase(): DatabaseSchema {
  const salt = bcrypt.genSaltSync(10);

  const defaultSchools: School[] = [
    {
      id: 'SCH_PANNAIPURAM',
      name: 'Govt Hr Sec School Pannaipuram',
      code: 'STATE-405',
      address: 'Main Road, Pannaipuram, Theni District, Tamil Nadu',
      contact_email: 'admin@ghsspannaipuram.edu',
      storage_quota_bytes: 214748364800, // 200 GB
      created_at: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'SCH_GREENVALE',
      name: 'Greenvale Science & Tech Academy',
      code: 'SCH_GREENVALE',
      address: '5 Science Park Blvd, Tech Zone',
      contact_email: 'office@greenvale.edu',
      storage_quota_bytes: 161061273600, // 150 GB
      created_at: '2026-02-15T00:00:00.000Z',
    },
  ];

  const defaultUsers: StoredUser[] = [
    {
      id: 'usr_admin',
      schoolId: 'SCH_PANNAIPURAM',
      school_name: 'Govt Hr Sec School Pannaipuram',
      school_code: 'STATE-405',
      username: 'admin',
      email: 'admin@ghsspannaipuram.edu',
      password_hash: bcrypt.hashSync('admin123', salt),
      role: 'admin',
      status: 'active',
      department: 'School Administration & IT',
      storage_used: 350 * 1024 * 1024,
      storage_limit: 50 * 1024 * 1024 * 1024, // 50GB
      created_at: '2026-01-10T08:00:00.000Z',
    },
    {
      id: 'usr_emal',
      schoolId: 'SCH_PANNAIPURAM',
      school_name: 'Govt Hr Sec School Pannaipuram',
      school_code: 'STATE-405',
      username: 'emal',
      email: 'emal@teacherhub.edu',
      password_hash: bcrypt.hashSync('email password', salt),
      role: 'teacher',
      status: 'active',
      department: 'Science & Computing',
      storage_used: 128 * 1024 * 1024,
      storage_limit: 15 * 1024 * 1024 * 1024, // 15GB
      created_at: '2026-02-01T09:30:00.000Z',
    },
    {
      id: 'usr_pssofttech',
      schoolId: 'SCH_PANNAIPURAM',
      school_name: 'Govt Hr Sec School Pannaipuram',
      school_code: 'STATE-405',
      username: 'pssofttech',
      email: 'pssofttech@gmail.com',
      password_hash: bcrypt.hashSync('admin123', salt),
      role: 'admin',
      status: 'active',
      department: 'Computer Science & System Administration',
      storage_used: 245 * 1024 * 1024,
      storage_limit: 107374182400,
      created_at: '2026-02-15T11:00:00.000Z',
    },
    {
      id: 'usr_vadivubichem',
      schoolId: 'SCH_PANNAIPURAM',
      school_name: 'Govt Hr Sec School Pannaipuram',
      school_code: 'STATE-405',
      username: 'vadivubichem',
      email: 'vadivubichem@gmail.com',
      password_hash: bcrypt.hashSync('password123', salt),
      role: 'teacher',
      status: 'active',
      department: 'Biochemistry Department',
      storage_used: 310 * 1024 * 1024,
      storage_limit: 16106127360,
      created_at: '2026-03-05T10:45:00.000Z',
    },
    {
      id: 'usr_vadivubiochem_alt',
      schoolId: 'SCH_PANNAIPURAM',
      school_name: 'Govt Hr Sec School Pannaipuram',
      school_code: 'STATE-405',
      username: 'vadivubiochem',
      email: 'vadivubiochem@gmail.com',
      password_hash: bcrypt.hashSync('password123', salt),
      role: 'teacher',
      status: 'active',
      department: 'Biochemistry Department',
      storage_used: 195 * 1024 * 1024,
      storage_limit: 16106127360,
      created_at: '2026-03-06T09:00:00.000Z',
    },
    {
      id: 'usr_ramamoorthy',
      schoolId: 'SCH_PANNAIPURAM',
      school_name: 'Govt Hr Sec School Pannaipuram',
      school_code: 'STATE-405',
      username: 'Ramamoorthy',
      email: 'moorthyagri84@gmail.com',
      password_hash: bcrypt.hashSync('staff123', salt),
      role: 'teacher',
      status: 'active',
      department: 'Agricultural Science & Biology',
      storage_used: 0,
      storage_limit: 16106127360,
      created_at: '2026-03-01T08:00:00.000Z',
    },
    {
      id: 'usr_mudm98xd',
      schoolId: 'SCH_PANNAIPURAM',
      school_name: 'Govt Hr Sec School Pannaipuram',
      school_code: 'STATE-405',
      username: 'Ramaraj',
      email: 'ramaraj22feb89@gmail.com',
      password_hash: bcrypt.hashSync('staff123', salt),
      role: 'teacher',
      status: 'active',
      department: 'General Faculty',
      storage_used: 0,
      storage_limit: 16106127360,
      created_at: '2026-03-05T08:00:00.000Z',
    },
    {
      id: 'usr_mudnn6c0',
      schoolId: 'SCH_PANNAIPURAM',
      school_name: 'Govt Hr Sec School Pannaipuram',
      school_code: 'STATE-405',
      username: 'Saravanababu',
      email: 'mohaniranj1930@gmail.com',
      password_hash: bcrypt.hashSync('staff123', salt),
      role: 'teacher',
      status: 'active',
      department: 'General Faculty',
      storage_used: 0,
      storage_limit: 16106127360,
      created_at: '2026-03-05T08:00:00.000Z',
    },
    {
      id: 'usr_mudnvf3b',
      schoolId: 'SCH_PANNAIPURAM',
      school_name: 'Govt Hr Sec School Pannaipuram',
      school_code: 'STATE-405',
      username: 'Anbazhagan',
      email: 'anbazhagansankar813@gmail.com',
      password_hash: bcrypt.hashSync('staff123', salt),
      role: 'teacher',
      status: 'active',
      department: 'General Faculty',
      storage_used: 0,
      storage_limit: 16106127360,
      created_at: '2026-03-05T08:00:00.000Z',
    },
    {
      id: 'usr_mudo87xf',
      schoolId: 'SCH_PANNAIPURAM',
      school_name: 'Govt Hr Sec School Pannaipuram',
      school_code: 'STATE-405',
      username: 'Sundar',
      email: 'sundarmms1985@gmail.com',
      password_hash: bcrypt.hashSync('staff123', salt),
      role: 'teacher',
      status: 'active',
      department: 'General Faculty',
      storage_used: 0,
      storage_limit: 16106127360,
      created_at: '2026-03-05T08:00:00.000Z',
    },
    {
      id: 'usr_mudq8v22',
      schoolId: 'SCH_PANNAIPURAM',
      school_name: 'Govt Hr Sec School Pannaipuram',
      school_code: 'STATE-405',
      username: 'Ramesh',
      email: 'hss1603007@gmail.com',
      password_hash: bcrypt.hashSync('staff123', salt),
      role: 'teacher',
      status: 'active',
      department: 'General Faculty',
      storage_used: 0,
      storage_limit: 16106127360,
      created_at: '2026-03-05T08:00:00.000Z',
    },
  ];

  const defaultFolders: Folder[] = [
    {
      id: 'fld_class11',
      user_id: 'usr_pssofttech',
      parent_folder_id: null,
      folder_name: 'Class 11',
      color: '#3B82F6',
      created_at: '2026-03-01T08:00:00.000Z',
    },
    {
      id: 'fld_c11_cs',
      user_id: 'usr_pssofttech',
      parent_folder_id: 'fld_class11',
      folder_name: 'Computer Science',
      color: '#6366F1',
      created_at: '2026-03-01T08:05:00.000Z',
    },
    {
      id: 'fld_c11_qp',
      user_id: 'usr_pssofttech',
      parent_folder_id: 'fld_class11',
      folder_name: 'Question Papers',
      color: '#0EA5E9',
      created_at: '2026-03-01T08:10:00.000Z',
    },
    {
      id: 'fld_class12',
      user_id: 'usr_pssofttech',
      parent_folder_id: null,
      folder_name: 'Class 12',
      color: '#8B5CF6',
      created_at: '2026-03-02T09:00:00.000Z',
    },
    {
      id: 'fld_c12_cs',
      user_id: 'usr_pssofttech',
      parent_folder_id: 'fld_class12',
      folder_name: 'Computer Science',
      color: '#EC4899',
      created_at: '2026-03-02T09:05:00.000Z',
    },
    {
      id: 'fld_c12_l1',
      user_id: 'usr_pssofttech',
      parent_folder_id: 'fld_c12_cs',
      folder_name: 'Lesson 1',
      color: '#F43F5E',
      created_at: '2026-03-02T09:10:00.000Z',
    },
    {
      id: 'fld_c12_l2',
      user_id: 'usr_pssofttech',
      parent_folder_id: 'fld_c12_cs',
      folder_name: 'Lesson 2',
      color: '#F97316',
      created_at: '2026-03-02T09:15:00.000Z',
    },
    {
      id: 'fld_c12_l5',
      user_id: 'usr_pssofttech',
      parent_folder_id: 'fld_c12_cs',
      folder_name: 'Lesson 5',
      color: '#10B981',
      created_at: '2026-03-02T09:20:00.000Z',
    },
    {
      id: 'fld_c12_videos',
      user_id: 'usr_pssofttech',
      parent_folder_id: 'fld_class12',
      folder_name: 'Videos',
      color: '#E11D48',
      created_at: '2026-03-02T09:25:00.000Z',
    },
    {
      id: 'fld_c12_audio',
      user_id: 'usr_pssofttech',
      parent_folder_id: 'fld_class12',
      folder_name: 'Audio',
      color: '#14B8A6',
      created_at: '2026-03-02T09:30:00.000Z',
    },
    {
      id: 'fld_ppt',
      user_id: 'usr_pssofttech',
      parent_folder_id: null,
      folder_name: 'PPT',
      color: '#F59E0B',
      created_at: '2026-03-03T10:00:00.000Z',
    },
    {
      id: 'fld_pdf',
      user_id: 'usr_pssofttech',
      parent_folder_id: null,
      folder_name: 'PDF',
      color: '#EF4444',
      created_at: '2026-03-03T10:05:00.000Z',
    },
    {
      id: 'fld_worksheets',
      user_id: 'usr_vadivubichem',
      parent_folder_id: null,
      folder_name: 'Worksheets',
      color: '#059669',
      created_at: '2026-03-04T11:00:00.000Z',
    },
  ];

  // Helper to create small sample test files on disk if not present
  const seedDemoMedia = (fileName: string, sampleContent: string): string => {
    const filePath = path.join(UPLOADS_DIR, fileName);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, sampleContent);
    }
    return fileName;
  };

  seedDemoMedia('sample_lesson_notes.txt', 'Class 12 - Lesson 5: Relational Database Management & SQL Queries.\nKey concepts: Primary Keys, Foreign Keys, Normalization, ACID Properties.');
  seedDemoMedia('Class_11_CS_Syllabus.txt', 'CBSE / State Curriculum: Computer Science 2026-2027 Syllabus Overview.');

  const defaultFiles: TeachingFile[] = [
    {
      id: 'fil_lesson5_video',
      user_id: 'usr_pssofttech',
      folder_id: 'fld_c12_l5',
      file_name: 'Class_12_Lesson_5.mp4',
      file_type: 'video',
      file_extension: 'mp4',
      file_size: 156 * 1024 * 1024, // 156 MB
      storage_path: 'sample_lesson_notes.txt', // mapped demo path
      device: 'Mobile (Android Phone)',
      uploaded_at: '2026-09-05T14:20:00.000Z',
      updated_at: '2026-09-05T14:20:00.000Z',
      is_favorite: true,
      is_trashed: false,
      mime_type: 'video/mp4',
      shared_mode: 'all_teachers',
      duration: 1845, // 30 mins 45 secs
      owner_name: 'pssofttech',
      owner_email: 'pssofttech@gmail.com',
    },
    {
      id: 'fil_cs_networks',
      user_id: 'usr_pssofttech',
      folder_id: 'fld_c12_l2',
      file_name: 'Computer_Networks_Topology.mp4',
      file_type: 'video',
      file_extension: 'mp4',
      file_size: 98 * 1024 * 1024,
      storage_path: 'sample_lesson_notes.txt',
      device: 'Desktop (Windows 11)',
      uploaded_at: '2026-09-04T10:15:00.000Z',
      updated_at: '2026-09-04T10:15:00.000Z',
      is_favorite: false,
      is_trashed: false,
      mime_type: 'video/mp4',
      shared_mode: 'private',
      duration: 1220,
      owner_name: 'pssofttech',
      owner_email: 'pssofttech@gmail.com',
    },
    {
      id: 'fil_cs_syllabus_pdf',
      user_id: 'usr_pssofttech',
      folder_id: 'fld_c11_cs',
      file_name: 'Class_11_CS_Syllabus.pdf',
      file_type: 'document',
      file_extension: 'pdf',
      file_size: 2450000, // 2.45 MB
      storage_path: 'Class_11_CS_Syllabus.txt',
      device: 'Desktop (MacBook Pro)',
      uploaded_at: '2026-09-03T09:00:00.000Z',
      updated_at: '2026-09-03T09:00:00.000Z',
      is_favorite: true,
      is_trashed: false,
      mime_type: 'application/pdf',
      shared_mode: 'all_teachers',
      owner_name: 'pssofttech',
      owner_email: 'pssofttech@gmail.com',
    },
    {
      id: 'fil_audio_lecture',
      user_id: 'usr_vadivubichem',
      folder_id: 'fld_worksheets',
      file_name: 'Biochemistry_Enzyme_Kinetics_Lecture.mp3',
      file_type: 'audio',
      file_extension: 'mp3',
      file_size: 24 * 1024 * 1024,
      storage_path: 'sample_lesson_notes.txt',
      device: 'Mobile (iPhone 15)',
      uploaded_at: '2026-09-04T16:40:00.000Z',
      updated_at: '2026-09-04T16:40:00.000Z',
      is_favorite: true,
      is_trashed: false,
      mime_type: 'audio/mpeg',
      shared_mode: 'shared_users',
      duration: 1540,
      owner_name: 'vadivubichem',
      owner_email: 'vadivubichem@gmail.com',
    },
    {
      id: 'fil_cell_diagram',
      user_id: 'usr_vadivubichem',
      folder_id: 'fld_worksheets',
      file_name: 'Cellular_Respiration_Pathway_Diagram.png',
      file_type: 'image',
      file_extension: 'png',
      file_size: 4200000,
      storage_path: 'sample_lesson_notes.txt',
      device: 'Desktop (MacBook Air)',
      uploaded_at: '2026-09-05T11:10:00.000Z',
      updated_at: '2026-09-05T11:10:00.000Z',
      is_favorite: false,
      is_trashed: false,
      mime_type: 'image/png',
      shared_mode: 'all_teachers',
      owner_name: 'vadivubichem',
      owner_email: 'vadivubichem@gmail.com',
    },
    {
      id: 'fil_emal_chem_audio',
      user_id: 'usr_emal',
      folder_id: null,
      file_name: 'Chemistry_Titration_Lab_Guide.m4a',
      file_type: 'audio',
      file_extension: 'm4a',
      file_size: 14 * 1024 * 1024,
      storage_path: 'sample_lesson_notes.txt',
      device: 'Mobile (iPhone)',
      uploaded_at: '2026-09-02T13:45:00.000Z',
      updated_at: '2026-09-02T13:45:00.000Z',
      is_favorite: true,
      is_trashed: false,
      mime_type: 'audio/mp4',
      shared_mode: 'all_teachers',
      duration: 890,
      owner_name: 'emal',
      owner_email: 'emal@teacherhub.edu',
    },
    {
      id: 'fil_grades_sheet',
      user_id: 'usr_pssofttech',
      folder_id: 'fld_c12_l1',
      file_name: 'Class_12_Term_1_Grades_Attendance.xlsx',
      file_type: 'document',
      file_extension: 'xlsx',
      file_size: 1250000,
      storage_path: 'sample_lesson_notes.txt',
      device: 'Desktop (Windows 11)',
      uploaded_at: '2026-09-04T12:00:00.000Z',
      updated_at: '2026-09-04T12:00:00.000Z',
      is_favorite: true,
      is_trashed: false,
      mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      shared_mode: 'all_teachers',
      owner_name: 'pssofttech',
      owner_email: 'pssofttech@gmail.com',
    },
    {
      id: 'fil_july_academic_plan',
      user_id: 'usr_vadivubichem',
      folder_id: null,
      file_name: 'July_Academic_Plan_and_Video_Links.xlsx',
      file_type: 'document',
      file_extension: 'xlsx',
      file_size: 1450000,
      storage_path: 'sample_lesson_notes.txt',
      device: 'Desktop (Windows 11)',
      uploaded_at: '2026-09-06T08:30:00.000Z',
      updated_at: '2026-09-06T08:30:00.000Z',
      is_favorite: true,
      is_trashed: false,
      mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      shared_mode: 'all_teachers',
      owner_name: 'vadivubichem',
      owner_email: 'vadivubichem@gmail.com',
    },
    {
      id: 'fil_june_academic_plan',
      user_id: 'usr_vadivubichem',
      folder_id: null,
      file_name: 'June_Academic_Plan_and_Video_Links.xlsx',
      file_type: 'document',
      file_extension: 'xlsx',
      file_size: 1380000,
      storage_path: 'sample_lesson_notes.txt',
      device: 'Desktop (Windows 11)',
      uploaded_at: '2026-09-06T08:25:00.000Z',
      updated_at: '2026-09-06T08:25:00.000Z',
      is_favorite: true,
      is_trashed: false,
      mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      shared_mode: 'all_teachers',
      owner_name: 'vadivubichem',
      owner_email: 'vadivubichem@gmail.com',
    },
  ];

  const defaultSharing: SharingRecord[] = [
    {
      id: 'shr_1',
      file_id: 'fil_audio_lecture',
      owner_id: 'usr_vadivubichem',
      shared_user_id: 'usr_pssofttech',
      permission: 'view',
      created_at: '2026-09-04T17:00:00.000Z',
      user_email: 'pssofttech@gmail.com',
      user_name: 'pssofttech',
    },
  ];

  const defaultAuditLogs: AuditLog[] = [
    {
      id: 'log_1',
      user_id: 'usr_pssofttech',
      username: 'pssofttech',
      action: 'MOBILE_UPLOAD',
      target_type: 'file',
      target_name: 'Class_12_Lesson_5.mp4',
      device: 'Mobile (Android Phone)',
      ip: '192.168.1.42',
      timestamp: '2026-09-05T14:20:00.000Z',
    },
    {
      id: 'log_2',
      user_id: 'usr_pssofttech',
      username: 'pssofttech',
      action: 'CROSS_DEVICE_LOGIN',
      target_type: 'auth',
      target_name: 'Login from Desktop Computer',
      device: 'Desktop (Windows 11 PC)',
      ip: '192.168.1.105',
      timestamp: '2026-09-05T15:10:00.000Z',
    },
    {
      id: 'log_3',
      user_id: 'usr_admin',
      username: 'admin',
      action: 'SYSTEM_AUDIT',
      target_type: 'user',
      target_name: 'Security scan and quota validation',
      device: 'Desktop (Admin Workstation)',
      ip: '10.0.0.1',
      timestamp: '2026-09-06T01:00:00.000Z',
    },
  ];

  return {
    schools: defaultSchools,
    users: defaultUsers,
    files: defaultFiles.map(f => ({ ...f, schoolId: f.schoolId || 'SCH_PANNAIPURAM' })),
    folders: defaultFolders.map(f => ({ ...f, schoolId: f.schoolId || 'SCH_PANNAIPURAM' })),
    sharing: defaultSharing,
    auditLogs: defaultAuditLogs.map(l => ({ ...l, schoolId: l.schoolId || 'SCH_PANNAIPURAM' })),
  };
}

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed: DatabaseSchema = JSON.parse(raw);

        const initial = getInitialDatabase();
        if (!parsed.schools || parsed.schools.length === 0) {
          parsed.schools = initial.schools;
        }

        // Filter out Riverside from schools
        parsed.schools = parsed.schools.filter(
          (s) => s.id !== 'SCH_RIVERSIDE' && s.code !== 'RIVER-202' && !(s.name || '').includes('Riverside')
        );

        // Migrate Central Model Academy / Central High to Govt Hr Sec School Pannaipuram
        for (let i = 0; i < parsed.schools.length; i++) {
          if (
            parsed.schools[i].id === 'SCH_CENTRAL' ||
            parsed.schools[i].code === 'SCH_CENTRAL' ||
            parsed.schools[i].code === 'CENTRAL-101' ||
            parsed.schools[i].name.includes('Central')
          ) {
            parsed.schools[i] = {
              ...parsed.schools[i],
              id: 'SCH_PANNAIPURAM',
              name: 'Govt Hr Sec School Pannaipuram',
              code: 'STATE-405',
              address: 'Main Road, Pannaipuram, Theni District, Tamil Nadu',
              contact_email: 'admin@ghsspannaipuram.edu',
            };
          }
        }

        // Guarantee Govt Hr Sec School Pannaipuram is in schools
        if (!parsed.schools.some((s) => s.id === 'SCH_PANNAIPURAM')) {
          parsed.schools.unshift({
            id: 'SCH_PANNAIPURAM',
            name: 'Govt Hr Sec School Pannaipuram',
            code: 'STATE-405',
            address: 'Main Road, Pannaipuram, Theni District, Tamil Nadu',
            contact_email: 'admin@ghsspannaipuram.edu',
            storage_quota_bytes: 214748364800,
            created_at: '2026-01-01T00:00:00.000Z',
          });
        }

        // Filter out Riverside users
        parsed.users = parsed.users.filter(
          (u) =>
            u.id !== 'usr_riverside_admin' &&
            u.id !== 'usr_riverside_teacher' &&
            u.schoolId !== 'SCH_RIVERSIDE' &&
            u.school_code !== 'RIVER-202' &&
            !u.email.includes('riverside.edu')
        );

        // Filter out St. John's Higher Secondary School (STJOHN-303)
        if (parsed.schools) {
          parsed.schools = parsed.schools.filter(
            (s) =>
              s.id !== 'SCH_STJOHNS' &&
              s.code !== 'STJOHN-303' &&
              s.code !== 'SCH_STJOHNS' &&
              !(s.name || '').toLowerCase().includes('st. john') &&
              !(s.name || '').toLowerCase().includes('st.john') &&
              s.id !== 'SCH_RIVERSIDE' &&
              s.code !== 'RIVER-202'
          );
        }

        // Filter out permanently deleted user accounts across all devices
        parsed.users = parsed.users.filter(
          (u) =>
            u.id !== 'usr_vasisoft' &&
            !u.email.toLowerCase().includes('vasisoft20815') &&
            !u.email.toLowerCase().includes('vasisoft20818') &&
            !u.username.toLowerCase().includes('vasisoft')
        );
        parsed.files = parsed.files.filter(
          (f) =>
            f.user_id !== 'usr_vasisoft' &&
            !(f.owner_email && (f.owner_email.toLowerCase().includes('vasisoft20815') || f.owner_email.toLowerCase().includes('vasisoft20818')))
        );
        parsed.folders = parsed.folders.filter((fld) => fld.user_id !== 'usr_vasisoft');
        if (parsed.sharing) {
          parsed.sharing = parsed.sharing.filter(
            (s) =>
              s.shared_user_id !== 'usr_vasisoft' &&
              s.owner_id !== 'usr_vasisoft' &&
              !(s.user_email && (s.user_email.toLowerCase().includes('vasisoft20815') || s.user_email.toLowerCase().includes('vasisoft20818')))
          );
        }

        // Backfill and migrate schoolId on legacy users
        parsed.users.forEach((u) => {
          if (!u.schoolId || u.schoolId === 'SCH_CENTRAL') {
            u.schoolId = 'SCH_PANNAIPURAM';
            u.school_name = 'Govt Hr Sec School Pannaipuram';
            u.school_code = 'STATE-405';
          }
          if (u.id === 'usr_pssofttech' || u.username === 'pssofttech') {
            u.role = 'admin';
            u.schoolId = 'SCH_PANNAIPURAM';
            u.school_name = 'Govt Hr Sec School Pannaipuram';
            u.school_code = 'STATE-405';
          }
          if (u.id === 'usr_vadivubichem' || u.username === 'vadivubichem') {
            u.role = 'teacher';
            u.schoolId = 'SCH_PANNAIPURAM';
            u.school_name = 'Govt Hr Sec School Pannaipuram';
            u.school_code = 'STATE-405';
          }
        });

        // Filter Riverside files and folders
        parsed.files = parsed.files.filter((f) => f.schoolId !== 'SCH_RIVERSIDE' && !f.id.includes('riverside'));
        parsed.folders = parsed.folders.filter((fld) => fld.schoolId !== 'SCH_RIVERSIDE' && !fld.id.includes('riverside'));

        parsed.files.forEach((f) => {
          if (!f.schoolId || f.schoolId === 'SCH_CENTRAL') f.schoolId = 'SCH_PANNAIPURAM';
        });
        parsed.folders.forEach((f) => {
          if (!f.schoolId || f.schoolId === 'SCH_CENTRAL') f.schoolId = 'SCH_PANNAIPURAM';
        });
        parsed.auditLogs.forEach((l) => {
          if (!l.schoolId || l.schoolId === 'SCH_CENTRAL') l.schoolId = 'SCH_PANNAIPURAM';
        });

        // Ensure July and June files exist
        const hasJuly = parsed.files.some((f) => f.id === 'fil_july_academic_plan' || f.file_name.toLowerCase().includes('july'));
        const hasJune = parsed.files.some((f) => f.id === 'fil_june_academic_plan' || f.file_name.toLowerCase().includes('june'));

        if (!hasJuly || !hasJune) {
          if (!hasJuly) {
            const julyFile = initial.files.find((f) => f.id === 'fil_july_academic_plan');
            if (julyFile) parsed.files.push(julyFile);
          }
          if (!hasJune) {
            const juneFile = initial.files.find((f) => f.id === 'fil_june_academic_plan');
            if (juneFile) parsed.files.push(juneFile);
          }
        }
        this.save(parsed);

        return parsed;
      }
    } catch (err) {
      console.error('Failed to parse db.json, generating default data:', err);
    }
    const initial = getInitialDatabase();
    this.save(initial);
    return initial;
  }

  private save(dataToSave?: DatabaseSchema) {
    try {
      const data = dataToSave || this.data;
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save to db.json:', err);
    }
  }

  // --- Schools ---
  getSchools(): School[] {
    return this.data.schools || [];
  }

  getSchoolById(id: string): School | undefined {
    return (this.data.schools || []).find(s => s.id === id || s.code === id);
  }

  getSchoolByCode(code: string): School | undefined {
    const clean = code.trim().toUpperCase();
    return (this.data.schools || []).find(s => s.code.toUpperCase() === clean);
  }

  createSchool(school: School): School {
    if (!this.data.schools) this.data.schools = [];
    this.data.schools.push(school);
    this.save();
    return school;
  }

  updateSchool(id: string, updates: Partial<School>): School | undefined {
    if (!this.data.schools) this.data.schools = [];
    const index = this.data.schools.findIndex(s => s.id === id || s.code === id);
    if (index === -1) return undefined;
    this.data.schools[index] = { ...this.data.schools[index], ...updates };
    this.save();
    return this.data.schools[index];
  }

  // --- Users ---
  getUsers(schoolId?: string): StoredUser[] {
    if (schoolId) {
      return this.data.users.filter(u => (u.schoolId || 'SCH_PANNAIPURAM') === schoolId);
    }
    return this.data.users;
  }

  getUserById(id: string): StoredUser | undefined {
    return this.data.users.find(u => u.id === id);
  }

  getUserByEmailOrUsername(identifier: string, schoolId?: string): StoredUser | undefined {
    const clean = identifier.trim().toLowerCase();
    return this.data.users.find(
      u => (u.email.toLowerCase() === clean || u.username.toLowerCase() === clean) &&
           (!schoolId || (u.schoolId || 'SCH_PANNAIPURAM') === schoolId)
    );
  }

  createUser(user: StoredUser): StoredUser {
    this.data.users.push(user);
    this.save();
    return user;
  }

  updateUser(id: string, updates: Partial<StoredUser>): StoredUser | undefined {
    const index = this.data.users.findIndex(u => u.id === id);
    if (index === -1) return undefined;
    this.data.users[index] = { ...this.data.users[index], ...updates };
    this.save();
    return this.data.users[index];
  }

  deleteUser(id: string): boolean {
    const initialLen = this.data.users.length;
    this.data.users = this.data.users.filter(u => u.id !== id);
    this.data.files = this.data.files.filter(f => f.user_id !== id);
    this.data.folders = this.data.folders.filter(f => f.user_id !== id);
    if (this.data.users.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // --- Files ---
  getFiles(schoolId?: string): TeachingFile[] {
    if (schoolId) {
      return this.data.files.filter(f => (f.schoolId || 'SCH_PANNAIPURAM') === schoolId);
    }
    return this.data.files;
  }

  getFileById(id: string): TeachingFile | undefined {
    return this.data.files.find(f => f.id === id);
  }

  getUserFiles(userId: string, role: string, schoolId?: string): TeachingFile[] {
    let files = this.data.files;
    if (schoolId) {
      files = files.filter(f => (f.schoolId || 'SCH_PANNAIPURAM') === schoolId);
    }
    if (role === 'admin') {
      return files;
    }
    // Teacher sees their own files + files shared with all_teachers + files explicitly shared with them
    const sharedWithUserFileIds = new Set(
      this.data.sharing.filter(s => s.shared_user_id === userId).map(s => s.file_id)
    );

    return files.filter(
      f => f.user_id === userId ||
           f.shared_mode === 'all_teachers' ||
           sharedWithUserFileIds.has(f.id)
    );
  }

  createFile(file: TeachingFile): TeachingFile {
    this.data.files.unshift(file);
    // update user storage
    const user = this.getUserById(file.user_id);
    if (user) {
      user.storage_used = (user.storage_used || 0) + file.file_size;
    }
    this.save();
    return file;
  }

  updateFile(id: string, updates: Partial<TeachingFile>): TeachingFile | undefined {
    const index = this.data.files.findIndex(f => f.id === id);
    if (index === -1) return undefined;
    this.data.files[index] = {
      ...this.data.files[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.save();
    return this.data.files[index];
  }

  deleteFile(id: string, permanent: boolean = false): boolean {
    const index = this.data.files.findIndex(f => f.id === id);
    if (index === -1) return false;

    if (!permanent) {
      this.data.files[index].is_trashed = true;
      this.save();
      return true;
    }

    const [removed] = this.data.files.splice(index, 1);
    // subtract storage
    const user = this.getUserById(removed.user_id);
    if (user) {
      user.storage_used = Math.max(0, (user.storage_used || 0) - removed.file_size);
    }
    this.save();
    return true;
  }

  // --- Folders ---
  getFolders(schoolId?: string): Folder[] {
    if (schoolId) {
      return this.data.folders.filter(f => (f.schoolId || 'SCH_PANNAIPURAM') === schoolId);
    }
    return this.data.folders;
  }

  getUserFolders(userId: string, role: string, schoolId?: string): Folder[] {
    let folders = this.data.folders;
    if (schoolId) {
      folders = folders.filter(f => (f.schoolId || 'SCH_PANNAIPURAM') === schoolId);
    }
    if (role === 'admin') {
      return folders;
    }
    return folders.filter(f => f.user_id === userId);
  }

  createFolder(folder: Folder): Folder {
    this.data.folders.push(folder);
    this.save();
    return folder;
  }

  updateFolder(id: string, updates: Partial<Folder>): Folder | undefined {
    const index = this.data.folders.findIndex(f => f.id === id);
    if (index === -1) return undefined;
    this.data.folders[index] = { ...this.data.folders[index], ...updates };
    this.save();
    return this.data.folders[index];
  }

  deleteFolder(id: string): boolean {
    const initialLen = this.data.folders.length;
    this.data.folders = this.data.folders.filter(f => f.id !== id && f.parent_folder_id !== id);
    if (this.data.folders.length !== initialLen) {
      // Move any files in this folder to root or trash
      this.data.files.forEach(f => {
        if (f.folder_id === id) {
          f.folder_id = null;
        }
      });
      this.save();
      return true;
    }
    return false;
  }

  // --- Sharing ---
  getSharingRecords(fileId?: string): SharingRecord[] {
    if (fileId) {
      return this.data.sharing.filter(s => s.file_id === fileId);
    }
    return this.data.sharing;
  }

  addSharingRecord(record: SharingRecord): SharingRecord {
    this.data.sharing.push(record);
    this.save();
    return record;
  }

  removeSharingRecord(id: string): boolean {
    const initial = this.data.sharing.length;
    this.data.sharing = this.data.sharing.filter(s => s.id !== id);
    if (this.data.sharing.length !== initial) {
      this.save();
      return true;
    }
    return false;
  }

  // --- Audit Logs ---
  getAuditLogs(schoolId?: string): AuditLog[] {
    if (schoolId) {
      return this.data.auditLogs.filter(l => (l.schoolId || 'SCH_PANNAIPURAM') === schoolId).slice(0, 50);
    }
    return this.data.auditLogs.slice(0, 50);
  }

  addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): AuditLog {
    const newLog: AuditLog = {
      ...log,
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
    };
    this.data.auditLogs.unshift(newLog);
    if (this.data.auditLogs.length > 200) {
      this.data.auditLogs.pop();
    }
    this.save();
    return newLog;
  }
}

export const db = new Database();
export { UPLOADS_DIR };
