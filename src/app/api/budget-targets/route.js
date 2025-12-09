import { NextResponse } from 'next/server';
import db, { initializeDatabase } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(request) {
  try {
    await requireAdmin();
    initializeDatabase();
    
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    if (month && year) {
      const target = db.getBudgetTargetByMonth(parseInt(month), parseInt(year));
      return NextResponse.json(target || null);
    }

    const targets = db.getBudgetTargets();
    return NextResponse.json(targets);
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
    const { month, year, revenueTarget, productCostTargetPct, laborCostTargetPct } = body;

    if (!month || !year) {
      return NextResponse.json({ error: 'נא לבחור חודש ושנה' }, { status: 400 });
    }

    const target = db.createBudgetTarget({
      month: parseInt(month),
      year: parseInt(year),
      revenueTarget: parseFloat(revenueTarget) || 0,
      productCostTargetPct: parseFloat(productCostTargetPct) || 30,
      laborCostTargetPct: parseFloat(laborCostTargetPct) || 28,
    });

    return NextResponse.json(target);
  } catch (error) {
    if (error.message === 'Unauthorized' || error.message === 'Admin access required') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'שגיאה בשרת' }, { status: 500 });
  }
}
