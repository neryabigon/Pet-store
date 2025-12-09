import { NextResponse } from 'next/server';
import { getDb, query, run } from '@/lib/db';
import { requireAuth, hashPassword } from '@/lib/auth';

export async function GET() {
  try {
    const auth = await requireAuth(['admin']);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    await getDb();
    const users = query('SELECT id, username, name, role, hourly_rate, created_at FROM users ORDER BY name');
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'שגיאה בטעינת משתמשים' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const auth = await requireAuth(['admin']);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { username, password, name, role, hourly_rate } = await request.json();

    if (!username || !password || !name || !role) {
      return NextResponse.json(
        { error: 'כל השדות נדרשים' },
        { status: 400 }
      );
    }

    const validRoles = ['admin', 'shift_manager', 'worker'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'תפקיד לא תקין' },
        { status: 400 }
      );
    }

    await getDb();
    
    // Check if username exists
    const existing = query('SELECT id FROM users WHERE username = ?', [username]);
    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'שם משתמש כבר קיים' },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);
    const result = run(
      'INSERT INTO users (username, password_hash, name, role, hourly_rate) VALUES (?, ?, ?, ?, ?)',
      [username, passwordHash, name, role, hourly_rate || 0]
    );

    return NextResponse.json({ 
      success: true, 
      id: result.lastInsertRowid 
    });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: 'שגיאה ביצירת משתמש' },
      { status: 500 }
    );
  }
}
