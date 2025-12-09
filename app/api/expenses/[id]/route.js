import { NextResponse } from 'next/server';
import { getDb, run } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function PUT(request, { params }) {
  try {
    const auth = await requireAuth(['admin']);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    const { category_id, supplier_id, amount, date, notes } = await request.json();

    if (!category_id || amount === undefined || !date) {
      return NextResponse.json(
        { error: 'שדות חובה חסרים' },
        { status: 400 }
      );
    }

    await getDb();
    run(
      'UPDATE expenses SET category_id = ?, supplier_id = ?, amount = ?, date = ?, notes = ? WHERE id = ?',
      [category_id, supplier_id || null, amount, date, notes || null, id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update expense error:', error);
    return NextResponse.json(
      { error: 'שגיאה בעדכון הוצאה' },
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
    run('DELETE FROM expenses WHERE id = ?', [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete expense error:', error);
    return NextResponse.json(
      { error: 'שגיאה במחיקת הוצאה' },
      { status: 500 }
    );
  }
}
