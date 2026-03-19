const Expense = require('../models/Expense');
const Group = require('../models/Group');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

// Helper: silently log activity
async function logActivity(groupId, actorId, actorName, action, details, meta = {}) {
  try {
    await ActivityLog.create({ groupId: String(groupId), actorId, actorName, action, details, meta });
  } catch (_) {}
}

// Add expense
exports.addExpense = async (req, res) => {
  try {
    const { title, amount, paidBy, splitBetween } = req.body;
    const groupId = req.params.groupId;

    // Validate group exists
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Validate split amounts add up to total
    const totalSplit = splitBetween.reduce((sum, split) => sum + split.amount, 0);
    if (Math.abs(totalSplit - amount) > 0.01) {
      return res.status(400).json({ message: 'Split amounts must equal total amount' });
    }

    // Create expense
    const expense = await Expense.createExpense(title, amount, groupId, paidBy, splitBetween);

    // Log activity
    const actor = await User.findById(paidBy);
    logActivity(groupId, paidBy, actor?.name || 'Unknown',
      'added_expense',
      `Added "${title}" for ₹${parseFloat(amount).toFixed(2)}`,
      { expenseId: expense.id, amount });

    res.status(201).json({
      message: 'Expense added successfully',
      expense
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get expenses for a group
exports.getExpenses = async (req, res) => {
  try {
    const groupId = req.params.groupId;

    // Validate group exists
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const expenses = await Expense.findByGroup(groupId);

    res.json({ expenses });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get balances for a group
exports.getBalances = async (req, res) => {
  try {
    const groupId = req.params.groupId;

    // Validate group exists
    const group = await Group.findByIdPopulated(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Get all unsettled expenses for the group
    const expenses = await Expense.findUnsettledByGroup(groupId);

    // Calculate balances
    const balances = {};

    // Initialize balances for all members
    group.members.forEach(member => {
      const memberId = member._id.toString();
      balances[memberId] = { user: member, balance: 0 };
    });

    // Calculate: positive = paid more than share, negative = owes
    expenses.forEach(expense => {
      const paidById = expense.paidBy._id.toString();

      // Person who paid gets credited with full amount
      if (balances[paidById]) {
        balances[paidById].balance += expense.amount;
      }

      // Each person in split gets debited their share
      expense.splitBetween.forEach(split => {
        const userId = split.user._id.toString();
        if (balances[userId]) {
          balances[userId].balance -= split.amount;
        }
      });
    });

    const balanceDetails = Object.values(balances).map(entry => ({
      user: {
        id: entry.user._id,
        name: entry.user.name,
        email: entry.user.email
      },
      balance: parseFloat(entry.balance.toFixed(2))
    }));

    res.json({ balances: balanceDetails });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get who owes whom
exports.getSettlements = async (req, res) => {
  try {
    const groupId = req.params.groupId;

    // Validate group exists
    const group = await Group.findByIdPopulated(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Get balances
    const expenses = await Expense.findUnsettledByGroup(groupId);
    const balanceMap = {};

    group.members.forEach(member => {
      balanceMap[member._id.toString()] = { user: member, balance: 0 };
    });

    expenses.forEach(expense => {
      const paidById = expense.paidBy._id.toString();
      if (balanceMap[paidById]) {
        balanceMap[paidById].balance += expense.amount;
      }

      expense.splitBetween.forEach(split => {
        const userId = split.user._id.toString();
        if (balanceMap[userId]) {
          balanceMap[userId].balance -= split.amount;
        }
      });
    });

    // Calculate settlements (who owes whom)
    const settlements = [];
    const creditors = [];
    const debtors = [];

    Object.values(balanceMap).forEach(entry => {
      const balance = parseFloat(entry.balance.toFixed(2));
      if (balance > 0.01) {
        creditors.push({ user: entry.user, balance });
      } else if (balance < -0.01) {
        debtors.push({ user: entry.user, balance: Math.abs(balance) });
      }
    });

    // Match creditors with debtors
    creditors.sort((a, b) => b.balance - a.balance);
    debtors.sort((a, b) => b.balance - a.balance);

    let creditorIndex = 0;
    let debtorIndex = 0;

    while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
      const creditor = creditors[creditorIndex];
      const debtor = debtors[debtorIndex];

      const amount = Math.min(creditor.balance, debtor.balance);

      settlements.push({
        from: {
          id: debtor.user._id,
          name: debtor.user.name,
          email: debtor.user.email
        },
        to: {
          id: creditor.user._id,
          name: creditor.user.name,
          email: creditor.user.email
        },
        amount: parseFloat(amount.toFixed(2))
      });

      creditor.balance -= amount;
      debtor.balance -= amount;

      if (creditor.balance < 0.01) creditorIndex++;
      if (debtor.balance < 0.01) debtorIndex++;
    }

    res.json({ settlements });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark expense as settled
exports.settleExpense = async (req, res) => {
  try {
    const expenseId = req.params.expenseId;
    const { settledBy, amount } = req.body;

    if (!settledBy) {
      return res.status(400).json({ message: 'settledBy is required' });
    }

    const expense = await Expense.findById(expenseId);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Add settlement
    const updatedExpense = await Expense.addSettlement(
      expenseId,
      settledBy,
      amount || expense.amount
    );

    // Log activity
    const actor = await User.findById(settledBy);
    const groupId = expense.group?._id || expense.group || expense.groupId;
    if (groupId) {
      logActivity(groupId, settledBy, actor?.name || 'Unknown',
        'settled',
        `Settled \"${expense.title}\" for ₹${parseFloat(amount || expense.amount).toFixed(2)}`,
        { expenseId, amount: amount || expense.amount });
    }

    res.json({
      message: 'Payment settled successfully',
      expense: updatedExpense
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};