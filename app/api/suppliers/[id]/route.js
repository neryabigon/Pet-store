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
    const { name } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: 'שם ספק נדרש' },
        { status: 400 }
      );
    }

    await getDb();
    run('UPDATE suppliers SET name = ? WHERE id = ?', [name, id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update supplier error:', error);
    return NextResponse.json(
      { error: 'שגיאה בעדכון ספק' },
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
    
    // Check if supplier is in use
    const expensesCount = get('SELECT COUNT(*) as count FROM expenses WHERE supplier_id = ?', [id]);
    
    if (expensesCount?.count > 0) {
      return NextResponse.json(
        { error: 'לא ניתן למחוק ספק שבשימוש' },
        { status: 400 }
      );
    }

    run('DELETE FROM suppliers WHERE id = ?', [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete supplier error:', error);
    return NextResponse.json(
      { error: 'שגיאה במחיקת ספק' },
      { status: 500 }
    );
  }
}
