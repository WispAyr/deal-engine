/**
 * User management: registration, onboarding, admin.
 * Persists to users.json.
 */
import fs from 'fs';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const USERS_DB = path.join(__dirname, '../src/data/users.json');

const SALT_LEN = 16;
const KEY_LEN = 64;

function hashPassword(password) {
  const salt = crypto.randomBytes(SALT_LEN).toString('hex');
  const hash = crypto.scryptSync(password, salt, KEY_LEN).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(stored, password) {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const computed = crypto.scryptSync(password, salt, KEY_LEN).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(computed));
}

function readUsers() {
  if (!fs.existsSync(USERS_DB)) return [];
  try {
    const raw = JSON.parse(fs.readFileSync(USERS_DB, 'utf-8'));
    return Array.isArray(raw) ? raw : raw.users || [];
  } catch {
    return [];
  }
}

function writeUsers(users) {
  const dir = path.dirname(USERS_DB);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(USERS_DB, JSON.stringify(users, null, 2), 'utf-8');
}

export function findByEmail(email) {
  const users = readUsers();
  return users.find((u) => u.email?.toLowerCase() === email?.toLowerCase());
}

export function findById(id) {
  const users = readUsers();
  return users.find((u) => u.id === id);
}

export function createUser({ email, password }) {
  const users = readUsers();
  if (findByEmail(email)) return { error: 'Email already registered' };
  const id = `user-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  const isFirst = users.length === 0;
  const user = {
    id,
    email: email.toLowerCase().trim(),
    passwordHash: hashPassword(password),
    role: isFirst ? 'admin' : 'user',
    status: isFirst ? 'active' : 'pending',
    onboardingStep: 0,
    stripeCustomerId: null,
    subscriptionStatus: null,
    createdAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
  };
  users.push(user);
  writeUsers(users);
  return { user };
}

export function updateUser(id, updates) {
  const users = readUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx < 0) return null;
  const allowed = ['status', 'role', 'onboardingStep', 'stripeCustomerId', 'subscriptionStatus', 'lastActiveAt'];
  allowed.forEach((k) => {
    if (updates[k] !== undefined) users[idx][k] = updates[k];
  });
  writeUsers(users);
  return users[idx];
}

export function touchLastActive(id) {
  return updateUser(id, { lastActiveAt: new Date().toISOString() });
}

export function listUsers() {
  return readUsers().map(({ passwordHash, ...u }) => u);
}
