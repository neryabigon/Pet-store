import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { getDb, get, query } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'pet-store-budget-secret-key-change-in-production';
const TOKEN_EXPIRY = '7d';

export async function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

export function generateToken(user) {
  return jwt.sign(
    { 
      id: user.id, 
      username: user.username, 
      name: user.name,
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  
  if (!token) return null;
  
  const decoded = verifyToken(token);
  if (!decoded) return null;
  
  await getDb();
  const user = get('SELECT id, username, name, role, hourly_rate FROM users WHERE id = ?', [decoded.id]);
  return user;
}

export async function requireAuth(requiredRoles = []) {
  const user = await getCurrentUser();
  
  if (!user) {
    return { error: 'לא מחובר', status: 401 };
  }
  
  if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
    return { error: 'אין הרשאה', status: 403 };
  }
  
  return { user };
}

export async function login(username, password) {
  await getDb();
  const user = get('SELECT * FROM users WHERE username = ?', [username]);
  
  if (!user) {
    return { error: 'שם משתמש או סיסמה שגויים' };
  }
  
  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    return { error: 'שם משתמש או סיסמה שגויים' };
  }
  
  const token = generateToken(user);
  return { 
    token, 
    user: { 
      id: user.id, 
      username: user.username, 
      name: user.name, 
      role: user.role 
    } 
  };
}
