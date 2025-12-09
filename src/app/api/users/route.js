import { NextResponse } from 'next/server';
import db, { initializeDatabase } from '@/lib/db';
import { requireAdmin, hashPassword } from '@/lib/auth';

export async function GET() {
  try {
    await requireAdmin();
    initializeDatabase();
    
    const users = db.getUsers().map(({ password, ...user }) => user);
    return NextResponse.json(users);
  } catch (error) {
    if (error.message === 'Unauthorized' || error.message === 'Admin access required') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'שגיאה בשרת' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await requireAdmin();
    initializeDatabase();
    
    const body = await request.json();
    const { name, email, password, role, position, hourlyRate } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'נא למלא את כל השדות החובה' }, { status: 400 });
    }

    // Check if email exists
    const existing = db.getUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: 'אימייל כבר קיים במערכת' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);
    const user = db.createUser({
      name,
      email,
      password: hashedPassword,
      role: role || 'worker',
      position: position || 'עובד',
      hourlyRate: hourlyRate || 35,
    });

    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    if (error.message === 'Unauthorized' || error.message === 'Admin access required') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'שגיאה בשרת' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await requireAdmin();
    initializeDatabase();
    
    const body = await request.json();
    const { id, name, email, password, role, position, hourlyRate } = body;

    if (!id) {
      return NextResponse.json({ error: 'חסר מזהה משתמש' }, { status: 400 });
    }

    const updates = { name, email, role, position, hourlyRate };
    
    if (password) {
      updates.password = await hashPassword(password);
    }

    const user = db.updateUser(id, updates);
    if (!user) {
      return NextResponse.json({ error: 'משתמש לא נמצא' }, { status: 404 });
    }

    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    if (error.message === 'Unauthorized' || error.message === 'Admin access required') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'שגיאה בשרת' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await requireAdmin();
    initializeDatabase();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'חסר מזהה משתמש' }, { status: 400 });
    }

    db.deleteUser(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error.message === 'Unauthorized' || error.message === 'Admin access required') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'שגיאה בשרת' }, { status: 500 });
  }
}
