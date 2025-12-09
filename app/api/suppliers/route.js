import { NextResponse } from 'next/server';
import { getDb, query, run } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET() {
  try {
    await getDb();
    const suppliers = query('SELECT * FROM suppliers ORDER BY name');
    return NextResponse.json({ suppliers });
  } catch (error) {
    console.error('Get suppliers error:', error);
    return NextResponse.json(
      { error: 'שגיאה בטעינת ספקים' },
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

    const { name } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: 'שם ספק נדרש' },
        { status: 400 }
      );
    }

    await getDb();
    const result = run('INSERT INTO suppliers (name) VALUES (?)', [name]);

    return NextResponse.json({ 
      success: true, 
      id: result.lastInsertRowid 
    });
  } catch (error) {
    console.error('Create supplier error:', error);
    return NextResponse.json(
      { error: 'שגיאה ביצירת ספק' },
      { status: 500 }
    );
  }
}
