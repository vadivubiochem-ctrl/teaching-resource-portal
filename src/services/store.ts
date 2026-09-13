import type {
  User,
  TeachingFile,
  Folder,
  SystemStats,
  AuditLog,
  UploadProgressItem,
  TeacherPermissions,
  School,
} from '../types.js';
import { DEFAULT_TEACHER_PERMISSIONS } from '../types.js';

// Storage keys
const DB_SCHOOLS_KEY = 'teacher_hub_db_schools_v1';
const DB_USERS_KEY = 'teacher_hub_db_users';
const DB_FILES_KEY = 'teacher_hub_db_files';
const DB_FOLDERS_KEY = 'teacher_hub_db_folders';
const DB_LOGS_KEY = 'teacher_hub_db_logs';
const CURRENT_TOKEN_KEY = 'teacher_hub_token';
const SIMULATED_DEVICE_KEY = 'teacher_hub_simulated_device';

// Default Educational Institutions / Schools
export const DEFAULT_SCHOOLS: School[] = [
  {
    id: 'SCH_PANNAIPURAM',
    code: 'STATE-405',
    name: 'Govt Hr Sec School Pannaipuram',
    address: 'Main Road, Pannaipuram, Theni District, Tamil Nadu',
    contact_email: 'admin@ghsspannaipuram.edu',
    created_at: '2026-01-10T08:00:00.000Z',
    storage_quota_bytes: 214748364800, // 200 GB
    admin_id: 'usr_pssofttech',
  },
  {
    id: 'SCH_STJOHNS',
    code: 'STJOHN-303',
    name: "St. John's Higher Secondary School",
    address: '88 Cathedral Road, South Wing',
    contact_email: 'principal@stjohns.edu',
    created_at: '2026-02-01T09:00:00.000Z',
    storage_quota_bytes: 107374182400, // 100 GB
  },
];

// Default Accounts: State Admin (pssofttech) and State Teacher (vadivubichem)
export const INITIAL_USERS: User[] = [
  {
    id: 'usr_pssofttech',
    schoolId: 'SCH_PANNAIPURAM',
    school_name: 'Govt Hr Sec School Pannaipuram',
    school_code: 'STATE-405',
    username: 'pssofttech',
    email: 'pssofttech@gmail.com',
    role: 'admin',
    status: 'active',
    department: 'Computer Science & System Administration',
    storage_used: 412500000,
    storage_limit: 107374182400, // 100 GB State Admin pool
    created_at: '2026-02-15T11:00:00.000Z',
  },
  {
    id: 'usr_vadivubichem',
    schoolId: 'SCH_PANNAIPURAM',
    school_name: 'Govt Hr Sec School Pannaipuram',
    school_code: 'STATE-405',
    username: 'vadivubichem',
    email: 'vadivubichem@gmail.com',
    role: 'teacher',
    status: 'active',
    department: 'Biochemistry Department',
    storage_used: 356200000,
    storage_limit: 16106127360, // 15 GB State Teacher quota
    created_at: '2026-02-22T08:45:00.000Z',
    permissions: { ...DEFAULT_TEACHER_PERMISSIONS },
  },
  {
    id: 'usr_emal',
    schoolId: 'SCH_PANNAIPURAM',
    school_name: 'Govt Hr Sec School Pannaipuram',
    school_code: 'STATE-405',
    username: 'emal',
    email: 'emal@teacherhub.edu',
    role: 'teacher',
    status: 'active',
    department: 'Science & Computing',
    storage_used: 284160000,
    storage_limit: 16106127360, // 15 GB
    created_at: '2026-02-01T09:30:00.000Z',
    permissions: { ...DEFAULT_TEACHER_PERMISSIONS },
  },
  {
    id: 'usr_vasisoft',
    schoolId: 'SCH_PANNAIPURAM',
    school_name: 'Govt Hr Sec School Pannaipuram',
    school_code: 'STATE-405',
    username: 'vasisoft',
    email: 'vasisoft20815@gmail.com',
    role: 'teacher',
    status: 'active',
    department: 'Mathematics & Advanced Technology',
    storage_used: 198700000,
    storage_limit: 16106127360, // 15 GB
    created_at: '2026-02-20T14:15:00.000Z',
    permissions: { ...DEFAULT_TEACHER_PERMISSIONS },
  },
];

// LocalStorage key for persistent passwords
const DB_PASSWORDS_KEY = 'teacherhub_user_passwords_v1';

const DEFAULT_PASSWORDS: Record<string, string[]> = {
  usr_pssofttech: ['password123', 'pssofttech', 'pssofttech@gmail.com', 'admin', 'admin123'],
  usr_vadivubichem: ['password123', 'vadivubichem', 'vadivubichem@gmail.com', 'vadivubiochem', 'teacher'],
  usr_emal: ['email password', 'emal', 'password123'],
  usr_vasisoft: ['password123', 'vasisoft'],
};

export function getStoredPasswords(): Record<string, string[]> {
  try {
    const raw = localStorage.getItem(DB_PASSWORDS_KEY);
    if (!raw) return { ...DEFAULT_PASSWORDS };
    return { ...DEFAULT_PASSWORDS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_PASSWORDS };
  }
}

export function saveStoredPassword(userId: string, password: string): void {
  try {
    const current = getStoredPasswords();
    if (!current[userId]) current[userId] = [];
    if (!current[userId].includes(password)) {
      current[userId].unshift(password);
    }
    localStorage.setItem(DB_PASSWORDS_KEY, JSON.stringify(current));
    USER_PASSWORDS[userId] = current[userId];
  } catch (e) {
    console.error('Failed to persist user password:', e);
  }
}

// User passwords map (allows flexible matching for smooth user testing)
export const USER_PASSWORDS: Record<string, string[]> = getStoredPasswords();

// Initial Folders
export const INITIAL_FOLDERS: Folder[] = [
  {
    id: 'fld_sci_curriculum',
    schoolId: 'SCH_PANNAIPURAM',
    user_id: 'usr_emal',
    parent_folder_id: null,
    folder_name: 'Science Curriculum (Class 10-12)',
    created_at: '2026-02-05T10:00:00.000Z',
    color: '#6366f1',
    file_count: 5,
  },
  {
    id: 'fld_video_lessons',
    schoolId: 'SCH_PANNAIPURAM',
    user_id: 'usr_emal',
    parent_folder_id: 'fld_sci_curriculum',
    folder_name: 'Recorded Video Lectures',
    created_at: '2026-02-06T11:20:00.000Z',
    color: '#ec4899',
    file_count: 3,
  },
  {
    id: 'fld_cs_modules',
    schoolId: 'SCH_PANNAIPURAM',
    user_id: 'usr_pssofttech',
    parent_folder_id: null,
    folder_name: 'CS Python & Data Structures',
    created_at: '2026-02-16T09:40:00.000Z',
    color: '#10b981',
    file_count: 4,
  },
  {
    id: 'fld_biochem_labs',
    schoolId: 'SCH_PANNAIPURAM',
    user_id: 'usr_vadivubichem',
    parent_folder_id: null,
    folder_name: 'Biochemistry Lab Experiments & Diagrams',
    created_at: '2026-02-23T13:10:00.000Z',
    color: '#06b6d4',
    file_count: 4,
  },
  {
    id: 'fld_math_worksheets',
    schoolId: 'SCH_PANNAIPURAM',
    user_id: 'usr_vasisoft',
    parent_folder_id: null,
    folder_name: 'Calculus & Linear Algebra Worksheets',
    created_at: '2026-02-21T15:00:00.000Z',
    color: '#8b5cf6',
    file_count: 3,
  },
];

// Initial Teaching Files with real working media clips
export const INITIAL_FILES: TeachingFile[] = [
  {
    id: 'file_01_cell_biology',
    schoolId: 'SCH_PANNAIPURAM',
    user_id: 'usr_emal',
    folder_id: 'fld_sci_curriculum',
    file_name: 'Cellular_Respiration_Lesson_Plan.pdf',
    file_type: 'document',
    file_extension: 'pdf',
    file_size: 4823440, // ~4.6 MB
    storage_path: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    device: 'Desktop (Windows 11 PC)',
    uploaded_at: '2026-03-01T08:30:00.000Z',
    updated_at: '2026-03-01T08:30:00.000Z',
    is_favorite: true,
    is_trashed: false,
    mime_type: 'application/pdf',
    shared_mode: 'all_teachers',
    owner_name: 'emal',
    owner_email: 'emal@teacherhub.edu',
  },
  {
    id: 'file_02_physics_video',
    schoolId: 'SCH_PANNAIPURAM',
    user_id: 'usr_emal',
    folder_id: 'fld_video_lessons',
    file_name: 'Electromagnetic_Induction_Lecture.mp4',
    file_type: 'video',
    file_extension: 'mp4',
    file_size: 148576000, // ~141 MB
    storage_path: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    device: 'Mobile (Android Phone)',
    uploaded_at: '2026-03-02T14:15:00.000Z',
    updated_at: '2026-03-02T14:15:00.000Z',
    is_favorite: true,
    is_trashed: false,
    mime_type: 'video/mp4',
    duration: 596,
    thumbnail_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&auto=format&fit=crop&q=60',
    shared_mode: 'all_teachers',
    owner_name: 'emal',
    owner_email: 'emal@teacherhub.edu',
  },
  {
    id: 'file_03_pronunciation_audio',
    schoolId: 'SCH_PANNAIPURAM',
    user_id: 'usr_emal',
    folder_id: 'fld_sci_curriculum',
    file_name: 'Scientific_Nomenclature_Audio_Guide.mp3',
    file_type: 'audio',
    file_extension: 'mp3',
    file_size: 18450000, // ~17.5 MB
    storage_path: 'https://actions.google.com/sounds/v1/ambiences/daytime_forest_bonfire.ogg',
    device: 'Mobile (iPhone 15 Pro)',
    uploaded_at: '2026-03-03T11:05:00.000Z',
    updated_at: '2026-03-03T11:05:00.000Z',
    is_favorite: false,
    is_trashed: false,
    mime_type: 'audio/mpeg',
    duration: 215,
    shared_mode: 'shared_users',
    owner_name: 'emal',
    owner_email: 'emal@teacherhub.edu',
  },
  {
    id: 'file_04_dna_diagram',
    schoolId: 'SCH_PANNAIPURAM',
    user_id: 'usr_vadivubichem',
    folder_id: 'fld_biochem_labs',
    file_name: 'DNA_Replication_Fork_Diagram.png',
    file_type: 'image',
    file_extension: 'png',
    file_size: 8450120, // ~8 MB
    storage_path: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=1000&auto=format&fit=crop&q=80',
    device: 'Desktop (Windows 11 PC)',
    uploaded_at: '2026-03-04T09:20:00.000Z',
    updated_at: '2026-03-04T09:20:00.000Z',
    is_favorite: true,
    is_trashed: false,
    mime_type: 'image/png',
    shared_mode: 'all_teachers',
    owner_name: 'vadivubichem',
    owner_email: 'vadivubichem@gmail.com',
  },
  {
    id: 'file_05_python_cheatsheet',
    schoolId: 'SCH_PANNAIPURAM',
    user_id: 'usr_pssofttech',
    folder_id: 'fld_cs_modules',
    file_name: 'Python_Algorithms_Comprehensive_Notes.docx',
    file_type: 'document',
    file_extension: 'docx',
    file_size: 6120000,
    storage_path: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    device: 'Desktop (MacBook Air)',
    uploaded_at: '2026-03-04T16:40:00.000Z',
    updated_at: '2026-03-04T16:40:00.000Z',
    is_favorite: false,
    is_trashed: false,
    mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    shared_mode: 'all_teachers',
    owner_name: 'pssofttech',
    owner_email: 'pssofttech@gmail.com',
  },
  {
    id: 'file_06_calculus_worksheet',
    schoolId: 'SCH_PANNAIPURAM',
    user_id: 'usr_vasisoft',
    folder_id: 'fld_math_worksheets',
    file_name: 'Integral_Calculus_Practice_Set_2026.pdf',
    file_type: 'document',
    file_extension: 'pdf',
    file_size: 5120000,
    storage_path: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    device: 'Mobile (Android Phone)',
    uploaded_at: '2026-03-05T10:15:00.000Z',
    updated_at: '2026-03-05T10:15:00.000Z',
    is_favorite: true,
    is_trashed: false,
    mime_type: 'application/pdf',
    shared_mode: 'all_teachers',
    owner_name: 'vasisoft',
    owner_email: 'vasisoft20815@gmail.com',
  },
  {
    id: 'file_07_biochem_audio',
    schoolId: 'SCH_PANNAIPURAM',
    user_id: 'usr_vadivubichem',
    folder_id: 'fld_biochem_labs',
    file_name: 'Enzyme_Kinetics_Audio_Walkthrough.mp3',
    file_type: 'audio',
    file_extension: 'mp3',
    file_size: 24500000,
    storage_path: 'https://actions.google.com/sounds/v1/ambiences/daytime_forest_bonfire.ogg',
    device: 'Desktop (Windows 11 PC)',
    uploaded_at: '2026-03-05T13:45:00.000Z',
    updated_at: '2026-03-05T13:45:00.000Z',
    is_favorite: false,
    is_trashed: false,
    mime_type: 'audio/mpeg',
    duration: 340,
    shared_mode: 'shared_users',
    owner_name: 'vadivubichem',
    owner_email: 'vadivubichem@gmail.com',
  },
];

// In-memory and IndexedDB cache for binary files (Blobs / Files) across sessions
const inMemoryBlobCache = new Map<string, Blob>();
const IDB_NAME = 'TeacherResourceHubDB';
const IDB_STORE = 'uploaded_blobs';

function openBlobDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function storeBlob(fileId: string, blob: Blob): Promise<void> {
  // Store immediately in memory cache
  inMemoryBlobCache.set(fileId, blob);

  try {
    const db = await openBlobDB();
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(blob, fileId);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IndexedDB blob storage fallback:', err);
  }
}

export async function getBlob(fileId: string): Promise<Blob | null> {
  // Check in-memory cache first for instant retrieval
  if (inMemoryBlobCache.has(fileId)) {
    return inMemoryBlobCache.get(fileId) || null;
  }

  try {
    const db = await openBlobDB();
    const tx = db.transaction(IDB_STORE, 'readonly');
    const request = tx.objectStore(IDB_STORE).get(fileId);
    return new Promise((resolve) => {
      request.onsuccess = () => {
        const result = request.result || null;
        if (result) {
          inMemoryBlobCache.set(fileId, result);
        }
        resolve(result);
      };
      request.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

// Local Repository Store
export class LocalStore {
  // Educational Institutions / Multi-School Tenancy
  static getSchools(): School[] {
    const raw = localStorage.getItem(DB_SCHOOLS_KEY);
    let parsed: School[];
    if (!raw) {
      parsed = [...DEFAULT_SCHOOLS];
      localStorage.setItem(DB_SCHOOLS_KEY, JSON.stringify(parsed));
      return parsed;
    }
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = [...DEFAULT_SCHOOLS];
    }

    let changed = false;

    // Remove Riverside Collegiate Institute completely
    if (parsed.some((s) => s.id === 'SCH_RIVERSIDE' || s.code === 'RIVER-202' || (s.name || '').includes('Riverside'))) {
      parsed = parsed.filter(
        (s) => s.id !== 'SCH_RIVERSIDE' && s.code !== 'RIVER-202' && !(s.name || '').includes('Riverside')
      );
      changed = true;
    }

    // Migrate Central High to Govt Hr Sec School Pannaipuram
    for (let i = 0; i < parsed.length; i++) {
      if (
        parsed[i].id === 'SCH_CENTRAL' ||
        parsed[i].code === 'CENTRAL-101' ||
        parsed[i].code === 'SCH_CENTRAL' ||
        (parsed[i].name || '').includes('Central High')
      ) {
        parsed[i] = {
          ...parsed[i],
          id: 'SCH_PANNAIPURAM',
          code: 'STATE-405',
          name: 'Govt Hr Sec School Pannaipuram',
          address: 'Main Road, Pannaipuram, Theni District, Tamil Nadu',
          contact_email: 'admin@ghsspannaipuram.edu',
          admin_id: 'usr_pssofttech',
        };
        changed = true;
      }
    }

    // Guarantee default institutions are present
    for (const defSch of DEFAULT_SCHOOLS) {
      if (!parsed.some((s) => s.id === defSch.id)) {
        parsed.unshift(defSch);
        changed = true;
      }
    }

    if (changed) {
      localStorage.setItem(DB_SCHOOLS_KEY, JSON.stringify(parsed));
    }
    return parsed;
  }

  static getSchoolById(id: string): School | undefined {
    return this.getSchools().find((s) => s.id === id);
  }

  static getSchoolByCode(code: string): School | undefined {
    const clean = (code || '').trim().toUpperCase();
    return this.getSchools().find((s) => (s.code || '').trim().toUpperCase() === clean);
  }

  static saveSchools(schools: School[]): void {
    localStorage.setItem(DB_SCHOOLS_KEY, JSON.stringify(schools));
  }

  static registerSchool(data: {
    name: string;
    code: string;
    address?: string;
    contact_email?: string;
    storage_quota_bytes?: number;
    admin_id?: string;
  }): School {
    const schools = this.getSchools();
    const cleanCode = data.code.trim().toUpperCase();
    const existing = schools.find((s) => s.code.toUpperCase() === cleanCode);
    if (existing) {
      throw new Error(`A school with code "${cleanCode}" is already registered (${existing.name}).`);
    }

    const newId = 'SCH_' + cleanCode.replace(/[^A-Z0-9]/g, '_') + '_' + Math.random().toString(36).substring(2, 6).toUpperCase();
    const newSchool: School = {
      id: newId,
      code: cleanCode,
      name: data.name.trim(),
      address: data.address?.trim() || '',
      contact_email: data.contact_email?.trim() || '',
      created_at: new Date().toISOString(),
      storage_quota_bytes: data.storage_quota_bytes || 214748364800, // default 200 GB
      admin_id: data.admin_id,
    };

    schools.push(newSchool);
    this.saveSchools(schools);
    return newSchool;
  }

  static updateSchool(schoolId: string, updates: Partial<School>): School {
    const schools = this.getSchools();
    const index = schools.findIndex((s) => s.id === schoolId);
    if (index === -1) {
      throw new Error(`School with ID "${schoolId}" not found.`);
    }

    // Check code collision if code updated
    if (updates.code) {
      const cleanCode = updates.code.trim().toUpperCase();
      const collision = schools.find((s) => s.id !== schoolId && s.code.toUpperCase() === cleanCode);
      if (collision) {
        throw new Error(`School code "${cleanCode}" is already in use by "${collision.name}".`);
      }
      updates.code = cleanCode;
    }

    schools[index] = {
      ...schools[index],
      ...updates,
    };
    this.saveSchools(schools);

    // Sync school name/code to existing user profiles belonging to this school
    const users = this.getUsers();
    let usersUpdated = false;
    for (const u of users) {
      if (u.schoolId === schoolId) {
        if (updates.name) u.school_name = updates.name;
        if (updates.code) u.school_code = updates.code;
        usersUpdated = true;
      }
    }
    if (usersUpdated) {
      this.saveUsers(users);
    }

    return schools[index];
  }

  static getUsers(): User[] {
    const raw = localStorage.getItem(DB_USERS_KEY);
    let users: User[];
    if (!raw) {
      users = [...INITIAL_USERS];
      localStorage.setItem(DB_USERS_KEY, JSON.stringify(users));
    } else {
      try {
        users = JSON.parse(raw);
      } catch {
        users = [...INITIAL_USERS];
      }
    }

    // Auto-migrate: enforce school assignment & roles
    let modified = false;

    // Filter out obsolete separate admin account if present
    const prevAdminUser = users.find((u) => u.id === 'usr_admin');
    if (prevAdminUser) {
      users = users.filter((u) => u.id !== 'usr_admin');
      modified = true;
    }

    // Filter out Riverside users
    if (
      users.some(
        (u) =>
          u.id === 'usr_riverside_admin' ||
          u.id === 'usr_riverside_teacher' ||
          u.schoolId === 'SCH_RIVERSIDE' ||
          u.school_code === 'RIVER-202' ||
          (u.email || '').toLowerCase() === 'admin@riverside.edu' ||
          (u.email || '').toLowerCase() === 'clara@riverside.edu'
      )
    ) {
      users = users.filter(
        (u) =>
          u.id !== 'usr_riverside_admin' &&
          u.id !== 'usr_riverside_teacher' &&
          u.schoolId !== 'SCH_RIVERSIDE' &&
          u.school_code !== 'RIVER-202' &&
          (u.email || '').toLowerCase() !== 'admin@riverside.edu' &&
          (u.email || '').toLowerCase() !== 'clara@riverside.edu'
      );
      modified = true;
    }

    // Ensure pssofttech exists as State Admin for Govt Hr Sec School Pannaipuram
    let adminUser = users.find(
      (u) =>
        u.id === 'usr_pssofttech' ||
        (u.email || '').toLowerCase() === 'pssofttech@gmail.com' ||
        (u.username || '').toLowerCase() === 'pssofttech'
    );

    if (!adminUser) {
      adminUser = {
        id: 'usr_pssofttech',
        schoolId: 'SCH_PANNAIPURAM',
        school_name: 'Govt Hr Sec School Pannaipuram',
        school_code: 'STATE-405',
        username: 'pssofttech',
        email: 'pssofttech@gmail.com',
        role: 'admin',
        status: 'active',
        department: 'Computer Science & System Administration',
        storage_used: 412500000,
        storage_limit: 107374182400, // 100 GB State Admin pool
        created_at: '2026-02-15T11:00:00.000Z',
      };
      users.unshift(adminUser);
      modified = true;
    } else {
      if (
        adminUser.schoolId !== 'SCH_PANNAIPURAM' ||
        adminUser.school_code !== 'STATE-405' ||
        adminUser.school_name !== 'Govt Hr Sec School Pannaipuram'
      ) {
        adminUser.schoolId = 'SCH_PANNAIPURAM';
        adminUser.school_name = 'Govt Hr Sec School Pannaipuram';
        adminUser.school_code = 'STATE-405';
        modified = true;
      }
      if (adminUser.role !== 'admin') {
        adminUser.role = 'admin';
        modified = true;
      }
      if (adminUser.email !== 'pssofttech@gmail.com') {
        adminUser.email = 'pssofttech@gmail.com';
        modified = true;
      }
      if (!adminUser.storage_limit || adminUser.storage_limit < 50000000000) {
        adminUser.storage_limit = 107374182400; // 100 GB
        modified = true;
      }
      if (adminUser.permissions) {
        delete adminUser.permissions;
        modified = true;
      }
    }

    // Ensure vadivubichem exists as a State Teacher in Govt Hr Sec School Pannaipuram
    let vadivuUser = users.find(
      (u) =>
        u.id === 'usr_vadivubichem' ||
        (u.email || '').toLowerCase() === 'vadivubiochem@gmail.com' ||
        (u.email || '').toLowerCase() === 'vadivubichem@gmail.com' ||
        (u.username || '').toLowerCase() === 'vadivubichem' ||
        (u.username || '').toLowerCase() === 'vadivubiochem'
    );

    if (!vadivuUser) {
      vadivuUser = {
        id: 'usr_vadivubichem',
        schoolId: 'SCH_PANNAIPURAM',
        school_name: 'Govt Hr Sec School Pannaipuram',
        school_code: 'STATE-405',
        username: 'vadivubichem',
        email: 'vadivubichem@gmail.com',
        role: 'teacher',
        status: 'active',
        department: 'Biochemistry Department',
        storage_used: 356200000,
        storage_limit: 16106127360, // 15 GB
        created_at: '2026-02-22T08:45:00.000Z',
        permissions: { ...DEFAULT_TEACHER_PERMISSIONS },
      };
      users.push(vadivuUser);
      modified = true;
    } else {
      if (
        vadivuUser.schoolId !== 'SCH_PANNAIPURAM' ||
        vadivuUser.school_code !== 'STATE-405' ||
        vadivuUser.school_name !== 'Govt Hr Sec School Pannaipuram'
      ) {
        vadivuUser.schoolId = 'SCH_PANNAIPURAM';
        vadivuUser.school_name = 'Govt Hr Sec School Pannaipuram';
        vadivuUser.school_code = 'STATE-405';
        modified = true;
      }
      if (vadivuUser.role !== 'teacher') {
        vadivuUser.role = 'teacher';
        modified = true;
      }
      if (vadivuUser.email !== 'vadivubichem@gmail.com') {
        vadivuUser.email = 'vadivubichem@gmail.com';
        modified = true;
      }
      if (vadivuUser.storage_limit > 50000000000) {
        vadivuUser.storage_limit = 16106127360; // 15 GB
        modified = true;
      }
      if (!vadivuUser.permissions) {
        vadivuUser.permissions = { ...DEFAULT_TEACHER_PERMISSIONS };
        modified = true;
      }
    }

    // Ensure all users have schoolId & school metadata populated
    const schools = this.getSchools();
    for (const u of users) {
      if (!u.schoolId || u.schoolId === 'SCH_CENTRAL') {
        u.schoolId = 'SCH_PANNAIPURAM';
        u.school_name = 'Govt Hr Sec School Pannaipuram';
        u.school_code = 'STATE-405';
        modified = true;
      }
      const school = schools.find((s) => s.id === u.schoolId);
      if (school) {
        if (!u.school_name || u.school_name !== school.name) {
          u.school_name = school.name;
          modified = true;
        }
        if (!u.school_code || u.school_code !== school.code) {
          u.school_code = school.code;
          modified = true;
        }
      }
    }

    if (modified) {
      this.saveUsers(users);
    }
    return users;
  }

  static recalculateStorage(): void {
    const users = this.getUsers();
    const files = this.getFiles().filter((f) => !f.is_trashed);
    for (const u of users) {
      const userFiles = files.filter((f) => f.user_id === u.id);
      u.storage_used = userFiles.reduce((acc, f) => acc + (f.file_size || 0), 0);
    }
    this.saveUsers(users);
  }

  static saveUsers(users: User[]): void {
    localStorage.setItem(DB_USERS_KEY, JSON.stringify(users));
  }

  static getFiles(): TeachingFile[] {
    const raw = localStorage.getItem(DB_FILES_KEY);
    let files: TeachingFile[];
    if (!raw) {
      files = [...INITIAL_FILES];
      localStorage.setItem(DB_FILES_KEY, JSON.stringify(files));
      return files;
    }
    try {
      files = JSON.parse(raw);
    } catch {
      files = [...INITIAL_FILES];
    }

    let changed = false;

    // Filter out Riverside files
    if (files.some((f) => f.schoolId === 'SCH_RIVERSIDE' || f.id.includes('riverside'))) {
      files = files.filter((f) => f.schoolId !== 'SCH_RIVERSIDE' && !f.id.includes('riverside'));
      changed = true;
    }

    // Migration: ensure every file has schoolId SCH_PANNAIPURAM if SCH_CENTRAL or missing
    for (const f of files) {
      if (!f.schoolId || f.schoolId === 'SCH_CENTRAL') {
        f.schoolId = 'SCH_PANNAIPURAM';
        changed = true;
      }
    }
    if (changed) {
      this.saveFiles(files);
    }
    return files;
  }

  static saveFiles(files: TeachingFile[]): void {
    localStorage.setItem(DB_FILES_KEY, JSON.stringify(files));
  }

  static getFolders(): Folder[] {
    const raw = localStorage.getItem(DB_FOLDERS_KEY);
    let folders: Folder[];
    if (!raw) {
      folders = [...INITIAL_FOLDERS];
      localStorage.setItem(DB_FOLDERS_KEY, JSON.stringify(folders));
      return folders;
    }
    try {
      folders = JSON.parse(raw);
    } catch {
      folders = [...INITIAL_FOLDERS];
    }

    let changed = false;

    // Filter out Riverside folders
    if (folders.some((fld) => fld.schoolId === 'SCH_RIVERSIDE' || fld.id.includes('riverside'))) {
      folders = folders.filter((fld) => fld.schoolId !== 'SCH_RIVERSIDE' && !fld.id.includes('riverside'));
      changed = true;
    }

    // Migration: ensure every folder has schoolId SCH_PANNAIPURAM if SCH_CENTRAL or missing
    for (const fld of folders) {
      if (!fld.schoolId || fld.schoolId === 'SCH_CENTRAL') {
        fld.schoolId = 'SCH_PANNAIPURAM';
        changed = true;
      }
    }
    if (changed) {
      this.saveFolders(folders);
    }
    return folders;
  }

  static saveFolders(folders: Folder[]): void {
    localStorage.setItem(DB_FOLDERS_KEY, JSON.stringify(folders));
  }

  static getAuditLogs(): AuditLog[] {
    const raw = localStorage.getItem(DB_LOGS_KEY);
    let logs: AuditLog[];
    if (!raw) {
      const initialLogs: AuditLog[] = [
        {
          id: 'log_01',
          schoolId: 'SCH_PANNAIPURAM',
          user_id: 'usr_vadivubichem',
          username: 'vadivubichem',
          action: 'MOBILE_UPLOAD',
          target_type: 'file',
          target_name: 'Enzyme_Kinetics_Audio_Walkthrough.mp3',
          device: 'Mobile (Android Phone)',
          ip: '192.168.1.45',
          timestamp: '2026-03-05T13:45:00.000Z',
          details: 'Uploaded 24.5 MB audio lecture via mobile browser',
        },
        {
          id: 'log_02',
          schoolId: 'SCH_PANNAIPURAM',
          user_id: 'usr_vasisoft',
          username: 'vasisoft',
          action: 'MOVE_FILE',
          target_type: 'file',
          target_name: 'Integral_Calculus_Practice_Set_2026.pdf',
          device: 'Mobile (Android Phone)',
          ip: '192.168.1.33',
          timestamp: '2026-03-05T10:15:00.000Z',
          details: 'Moved into "Mathematics & Advanced Technology" folder',
        },
        {
          id: 'log_03',
          schoolId: 'SCH_PANNAIPURAM',
          user_id: 'usr_pssofttech',
          username: 'pssofttech',
          action: 'RENAME_FILE',
          target_type: 'file',
          target_name: 'Python_Algorithms_Comprehensive_Notes.docx',
          device: 'Desktop (MacBook Air)',
          ip: '192.168.1.18',
          timestamp: '2026-03-04T16:40:00.000Z',
          details: 'Renamed from "Python_Algorithms_v1_draft.docx"',
        },
        {
          id: 'log_04',
          schoolId: 'SCH_PANNAIPURAM',
          user_id: 'usr_vadivubichem',
          username: 'vadivubichem',
          action: 'DESKTOP_UPLOAD',
          target_type: 'file',
          target_name: 'DNA_Replication_Fork_Diagram.png',
          device: 'Desktop (Windows 11 PC)',
          ip: '192.168.1.45',
          timestamp: '2026-03-04T09:20:00.000Z',
          details: 'High-resolution diagram uploaded to Biochemistry Lab Experiments',
        },
        {
          id: 'log_05',
          schoolId: 'SCH_PANNAIPURAM',
          user_id: 'usr_emal',
          username: 'emal',
          action: 'MOVE_TO_TRASH',
          target_type: 'file',
          target_name: 'Old_Curriculum_Syllabus_2024.pdf',
          device: 'Desktop (Windows PC)',
          ip: '192.168.1.12',
          timestamp: '2026-03-03T17:15:00.000Z',
          details: 'Moved obsolete syllabus file to Trash folder',
        },
        {
          id: 'log_06',
          schoolId: 'SCH_PANNAIPURAM',
          user_id: 'usr_emal',
          username: 'emal',
          action: 'BATCH_MOVE_FILES',
          target_type: 'file',
          target_name: '3 file(s) moved',
          device: 'Desktop (Windows PC)',
          ip: '192.168.1.12',
          timestamp: '2026-03-03T14:30:00.000Z',
          details: 'Moved to "Science Curriculum (Class 10-12)": Physics_Notes.pdf, Chem_Guide.pdf, Bio_Review.docx',
        },
        {
          id: 'log_07',
          schoolId: 'SCH_PANNAIPURAM',
          user_id: 'usr_pssofttech',
          username: 'pssofttech',
          action: 'CREATE_FOLDER',
          target_type: 'folder',
          target_name: 'CS Python & Data Structures',
          device: 'Desktop (MacBook Air)',
          ip: '192.168.1.18',
          timestamp: '2026-03-02T11:00:00.000Z',
          details: 'Created departmental organizational folder',
        },
        {
          id: 'log_08',
          schoolId: 'SCH_PANNAIPURAM',
          user_id: 'usr_pssofttech',
          username: 'pssofttech',
          action: 'DELETE_FILE_PERMANENT',
          target_type: 'file',
          target_name: 'Temporary_Upload_Scan_Temp.bin',
          device: 'Desktop (Admin Workstation)',
          ip: '10.0.0.1',
          timestamp: '2026-03-02T08:20:00.000Z',
          details: 'Purged corrupted temporary buffer during maintenance cycle',
        },
        {
          id: 'log_09',
          schoolId: 'SCH_PANNAIPURAM',
          user_id: 'usr_emal',
          username: 'emal',
          action: 'DESKTOP_UPLOAD',
          target_type: 'file',
          target_name: 'Photosynthesis_Cellular_Respiration_Lesson.mp4',
          device: 'Desktop (Windows 11 PC)',
          ip: '192.168.1.12',
          timestamp: '2026-03-01T15:30:00.000Z',
          details: 'Uploaded 45.2 MB high-definition video lecture',
        },
        {
          id: 'log_10',
          schoolId: 'SCH_PANNAIPURAM',
          user_id: 'usr_vadivubichem',
          username: 'vadivubichem',
          action: 'LOGIN',
          target_type: 'auth',
          target_name: 'Successful login via Desktop (Windows 11 PC)',
          device: 'Desktop (Windows 11 PC)',
          ip: '192.168.1.45',
          timestamp: '2026-03-01T08:45:00.000Z',
          details: 'Teacher credentials verified and active session opened',
        },
      ];
      localStorage.setItem(DB_LOGS_KEY, JSON.stringify(initialLogs));
      return initialLogs;
    }
    try {
      logs = JSON.parse(raw);
    } catch {
      return [];
    }

    let changed = false;
    for (const lg of logs) {
      if (!lg.schoolId || lg.schoolId === 'SCH_CENTRAL') {
        lg.schoolId = 'SCH_PANNAIPURAM';
        changed = true;
      }
    }
    if (changed) {
      localStorage.setItem(DB_LOGS_KEY, JSON.stringify(logs));
    }
    return logs;
  }

  static addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'> & { schoolId?: string }): void {
    const logs = this.getAuditLogs();
    const sessionUser = this.getSessionUser();
    const schoolId = log.schoolId || sessionUser?.schoolId || 'SCH_PANNAIPURAM';

    const newLog: AuditLog = {
      ...log,
      schoolId,
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
    };
    logs.unshift(newLog);
    if (logs.length > 200) logs.pop();
    localStorage.setItem(DB_LOGS_KEY, JSON.stringify(logs));
  }

  static getSessionUser(): User | null {
    const token = localStorage.getItem(CURRENT_TOKEN_KEY);
    if (!token) return null;
    const users = this.getUsers();
    const user = users.find((u) => u.id === token);
    return user || null;
  }

  static setSessionUser(userId: string): void {
    localStorage.setItem(CURRENT_TOKEN_KEY, userId);
  }

  static clearSession(): void {
    localStorage.removeItem(CURRENT_TOKEN_KEY);
  }

  static getSimulatedDevice(): string {
    const saved = localStorage.getItem(SIMULATED_DEVICE_KEY);
    if (saved) return saved;
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('iphone')) return 'Mobile (iPhone)';
    if (ua.includes('android')) return 'Mobile (Android Phone)';
    if (ua.includes('macintosh')) return 'Desktop (MacBook)';
    if (ua.includes('windows')) return 'Desktop (Windows PC)';
    return 'Desktop (Windows 11 PC)';
  }

  static setSimulatedDevice(device: string): void {
    localStorage.setItem(SIMULATED_DEVICE_KEY, device);
  }
}
