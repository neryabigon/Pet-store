import { NextResponse } from 'next/server';
import { getDb, query, get } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(request) {
  try {
    const auth = await requireAuth();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year')) || new Date().getFullYear();
    const month = parseInt(searchParams.get('month')) || new Date().getMonth() + 1;

    await getDb();

    // Get date range for the month
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    // Total revenue for the month
    const revenueResult = get(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM daily_sales
      WHERE date >= ? AND date <= ?
    `, [startDate, endDate]);
    const totalRevenue = revenueResult?.total || 0;

    // Revenue by category
    const revenueByCategory = query(`
      SELECT c.name, c.id, COALESCE(SUM(ds.amount), 0) as total
      FROM categories c
      LEFT JOIN daily_sales ds ON c.id = ds.category_id 
        AND ds.date >= ? AND ds.date <= ?
      WHERE c.type = 'income'
      GROUP BY c.id, c.name
      ORDER BY total DESC
    `, [startDate, endDate]);

    // Total supplier expenses
    const supplierExpenses = get(`
      SELECT COALESCE(SUM(e.amount), 0) as total
      FROM expenses e
      JOIN categories c ON e.category_id = c.id
      WHERE c.type = 'expense_supplier'
        AND e.date >= ? AND e.date <= ?
    `, [startDate, endDate]);

    // Total fixed expenses
    const fixedExpenses = get(`
      SELECT COALESCE(SUM(e.amount), 0) as total
      FROM expenses e
      JOIN categories c ON e.category_id = c.id
      WHERE c.type = 'expense_fixed'
        AND e.date >= ? AND e.date <= ?
    `, [startDate, endDate]);

    // Total operational expenses
    const operationalExpenses = get(`
      SELECT COALESCE(SUM(e.amount), 0) as total
      FROM expenses e
      JOIN categories c ON e.category_id = c.id
      WHERE c.type = 'expense_operational'
        AND e.date >= ? AND e.date <= ?
    `, [startDate, endDate]);

    // Labor costs (shifts * hourly_rate)
    const laborCosts = get(`
      SELECT COALESCE(SUM(s.hours * u.hourly_rate), 0) as total
      FROM shifts s
      JOIN users u ON s.user_id = u.id
      WHERE s.date >= ? AND s.date <= ?
    `, [startDate, endDate]);

    // Get monthly target
    const target = get(`
      SELECT * FROM targets WHERE year = ? AND month = ?
    `, [year, month]);

    // Daily revenue trend
    const dailyRevenue = query(`
      SELECT date, SUM(amount) as total
      FROM daily_sales
      WHERE date >= ? AND date <= ?
      GROUP BY date
      ORDER BY date
    `, [startDate, endDate]);

    // Calculate percentages
    const productCostPercent = totalRevenue > 0 
      ? ((supplierExpenses?.total || 0) / totalRevenue * 100).toFixed(1) 
      : 0;
    const laborCostPercent = totalRevenue > 0 
      ? ((laborCosts?.total || 0) / totalRevenue * 100).toFixed(1) 
      : 0;

    // Expenses by category
    const expensesByCategory = query(`
      SELECT c.name, c.type, COALESCE(SUM(e.amount), 0) as total
      FROM categories c
      LEFT JOIN expenses e ON c.id = e.category_id 
        AND e.date >= ? AND e.date <= ?
      WHERE c.type LIKE 'expense_%'
      GROUP BY c.id, c.name, c.type
      ORDER BY total DESC
    `, [startDate, endDate]);

    // Top suppliers by expense
    const topSuppliers = query(`
      SELECT s.name, COALESCE(SUM(e.amount), 0) as total
      FROM suppliers s
      LEFT JOIN expenses e ON s.id = e.supplier_id 
        AND e.date >= ? AND e.date <= ?
      GROUP BY s.id, s.name
      ORDER BY total DESC
      LIMIT 5
    `, [startDate, endDate]);

    return NextResponse.json({
      summary: {
        totalRevenue,
        supplierExpenses: supplierExpenses?.total || 0,
        fixedExpenses: fixedExpenses?.total || 0,
        operationalExpenses: operationalExpenses?.total || 0,
        laborCosts: laborCosts?.total || 0,
        productCostPercent,
        laborCostPercent,
        target,
      },
      revenueByCategory,
      expensesByCategory,
      dailyRevenue,
      topSuppliers,
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    return NextResponse.json(
      { error: 'שגיאה בטעינת נתוני דשבורד' },
      { status: 500 }
    );
  }
}
