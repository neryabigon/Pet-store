import { NextResponse } from 'next/server';
import db, { initializeDatabase } from '@/lib/db';
import { requireAuth, requireAdmin } from '@/lib/auth';

export async function GET() {
  try {
    await requireAuth();
    initializeDatabase();
    
    const categories = db.getCategories();
    return NextResponse.json(categories);
  } catch (error) {
    if (error.message === 'Unauthorized') {
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
    const { name, type } = body;

    if (!name || !type) {
      return NextResponse.json({ error: 'נא למלא את כל השדות' }, { status: 400 });
    }

    const category = db.createCategory({ name, type });
    return NextResponse.json(category);
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
    const { id, name, type } = body;

    if (!id) {
      return NextResponse.json({ error: 'חסר מזהה קטגוריה' }, { status: 400 });
    }

    const category = db.updateCategory(id, { name, type });
    if (!category) {
      return NextResponse.json({ error: 'קטגוריה לא נמצאה' }, { status: 404 });
    }

    return NextResponse.json(category);
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
      return NextResponse.json({ error: 'חסר מזהה קטגוריה' }, { status: 400 });
    }

    db.deleteCategory(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error.message === 'Unauthorized' || error.message === 'Admin access required') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'שגיאה בשרת' }, { status: 500 });
  }
}
