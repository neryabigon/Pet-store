import { NextResponse } from 'next/server';
import db, { initializeDatabase } from '@/lib/db';
import { requireAuth, requireAdmin } from '@/lib/auth';

export async function GET() {
  try {
    await requireAuth();
    initializeDatabase();
    
    const suppliers = db.getSuppliers();
    return NextResponse.json(suppliers);
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
    const { name, phone, email, notes } = body;

    if (!name) {
      return NextResponse.json({ error: 'נא להזין שם ספק' }, { status: 400 });
    }

    const supplier = db.createSupplier({ name, phone, email, notes });
    return NextResponse.json(supplier);
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
    const { id, name, phone, email, notes } = body;

    if (!id) {
      return NextResponse.json({ error: 'חסר מזהה ספק' }, { status: 400 });
    }

    const supplier = db.updateSupplier(id, { name, phone, email, notes });
    if (!supplier) {
      return NextResponse.json({ error: 'ספק לא נמצא' }, { status: 404 });
    }

    return NextResponse.json(supplier);
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
      return NextResponse.json({ error: 'חסר מזהה ספק' }, { status: 400 });
    }

    db.deleteSupplier(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error.message === 'Unauthorized' || error.message === 'Admin access required') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'שגיאה בשרת' }, { status: 500 });
  }
}
