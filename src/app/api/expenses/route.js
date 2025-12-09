import { NextResponse } from 'next/server';
import db, { initializeDatabase } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(request) {
  try {
    await requireAdmin();
    initializeDatabase();
    
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let expenses;
    
    if (startDate && endDate) {
      expenses = db.getExpensesByDateRange(startDate, endDate);
    } else {
      expenses = db.getExpenses();
    }

    // Enrich with category and supplier names
    const categories = db.getCategories();
    const suppliers = db.getSuppliers();
    
    expenses = expenses.map(expense => ({
      ...expense,
      categoryName: categories.find(c => c.id === expense.categoryId)?.name || 'לא ידוע',
      supplierName: suppliers.find(s => s.id === expense.supplierId)?.name || '-',
    }));

    return NextResponse.json(expenses);
  } catch (error) {
    if (error.message === 'Unauthorized' || error.message === 'Admin access required') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'שגיאה בשרת' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await requireAdmin();
    initializeDatabase();
    
    const body = await request.json();
    const { amount, categoryId, supplierId, date, description, type } = body;

    if (!amount || !categoryId || !date) {
      return NextResponse.json({ error: 'נא למלא את כל השדות החובה' }, { status: 400 });
    }

    const expense = db.createExpense({
      amount: parseFloat(amount),
      categoryId,
      supplierId: supplierId || null,
      date,
      description: description || '',
      type: type || 'supplier', // supplier or fixed
    });

    return NextResponse.json(expense);
  } catch (error) {
    if (error.message === 'Unauthorized' || error.message === 'Admin access required') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'שגיאה בשרת' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await requireAdmin();
    initializeDatabase();
    
    const body = await request.json();
    const { id, amount, categoryId, supplierId, date, description, type } = body;

    if (!id) {
      return NextResponse.json({ error: 'חסר מזהה הוצאה' }, { status: 400 });
    }

    const expense = db.updateExpense(id, {
      amount: parseFloat(amount),
      categoryId,
      supplierId,
      date,
      description,
      type,
    });

    if (!expense) {
      return NextResponse.json({ error: 'הוצאה לא נמצאה' }, { status: 404 });
    }

    return NextResponse.json(expense);
  } catch (error) {
    if (error.message === 'Unauthorized' || error.message === 'Admin access required') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'שגיאה בשרת' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await requireAdmin();
    initializeDatabase();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'חסר מזהה הוצאה' }, { status: 400 });
    }

    db.deleteExpense(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error.message === 'Unauthorized' || error.message === 'Admin access required') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'שגיאה בשרת' }, { status: 500 });
  }
}
