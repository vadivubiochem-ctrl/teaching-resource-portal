import express, { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { db, UPLOADS_DIR, StoredUser } from './db.js';
import {
  createSessionToken,
  revokeSessionToken,
  AuthenticatedRequest,
  requireAuth,
  requireAdmin,
} from './auth.js';
import type { TeachingFile, FileCategory, Folder, SharingRecord } from '../src/types.js';

const router = Router();

// Configure Multer storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const safeName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${safeName}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 1024 * 1024 * 1024, // 1 GB max per file
  },
});

function getFileCategory(filename: string, mimeType: string): FileCategory {
  const ext = path.extname(filename).toLowerCase().replace('.', '');
  const videoExts = ['mp4', 'webm', 'mov', 'avi', 'mkv', 'flv', 'm4v', '3gp'];
  const audioExts = ['mp3', 'wav', 'm4a', 'aac', 'ogg', 'flac', 'wma'];
  const docExts = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf', 'csv', 'md'];
  const imgExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'];

  if (videoExts.includes(ext) || mimeType.startsWith('video/')) return 'video';
  if (audioExts.includes(ext) || mimeType.startsWith('audio/')) return 'audio';
  if (imgExts.includes(ext) || mimeType.startsWith('image/')) return 'image';
  if (docExts.includes(ext) || mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('sheet') || mimeType.includes('text/')) return 'document';
  return 'other';
}

function detectDevice(req: express.Request): string {
  const customHeader = req.headers['x-client-device'];
  if (customHeader) return String(customHeader);

  const ua = (req.headers['user-agent'] || '').toLowerCase();
  if (ua.includes('iphone')) return 'Mobile (iPhone)';
  if (ua.includes('ipad')) return 'Tablet (iPad)';
  if (ua.includes('android')) {
    if (ua.includes('mobile')) return 'Mobile (Android Phone)';
    return 'Tablet (Android)';
  }
  if (ua.includes('macintosh') || ua.includes('mac os')) return 'Desktop (MacBook)';
  if (ua.includes('windows')) return 'Desktop (Windows PC)';
  if (ua.includes('linux')) return 'Desktop (Linux)';
  return 'Desktop (Computer)';
}

function sanitizeUser(user: StoredUser) {
  const { password_hash, ...safe } = user;
  return safe;
}

// ---------------- AUTH ROUTES ----------------

router.post('/auth/login', (req, res) => {
  const { identifier, password, device } = req.body;

  if (!identifier || !password) {
    res.status(400).json({ error: 'Username/Email and Password are required.' });
    return;
  }

  const user = db.getUserByEmailOrUsername(identifier);
  if (!user) {
    res.status(401).json({ error: 'Invalid credentials. User not found.' });
    return;
  }

  if (user.status === 'suspended') {
    res.status(403).json({ error: 'Your account is suspended. Please contact the administrator.' });
    return;
  }

  const isPasswordValid = bcrypt.compareSync(password, user.password_hash);
  if (!isPasswordValid) {
    res.status(401).json({ error: 'Invalid username or password.' });
    return;
  }

  const clientDevice = device || detectDevice(req);
  const token = createSessionToken(user.id);

  db.addAuditLog({
    user_id: user.id,
    username: user.username,
    action: 'LOGIN',
    target_type: 'auth',
    target_name: `Successful login via ${clientDevice}`,
    device: clientDevice,
    ip: req.ip || '127.0.0.1',
  });

  res.json({
    token,
    user: sanitizeUser(user),
  });
});

router.post('/auth/logout', requireAuth, (req: AuthenticatedRequest, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    revokeSessionToken(authHeader.substring(7));
  }
  res.json({ success: true });
});

router.get('/auth/me', requireAuth, (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  res.json({ user: sanitizeUser(req.user) });
});

router.post('/auth/quick-switch', (req, res) => {
  const { userId, email, username, device } = req.body;
  let user: StoredUser | undefined;

  if (userId) {
    user = db.getUserById(userId);
  } else if (email) {
    user = db.getUserByEmailOrUsername(email);
  } else if (username) {
    user = db.getUserByEmailOrUsername(username);
  }

  if (!user) {
    res.status(404).json({ error: 'User account not found.' });
    return;
  }

  const clientDevice = device || detectDevice(req);
  const token = createSessionToken(user.id);

  db.addAuditLog({
    user_id: user.id,
    username: user.username,
    action: 'QUICK_SWITCH_USER',
    target_type: 'auth',
    target_name: `Quick switched user account to ${user.username}`,
    device: clientDevice,
    ip: req.ip || '127.0.0.1',
  });

  res.json({
    token,
    user: sanitizeUser(user),
  });
});

router.post('/auth/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: 'Email address is required.' });
    return;
  }
  const user = db.getUserByEmailOrUsername(email);
  if (!user) {
    res.status(404).json({ error: 'No account found with this email address.' });
    return;
  }
  res.json({
    success: true,
    message: `Password reset verification link and temporary PIN have been prepared for ${email}. For demonstration, administrator or quick reset can be applied directly.`,
    demoResetPin: '849201',
  });
});

router.post('/auth/reset-password', (req, res) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) {
    res.status(400).json({ error: 'Email and new password are required.' });
    return;
  }
  const user = db.getUserByEmailOrUsername(email);
  if (!user) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }
  const salt = bcrypt.genSaltSync(10);
  const newHash = bcrypt.hashSync(newPassword, salt);
  db.updateUser(user.id, { password_hash: newHash });

  res.json({ success: true, message: 'Password has been updated successfully. Please log in.' });
});

// ---------------- FILES ROUTES ----------------

router.get('/files', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  let files = db.getUserFiles(user.id, user.role);

  const { type, folderId, favorite, recent, trash, search } = req.query;

  // Trashed filter
  if (trash === 'true') {
    files = files.filter(f => f.is_trashed);
  } else {
    files = files.filter(f => !f.is_trashed);
  }

  // Type filter
  if (type && typeof type === 'string' && type !== 'all') {
    files = files.filter(f => f.file_type === type);
  }

  // Folder filter
  if (folderId !== undefined && folderId !== 'all') {
    if (folderId === 'root') {
      files = files.filter(f => f.folder_id === null);
    } else {
      files = files.filter(f => f.folder_id === folderId);
    }
  }

  // Favorite filter
  if (favorite === 'true') {
    files = files.filter(f => f.is_favorite);
  }

  // Recent filter
  if (recent === 'true') {
    files = [...files].sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime());
  }

  // Search filter
  if (search && typeof search === 'string' && search.trim().length > 0) {
    const q = search.trim().toLowerCase();
    files = files.filter(f =>
      f.file_name.toLowerCase().includes(q) ||
      f.file_extension.toLowerCase().includes(q) ||
      (f.owner_name && f.owner_name.toLowerCase().includes(q))
    );
  }

  res.json({ files });
});

function getOrCreateVirtualCategoryFolder(userId: string, category: string): { id: string; name: string } {
  const categoryMap: Record<string, { name: string; color: string }> = {
    document: { name: 'Documents', color: '#3B82F6' },
    image: { name: 'Images', color: '#8B5CF6' },
    video: { name: 'Videos', color: '#EF4444' },
    audio: { name: 'Audio', color: '#10B981' },
    other: { name: 'Documents', color: '#3B82F6' },
  };

  const config = categoryMap[category] || categoryMap.document;
  const folders = db.getFolders();
  let folder = folders.find(f => f.user_id === userId && f.folder_name.toLowerCase() === config.name.toLowerCase());
  if (!folder) {
    folder = folders.find(f => f.folder_name.toLowerCase() === config.name.toLowerCase());
  }

  if (!folder) {
    const newFld: Folder = {
      id: 'fld_' + config.name.toLowerCase() + '_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      user_id: userId,
      parent_folder_id: null,
      folder_name: config.name,
      color: config.color,
      created_at: new Date().toISOString(),
      file_count: 0,
    };
    db.createFolder(newFld);
    return { id: newFld.id, name: newFld.folder_name };
  }

  return { id: folder.id, name: folder.folder_name };
}

router.post('/files/upload', requireAuth, upload.array('files'), (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const files = req.files as Express.Multer.File[];
  const folderId = req.body.folder_id ? String(req.body.folder_id) : null;
  const clientDevice = req.body.device || detectDevice(req);

  if (!files || files.length === 0) {
    res.status(400).json({ error: 'No files uploaded.' });
    return;
  }

  const uploadedFiles: TeachingFile[] = [];

  for (const f of files) {
    const ext = path.extname(f.originalname).replace('.', '').toLowerCase();
    const category = getFileCategory(f.originalname, f.mimetype);

    // Auto-categorize: detect file type during upload and route to corresponding virtual folder if not specifically targeted
    let targetFolderId = folderId === 'root' || !folderId ? null : folderId;
    let targetFolderName = 'Root Directory';
    if (!targetFolderId) {
      const virtualFolder = getOrCreateVirtualCategoryFolder(user.id, category);
      targetFolderId = virtualFolder.id;
      targetFolderName = virtualFolder.name;
    }

    // Approximate duration for videos/audios if not available
    let duration: number | undefined;
    if (category === 'video') duration = 600; // default 10m
    if (category === 'audio') duration = 300; // default 5m

    const newFile: TeachingFile = {
      id: 'fil_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      user_id: user.id,
      folder_id: targetFolderId,
      file_name: f.originalname,
      file_type: category,
      file_extension: ext || 'bin',
      file_size: f.size,
      storage_path: f.filename,
      device: clientDevice,
      uploaded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_favorite: false,
      is_trashed: false,
      mime_type: f.mimetype || 'application/octet-stream',
      shared_mode: 'private',
      duration,
      owner_name: user.username,
      owner_email: user.email,
    };

    db.createFile(newFile);
    uploadedFiles.push(newFile);

    db.addAuditLog({
      user_id: user.id,
      username: user.username,
      action: 'AUTO_CATEGORIZE_UPLOAD',
      target_type: 'file',
      target_name: f.originalname,
      device: clientDevice,
      ip: req.ip || '127.0.0.1',
      details: `Auto-detected "${category}" and moved into virtual folder "${targetFolderName}"`,
    });
  }

  res.status(201).json({
    message: `Successfully uploaded ${uploadedFiles.length} file(s) to central cloud storage.`,
    files: uploadedFiles,
  });
});

router.get('/files/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const file = db.getFileById(req.params.id);
  if (!file) {
    res.status(404).json({ error: 'File not found.' });
    return;
  }
  res.json({ file });
});

router.get('/files/:id/download', (req, res) => {
  let file = db.getFileById(req.params.id);
  if (!file) {
    const all = db.getFiles();
    file = all.find((f) => f.id === req.params.id || f.file_name === req.params.id || f.storage_path === req.params.id);
  }

  if (file) {
    const filePath = path.join(UPLOADS_DIR, file.storage_path);
    if (fs.existsSync(filePath)) {
      res.download(filePath, file.file_name);
      return;
    }
  }

  // Also check if req.params.id is directly a file in UPLOADS_DIR
  const directPath = path.join(UPLOADS_DIR, req.params.id);
  if (fs.existsSync(directPath)) {
    res.download(directPath, req.params.id);
    return;
  }

  if (file) {
    // Generate fallback dynamic content if physical file was cleared
    res.setHeader('Content-Disposition', `attachment; filename="${file.file_name}"`);
    res.setHeader('Content-Type', file.mime_type || 'application/octet-stream');
    res.send(`Educational Resource: ${file.file_name}\nUploaded by: ${file.owner_name || 'Teacher'} (${file.owner_email || 'teacher@hub'})\nType: ${file.file_type}\nCreated via Teacher Resource Hub central storage.`);
    return;
  }

  res.status(404).json({ error: 'File not found.' });
});

// Stream endpoint with Range Support (HTTP 206) for video and audio playback
router.get('/files/:id/stream', (req, res) => {
  const file = db.getFileById(req.params.id);
  if (!file) {
    res.status(404).json({ error: 'Media file not found.' });
    return;
  }

  const filePath = path.join(UPLOADS_DIR, file.storage_path);
  if (!fs.existsSync(filePath)) {
    // If demo file doesn't exist on disk, return sample payload
    res.setHeader('Content-Type', file.mime_type);
    res.send(Buffer.from('Teacher Resource Hub Sample Stream'));
    return;
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = end - start + 1;
    const stream = fs.createReadStream(filePath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': file.mime_type,
    };
    res.writeHead(206, head);
    stream.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': file.mime_type,
      'Accept-Ranges': 'bytes',
    };
    res.writeHead(200, head);
    fs.createReadStream(filePath).pipe(res);
  }
});

router.patch('/files/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const file = db.getFileById(req.params.id);

  if (!file) {
    res.status(404).json({ error: 'File not found.' });
    return;
  }

  if (user.role !== 'admin' && file.user_id !== user.id) {
    res.status(403).json({ error: 'You do not have permission to modify this file.' });
    return;
  }

  const allowedUpdates: Partial<TeachingFile> = {};
  if (req.body.file_name !== undefined) allowedUpdates.file_name = String(req.body.file_name);
  if (req.body.folder_id !== undefined) allowedUpdates.folder_id = req.body.folder_id === 'root' ? null : req.body.folder_id;
  if (req.body.is_favorite !== undefined) allowedUpdates.is_favorite = Boolean(req.body.is_favorite);
  if (req.body.is_trashed !== undefined) allowedUpdates.is_trashed = Boolean(req.body.is_trashed);
  if (req.body.shared_mode !== undefined) allowedUpdates.shared_mode = req.body.shared_mode;

  const updated = db.updateFile(file.id, allowedUpdates);
  res.json({ file: updated });
});

router.delete('/files/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const file = db.getFileById(req.params.id);

  if (!file) {
    res.status(404).json({ error: 'File not found.' });
    return;
  }

  if (user.role !== 'admin' && file.user_id !== user.id) {
    res.status(403).json({ error: 'You do not have permission to delete this file.' });
    return;
  }

  const permanent = req.query.permanent === 'true';
  db.deleteFile(file.id, permanent);

  db.addAuditLog({
    user_id: user.id,
    username: user.username,
    action: permanent ? 'PERMANENT_DELETE' : 'TRASH_FILE',
    target_type: 'file',
    target_name: file.file_name,
    device: detectDevice(req),
    ip: req.ip || '127.0.0.1',
  });

  res.json({ success: true, permanent });
});

router.post('/files/:id/copy', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const original = db.getFileById(req.params.id);

  if (!original) {
    res.status(404).json({ error: 'File not found.' });
    return;
  }

  const ext = path.extname(original.file_name);
  const base = path.basename(original.file_name, ext);
  const newName = `${base} (Copy)${ext}`;

  const copiedFile: TeachingFile = {
    ...original,
    id: 'fil_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    user_id: user.id,
    file_name: newName,
    owner_name: user.username,
    owner_email: user.email,
    uploaded_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_favorite: false,
    is_trashed: false,
  };

  db.createFile(copiedFile);
  res.status(201).json({ file: copiedFile });
});

// ---------------- FOLDER ROUTES ----------------

router.get('/folders', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const folders = db.getUserFolders(user.id, user.role);

  // Compute file count per folder
  const allFiles = db.getFiles().filter(f => !f.is_trashed);
  const foldersWithCounts = folders.map(f => ({
    ...f,
    file_count: allFiles.filter(item => item.folder_id === f.id).length,
  }));

  res.json({ folders: foldersWithCounts });
});

router.post('/folders', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { folder_name, parent_folder_id, color } = req.body;

  if (!folder_name || folder_name.trim().length === 0) {
    res.status(400).json({ error: 'Folder name is required.' });
    return;
  }

  const colors = ['#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#0EA5E9'];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];

  const newFolder: Folder = {
    id: 'fld_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    user_id: user.id,
    parent_folder_id: parent_folder_id === 'root' || !parent_folder_id ? null : parent_folder_id,
    folder_name: folder_name.trim(),
    created_at: new Date().toISOString(),
    color: color || randomColor,
  };

  db.createFolder(newFolder);

  db.addAuditLog({
    user_id: user.id,
    username: user.username,
    action: 'CREATE_FOLDER',
    target_type: 'folder',
    target_name: newFolder.folder_name,
    device: detectDevice(req),
    ip: req.ip || '127.0.0.1',
  });

  res.status(201).json({ folder: newFolder });
});

router.patch('/folders/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const folder = db.getFolders().find(f => f.id === req.params.id);

  if (!folder) {
    res.status(404).json({ error: 'Folder not found.' });
    return;
  }

  if (user.role !== 'admin' && folder.user_id !== user.id) {
    res.status(403).json({ error: 'Permission denied to edit this folder.' });
    return;
  }

  const updates: Partial<Folder> = {};
  if (req.body.folder_name) updates.folder_name = String(req.body.folder_name).trim();
  if (req.body.parent_folder_id !== undefined) {
    updates.parent_folder_id = req.body.parent_folder_id === 'root' ? null : req.body.parent_folder_id;
  }
  if (req.body.color) updates.color = String(req.body.color);

  const updated = db.updateFolder(folder.id, updates);
  res.json({ folder: updated });
});

router.delete('/folders/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const folder = db.getFolders().find(f => f.id === req.params.id);

  if (!folder) {
    res.status(404).json({ error: 'Folder not found.' });
    return;
  }

  if (user.role !== 'admin' && folder.user_id !== user.id) {
    res.status(403).json({ error: 'Permission denied to delete this folder.' });
    return;
  }

  db.deleteFolder(folder.id);
  res.json({ success: true });
});

// ---------------- SHARING ROUTES ----------------

router.get('/sharing', requireAuth, (req: AuthenticatedRequest, res) => {
  const fileId = req.query.fileId as string | undefined;
  const records = db.getSharingRecords(fileId);
  res.json({ sharing: records });
});

router.post('/sharing', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { file_id, shared_user_id, permission, shared_mode } = req.body;

  const file = db.getFileById(file_id);
  if (!file) {
    res.status(404).json({ error: 'File not found.' });
    return;
  }

  if (user.role !== 'admin' && file.user_id !== user.id) {
    res.status(403).json({ error: 'Permission denied to manage sharing.' });
    return;
  }

  if (shared_mode) {
    db.updateFile(file.id, { shared_mode });
  }

  if (shared_user_id) {
    const targetUser = db.getUserById(shared_user_id) || db.getUserByEmailOrUsername(shared_user_id);
    if (!targetUser) {
      res.status(404).json({ error: 'Target teacher account not found.' });
      return;
    }

    const record: SharingRecord = {
      id: 'shr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      file_id: file.id,
      owner_id: user.id,
      shared_user_id: targetUser.id,
      permission: permission || 'view',
      created_at: new Date().toISOString(),
      user_email: targetUser.email,
      user_name: targetUser.username,
    };

    db.addSharingRecord(record);
    res.status(201).json({ record, shared_mode });
    return;
  }

  res.json({ success: true, shared_mode });
});

router.delete('/sharing/:id', requireAuth, (_req, res) => {
  db.removeSharingRecord(_req.params.id);
  res.json({ success: true });
});

// ---------------- STATS & DASHBOARD ----------------

router.get('/stats', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const allFiles = db.getFiles().filter(f => !f.is_trashed);
  const userFiles = user.role === 'admin' ? allFiles : allFiles.filter(f => f.user_id === user.id);
  const allFolders = db.getUserFolders(user.id, user.role);

  const videos = userFiles.filter(f => f.file_type === 'video').length;
  const audio = userFiles.filter(f => f.file_type === 'audio').length;
  const documents = userFiles.filter(f => f.file_type === 'document').length;
  const images = userFiles.filter(f => f.file_type === 'image').length;
  const other = userFiles.filter(f => f.file_type === 'other').length;

  const storageUsed = userFiles.reduce((acc, curr) => acc + (curr.file_size || 0), 0);

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const todayUploads = userFiles.filter(f => new Date(f.uploaded_at).getTime() >= startOfDay).length;

  res.json({
    totalUsers: db.getUsers().length,
    activeUsers: db.getUsers().filter(u => u.status === 'active').length,
    totalFiles: userFiles.length,
    totalFolders: allFolders.length,
    totalVideos: videos,
    totalAudio: audio,
    totalDocuments: documents,
    totalImages: images,
    totalOther: other,
    totalStorageUsed: storageUsed,
    storageLimit: user.storage_limit || 15 * 1024 * 1024 * 1024,
    todayUploads,
  });
});

// ---------------- ADMIN ROUTES ----------------

router.get('/admin/dashboard', requireAdmin, (_req, res) => {
  const allFiles = db.getFiles();
  const activeFiles = allFiles.filter(f => !f.is_trashed);
  const users = db.getUsers().map(sanitizeUser);
  const totalStorage = activeFiles.reduce((acc, f) => acc + f.file_size, 0);

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const todayUploads = allFiles.filter(f => new Date(f.uploaded_at).getTime() >= startOfDay).length;

  res.json({
    metrics: {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.status === 'active').length,
      totalFiles: activeFiles.length,
      totalVideos: activeFiles.filter(f => f.file_type === 'video').length,
      totalDocuments: activeFiles.filter(f => f.file_type === 'document').length,
      totalStorage,
      todayUploads,
      failedUploads: 0,
    },
    users,
    auditLogs: db.getAuditLogs(),
  });
});

router.get('/admin/users', requireAdmin, (_req, res) => {
  res.json({ users: db.getUsers().map(sanitizeUser) });
});

router.post('/admin/users', requireAdmin, (req, res) => {
  const { username, email, password, role, department, storage_limit } = req.body;
  if (!username || !email || !password) {
    res.status(400).json({ error: 'Username, email and password are required.' });
    return;
  }

  if (db.getUserByEmailOrUsername(email) || db.getUserByEmailOrUsername(username)) {
    res.status(400).json({ error: 'User with this email or username already exists.' });
    return;
  }

  const salt = bcrypt.genSaltSync(10);
  const newUser: StoredUser = {
    id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    username: username.trim(),
    email: email.trim().toLowerCase(),
    password_hash: bcrypt.hashSync(password, salt),
    role: role === 'admin' ? 'admin' : 'teacher',
    status: 'active',
    department: department || 'General Education',
    storage_used: 0,
    storage_limit: storage_limit ? Number(storage_limit) : 15 * 1024 * 1024 * 1024,
    created_at: new Date().toISOString(),
  };

  db.createUser(newUser);
  res.status(201).json({ user: sanitizeUser(newUser) });
});

router.patch('/admin/users/:id', requireAdmin, (req, res) => {
  const user = db.getUserById(req.params.id);
  if (!user) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }

  const updates: Partial<StoredUser> = {};
  if (req.body.role) updates.role = req.body.role;
  if (req.body.status) updates.status = req.body.status;
  if (req.body.storage_limit !== undefined) updates.storage_limit = Number(req.body.storage_limit);
  if (req.body.department) updates.department = req.body.department;
  if (req.body.password) {
    const salt = bcrypt.genSaltSync(10);
    updates.password_hash = bcrypt.hashSync(req.body.password, salt);
  }

  const updated = db.updateUser(user.id, updates);
  res.json({ user: sanitizeUser(updated!) });
});

router.delete('/admin/users/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
  if (req.params.id === req.user?.id) {
    res.status(400).json({ error: 'Cannot delete your own admin account.' });
    return;
  }
  db.deleteUser(req.params.id);
  res.json({ success: true });
});

router.get('/admin/audit-logs', requireAdmin, (_req, res) => {
  res.json({ auditLogs: db.getAuditLogs() });
});

export default router;
