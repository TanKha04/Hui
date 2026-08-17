const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const dbPath = path.join(DATA_DIR, 'hui.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize schema
function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS hui_groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      amount_per_member INTEGER NOT NULL,
      total_members INTEGER NOT NULL DEFAULT 20,
      commission_rate REAL NOT NULL DEFAULT 0.5,
      start_date TEXT NOT NULL,
      host_name TEXT NOT NULL DEFAULT 'Chủ Hụi',
      host_phone TEXT DEFAULT '',
      host_address TEXT DEFAULT '',
      period_type TEXT DEFAULT 'month',
      current_period INTEGER DEFAULT 1,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS hui_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id INTEGER NOT NULL,
      order_index INTEGER NOT NULL,
      member_name TEXT NOT NULL,
      phone TEXT DEFAULT '',
      address TEXT DEFAULT '',
      cccd TEXT DEFAULT '',
      won_period INTEGER DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (group_id) REFERENCES hui_groups(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS hui_periods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id INTEGER NOT NULL,
      period_number INTEGER NOT NULL,
      due_date TEXT NOT NULL,
      winner_member_id INTEGER DEFAULT NULL,
      bid_amount INTEGER DEFAULT 0,
      net_payout INTEGER DEFAULT 0,
      commission_amount INTEGER DEFAULT 0,
      base_pot INTEGER DEFAULT 0,
      total_discount INTEGER DEFAULT 0,
      notes TEXT DEFAULT '',
      is_settled INTEGER DEFAULT 0,
      FOREIGN KEY (group_id) REFERENCES hui_groups(id) ON DELETE CASCADE,
      FOREIGN KEY (winner_member_id) REFERENCES hui_members(id) ON DELETE SET NULL,
      UNIQUE(group_id, period_number)
    );

    CREATE TABLE IF NOT EXISTS hui_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id INTEGER NOT NULL,
      period_number INTEGER NOT NULL,
      member_id INTEGER NOT NULL,
      amount_due INTEGER NOT NULL DEFAULT 0,
      amount_paid INTEGER DEFAULT 0,
      is_paid INTEGER DEFAULT 0,
      paid_date TEXT DEFAULT NULL,
      payment_method TEXT DEFAULT 'cash',
      FOREIGN KEY (group_id) REFERENCES hui_groups(id) ON DELETE CASCADE,
      FOREIGN KEY (member_id) REFERENCES hui_members(id) ON DELETE CASCADE,
      UNIQUE(group_id, period_number, member_id)
    );

    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Seed sample data if empty
  const count = db.prepare('SELECT COUNT(*) as count FROM hui_groups').get();
  if (count.count === 0) {
    seedSampleData();
  }
}

function calculateDueDate(startDateStr, periodIndex) {
  // periodIndex is 1 to 20
  const parts = startDateStr.split('-');
  const y = parseInt(parts[0], 10) || 2026;
  const m = parseInt(parts[1], 10) || 1;
  const d = parseInt(parts[2], 10) || 1;
  
  const targetDate = new Date(y, m - 1 + (periodIndex - 1), d);
  const yyyy = targetDate.getFullYear();
  const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
  const dd = String(targetDate.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function seedSampleData() {
  const insertGroup = db.prepare(`
    INSERT INTO hui_groups (name, amount_per_member, total_members, commission_rate, start_date, host_name, host_phone)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const group1 = insertGroup.run('Hụi Vàng 9999', 5000000, 20, 0.5, '2026-04-15', 'Chị Bảy Hụi', '0901234567');
  const group1Id = group1.lastInsertRowid;

  const insertMember = db.prepare(`
    INSERT INTO hui_members (group_id, order_index, member_name)
    VALUES (?, ?, ?)
  `);

  const sampleNames = [
    'Trần Văn A', 'Nguyễn Thị B', 'Lê Văn C', 'Phạm Thị D', 'Hoàng Văn E',
    'Vũ Thị F', 'Đặng Văn G', 'Bùi Thị H', 'Đỗ Văn I', 'Hồ Thị K',
    'Ngô Văn L', 'Dương Thị M', 'Lý Văn N', 'Mai Thị O', 'Trịnh Văn P',
    'Phan Thị Q', 'Võ Văn R', 'Huỳnh Thị S', 'Lâm Văn T', 'Đoàn Thị U'
  ];

  const memberIds = [];
  for (let i = 0; i < 20; i++) {
    const name = sampleNames[i] || `Thành viên ${i + 1}`;
    const res = insertMember.run(group1Id, i + 1, name);
    memberIds.push(res.lastInsertRowid);
  }

  // Create 20 periods
  const insertPeriod = db.prepare(`
    INSERT INTO hui_periods (group_id, period_number, due_date)
    VALUES (?, ?, ?)
  `);
  for (let p = 1; p <= 20; p++) {
    const dueDate = calculateDueDate('2026-04-15', p);
    insertPeriod.run(group1Id, p, dueDate);
  }

  // Create payments template for all 20 periods x 20 members
  const insertPayment = db.prepare(`
    INSERT INTO hui_payments (group_id, period_number, member_id, amount_due, is_paid)
    VALUES (?, ?, ?, ?, 0)
  `);
  for (let p = 1; p <= 20; p++) {
    for (let m = 0; m < 20; m++) {
      insertPayment.run(group1Id, p, memberIds[m], 5000000);
    }
  }

  // Sample group 2
  const group2 = insertGroup.run('Hụi Tiết Kiệm Tết', 2000000, 20, 0.5, '2026-01-10', 'Cô Tám', '0912345678');
  const group2Id = group2.lastInsertRowid;
  const group2MemberIds = [];
  for (let i = 0; i < 20; i++) {
    const res = insertMember.run(group2Id, i + 1, i < 5 ? `Chị Ba ${i + 1}` : `Thành viên ${i + 1}`);
    group2MemberIds.push(res.lastInsertRowid);
  }
  for (let p = 1; p <= 20; p++) {
    const dueDate = calculateDueDate('2026-01-10', p);
    insertPeriod.run(group2Id, p, dueDate);
    for (let m = 0; m < 20; m++) {
      insertPayment.run(group2Id, p, group2MemberIds[m], 2000000);
    }
  }
}

initSchema();

module.exports = {
  db,
  calculateDueDate
};
