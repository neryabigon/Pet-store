import { NextResponse } from 'next/server';
import db, { initializeDatabase } from '@/lib/db';
import { requireAuth, getCurrentUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await requireAuth();
    initializeDatabase();
    
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const userId = searchParams.get('userId');

    let sales;
    
    if (startDate && endDate) {
      sales = db.getSalesByDateRange(startDate, endDate);
    } else {
      sales = db.getSales();
    }

    // If worker, only show their own sales
    if (user.role !== 'admin' && !userId) {
      sales = sales.filter(s => s.userId === user.id);
    } else if (userId) {
      sales = sales.filter(s => s.userId === userId);
    }

    // Enrich with user and category names
    const users = db.getUsers();
    const categories = db.getCategories();
    
    sales = sales.map(sale => ({
      ...sale,
      userName: users.find(u => u.id === sale.userId)?.name || 'לא ידוע',
      categoryName: categories.find(c => c.id === sale.categoryId)?.name || 'לא ידוע',
    }));

    return NextResponse.json(sales);
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'שגיאה בשרת' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await requireAuth();
    initializeDatabase();
    
    const body = await request.json();
    const { amount, categoryId, date, notes } = body;

    if (!amount || !categoryId || !date) {
      return NextResponse.json({ error: 'נא למלא את כל השדות החובה' }, { status: 400 });
    }

    const sale = db.createSale({
      userId: user.id,
      amount: parseFloat(amount),
      categoryId,
      date,
      notes: notes || '',
    });

    return NextResponse.json(sale);
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'שגיאה בשרת' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const user = await requireAuth();
    initializeDatabase();
    
    const body = await request.json();
    const { id, amount, categoryId, date, notes } = body;

    if (!id) {
      return NextResponse.json({ error: 'חסר מזהה מכירה' }, { status: 400 });
    }

    // Check ownership if not admin
    const existingSale = db.getSales().find(s => s.id === id);
    if (!existingSale) {
      return NextResponse.json({ error: 'מכירה לא נמצאה' }, { status: 404 });
    }
    
    if (user.role !== 'admin' && existingSale.userId !== user.id) {
      return NextResponse.json({ error: 'אין הרשאה לעריכה' }, { status: 403 });
    }

    const sale = db.updateSale(id, {
      amount: parseFloat(amount),
      categoryId,
      date,
      notes,
    });

    return NextResponse.json(sale);
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'שגיאה בשרת' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const user = await requireAuth();
    initializeDatabase();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'חסר מזהה מכירה' }, { status: 400 });
    }

    // Check ownership if not admin
    const existingSale = db.getSales().find(s => s.id === id);
    if (existingSale && user.role !== 'admin' && existingSale.userId !== user.id) {
      return NextResponse.json({ error: 'אין הרשאה למחיקה' }, { status: 403 });
    }

    db.deleteSale(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'שגיאה בשרת' }, { status: 500 });
  }
}
