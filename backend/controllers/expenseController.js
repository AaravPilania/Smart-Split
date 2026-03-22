const Expense = require('../models/Expense');
const Group = require('../models/Group');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const Payment = require('../models/Payment');
const { classifyExpenseCategory, analyzeReceiptImage, parseNaturalLanguageExpense, generateAaruAdvice } = require('../utils/gemini');

// Helper: silently log activity
async function logActivity(groupId, actorId, actorName, action, details, meta = {}) {
  try {
    await ActivityLog.create({ groupId: String(groupId), actorId, actorName, action, details, meta });
  } catch (_) {}
}

// Add expense
exports.addExpense = async (req, res) => {
  try {
    const { title, amount, paidBy, splitBetween, category } = req.body;
    const groupId = req.params.groupId;

    // Validate group exists
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than 0' });
    }

    // Validate caller is a group member
    const callerIsMember = await Group.isMember(groupId, req.user.id);
    if (!callerIsMember) {
      return res.status(403).json({ message: 'You must be a group member to add expenses' });
    }

    // Validate split amounts add up to total
    const totalSplit = splitBetween.reduce((sum, split) => sum + split.amount, 0);
    if (Math.abs(totalSplit - amount) > 0.01) {
      return res.status(400).json({ message: 'Split amounts must equal total amount' });
    }

    // Create expense
    const expense = await Expense.createExpense(title, amount, groupId, paidBy, splitBetween, category);

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

    // Offset recorded direct payments
    const payments = await Payment.findByGroup(groupId);
    payments.forEach(payment => {
      const fromId = payment.from._id?.toString() || payment.from.toString();
      const toId   = payment.to._id?.toString()   || payment.to.toString();
      if (balances[fromId]) balances[fromId].balance += payment.amount;
      if (balances[toId])   balances[toId].balance   -= payment.amount;
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

    // Offset recorded direct payments
    const payments = await Payment.findByGroup(groupId);
    payments.forEach(payment => {
      const fromId = payment.from._id?.toString() || payment.from.toString();
      const toId   = payment.to._id?.toString()   || payment.to.toString();
      if (balanceMap[fromId]) balanceMap[fromId].balance += payment.amount;
      if (balanceMap[toId])   balanceMap[toId].balance   -= payment.amount;
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
          email: debtor.user.email,
          upiId: debtor.user.upiId || ''
        },
        to: {
          id: creditor.user._id,
          name: creditor.user.name,
          email: creditor.user.email,
          upiId: creditor.user.upiId || ''
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

    // Ensure requester can only settle for themselves
    if (settledBy !== req.user.id) {
      return res.status(403).json({ message: 'You can only record your own payments' });
    }

    // Prevent duplicate settlement by the same user
    const alreadySettled = expense.settledBy && expense.settledBy.some(s => s.user.toString() === req.user.id);
    if (alreadySettled) {
      return res.status(409).json({ message: 'You have already settled this expense' });
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

// Record an "I Paid It" direct payment
exports.recordPayment = async (req, res) => {
  try {
    const groupId = req.params.groupId;
    const { toUserId, amount } = req.body;

    if (!toUserId || !amount || amount <= 0) {
      return res.status(400).json({ message: 'toUserId and a positive amount are required' });
    }

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const isMember = await Group.isMember(groupId, req.user.id);
    if (!isMember) return res.status(403).json({ message: 'You must be a group member' });

    const payment = await Payment.create(groupId, req.user.id, toUserId, amount);

    const actor = await User.findById(req.user.id);
    logActivity(groupId, req.user.id, actor?.name || 'Unknown',
      'paid',
      `Paid ₹${parseFloat(amount).toFixed(2)}`,
      { paymentId: payment.id, to: toUserId, amount });

    res.status(201).json({ payment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get recorded payments for a group
exports.getPayments = async (req, res) => {
  try {
    const payments = await Payment.findByGroup(req.params.groupId);
    res.json({ payments });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete an expense
exports.deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.expenseId);
    if (!expense) return res.status(404).json({ message: 'Expense not found' });

    const paidById = expense.paidBy?._id?.toString() || expense.paidBy?.toString();
    const group    = await Group.findById(expense.group?._id || expense.group);
    const isCreator = group?.createdBy?.toString() === req.user.id;

    if (paidById !== req.user.id && !isCreator) {
      return res.status(403).json({ message: 'Not authorized to delete this expense' });
    }

    await Expense.deleteOne(req.params.expenseId);
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Suggest category using Gemini AI
exports.suggestCategory = async (req, res) => {
  try {
    const { title, ocrText } = req.body;
    const category = await classifyExpenseCategory(title || '', ocrText || '');
    res.json({ category: category || 'other', source: category ? 'ai' : 'fallback' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Analyze a receipt image using Gemini Vision
exports.analyzeReceipt = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No image provided' });
    const result = await analyzeReceiptImage(req.file.buffer, req.file.mimetype);
    if (!result) return res.status(422).json({ message: 'Could not analyze receipt — falling back to OCR' });
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Parse natural-language expense text using Gemini
exports.parseExpenseText = async (req, res) => {
  try {
    const { text, friends } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'text is required' });
    const result = await parseNaturalLanguageExpense(text.trim(), Array.isArray(friends) ? friends : []);
    if (!result) return res.status(422).json({ message: 'Could not parse expense' });
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Aaru chatbot — advice/question answering
exports.aaruAdvice = async (req, res) => {
  try {
    const { text, context } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'text is required' });
    const message = await generateAaruAdvice(text.trim(), context || {});
    if (!message) return res.status(422).json({ message: "I couldn't think of an answer right now. Check your Dashboard for detailed stats!" });
    res.json({ message });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update an existing expense
exports.updateExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;
    const { title, amount, category, splitBetween } = req.body;

    const existing = await Expense.findById(expenseId);
    if (!existing) return res.status(404).json({ message: 'Expense not found' });

    const groupId = existing.group?._id || existing.group;
    const group = await Group.findById(groupId);
    const callerId = req.user.id;
    const paidById = existing.paidBy?._id?.toString() || existing.paidBy?.toString();
    const isPayer = paidById === callerId;
    const isCreator = group?.createdBy?.toString() === callerId;

    if (!isPayer && !isCreator) {
      return res.status(403).json({ message: 'Only the payer or group creator can edit this expense' });
    }

    if (amount !== undefined && splitBetween !== undefined) {
      const total = splitBetween.reduce((s, x) => s + parseFloat(x.amount || 0), 0);
      if (Math.abs(total - parseFloat(amount)) > 0.01) {
        return res.status(400).json({ message: 'Split amounts must equal total amount' });
      }
    }

    const updated = await Expense.updateExpense(expenseId, { title, amount, category, splitBetween }, callerId);

    logActivity(
      groupId, callerId, req.user.name || 'Unknown',
      'edited_expense',
      `Edited "${updated.title}" — ₹${parseFloat(updated.amount).toFixed(2)}`,
      { expenseId }
    );

    res.json({ message: 'Expense updated', expense: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};