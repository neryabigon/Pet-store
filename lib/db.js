import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const DB_PATH = path.join(process.cwd(), 'data', 'budget.db');

let db = null;
let SQL = null;

export async function getDb() {
  if (db) return db;
  
  SQL = await initSqlJs();
  
  // Ensure data directory exists
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  // Load existing database or create new one
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
    await initializeDatabase();
  }
  
  return db;
}

export async function saveDb() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

async function initializeDatabase() {
  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'shift_manager', 'worker')),
      hourly_rate REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Categories table
  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense_supplier', 'expense_fixed', 'expense_operational')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Suppliers table
  db.run(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Daily sales table
  db.run(`
    CREATE TABLE IF NOT EXISTS daily_sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      category_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      date DATE NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (category_id) REFERENCES categories(id)
    )
  `);
  
  // Expenses table
  db.run(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      supplier_id INTEGER,
      amount REAL NOT NULL,
      date DATE NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id),
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
    )
  `);
  
  // Monthly targets table
  db.run(`
    CREATE TABLE IF NOT EXISTS targets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      year INTEGER NOT NULL,
      month INTEGER NOT NULL,
      revenue_target REAL DEFAULT 0,
      product_cost_percent REAL DEFAULT 30,
      labor_cost_percent REAL DEFAULT 28,
      UNIQUE(year, month)
    )
  `);
  
  // Shifts table for labor tracking
  db.run(`
    CREATE TABLE IF NOT EXISTS shifts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      date DATE NOT NULL,
      hours REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Insert default admin user (password: admin123)
  const adminPasswordHash = bcrypt.hashSync('admin123', 10);
  db.run(`
    INSERT INTO users (username, password_hash, name, role, hourly_rate)
    VALUES ('admin', ?, 'מנהל המערכת', 'admin', 0)
  `, [adminPasswordHash]);
  
  // Insert default categories
  const defaultCategories = [
    // Income categories
    { name: 'מזון לכלבים', type: 'income' },
    { name: 'מזון לחתולים', type: 'income' },
    { name: 'מזון לציפורים', type: 'income' },
    { name: 'מזון לדגים', type: 'income' },
    { name: 'מזון למכרסמים', type: 'income' },
    { name: 'אביזרים (רצועות, קערות, משחקים)', type: 'income' },
    { name: 'היגיינה וטיפוח', type: 'income' },
    { name: 'בריאות (ויטמינים, תוספים)', type: 'income' },
    // Supplier expense categories
    { name: 'קניות מזון לכלבים', type: 'expense_supplier' },
    { name: 'קניות מזון לחתולים', type: 'expense_supplier' },
    { name: 'קניות מזון אחר', type: 'expense_supplier' },
    { name: 'קניות אביזרים', type: 'expense_supplier' },
    { name: 'קניות היגיינה וטיפוח', type: 'expense_supplier' },
    // Fixed expenses
    { name: 'חשמל', type: 'expense_fixed' },
    { name: 'מים', type: 'expense_fixed' },
    { name: 'ארנונה', type: 'expense_fixed' },
    { name: 'שכר דירה', type: 'expense_fixed' },
    { name: 'טלפון ואינטרנט', type: 'expense_fixed' },
    { name: 'רואה חשבון', type: 'expense_fixed' },
    { name: 'ביטוח', type: 'expense_fixed' },
    // Operational expenses
    { name: 'תיקונים ותחזוקה', type: 'expense_operational' },
    { name: 'ציוד', type: 'expense_operational' },
    { name: 'שונות', type: 'expense_operational' },
  ];
  
  for (const cat of defaultCategories) {
    db.run(`INSERT INTO categories (name, type) VALUES (?, ?)`, [cat.name, cat.type]);
  }
  
  // Insert default suppliers
  const defaultSuppliers = ['ספק מזון ראשי', 'ספק אביזרים', 'ספק היגיינה'];
  for (const name of defaultSuppliers) {
    db.run(`INSERT INTO suppliers (name) VALUES (?)`, [name]);
  }
  
  await saveDb();
}

// Helper functions
export function query(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

export function run(sql, params = []) {
  db.run(sql, params);
  saveDb();
  return { changes: db.getRowsModified(), lastInsertRowid: db.exec("SELECT last_insert_rowid()")[0]?.values[0]?.[0] };
}

export function get(sql, params = []) {
  const results = query(sql, params);
  return results[0] || null;
}
