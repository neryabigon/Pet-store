import { NextResponse } from 'next/server';
import { getDb, get, run } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function PUT(request, { params }) {
  try {
    const auth = await requireAuth(['admin']);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    const { name, type } = await request.json();

    if (!name || !type) {
      return NextResponse.json(
        { error: 'שם וסוג קטגוריה נדרשים' },
        { status: 400 }
      );
    }

    await getDb();
    run('UPDATE categories SET name = ?, type = ? WHERE id = ?', [name, type, id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update category error:', error);
    return NextResponse.json(
      { error: 'שגיאה בעדכון קטגוריה' },
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

    await getDb();
    
    // Check if category is in use
    const salesCount = get('SELECT COUNT(*) as count FROM daily_sales WHERE category_id = ?', [id]);
    const expensesCount = get('SELECT COUNT(*) as count FROM expenses WHERE category_id = ?', [id]);
    
    if (salesCount?.count > 0 || expensesCount?.count > 0) {
      return NextResponse.json(
        { error: 'לא ניתן למחוק קטגוריה שבשימוש' },
        { status: 400 }
      );
    }

    run('DELETE FROM categories WHERE id = ?', [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete category error:', error);
    return NextResponse.json(
      { error: 'שגיאה במחיקת קטגוריה' },
      { status: 500 }
    );
  }
}
