const express = require('express');
const cors = require('cors');
const path = require('path');
const { db, calculateDueDate } = require('./db');
const { generateHuiDocx } = require('./docx-generator');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// API: Get all groups
app.get('/api/groups', (req, res) => {
  try {
    const groups = db.prepare(`
      SELECT g.*, 
        (SELECT COUNT(*) FROM hui_members WHERE group_id = g.id) as member_count,
        (SELECT COUNT(*) FROM hui_periods WHERE group_id = g.id AND is_settled = 1) as settled_periods_count
      FROM hui_groups g
      ORDER BY g.id DESC
    `).all();
    res.json({ success: true, data: groups });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Create new group
app.post('/api/groups', (req, res) => {
  try {
    const {
      name,
      amount_per_member,
      total_members = 20,
      start_date,
      host_name = 'Chủ Hụi',
      host_phone = '',
      commission_rate = 0.5,
      member_names = []
    } = req.body;

    if (!name || !amount_per_member || !start_date) {
      return res.status(400).json({ success: false, error: 'Thiếu thông tin bắt buộc (Tên hụi, Số tiền, Ngày bắt đầu)' });
    }

    const count = parseInt(total_members, 10) || 20;
    const amount = parseInt(amount_per_member, 10);
    const commRate = parseFloat(commission_rate) || 0.5;

    const createTransaction = db.transaction(() => {
      // 1. Insert group
      const insertGroup = db.prepare(`
        INSERT INTO hui_groups (name, amount_per_member, total_members, commission_rate, start_date, host_name, host_phone)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      const groupRes = insertGroup.run(name, amount, count, commRate, start_date, host_name, host_phone);
      const groupId = groupRes.lastInsertRowid;

      // 2. Insert members
      const insertMember = db.prepare(`
        INSERT INTO hui_members (group_id, order_index, member_name)
        VALUES (?, ?, ?)
      `);
      const memberIds = [];
      for (let i = 0; i < count; i++) {
        const memName = (member_names[i] && member_names[i].trim()) || `Thành viên ${i + 1}`;
        const memRes = insertMember.run(groupId, i + 1, memName);
        memberIds.push(memRes.lastInsertRowid);
      }

      // 3. Insert periods
      const insertPeriod = db.prepare(`
        INSERT INTO hui_periods (group_id, period_number, due_date)
        VALUES (?, ?, ?)
      `);
      for (let p = 1; p <= count; p++) {
        const dueDate = calculateDueDate(start_date, p);
        insertPeriod.run(groupId, p, dueDate);
      }

      // 4. Insert initial payment rows
      const insertPayment = db.prepare(`
        INSERT INTO hui_payments (group_id, period_number, member_id, amount_due, is_paid)
        VALUES (?, ?, ?, ?, 0)
      `);
      for (let p = 1; p <= count; p++) {
        for (let m = 0; m < count; m++) {
          insertPayment.run(groupId, p, memberIds[m], amount);
        }
      }

      return groupId;
    });

    const newGroupId = createTransaction();
    res.status(201).json({ success: true, groupId: newGroupId });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Get group detail
app.get('/api/groups/:id', (req, res) => {
  try {
    const groupId = req.params.id;
    const group = db.prepare('SELECT * FROM hui_groups WHERE id = ?').get(groupId);
    if (!group) {
      return res.status(400).json({ success: false, error: 'Không tìm thấy dây hụi' });
    }

    const members = db.prepare(`
      SELECT m.*,
        (SELECT COUNT(*) FROM hui_payments p WHERE p.member_id = m.id AND p.is_paid = 1) as paid_count,
        (SELECT SUM(p.amount_due) FROM hui_payments p WHERE p.member_id = m.id AND p.is_paid = 0 AND p.period_number <= g.current_period) as total_debt
      FROM hui_members m
      JOIN hui_groups g ON g.id = m.group_id
      WHERE m.group_id = ?
      ORDER BY m.order_index ASC
    `).all(groupId);

    const periods = db.prepare(`
      SELECT p.*, m.member_name as winner_name
      FROM hui_periods p
      LEFT JOIN hui_members m ON m.id = p.winner_member_id
      WHERE p.group_id = ?
      ORDER BY p.period_number ASC
    `).all(groupId);

    const currentPeriodNumber = group.current_period || 1;
    const payments = db.prepare(`
      SELECT * FROM hui_payments 
      WHERE group_id = ? AND period_number = ?
    `).all(groupId, currentPeriodNumber);

    res.json({
      success: true,
      data: {
        group,
        members,
        periods,
        currentPeriodPayments: payments,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Update member info (e.g., inline edit name)
app.put('/api/members/:id', (req, res) => {
  try {
    const memberId = req.params.id;
    const { member_name, phone, address, cccd } = req.body;
    db.prepare(`
      UPDATE hui_members 
      SET member_name = COALESCE(?, member_name),
          phone = COALESCE(?, phone),
          address = COALESCE(?, address),
          cccd = COALESCE(?, cccd)
      WHERE id = ?
    `).run(member_name, phone, address, cccd, memberId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Change group current period
app.put('/api/groups/:id/set-period', (req, res) => {
  try {
    const groupId = req.params.id;
    const { current_period } = req.body;
    db.prepare('UPDATE hui_groups SET current_period = ? WHERE id = ?').run(current_period, groupId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Settle period (HỐT HỤI)
app.post('/api/periods/:groupId/:periodNumber/settle', (req, res) => {
  try {
    const { groupId, periodNumber } = req.params;
    const { winner_member_id, bid_amount } = req.body;

    const pNum = parseInt(periodNumber, 10);
    const bid = parseInt(bid_amount, 10) || 0;

    const group = db.prepare('SELECT * FROM hui_groups WHERE id = ?').get(groupId);
    if (!group) return res.status(404).json({ success: false, error: 'Không tìm thấy dây hụi' });

    const member = db.prepare('SELECT * FROM hui_members WHERE id = ? AND group_id = ?').get(winner_member_id, groupId);
    if (!member) return res.status(404).json({ success: false, error: 'Không tìm thấy thành viên' });

    // Business Logic Calculations:
    const M = group.amount_per_member; // e.g., 2,000,000
    const totalMembers = group.total_members; // 20
    const remainingMonths = totalMembers - pNum; // e.g. 20 - 11 = 9
    const basePot = (totalMembers - 1) * M; // 19 * 2,000,000 = 38,000,000
    const totalDiscount = remainingMonths * bid; // 9 * 200,000 = 1,800,000
    const commission = Math.round(M * (group.commission_rate || 0.5)); // 2,000,000 * 50% = 1,000,000
    const netPayout = basePot - totalDiscount - commission; // 38,000,000 - 1,800,000 - 1,000,000 = 35,200,000

    const settleTx = db.transaction(() => {
      // 1. Mark previous winner for this period as null if any
      const existingPeriod = db.prepare('SELECT winner_member_id FROM hui_periods WHERE group_id = ? AND period_number = ?').get(groupId, pNum);
      if (existingPeriod && existingPeriod.winner_member_id) {
        db.prepare('UPDATE hui_members SET won_period = NULL WHERE id = ?').run(existingPeriod.winner_member_id);
      }

      // 2. Update member won_period
      db.prepare('UPDATE hui_members SET won_period = ? WHERE id = ?').run(pNum, winner_member_id);

      // 3. Update period record
      db.prepare(`
        UPDATE hui_periods
        SET winner_member_id = ?,
            bid_amount = ?,
            net_payout = ?,
            commission_amount = ?,
            base_pot = ?,
            total_discount = ?,
            is_settled = 1
        WHERE group_id = ? AND period_number = ?
      `).run(winner_member_id, bid, netPayout, commission, basePot, totalDiscount, groupId, pNum);

      // 4. Update amount_due in hui_payments for this period:
      // - Members who have already won (hụi chết, won_period < pNum): pay full M
      // - Members who haven't won yet (hụi sống): pay M - bid
      // - The winner in this period: they take the pot, their contribution is calculated in the 19 parts, amount_due = 0 or marked as resolved
      const allMembers = db.prepare('SELECT id, won_period FROM hui_members WHERE group_id = ?').all(groupId);
      for (const m of allMembers) {
        let amountDue = M;
        if (m.id === parseInt(winner_member_id, 10)) {
          amountDue = 0; // Winner takes pot
        } else if (m.won_period !== null && m.won_period < pNum) {
          // Hụi chết: pays full
          amountDue = M;
        } else {
          // Hụi sống: pays M - bid
          amountDue = Math.max(0, M - bid);
        }

        db.prepare(`
          UPDATE hui_payments
          SET amount_due = ?
          WHERE group_id = ? AND period_number = ? AND member_id = ?
        `).run(amountDue, groupId, pNum, m.id);
      }
    });

    settleTx();

    res.json({
      success: true,
      calculation: {
        basePot,
        remainingMonths,
        bid,
        totalDiscount,
        commission,
        netPayout
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Reset / Cancel settle for a period
app.post('/api/periods/:groupId/:periodNumber/unsettle', (req, res) => {
  try {
    const { groupId, periodNumber } = req.params;
    const pNum = parseInt(periodNumber, 10);

    const period = db.prepare('SELECT winner_member_id FROM hui_periods WHERE group_id = ? AND period_number = ?').get(groupId, pNum);
    if (period && period.winner_member_id) {
      db.prepare('UPDATE hui_members SET won_period = NULL WHERE id = ?').run(period.winner_member_id);
    }

    db.prepare(`
      UPDATE hui_periods
      SET winner_member_id = NULL,
          bid_amount = 0,
          net_payout = 0,
          commission_amount = 0,
          base_pot = 0,
          total_discount = 0,
          is_settled = 0
      WHERE group_id = ? AND period_number = ?
    `).run(groupId, pNum);

    const group = db.prepare('SELECT amount_per_member FROM hui_groups WHERE id = ?').get(groupId);
    db.prepare(`
      UPDATE hui_payments
      SET amount_due = ?
      WHERE group_id = ? AND period_number = ?
    `).run(group.amount_per_member, groupId, pNum);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Pay Hui for a member in a specific period (ĐÓNG HỤI)
app.post('/api/payments/pay', (req, res) => {
  try {
    const { group_id, period_number, member_id, paid_date, payment_method = 'cash' } = req.body;
    const today = new Date().toISOString().split('T')[0];
    const actualPaidDate = paid_date || today;

    const payment = db.prepare(`
      SELECT * FROM hui_payments 
      WHERE group_id = ? AND period_number = ? AND member_id = ?
    `).get(group_id, period_number, member_id);

    if (!payment) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy bản ghi đóng tiền' });
    }

    db.prepare(`
      UPDATE hui_payments
      SET is_paid = 1,
          amount_paid = amount_due,
          paid_date = ?,
          payment_method = ?
      WHERE id = ?
    `).run(actualPaidDate, payment_method, payment.id);

    res.json({ success: true, amount_paid: payment.amount_due, paid_date: actualPaidDate });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Toggle/Unpay (Hủy đóng hụi nếu bấm nhầm)
app.post('/api/payments/unpay', (req, res) => {
  try {
    const { group_id, period_number, member_id } = req.body;
    db.prepare(`
      UPDATE hui_payments
      SET is_paid = 0,
          amount_paid = 0,
          paid_date = NULL
      WHERE group_id = ? AND period_number = ? AND member_id = ?
    `).run(group_id, period_number, member_id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Get debt breakdown and history for a member (CÒN LẠI & NGÀY ĐÓNG LỊCH SỬ)
app.get('/api/members/:memberId/history', (req, res) => {
  try {
    const memberId = req.params.memberId;
    const member = db.prepare('SELECT m.*, g.name as group_name, g.amount_per_member, g.current_period FROM hui_members m JOIN hui_groups g ON g.id = m.group_id WHERE m.id = ?').get(memberId);
    if (!member) return res.status(404).json({ success: false, error: 'Không tìm thấy thành viên' });

    const payments = db.prepare(`
      SELECT p.*, per.due_date, per.is_settled, per.bid_amount, per.winner_member_id
      FROM hui_payments p
      JOIN hui_periods per ON per.group_id = p.group_id AND per.period_number = p.period_number
      WHERE p.member_id = ?
      ORDER BY p.period_number ASC
    `).all(memberId);

    const paidPeriods = payments.filter(p => p.is_paid === 1);
    const unpaidPeriodsUpToNow = payments.filter(p => p.is_paid === 0 && p.period_number <= member.current_period);
    const totalDebt = unpaidPeriodsUpToNow.reduce((sum, p) => sum + (p.amount_due || 0), 0);

    res.json({
      success: true,
      data: {
        member,
        totalPaidCount: paidPeriods.length,
        totalPeriods: payments.length,
        totalDebt,
        payments,
        unpaidPeriodsUpToNow,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Pay all remaining debt up to current period (ĐÓNG HẾT TIỀN HỤI)
app.post('/api/members/:memberId/pay-all', (req, res) => {
  try {
    const memberId = req.params.memberId;
    const member = db.prepare('SELECT m.*, g.current_period FROM hui_members m JOIN hui_groups g ON g.id = m.group_id WHERE m.id = ?').get(memberId);
    if (!member) return res.status(404).json({ success: false, error: 'Không tìm thấy thành viên' });

    const today = new Date().toISOString().split('T')[0];

    db.prepare(`
      UPDATE hui_payments
      SET is_paid = 1,
          amount_paid = amount_due,
          paid_date = ?
      WHERE member_id = ? AND is_paid = 0 AND period_number <= ?
    `).run(today, memberId, member.current_period);

    res.json({ success: true, message: 'Đã thanh toán tất cả các kỳ hụi còn nợ!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Get Gom Hui collection dashboard data (DANH SÁCH GOM HỤI)
app.get('/api/gom-hui', (req, res) => {
  try {
    const { date } = req.query;
    const today = date || new Date().toISOString().split('T')[0];

    // Fetch all active groups
    const groups = db.prepare(`SELECT * FROM hui_groups ORDER BY id DESC`).all();

    // Fetch all payments joined with members, groups, and periods
    const rows = db.prepare(`
      SELECT 
        p.id as payment_id,
        p.group_id,
        p.period_number,
        p.member_id,
        p.amount_due,
        p.amount_paid,
        p.is_paid,
        p.paid_date,
        p.payment_method,
        m.member_name,
        m.phone as member_phone,
        m.address as member_address,
        m.order_index,
        m.won_period,
        g.name as group_name,
        g.amount_per_member,
        g.total_members,
        g.current_period as group_current_period,
        g.host_name,
        g.commission_rate,
        per.due_date,
        per.is_settled,
        per.bid_amount,
        per.winner_member_id,
        (SELECT wm.member_name FROM hui_members wm WHERE wm.id = per.winner_member_id) as winner_name
      FROM hui_payments p
      JOIN hui_members m ON m.id = p.member_id
      JOIN hui_groups g ON g.id = p.group_id
      JOIN hui_periods per ON per.group_id = p.group_id AND per.period_number = p.period_number
      ORDER BY per.due_date ASC, g.id ASC, m.order_index ASC
    `).all();

    // Process rows to compute accurate amounts and status
    const items = rows.map(r => {
      const isWinnerThisPeriod = r.winner_member_id === r.member_id;
      const isHuiChet = r.won_period !== null && r.won_period < r.period_number;
      const isHuiSong = !isHuiChet && !isWinnerThisPeriod;

      let effectiveAmount = r.amount_per_member;
      let memberType = 'hui_song';

      if (isWinnerThisPeriod) {
        effectiveAmount = 0;
        memberType = 'winner';
      } else if (isHuiChet) {
        effectiveAmount = r.amount_per_member;
        memberType = 'hui_chet';
      } else if (r.is_settled === 1) {
        effectiveAmount = Math.max(0, r.amount_per_member - (r.bid_amount || 0));
        memberType = 'hui_song';
      } else {
        effectiveAmount = r.amount_per_member;
        memberType = 'hui_song';
      }

      // Check dates
      const isToday = r.due_date === today;
      const isOverdue = r.due_date < today && r.is_paid === 0;
      const isCurrentPeriod = r.period_number === r.group_current_period;
      const isUpcoming = r.due_date > today;

      return {
        ...r,
        effective_amount_due: effectiveAmount,
        member_type: memberType,
        is_today: isToday,
        is_overdue: isOverdue,
        is_current_period: isCurrentPeriod,
        is_upcoming: isUpcoming,
      };
    });

    // Compute stats
    const todayItems = items.filter(i => i.is_today && i.member_type !== 'winner');
    const todayDueItems = todayItems.filter(i => i.is_paid === 0);
    const todayPaidItems = todayItems.filter(i => i.is_paid === 1);

    const currentPeriodPending = items.filter(i => i.is_current_period && i.is_paid === 0 && i.member_type !== 'winner');
    const overdueItems = items.filter(i => i.is_overdue && i.member_type !== 'winner');
    const totalPaidItems = items.filter(i => i.is_paid === 1 && i.is_current_period);

    const stats = {
      todayDueCount: todayDueItems.length,
      todayDueTotal: todayDueItems.reduce((s, i) => s + i.effective_amount_due, 0),
      todayPaidCount: todayPaidItems.length,
      todayPaidTotal: todayPaidItems.reduce((s, i) => s + (i.amount_paid || i.effective_amount_due), 0),
      currentPendingCount: currentPeriodPending.length,
      currentPendingTotal: currentPeriodPending.reduce((s, i) => s + i.effective_amount_due, 0),
      overdueCount: overdueItems.length,
      overdueTotal: overdueItems.reduce((s, i) => s + i.effective_amount_due, 0),
      totalGroups: groups.length,
    };

    res.json({
      success: true,
      data: {
        today,
        stats,
        groups,
        items,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Get System Settings
app.get('/api/settings', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM system_settings').all();
    const settings = {};
    rows.forEach(r => { settings[r.key] = r.value; });
    
    const result = {
      brand_name: settings.brand_name || 'Hụi',
      greeting_name: settings.greeting_name || 'Xin chào!',
      host_name: settings.host_name || 'Chị Bảy Hụi',
      host_phone: settings.host_phone || '0901234567',
      commission_rate: settings.commission_rate || '0.5',
    };
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Save System Settings
app.post('/api/settings', (req, res) => {
  try {
    const { brand_name, greeting_name, host_name, host_phone, commission_rate } = req.body;
    
    const insertOrReplace = db.prepare('INSERT OR REPLACE INTO system_settings (key, value) VALUES (?, ?)');
    
    const saveTx = db.transaction(() => {
      if (brand_name !== undefined) insertOrReplace.run('brand_name', String(brand_name));
      if (greeting_name !== undefined) insertOrReplace.run('greeting_name', String(greeting_name));
      if (host_name !== undefined) {
        insertOrReplace.run('host_name', String(host_name));
        db.prepare('UPDATE hui_groups SET host_name = ?').run(String(host_name));
      }
      if (host_phone !== undefined) {
        insertOrReplace.run('host_phone', String(host_phone));
        db.prepare('UPDATE hui_groups SET host_phone = ?').run(String(host_phone));
      }
      if (commission_rate !== undefined) insertOrReplace.run('commission_rate', String(commission_rate));
    });

    saveTx();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Export Word .docx (IN GIẤY HỤI)
app.get('/api/groups/:id/export-docx', async (req, res) => {
  try {
    const groupId = req.params.id;
    const group = db.prepare('SELECT * FROM hui_groups WHERE id = ?').get(groupId);
    if (!group) return res.status(404).json({ success: false, error: 'Không tìm thấy dây hụi' });

    const members = db.prepare('SELECT * FROM hui_members WHERE group_id = ? ORDER BY order_index ASC').all(groupId);
    const periods = db.prepare('SELECT * FROM hui_periods WHERE group_id = ? ORDER BY period_number ASC').all(groupId);

    const docxBuffer = await generateHuiDocx(group, members, periods);

    const filename = `Giay_Hui_${encodeURIComponent(group.name.replace(/\s+/g, '_'))}.docx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(docxBuffer);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete group
app.delete('/api/groups/:id', (req, res) => {
  try {
    const groupId = req.params.id;
    db.prepare('DELETE FROM hui_groups WHERE id = ?').run(groupId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Serve frontend static build if available
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));

// Serve frontend fallback
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, error: 'API endpoint not found' });
  }
  const indexPath = path.join(clientDist, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.send(`<h1>Backend API Server is running on port ${PORT}</h1><p>Client build not found yet.</p>`);
    }
  });
});

app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});
