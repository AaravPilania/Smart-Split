const Expense = require('../models/Expense');
const Group = require('../models/Group');
const User = require('../models/User');

// Add expense
exports.addExpense = async (req, res) => {
  try {
    const { title, amount, paidBy, splitBetween } = req.body;
    const groupId = parseInt(req.params.groupId);

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
    const expense = await Expense.create(title, amount, groupId, paidBy, splitBetween);

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
    const groupId = parseInt(req.params.groupId);

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
    const groupId = parseInt(req.params.groupId);

    // Validate group exists
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Get all unsettled expenses for the group
    const expenses = await Expense.findUnsettledByGroup(groupId);

    // Calculate balances
    const balances = {};
    
    // Initialize balances for all members
    group.members.forEach(member => {
      balances[member.id] = 0;
    });

    // Calculate: positive = paid more than share, negative = owes
    expenses.forEach(expense => {
      const paidById = expense.paidBy.id;
      
      // Person who paid gets credited with full amount
      balances[paidById] = (balances[paidById] || 0) + expense.amount;

      // Each person in split gets debited their share
      expense.splitBetween.forEach(split => {
        const userId = split.user.id;
        balances[userId] = (balances[userId] || 0) - split.amount;
      });
    });

    // Get user details for balances
    const balanceDetails = await Promise.all(
      Object.keys(balances).map(async (userId) => {
        const user = await User.findById(parseInt(userId));
        return {
          user: {
            id: parseInt(userId),
            name: user?.name || 'Unknown',
            email: user?.email || 'Unknown'
          },
          balance: parseFloat(balances[userId].toFixed(2))
        };
      })
    );

    res.json({ balances: balanceDetails });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get who owes whom
exports.getSettlements = async (req, res) => {
  try {
    const groupId = parseInt(req.params.groupId);

    // Validate group exists
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Get balances
    const expenses = await Expense.findUnsettledByGroup(groupId);
    const balances = {};

    group.members.forEach(member => {
      balances[member.id] = 0;
    });

    expenses.forEach(expense => {
      const paidById = expense.paidBy.id;
      balances[paidById] = (balances[paidById] || 0) + expense.amount;

      expense.splitBetween.forEach(split => {
        const userId = split.user.id;
        balances[userId] = (balances[userId] || 0) - split.amount;
      });
    });

    // Calculate settlements (who owes whom)
    const settlements = [];
    const creditors = [];
    const debtors = [];

    // Separate creditors (positive balance) and debtors (negative balance)
    Object.keys(balances).forEach(userId => {
      const balance = parseFloat(balances[userId].toFixed(2));
      if (balance > 0.01) {
        creditors.push({ userId: parseInt(userId), balance });
      } else if (balance < -0.01) {
        debtors.push({ userId: parseInt(userId), balance: Math.abs(balance) });
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

      const creditorUser = await User.findById(creditor.userId);
      const debtorUser = await User.findById(debtor.userId);

      settlements.push({
        from: {
          id: debtor.userId,
          name: debtorUser?.name || 'Unknown',
          email: debtorUser?.email || 'Unknown'
        },
        to: {
          id: creditor.userId,
          name: creditorUser?.name || 'Unknown',
          email: creditorUser?.email || 'Unknown'
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
    const expenseId = parseInt(req.params.expenseId);
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

    res.json({
      message: 'Payment settled successfully',
      expense: updatedExpense
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
