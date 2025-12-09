import { NextResponse } from 'next/server';
import { getDb, query, run, get } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(request) {
  try {
    const auth = await requireAuth();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');
    const userId = searchParams.get('user_id');

    await getDb();
    
    let sql = `
      SELECT 
        s.*,
        u.name as user_name,
        u.hourly_rate
      FROM shifts s
      JOIN users u ON s.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (startDate) {
      sql += ' AND s.date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND s.date <= ?';
      params.push(endDate);
    }
    
    // Non-admin users can only see their own shifts
    if (auth.user.role !== 'admin' && auth.user.role !== 'shift_manager') {
      sql += ' AND s.user_id = ?';
      params.push(auth.user.id);
    } else if (userId) {
      sql += ' AND s.user_id = ?';
      params.push(userId);
    }

    sql += ' ORDER BY s.date DESC';

    const shifts = query(sql, params);
    return NextResponse.json({ shifts });
  } catch (error) {
    console.error('Get shifts error:', error);
    return NextResponse.json(
      { error: 'שגיאה בטעינת משמרות' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const auth = await requireAuth();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { user_id, date, hours } = await request.json();

    // Workers can only add their own shifts
    const targetUserId = auth.user.role === 'admin' || auth.user.role === 'shift_manager' 
      ? (user_id || auth.user.id) 
      : auth.user.id;

    if (!date || hours === undefined) {
      return NextResponse.json(
        { error: 'תאריך ושעות נדרשים' },
        { status: 400 }
      );
    }

    await getDb();

    // Check if there's already a shift for this user and date
    const existing = get(
      'SELECT id FROM shifts WHERE user_id = ? AND date = ?',
      [targetUserId, date]
    );

    if (existing) {
      // Update existing shift
      run('UPDATE shifts SET hours = ? WHERE id = ?', [hours, existing.id]);
      return NextResponse.json({ success: true, id: existing.id, updated: true });
    }

    const result = run(
      'INSERT INTO shifts (user_id, date, hours) VALUES (?, ?, ?)',
      [targetUserId, date, hours]
    );

    return NextResponse.json({ 
      success: true, 
      id: result.lastInsertRowid 
    });
  } catch (error) {
    console.error('Create shift error:', error);
    return NextResponse.json(
      { error: 'שגיאה ביצירת משמרת' },
      { status: 500 }
    );
  }
}
