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
        ds.*,
        u.name as user_name,
        c.name as category_name
      FROM daily_sales ds
      JOIN users u ON ds.user_id = u.id
      JOIN categories c ON ds.category_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (startDate) {
      sql += ' AND ds.date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND ds.date <= ?';
      params.push(endDate);
    }
    
    // Non-admin users can only see their own sales
    if (auth.user.role !== 'admin') {
      sql += ' AND ds.user_id = ?';
      params.push(auth.user.id);
    } else if (userId) {
      sql += ' AND ds.user_id = ?';
      params.push(userId);
    }

    sql += ' ORDER BY ds.date DESC, ds.created_at DESC';

    const sales = query(sql, params);
    return NextResponse.json({ sales });
  } catch (error) {
    console.error('Get sales error:', error);
    return NextResponse.json(
      { error: 'שגיאה בטעינת מכירות' },
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

    const { category_id, amount, date, notes } = await request.json();

    if (!category_id || amount === undefined || !date) {
      return NextResponse.json(
        { error: 'קטגוריה, סכום ותאריך נדרשים' },
        { status: 400 }
      );
    }

    await getDb();

    // Verify category is income type
    const category = get('SELECT type FROM categories WHERE id = ?', [category_id]);
    if (!category || category.type !== 'income') {
      return NextResponse.json(
        { error: 'קטגוריה לא תקינה' },
        { status: 400 }
      );
    }

    // Check if there's already a sale for this user, category, and date
    const existing = get(
      'SELECT id, amount FROM daily_sales WHERE user_id = ? AND category_id = ? AND date = ?',
      [auth.user.id, category_id, date]
    );

    if (existing) {
      // Update existing sale
      run(
        'UPDATE daily_sales SET amount = ?, notes = ? WHERE id = ?',
        [amount, notes || null, existing.id]
      );
      return NextResponse.json({ success: true, id: existing.id, updated: true });
    }

    const result = run(
      'INSERT INTO daily_sales (user_id, category_id, amount, date, notes) VALUES (?, ?, ?, ?, ?)',
      [auth.user.id, category_id, amount, date, notes || null]
    );

    return NextResponse.json({ 
      success: true, 
      id: result.lastInsertRowid 
    });
  } catch (error) {
    console.error('Create sale error:', error);
    return NextResponse.json(
      { error: 'שגיאה ביצירת מכירה' },
      { status: 500 }
    );
  }
}
