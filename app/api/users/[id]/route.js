import { NextResponse } from 'next/server';
import { getDb, get, run } from '@/lib/db';
import { requireAuth, hashPassword } from '@/lib/auth';

export async function PUT(request, { params }) {
  try {
    const auth = await requireAuth(['admin']);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    const { username, password, name, role, hourly_rate } = await request.json();

    if (!username || !name || !role) {
      return NextResponse.json(
        { error: 'שדות חובה חסרים' },
        { status: 400 }
      );
    }

    await getDb();

    // Check if username is taken by another user
    const existing = get('SELECT id FROM users WHERE username = ? AND id != ?', [username, id]);
    if (existing) {
      return NextResponse.json(
        { error: 'שם משתמש כבר קיים' },
        { status: 400 }
      );
    }

    if (password) {
      const passwordHash = await hashPassword(password);
      run(
        'UPDATE users SET username = ?, password_hash = ?, name = ?, role = ?, hourly_rate = ? WHERE id = ?',
        [username, passwordHash, name, role, hourly_rate || 0, id]
      );
    } else {
      run(
        'UPDATE users SET username = ?, name = ?, role = ?, hourly_rate = ? WHERE id = ?',
        [username, name, role, hourly_rate || 0, id]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'שגיאה בעדכון משתמש' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const auth = await requireAuth(['admin']);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;

    // Prevent deleting self
    if (auth.user.id === parseInt(id)) {
      return NextResponse.json(
        { error: 'לא ניתן למחוק את עצמך' },
        { status: 400 }
      );
    }

    await getDb();
    
    // Check if user has sales or shifts
    const salesCount = get('SELECT COUNT(*) as count FROM daily_sales WHERE user_id = ?', [id]);
    const shiftsCount = get('SELECT COUNT(*) as count FROM shifts WHERE user_id = ?', [id]);
    
    if (salesCount?.count > 0 || shiftsCount?.count > 0) {
      return NextResponse.json(
        { error: 'לא ניתן למחוק משתמש עם נתונים קיימים' },
        { status: 400 }
      );
    }

    run('DELETE FROM users WHERE id = ?', [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'שגיאה במחיקת משתמש' },
      { status: 500 }
    );
  }
}
