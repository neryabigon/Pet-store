import { NextResponse } from 'next/server';
import { getDb, query, run } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET() {
  try {
    await getDb();
    const categories = query('SELECT * FROM categories ORDER BY type, name');
    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    return NextResponse.json(
      { error: 'שגיאה בטעינת קטגוריות' },
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

    const { name, type } = await request.json();

    if (!name || !type) {
      return NextResponse.json(
        { error: 'שם וסוג קטגוריה נדרשים' },
        { status: 400 }
      );
    }

    const validTypes = ['income', 'expense_supplier', 'expense_fixed', 'expense_operational'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'סוג קטגוריה לא תקין' },
        { status: 400 }
      );
    }

    await getDb();
    const result = run('INSERT INTO categories (name, type) VALUES (?, ?)', [name, type]);

    return NextResponse.json({ 
      success: true, 
      id: result.lastInsertRowid 
    });
  } catch (error) {
    console.error('Create category error:', error);
    return NextResponse.json(
      { error: 'שגיאה ביצירת קטגוריה' },
      { status: 500 }
    );
  }
}
