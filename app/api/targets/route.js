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
    const year = searchParams.get('year');
    const month = searchParams.get('month');

    await getDb();
    
    let sql = 'SELECT * FROM targets WHERE 1=1';
    const params = [];

    if (year) {
      sql += ' AND year = ?';
      params.push(year);
    }
    if (month) {
      sql += ' AND month = ?';
      params.push(month);
    }

    sql += ' ORDER BY year DESC, month DESC';

    const targets = query(sql, params);
    return NextResponse.json({ targets });
  } catch (error) {
    console.error('Get targets error:', error);
    return NextResponse.json(
      { error: 'שגיאה בטעינת יעדים' },
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

    const { year, month, revenue_target, product_cost_percent, labor_cost_percent } = await request.json();

    if (!year || !month) {
      return NextResponse.json(
        { error: 'שנה וחודש נדרשים' },
        { status: 400 }
      );
    }

    await getDb();

    // Check if target exists for this month
    const existing = get('SELECT id FROM targets WHERE year = ? AND month = ?', [year, month]);

    if (existing) {
      // Update existing target
      run(
        'UPDATE targets SET revenue_target = ?, product_cost_percent = ?, labor_cost_percent = ? WHERE id = ?',
        [revenue_target || 0, product_cost_percent || 30, labor_cost_percent || 28, existing.id]
      );
      return NextResponse.json({ success: true, id: existing.id, updated: true });
    }

    const result = run(
      'INSERT INTO targets (year, month, revenue_target, product_cost_percent, labor_cost_percent) VALUES (?, ?, ?, ?, ?)',
      [year, month, revenue_target || 0, product_cost_percent || 30, labor_cost_percent || 28]
    );

    return NextResponse.json({ 
      success: true, 
      id: result.lastInsertRowid 
    });
  } catch (error) {
    console.error('Create target error:', error);
    return NextResponse.json(
      { error: 'שגיאה ביצירת יעד' },
      { status: 500 }
    );
  }
}
