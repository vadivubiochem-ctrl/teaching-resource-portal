import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  onSnapshot,
  writeBatch,
  query,
  where,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import type { TeachingFile, Folder, User, AuditLog, School } from '../types.js';

// Initialize Firebase App & Firestore
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);

export const COLLECTIONS = {
  FILES: 'files',
  FOLDERS: 'folders',
  USERS: 'users',
  AUDIT_LOGS: 'auditLogs',
  SCHOOLS: 'schools',
  DELETED_USERS: 'deletedUsers',
} as const;

/**
 * Convert file into Base64 data URL for direct online Firestore persistence (if <= 750KB)
 */
export async function fileToBase64(file: File): Promise<string | undefined> {
  // Max document size in Firestore is 1MB. We cap at 750KB to leave room for metadata
  if (file.size > 750 * 1024) {
    return undefined;
  }
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(typeof reader.result === 'string' ? reader.result : undefined);
    };
    reader.onerror = () => resolve(undefined);
    reader.readAsDataURL(file);
  });
}

/**
 * Online Database API for Files, Folders, Users & Multi-Tenant Schools
 */
export const onlineDb = {
  // Save or update a file in the Firestore database
  async saveFile(file: TeachingFile): Promise<void> {
    try {
      const fileRef = doc(db, COLLECTIONS.FILES, file.id);
      // Clean undefined fields for Firestore
      const cleanData = Object.fromEntries(
        Object.entries(file).filter(([_, v]) => v !== undefined)
      );
      await setDoc(fileRef, cleanData, { merge: true });
    } catch (err) {
      console.warn('Firestore saveFile error (offline or network fallback):', err);
    }
  },

  // Batch save multiple files (e.g. initial seed sync)
  async saveFilesBatch(files: TeachingFile[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      for (const file of files) {
        const fileRef = doc(db, COLLECTIONS.FILES, file.id);
        const cleanData = Object.fromEntries(
          Object.entries(file).filter(([_, v]) => v !== undefined)
        );
        batch.set(fileRef, cleanData, { merge: true });
      }
      await batch.commit();
    } catch (err) {
      console.warn('Firestore saveFilesBatch error:', err);
    }
  },

  // Fetch files from Firestore online database (scoped to schoolId if provided)
  async getFiles(schoolId?: string): Promise<TeachingFile[]> {
    try {
      const colRef = collection(db, COLLECTIONS.FILES);
      const q = schoolId ? query(colRef, where('schoolId', '==', schoolId)) : colRef;
      const snapshot = await getDocs(q);
      const files: TeachingFile[] = [];
      snapshot.forEach((docSnap) => {
        files.push(docSnap.data() as TeachingFile);
      });
      return files;
    } catch (err) {
      console.warn('Firestore getFiles error:', err);
      return [];
    }
  },

  // Delete file from Firestore online database
  async deleteFile(id: string): Promise<void> {
    try {
      const fileRef = doc(db, COLLECTIONS.FILES, id);
      await deleteDoc(fileRef);
    } catch (err) {
      console.warn('Firestore deleteFile error:', err);
    }
  },

  // Update file fields in Firestore
  async updateFile(id: string, updates: Partial<TeachingFile>): Promise<void> {
    try {
      const fileRef = doc(db, COLLECTIONS.FILES, id);
      const cleanUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, v]) => v !== undefined)
      );
      await updateDoc(fileRef, cleanUpdates);
    } catch (err) {
      console.warn('Firestore updateFile error:', err);
    }
  },

  // Real-time listener for files (scoped to schoolId if provided)
  subscribeFiles(onUpdate: (files: TeachingFile[]) => void, schoolId?: string): () => void {
    try {
      const colRef = collection(db, COLLECTIONS.FILES);
      const q = schoolId ? query(colRef, where('schoolId', '==', schoolId)) : colRef;
      return onSnapshot(
        q,
        (snapshot) => {
          const files: TeachingFile[] = [];
          snapshot.forEach((docSnap) => {
            files.push(docSnap.data() as TeachingFile);
          });
          onUpdate(files);
        },
        (error) => {
          console.warn('Firestore files subscription error:', error);
        }
      );
    } catch (err) {
      console.warn('Firestore subscribeFiles initialization error:', err);
      return () => {};
    }
  },

  // Folders
  async saveFolder(folder: Folder): Promise<void> {
    try {
      const folderRef = doc(db, COLLECTIONS.FOLDERS, folder.id);
      const cleanData = Object.fromEntries(
        Object.entries(folder).filter(([_, v]) => v !== undefined)
      );
      await setDoc(folderRef, cleanData, { merge: true });
    } catch (err) {
      console.warn('Firestore saveFolder error:', err);
    }
  },

  async getFolders(schoolId?: string): Promise<Folder[]> {
    try {
      const colRef = collection(db, COLLECTIONS.FOLDERS);
      const q = schoolId ? query(colRef, where('schoolId', '==', schoolId)) : colRef;
      const snapshot = await getDocs(q);
      const folders: Folder[] = [];
      snapshot.forEach((docSnap) => {
        folders.push(docSnap.data() as Folder);
      });
      return folders;
    } catch (err) {
      console.warn('Firestore getFolders error:', err);
      return [];
    }
  },

  async deleteFolder(id: string): Promise<void> {
    try {
      const folderRef = doc(db, COLLECTIONS.FOLDERS, id);
      await deleteDoc(folderRef);
    } catch (err) {
      console.warn('Firestore deleteFolder error:', err);
    }
  },

  subscribeFolders(onUpdate: (folders: Folder[]) => void, schoolId?: string): () => void {
    try {
      const colRef = collection(db, COLLECTIONS.FOLDERS);
      const q = schoolId ? query(colRef, where('schoolId', '==', schoolId)) : colRef;
      return onSnapshot(
        q,
        (snapshot) => {
          const folders: Folder[] = [];
          snapshot.forEach((docSnap) => {
            folders.push(docSnap.data() as Folder);
          });
          onUpdate(folders);
        },
        (error) => {
          console.warn('Firestore folders subscription error:', error);
        }
      );
    } catch (err) {
      console.warn('Firestore subscribeFolders initialization error:', err);
      return () => {};
    }
  },

  // Users & Storage sync
  async saveUser(user: User): Promise<void> {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, user.id);
      const cleanData = Object.fromEntries(
        Object.entries(user).filter(([_, v]) => v !== undefined)
      );
      await setDoc(userRef, cleanData, { merge: true });
    } catch (err) {
      console.warn('Firestore saveUser error:', err);
    }
  },

  async saveUsersBatch(users: User[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      for (const u of users) {
        const uRef = doc(db, COLLECTIONS.USERS, u.id);
        const cleanData = Object.fromEntries(
          Object.entries(u).filter(([_, v]) => v !== undefined)
        );
        batch.set(uRef, cleanData, { merge: true });
      }
      await batch.commit();
    } catch (err) {
      console.warn('Firestore saveUsersBatch error:', err);
    }
  },

  // Record a permanently deleted user in Firestore so all other devices (mobile/desktop) purge it immediately
  async recordDeletedUser(tombstone: { id: string; email?: string; username?: string; deletedAt?: string }): Promise<void> {
    try {
      const tombRef = doc(db, COLLECTIONS.DELETED_USERS, tombstone.id);
      await setDoc(
        tombRef,
        {
          id: tombstone.id,
          email: (tombstone.email || '').toLowerCase().trim(),
          username: (tombstone.username || '').toLowerCase().trim(),
          deletedAt: tombstone.deletedAt || new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('Firestore recordDeletedUser error:', err);
    }
  },

  async getDeletedUsers(): Promise<{ id: string; email?: string; username?: string; deletedAt?: string }[]> {
    try {
      const colRef = collection(db, COLLECTIONS.DELETED_USERS);
      const snapshot = await getDocs(colRef);
      const list: { id: string; email?: string; username?: string; deletedAt?: string }[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as any);
      });
      return list;
    } catch (err) {
      console.warn('Firestore getDeletedUsers error:', err);
      return [];
    }
  },

  subscribeDeletedUsers(onUpdate: (deletedUsers: { id: string; email?: string; username?: string }[]) => void): () => void {
    try {
      const colRef = collection(db, COLLECTIONS.DELETED_USERS);
      return onSnapshot(
        colRef,
        (snapshot) => {
          const list: { id: string; email?: string; username?: string }[] = [];
          snapshot.forEach((docSnap) => {
            list.push(docSnap.data() as any);
          });
          onUpdate(list);
        },
        (error) => {
          console.warn('Firestore deletedUsers subscription error:', error);
        }
      );
    } catch (err) {
      console.warn('Firestore subscribeDeletedUsers error:', err);
      return () => {};
    }
  },

  async deleteUser(id: string, email?: string, username?: string): Promise<void> {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, id);
      await deleteDoc(userRef);
      // Automatically record tombstone in deletedUsers collection in Firestore
      await this.recordDeletedUser({ id, email, username });
    } catch (err) {
      console.warn('Firestore deleteUser error:', err);
    }
  },

  async getUsers(schoolId?: string): Promise<User[]> {
    try {
      const colRef = collection(db, COLLECTIONS.USERS);
      const q = schoolId ? query(colRef, where('schoolId', '==', schoolId)) : colRef;
      const snapshot = await getDocs(q);
      const users: User[] = [];
      snapshot.forEach((docSnap) => {
        users.push(docSnap.data() as User);
      });
      return users;
    } catch (err) {
      console.warn('Firestore getUsers error:', err);
      return [];
    }
  },

  subscribeUsers(onUpdate: (users: User[]) => void, schoolId?: string): () => void {
    try {
      const colRef = collection(db, COLLECTIONS.USERS);
      const q = schoolId ? query(colRef, where('schoolId', '==', schoolId)) : colRef;
      return onSnapshot(
        q,
        (snapshot) => {
          const users: User[] = [];
          snapshot.forEach((docSnap) => {
            users.push(docSnap.data() as User);
          });
          onUpdate(users);
        },
        (error) => {
          console.warn('Firestore users subscription error:', error);
        }
      );
    } catch (err) {
      console.warn('Firestore subscribeUsers error:', err);
      return () => {};
    }
  },

  // Schools Multi-Tenancy
  async saveSchool(school: School): Promise<void> {
    try {
      const schoolRef = doc(db, COLLECTIONS.SCHOOLS, school.id);
      const cleanData = Object.fromEntries(
        Object.entries(school).filter(([_, v]) => v !== undefined)
      );
      await setDoc(schoolRef, cleanData, { merge: true });
    } catch (err) {
      console.warn('Firestore saveSchool error:', err);
    }
  },

  async getSchools(): Promise<School[]> {
    try {
      const colRef = collection(db, COLLECTIONS.SCHOOLS);
      const snapshot = await getDocs(colRef);
      const schools: School[] = [];
      snapshot.forEach((docSnap) => {
        schools.push(docSnap.data() as School);
      });
      return schools;
    } catch (err) {
      console.warn('Firestore getSchools error:', err);
      return [];
    }
  },

  async deleteSchool(id: string): Promise<void> {
    try {
      const schoolRef = doc(db, COLLECTIONS.SCHOOLS, id);
      await deleteDoc(schoolRef);
    } catch (err) {
      console.warn('Firestore deleteSchool error:', err);
    }
  },

  // Audit Logs
  async saveAuditLog(log: AuditLog): Promise<void> {
    try {
      const logRef = doc(db, COLLECTIONS.AUDIT_LOGS, log.id);
      const cleanData = Object.fromEntries(
        Object.entries(log).filter(([_, v]) => v !== undefined)
      );
      await setDoc(logRef, cleanData, { merge: true });
    } catch (err) {
      console.warn('Firestore saveAuditLog error:', err);
    }
  },
};
