import { NextResponse } from 'next/server';
import { getDb, query, run, get } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(request) {
  try {
    const auth = await requireAuth(['admin', 'shift_manager']);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');
    const type = searchParams.get('type');

    await getDb();
    
    let sql = `
      SELECT 
        e.*,
        c.name as category_name,
        c.type as category_type,
        s.name as supplier_name
      FROM expenses e
      JOIN categories c ON e.category_id = c.id
      LEFT JOIN suppliers s ON e.supplier_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (startDate) {
      sql += ' AND e.date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND e.date <= ?';
      params.push(endDate);
    }
    if (type) {
      sql += ' AND c.type = ?';
      params.push(type);
    }

    sql += ' ORDER BY e.date DESC, e.created_at DESC';

    const expenses = query(sql, params);
    return NextResponse.json({ expenses });
  } catch (error) {
    console.error('Get expenses error:', error);
    return NextResponse.json(
      { error: 'שגיאה בטעינת הוצאות' },
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

    const { category_id, supplier_id, amount, date, notes } = await request.json();

    if (!category_id || amount === undefined || !date) {
      return NextResponse.json(
        { error: 'קטגוריה, סכום ותאריך נדרשים' },
        { status: 400 }
      );
    }

    await getDb();

    // Verify category is expense type
    const category = get('SELECT type FROM categories WHERE id = ?', [category_id]);
    if (!category || !category.type.startsWith('expense_')) {
      return NextResponse.json(
        { error: 'קטגוריה לא תקינה' },
        { status: 400 }
      );
    }

    const result = run(
      'INSERT INTO expenses (category_id, supplier_id, amount, date, notes) VALUES (?, ?, ?, ?, ?)',
      [category_id, supplier_id || null, amount, date, notes || null]
    );

    return NextResponse.json({ 
      success: true, 
      id: result.lastInsertRowid 
    });
  } catch (error) {
    console.error('Create expense error:', error);
    return NextResponse.json(
      { error: 'שגיאה ביצירת הוצאה' },
      { status: 500 }
    );
  }
}
