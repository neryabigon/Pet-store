import { NextResponse } from 'next/server';
import db, { initializeDatabase } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await requireAuth();
    initializeDatabase();
    
    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month')) || new Date().getMonth() + 1;
    const year = parseInt(searchParams.get('year')) || new Date().getFullYear();

    // Calculate date range for the month
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

    // Get data
    const sales = db.getSalesByDateRange(startDate, endDate);
    const expenses = db.getExpensesByDateRange(startDate, endDate);
    const target = db.getBudgetTargetByMonth(month, year);
    const categories = db.getCategories();
    const users = db.getUsers();

    // Calculate totals
    const totalRevenue = sales.reduce((sum, s) => sum + s.amount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const supplierExpenses = expenses.filter(e => e.type === 'supplier').reduce((sum, e) => sum + e.amount, 0);
    const fixedExpenses = expenses.filter(e => e.type === 'fixed').reduce((sum, e) => sum + e.amount, 0);

    // Product cost percentage
    const productCostPct = totalRevenue > 0 ? (supplierExpenses / totalRevenue) * 100 : 0;

    // Sales by category
    const productCategories = categories.filter(c => c.type === 'product');
    const salesByCategory = productCategories.map(cat => {
      const catSales = sales.filter(s => s.categoryId === cat.id);
      return {
        id: cat.id,
        name: cat.name,
        total: catSales.reduce((sum, s) => sum + s.amount, 0),
        count: catSales.length,
      };
    }).filter(c => c.total > 0);

    // Sales by user (for admin)
    let salesByUser = [];
    if (user.role === 'admin') {
      salesByUser = users.map(u => {
        const userSales = sales.filter(s => s.userId === u.id);
        return {
          id: u.id,
          name: u.name,
          total: userSales.reduce((sum, s) => sum + s.amount, 0),
          count: userSales.length,
        };
      }).filter(u => u.total > 0);
    }

    // Daily sales for chart
    const dailySales = {};
    sales.forEach(sale => {
      if (!dailySales[sale.date]) {
        dailySales[sale.date] = 0;
      }
      dailySales[sale.date] += sale.amount;
    });

    // Expenses by category
    const expenseCategories = categories.filter(c => c.type === 'expense');
    const expensesByCategory = expenseCategories.map(cat => {
      const catExpenses = expenses.filter(e => e.categoryId === cat.id);
      return {
        id: cat.id,
        name: cat.name,
        total: catExpenses.reduce((sum, e) => sum + e.amount, 0),
      };
    }).filter(c => c.total > 0);

    return NextResponse.json({
      month,
      year,
      target: target || {
        revenueTarget: 50000,
        productCostTargetPct: 30,
        laborCostTargetPct: 28,
      },
      summary: {
        totalRevenue,
        totalExpenses,
        supplierExpenses,
        fixedExpenses,
        productCostPct,
        netProfit: totalRevenue - totalExpenses,
        revenueVsTarget: target ? (totalRevenue / target.revenueTarget) * 100 : 0,
      },
      salesByCategory,
      salesByUser,
      expensesByCategory,
      dailySales,
      recentSales: sales.slice(-10).reverse(),
      recentExpenses: expenses.slice(-10).reverse(),
    });
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'שגיאה בשרת' }, { status: 500 });
  }
}
