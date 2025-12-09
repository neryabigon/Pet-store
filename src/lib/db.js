import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

const DATA_DIR = path.join(process.cwd(), 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function getFilePath(collection) {
  return path.join(DATA_DIR, `${collection}.json`);
}

function readCollection(collection) {
  const filePath = getFilePath(collection);
  if (!fs.existsSync(filePath)) {
    return [];
  }
  const data = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(data);
}

function writeCollection(collection, data) {
  const filePath = getFilePath(collection);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// Initialize default data if not exists
export function initializeDatabase() {
  // Default categories
  if (!fs.existsSync(getFilePath('categories'))) {
    const defaultCategories = [
      { id: uuidv4(), name: 'מזון לכלבים', type: 'product', createdAt: new Date().toISOString() },
      { id: uuidv4(), name: 'מזון לחתולים', type: 'product', createdAt: new Date().toISOString() },
      { id: uuidv4(), name: 'מזון לציפורים', type: 'product', createdAt: new Date().toISOString() },
      { id: uuidv4(), name: 'מזון לדגים', type: 'product', createdAt: new Date().toISOString() },
      { id: uuidv4(), name: 'מזון למכרסמים', type: 'product', createdAt: new Date().toISOString() },
      { id: uuidv4(), name: 'אביזרים', type: 'product', createdAt: new Date().toISOString() },
      { id: uuidv4(), name: 'היגיינה וטיפוח', type: 'product', createdAt: new Date().toISOString() },
      { id: uuidv4(), name: 'בריאות ותוספים', type: 'product', createdAt: new Date().toISOString() },
      { id: uuidv4(), name: 'חשמל', type: 'expense', createdAt: new Date().toISOString() },
      { id: uuidv4(), name: 'ארנונה ומים', type: 'expense', createdAt: new Date().toISOString() },
      { id: uuidv4(), name: 'טלפון ואינטרנט', type: 'expense', createdAt: new Date().toISOString() },
      { id: uuidv4(), name: 'שכר דירה', type: 'expense', createdAt: new Date().toISOString() },
      { id: uuidv4(), name: 'רואה חשבון', type: 'expense', createdAt: new Date().toISOString() },
      { id: uuidv4(), name: 'ביטוח', type: 'expense', createdAt: new Date().toISOString() },
      { id: uuidv4(), name: 'תחזוקה ותיקונים', type: 'expense', createdAt: new Date().toISOString() },
    ];
    writeCollection('categories', defaultCategories);
  }

  // Default admin user
  if (!fs.existsSync(getFilePath('users'))) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    const defaultUsers = [
      {
        id: uuidv4(),
        name: 'מנהל',
        email: 'admin@store.com',
        password: hashedPassword,
        role: 'admin',
        position: 'מנהל',
        hourlyRate: 50,
        createdAt: new Date().toISOString()
      }
    ];
    writeCollection('users', defaultUsers);
  }

  // Initialize other collections if not exist
  if (!fs.existsSync(getFilePath('suppliers'))) {
    writeCollection('suppliers', []);
  }
  if (!fs.existsSync(getFilePath('sales'))) {
    writeCollection('sales', []);
  }
  if (!fs.existsSync(getFilePath('expenses'))) {
    writeCollection('expenses', []);
  }
  if (!fs.existsSync(getFilePath('workHours'))) {
    writeCollection('workHours', []);
  }
  if (!fs.existsSync(getFilePath('budgetTargets'))) {
    const currentDate = new Date();
    const defaultTarget = {
      id: uuidv4(),
      month: currentDate.getMonth() + 1,
      year: currentDate.getFullYear(),
      revenueTarget: 50000,
      productCostTargetPct: 30,
      laborCostTargetPct: 28,
      createdAt: new Date().toISOString()
    };
    writeCollection('budgetTargets', [defaultTarget]);
  }
}

// CRUD Operations
export const db = {
  // Users
  getUsers: () => readCollection('users'),
  getUserById: (id) => readCollection('users').find(u => u.id === id),
  getUserByEmail: (email) => readCollection('users').find(u => u.email === email),
  createUser: (user) => {
    const users = readCollection('users');
    const newUser = { ...user, id: uuidv4(), createdAt: new Date().toISOString() };
    users.push(newUser);
    writeCollection('users', users);
    return newUser;
  },
  updateUser: (id, updates) => {
    const users = readCollection('users');
    const index = users.findIndex(u => u.id === id);
    if (index !== -1) {
      users[index] = { ...users[index], ...updates };
      writeCollection('users', users);
      return users[index];
    }
    return null;
  },
  deleteUser: (id) => {
    const users = readCollection('users');
    const filtered = users.filter(u => u.id !== id);
    writeCollection('users', filtered);
  },

  // Categories
  getCategories: () => readCollection('categories'),
  getCategoryById: (id) => readCollection('categories').find(c => c.id === id),
  createCategory: (category) => {
    const categories = readCollection('categories');
    const newCategory = { ...category, id: uuidv4(), createdAt: new Date().toISOString() };
    categories.push(newCategory);
    writeCollection('categories', categories);
    return newCategory;
  },
  updateCategory: (id, updates) => {
    const categories = readCollection('categories');
    const index = categories.findIndex(c => c.id === id);
    if (index !== -1) {
      categories[index] = { ...categories[index], ...updates };
      writeCollection('categories', categories);
      return categories[index];
    }
    return null;
  },
  deleteCategory: (id) => {
    const categories = readCollection('categories');
    const filtered = categories.filter(c => c.id !== id);
    writeCollection('categories', filtered);
  },

  // Suppliers
  getSuppliers: () => readCollection('suppliers'),
  getSupplierById: (id) => readCollection('suppliers').find(s => s.id === id),
  createSupplier: (supplier) => {
    const suppliers = readCollection('suppliers');
    const newSupplier = { ...supplier, id: uuidv4(), createdAt: new Date().toISOString() };
    suppliers.push(newSupplier);
    writeCollection('suppliers', suppliers);
    return newSupplier;
  },
  updateSupplier: (id, updates) => {
    const suppliers = readCollection('suppliers');
    const index = suppliers.findIndex(s => s.id === id);
    if (index !== -1) {
      suppliers[index] = { ...suppliers[index], ...updates };
      writeCollection('suppliers', suppliers);
      return suppliers[index];
    }
    return null;
  },
  deleteSupplier: (id) => {
    const suppliers = readCollection('suppliers');
    const filtered = suppliers.filter(s => s.id !== id);
    writeCollection('suppliers', filtered);
  },

  // Sales
  getSales: () => readCollection('sales'),
  getSalesByUser: (userId) => readCollection('sales').filter(s => s.userId === userId),
  getSalesByDate: (date) => readCollection('sales').filter(s => s.date === date),
  getSalesByDateRange: (startDate, endDate) => {
    return readCollection('sales').filter(s => s.date >= startDate && s.date <= endDate);
  },
  createSale: (sale) => {
    const sales = readCollection('sales');
    const newSale = { ...sale, id: uuidv4(), createdAt: new Date().toISOString() };
    sales.push(newSale);
    writeCollection('sales', sales);
    return newSale;
  },
  updateSale: (id, updates) => {
    const sales = readCollection('sales');
    const index = sales.findIndex(s => s.id === id);
    if (index !== -1) {
      sales[index] = { ...sales[index], ...updates };
      writeCollection('sales', sales);
      return sales[index];
    }
    return null;
  },
  deleteSale: (id) => {
    const sales = readCollection('sales');
    const filtered = sales.filter(s => s.id !== id);
    writeCollection('sales', filtered);
  },

  // Expenses
  getExpenses: () => readCollection('expenses'),
  getExpensesByDateRange: (startDate, endDate) => {
    return readCollection('expenses').filter(e => e.date >= startDate && e.date <= endDate);
  },
  createExpense: (expense) => {
    const expenses = readCollection('expenses');
    const newExpense = { ...expense, id: uuidv4(), createdAt: new Date().toISOString() };
    expenses.push(newExpense);
    writeCollection('expenses', expenses);
    return newExpense;
  },
  updateExpense: (id, updates) => {
    const expenses = readCollection('expenses');
    const index = expenses.findIndex(e => e.id === id);
    if (index !== -1) {
      expenses[index] = { ...expenses[index], ...updates };
      writeCollection('expenses', expenses);
      return expenses[index];
    }
    return null;
  },
  deleteExpense: (id) => {
    const expenses = readCollection('expenses');
    const filtered = expenses.filter(e => e.id !== id);
    writeCollection('expenses', filtered);
  },

  // Work Hours
  getWorkHours: () => readCollection('workHours'),
  getWorkHoursByUser: (userId) => readCollection('workHours').filter(w => w.userId === userId),
  getWorkHoursByDateRange: (startDate, endDate) => {
    return readCollection('workHours').filter(w => w.date >= startDate && w.date <= endDate);
  },
  createWorkHours: (workHours) => {
    const hours = readCollection('workHours');
    const newHours = { ...workHours, id: uuidv4(), createdAt: new Date().toISOString() };
    hours.push(newHours);
    writeCollection('workHours', hours);
    return newHours;
  },
  updateWorkHours: (id, updates) => {
    const hours = readCollection('workHours');
    const index = hours.findIndex(w => w.id === id);
    if (index !== -1) {
      hours[index] = { ...hours[index], ...updates };
      writeCollection('workHours', hours);
      return hours[index];
    }
    return null;
  },

  // Budget Targets
  getBudgetTargets: () => readCollection('budgetTargets'),
  getBudgetTargetByMonth: (month, year) => {
    return readCollection('budgetTargets').find(t => t.month === month && t.year === year);
  },
  createBudgetTarget: (target) => {
    const targets = readCollection('budgetTargets');
    const existing = targets.findIndex(t => t.month === target.month && t.year === target.year);
    if (existing !== -1) {
      targets[existing] = { ...targets[existing], ...target };
    } else {
      targets.push({ ...target, id: uuidv4(), createdAt: new Date().toISOString() });
    }
    writeCollection('budgetTargets', targets);
    return targets.find(t => t.month === target.month && t.year === target.year);
  },
};

export default db;
