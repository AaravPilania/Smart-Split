/**
 * Recurring bills processor for home groups.
 * Runs daily to check if any active recurring bills are due
 * for the current month and auto-creates expenses split among group members.
 */
const mongoose = require('mongoose');
const Expense = require('../models/Expense');

async function run() {
  if (mongoose.connection.readyState !== 1) return;

  try {
    const GroupModel = mongoose.model('Group');
    const now = new Date();
    const currentDay = now.getDate();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const homeGroups = await GroupModel.find({
      type: 'home',
      archived: { $ne: true },
      'recurringBills.0': { $exists: true },
    }).populate('members', 'name email');

    let generated = 0;

    for (const group of homeGroups) {
      for (const bill of group.recurringBills) {
        if (!bill.active) continue;
        if (bill.lastGeneratedMonth === currentMonth) continue;
        if (currentDay < bill.billingDay) continue;

        const members = group.members || [];
        if (members.length === 0) continue;

        const perPerson = Math.round((bill.amount / members.length) * 100) / 100;
        const splits = members.map((m, i) => ({
          user: m._id || m,
          amount: i === 0 ? bill.amount - perPerson * (members.length - 1) : perPerson,
        }));

        await Expense.createExpense(
          `${bill.name} – ${now.toLocaleString('default', { month: 'short' })}`,
          bill.amount,
          group._id,
          group.createdBy,
          splits,
          bill.category || 'utilities'
        );

        bill.lastGeneratedMonth = currentMonth;
        generated++;
      }

      await group.save();
    }

    if (generated > 0) {
      console.log(`[RecurringBills] Generated ${generated} expense(s)`);
    }
  } catch (err) {
    console.error('[RecurringBills] Error:', err.message);
  }
}

function start() {
  // Run every 6 hours
  setInterval(run, 6 * 60 * 60 * 1000);
  // Initial run after 30 seconds
  setTimeout(run, 30_000);
  console.log('[RecurringBills] Recurring bills job scheduled (every 6h)');
}

module.exports = { start, run };
