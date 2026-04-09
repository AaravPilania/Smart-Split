/**
 * Subscription billing date processor
 * Runs periodically to advance nextBillingDate for due subscriptions,
 * creates auto-expenses (split among sharedWith partners), and notifies users.
 */
const mongoose = require('mongoose');
const Subscription = mongoose.model('Subscription');
const Notification = mongoose.model('Notification');
const GroupModel = mongoose.model('Group');
const Expense = require('../models/Expense');

const CYCLE_ADVANCE = {
  weekly:    7,
  monthly:   null,
  quarterly: null,
  yearly:    null,
};

function advanceDate(date, cycle) {
  const d = new Date(date);
  switch (cycle) {
    case 'weekly':
      d.setDate(d.getDate() + 7);
      break;
    case 'monthly':
      d.setMonth(d.getMonth() + 1);
      break;
    case 'quarterly':
      d.setMonth(d.getMonth() + 3);
      break;
    case 'yearly':
      d.setFullYear(d.getFullYear() + 1);
      break;
  }
  return d;
}

// Find or create a dedicated "Subscriptions" group for a user
async function getSubsGroup(userId, partnerIds = []) {
  const allMembers = [userId, ...partnerIds];
  // Look for existing auto-created Subscriptions group for this user
  let group = await GroupModel.findOne({
    name: '📦 Subscriptions',
    createdBy: userId,
  });
  if (!group) {
    group = await GroupModel.create({
      name: '📦 Subscriptions',
      description: 'Auto-created for subscription billing',
      createdBy: userId,
      members: allMembers,
      admins: [userId],
    });
  } else {
    // Ensure all partners are members
    const existing = group.members.map(m => m.toString());
    const toAdd = allMembers.filter(id => !existing.includes(id.toString()));
    if (toAdd.length > 0) {
      await GroupModel.findByIdAndUpdate(group._id, { $addToSet: { members: { $each: toAdd } } });
    }
  }
  return group;
}

async function processSubscriptions() {
  if (mongoose.connection.readyState !== 1) return; // skip if DB not connected

  try {
    const now = new Date();
    const dueSubs = await Subscription.find({
      active: true,
      nextBillingDate: { $lte: now },
    }).populate('sharedWith', 'name email').limit(200);

    for (const sub of dueSubs) {
      try {
        const newDate = advanceDate(sub.nextBillingDate, sub.billingCycle);
        sub.nextBillingDate = newDate;
        await sub.save();

        // Create auto-expense
        const partnerIds = (sub.sharedWith || []).map(u => u._id || u);
        const group = await getSubsGroup(sub.user, partnerIds);
        const allPeople = [sub.user, ...partnerIds];
        const perPerson = Math.round((sub.amount / allPeople.length) * 100) / 100;
        // Adjust rounding: first person gets remainder
        const splits = allPeople.map((uid, i) => ({
          user: uid,
          amount: i === 0 ? sub.amount - perPerson * (allPeople.length - 1) : perPerson,
        }));

        await Expense.createExpense(
          `${sub.name} (${sub.billingCycle})`,
          sub.amount,
          group._id,
          sub.user,
          splits,
          sub.category || 'utilities'
        );

        // Create a notification for the owner
        await Notification.create({
          to: sub.user,
          type: 'subscription_charged',
          message: `Your ${sub.name} subscription of ₹${sub.amount} has been billed${partnerIds.length > 0 ? ` (split ${allPeople.length} ways)` : ''}. Next billing: ${newDate.toLocaleDateString()}.`,
          amount: sub.amount,
          read: false,
        });

        // Notify partners
        for (const pid of partnerIds) {
          await Notification.create({
            to: pid,
            from: sub.user,
            type: 'subscription_charged',
            message: `You owe ₹${perPerson} for ${sub.name} subscription shared by ${sub.user.name || 'a friend'}.`,
            amount: perPerson,
            read: false,
          });
        }
      } catch (err) {
        console.error(`[SubCron] Failed to process subscription ${sub._id}:`, err.message);
      }
    }

    if (dueSubs.length > 0) {
      console.log(`[SubCron] Processed ${dueSubs.length} due subscriptions`);
    }
  } catch (err) {
    console.error('[SubCron] Error:', err.message);
  }
}

// Run every hour
let intervalId = null;
function start() {
  if (intervalId) return;
  // Initial run after 10s (let DB connect first)
  setTimeout(processSubscriptions, 10_000);
  intervalId = setInterval(processSubscriptions, 60 * 60 * 1000);
  console.log('[SubCron] Subscription processor started (hourly)');
}

function stop() {
  if (intervalId) { clearInterval(intervalId); intervalId = null; }
}

module.exports = { start, stop, processSubscriptions };
