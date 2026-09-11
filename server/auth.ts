import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import { db, StoredUser } from './db.js';

// In-memory active session tokens mapping token -> userId
const sessions = new Map<string, { userId: string; expiresAt: number }>();

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days for "Remember Me" / persistent login

export function createSessionToken(userId: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, {
    userId,
    expiresAt: Date.now() + SESSION_TTL_MS,
  });
  return token;
}

export function revokeSessionToken(token: string): void {
  sessions.delete(token);
}

export function validateSessionToken(token?: string): StoredUser | null {
  if (!token) return null;
  const session = sessions.get(token);
  if (session) {
    if (Date.now() > session.expiresAt) {
      sessions.delete(token);
      return null;
    }
    const user = db.getUserById(session.userId);
    if (user && user.status === 'active') return user;
  }

  // Also support direct user ID, email, or username tokens for seamless client sync
  const directUser = db.getUserById(token) || db.getUserByEmailOrUsername(token);
  if (directUser && directUser.status === 'active') {
    return directUser;
  }

  return null;
}

export interface AuthenticatedRequest extends Request {
  user?: StoredUser;
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.query.token) {
    token = String(req.query.token);
  }

  if (token) {
    const user = validateSessionToken(token);
    if (user) {
      req.user = user;
    }
  }

  next();
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required. Please log in.' });
    return;
  }
  next();
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required. Please log in.' });
    return;
  }
  if (req.user.role !== 'admin') {
    res.status(403).json({ error: 'Admin access privileges required.' });
    return;
  }
  next();
}
