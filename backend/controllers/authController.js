const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Group = require('../models/Group');
const Expense = require('../models/Expense');
const Payment = require('../models/Payment');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Signup
exports.signup = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({ email, password, name });
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        username: user.username,
        pfp: user.pfp || '',
        upiId: user.upiId || '',
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // findByEmail with true = include password hash
    const user = await User.findByEmail(email, true);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await User.comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        username: user.username,
        pfp: user.pfp || '',
        upiId: user.upiId || '',
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { name, email, password, username, pfp, upiId, currentPassword } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const emailTaken = await User.findByEmail(email);
      if (emailTaken) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    // Check if username is being changed and if it's already taken
    if (username && username.toLowerCase().trim() !== user.username) {
      const usernameTaken = await User.findByUsername(username);
      if (usernameTaken && usernameTaken.id?.toString() !== userId?.toString()) {
        return res.status(400).json({ message: 'Username already taken' });
      }
    }

    // Require current password verification when changing password
    if (password) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password is required to set a new password' });
      }
      const userWithPwd = await User.findByEmail(user.email, true);
      const isMatch = await User.comparePassword(currentPassword, userWithPwd.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }
    }

    const updatedUser = await User.updateById(userId, { name, email, password, username, pfp, upiId });

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id,
        email: updatedUser.email,
        name: updatedUser.name,
        username: updatedUser.username,
        pfp: updatedUser.pfp || '',
        upiId: updatedUser.upiId || '',
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/auth/dashboard/summary — parallel fetch of all dashboard data
exports.getDashboardSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const userGroups = await Group.findByUser(userId);

    if (!userGroups.length) {
      return res.json({
        groups: [], allExpenses: [], perGroupSpending: [],
        stats: { totalExpenses: 0, youOwe: 0, owedToYou: 0 },
        userSettlements: []
      });
    }

    // Fetch all group data in parallel
    const groupResults = await Promise.all(userGroups.map(async (group) => {
      const [expenses, unsettledExpenses, payments] = await Promise.all([
        Expense.findByGroup(group.id),
        Expense.findUnsettledByGroup(group.id),
        Payment.findByGroup(group.id)
      ]);
      return { group, expenses, unsettledExpenses, payments };
    }));

    let allExpenses = [];
    let totalExpensesAmount = 0;
    let userOweTotal = 0;
    let owedToUserTotal = 0;
    const allSettlements = [];
    const perGroupSpending = [];

    for (const { group, expenses, unsettledExpenses, payments } of groupResults) {
      allExpenses = allExpenses.concat(expenses);
      const groupTotal = expenses.reduce((s, e) => s + parseFloat(e.amount || 0), 0);
      totalExpensesAmount += groupTotal;
      if (groupTotal > 0) perGroupSpending.push({ name: group.name, amount: groupTotal });

      // Build balance map for group members
      const balanceMap = {};
      (group.members || []).forEach(m => {
        const id = m._id?.toString() || m.id?.toString();
        if (id) balanceMap[id] = 0;
      });

      unsettledExpenses.forEach(exp => {
        const paidById = exp.paidBy?._id?.toString() || exp.paidBy?.toString();
        if (balanceMap[paidById] !== undefined) balanceMap[paidById] += parseFloat(exp.amount || 0);
        (exp.splitBetween || []).forEach(split => {
          const uid = split.user?._id?.toString() || split.user?.toString();
          if (balanceMap[uid] !== undefined) balanceMap[uid] -= parseFloat(split.amount || 0);
        });
      });

      // Factor in recorded payments
      payments.forEach(p => {
        const fromId = p.from?._id?.toString() || p.from?.toString();
        const toId   = p.to?._id?.toString()   || p.to?.toString();
        if (balanceMap[fromId] !== undefined) balanceMap[fromId] += parseFloat(p.amount || 0);
        if (balanceMap[toId]   !== undefined) balanceMap[toId]   -= parseFloat(p.amount || 0);
      });

      const userBalance = parseFloat((balanceMap[userId] || 0).toFixed(2));
      if (userBalance < 0) userOweTotal += Math.abs(userBalance);
      else if (userBalance > 0) owedToUserTotal += userBalance;

      // Greedy settlement algorithm
      const creditors = [], debtors = [];
      Object.entries(balanceMap).forEach(([uid, bal]) => {
        const b = parseFloat(bal.toFixed(2));
        const member = (group.members || []).find(m => (m._id?.toString() || m.id?.toString()) === uid);
        if (!member) return;
        const user = { id: member._id || member.id, name: member.name, email: member.email };
        if (b > 0.01) creditors.push({ user, balance: b });
        else if (b < -0.01) debtors.push({ user, balance: Math.abs(b) });
      });
      creditors.sort((a, b) => b.balance - a.balance);
      debtors.sort((a, b) => b.balance - a.balance);
      let ci = 0, di = 0;
      while (ci < creditors.length && di < debtors.length) {
        const c = creditors[ci], d = debtors[di];
        const amount = parseFloat(Math.min(c.balance, d.balance).toFixed(2));
        allSettlements.push({ from: d.user, to: c.user, amount, groupId: group.id });
        c.balance -= amount; d.balance -= amount;
        if (c.balance < 0.01) ci++;
        if (d.balance < 0.01) di++;
      }
    }

    allExpenses.sort((a, b) =>
      new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at)
    );

    res.json({
      groups: userGroups,
      allExpenses,
      perGroupSpending: perGroupSpending.sort((a, b) => b.amount - a.amount),
      stats: {
        totalExpenses: parseFloat(totalExpensesAmount.toFixed(2)),
        youOwe: parseFloat(userOweTotal.toFixed(2)),
        owedToYou: parseFloat(owedToUserTotal.toFixed(2))
      },
      userSettlements: allSettlements
        .filter(s => s.from.id?.toString() === userId || s.to.id?.toString() === userId)
        .slice(0, 10)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};