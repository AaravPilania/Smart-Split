const { getPool } = require('../config/database');

class Expense {
  // Create a new expense
  static async create(title, amount, groupId, paidBy, splitBetween) {
    const pool = getPool();
    
    // Insert expense
    const [result] = await pool.execute(
      'INSERT INTO expenses (title, amount, group_id, paid_by) VALUES (?, ?, ?, ?)',
      [title, amount, groupId, paidBy]
    );
    
    const expenseId = result.insertId;
    
    // Insert splits
    for (const split of splitBetween) {
      await pool.execute(
        'INSERT INTO expense_splits (expense_id, user_id, amount) VALUES (?, ?, ?)',
        [expenseId, split.user, split.amount]
      );
    }
    
    return await this.findById(expenseId);
  }

  // Find expense by ID
  static async findById(id) {
    const pool = getPool();
    const [expenses] = await pool.execute(
      `SELECT e.*, 
       u.id as paid_by_id, u.name as paid_by_name, u.email as paid_by_email,
       g.id as group_id, g.name as group_name
       FROM expenses e
       LEFT JOIN users u ON e.paid_by = u.id
       LEFT JOIN \`groups\` g ON e.group_id = g.id
       WHERE e.id = ?`,
      [id]
    );
    
    if (expenses.length === 0) return null;
    
    const expense = expenses[0];
    
    // Get splits
    const splits = await this.getSplits(id);
    
    // Get settlements
    const settlements = await this.getSettlements(id);
    
    return {
      id: expense.id,
      title: expense.title,
      amount: parseFloat(expense.amount),
      group: {
        id: expense.group_id,
        name: expense.group_name
      },
      paidBy: {
        id: expense.paid_by_id,
        name: expense.paid_by_name,
        email: expense.paid_by_email
      },
      splitBetween: splits,
      settled: expense.settled === 1,
      settledBy: settlements,
      createdAt: expense.created_at,
      updatedAt: expense.updated_at
    };
  }

  // Get all expenses for a group
  static async findByGroup(groupId) {
    const pool = getPool();
    const [expenses] = await pool.execute(
      `SELECT e.*, 
       u.id as paid_by_id, u.name as paid_by_name, u.email as paid_by_email,
       g.id as group_id, g.name as group_name
       FROM expenses e
       LEFT JOIN users u ON e.paid_by = u.id
       LEFT JOIN \`groups\` g ON e.group_id = g.id
       WHERE e.group_id = ?
       ORDER BY e.created_at DESC`,
      [groupId]
    );
    
    // Get splits and settlements for each expense
    const expensesWithDetails = await Promise.all(
      expenses.map(async (expense) => {
        const splits = await this.getSplits(expense.id);
        const settlements = await this.getSettlements(expense.id);
        
        return {
          id: expense.id,
          title: expense.title,
          amount: parseFloat(expense.amount),
          group: {
            id: expense.group_id,
            name: expense.group_name
          },
          paidBy: {
            id: expense.paid_by_id,
            name: expense.paid_by_name,
            email: expense.paid_by_email
          },
          splitBetween: splits,
          settled: expense.settled === 1,
          settledBy: settlements,
          createdAt: expense.created_at,
          updatedAt: expense.updated_at
        };
      })
    );
    
    return expensesWithDetails;
  }

  // Get expenses by group where not settled
  static async findUnsettledByGroup(groupId) {
    const pool = getPool();
    const [expenses] = await pool.execute(
      `SELECT e.*, 
       u.id as paid_by_id, u.name as paid_by_name, u.email as paid_by_email
       FROM expenses e
       LEFT JOIN users u ON e.paid_by = u.id
       WHERE e.group_id = ? AND e.settled = FALSE
       ORDER BY e.created_at DESC`,
      [groupId]
    );
    
    const expensesWithSplits = await Promise.all(
      expenses.map(async (expense) => {
        const splits = await this.getSplits(expense.id);
        
        return {
          id: expense.id,
          title: expense.title,
          amount: parseFloat(expense.amount),
          paidBy: {
            id: expense.paid_by_id,
            name: expense.paid_by_name,
            email: expense.paid_by_email
          },
          splitBetween: splits
        };
      })
    );
    
    return expensesWithSplits;
  }

  // Get splits for an expense
  static async getSplits(expenseId) {
    const pool = getPool();
    const [splits] = await pool.execute(
      `SELECT es.amount, u.id as user_id, u.name, u.email
       FROM expense_splits es
       INNER JOIN users u ON es.user_id = u.id
       WHERE es.expense_id = ?`,
      [expenseId]
    );
    
    return splits.map(split => ({
      user: {
        id: split.user_id,
        name: split.name,
        email: split.email
      },
      amount: parseFloat(split.amount)
    }));
  }

  // Get settlements for an expense
  static async getSettlements(expenseId) {
    const pool = getPool();
    const [settlements] = await pool.execute(
      `SELECT es.amount, es.settled_at, u.id as user_id, u.name, u.email
       FROM expense_settlements es
       INNER JOIN users u ON es.user_id = u.id
       WHERE es.expense_id = ?
       ORDER BY es.settled_at DESC`,
      [expenseId]
    );
    
    return settlements.map(settlement => ({
      user: {
        id: settlement.user_id,
        name: settlement.name,
        email: settlement.email
      },
      amount: parseFloat(settlement.amount),
      settledAt: settlement.settled_at
    }));
  }

  // Add settlement
  static async addSettlement(expenseId, userId, amount) {
    const pool = getPool();
    
    await pool.execute(
      'INSERT INTO expense_settlements (expense_id, user_id, amount) VALUES (?, ?, ?)',
      [expenseId, userId, amount]
    );
    
    // Check if expense should be marked as settled
    const [settlements] = await pool.execute(
      'SELECT SUM(amount) as total_settled FROM expense_settlements WHERE expense_id = ?',
      [expenseId]
    );
    
    const [expense] = await pool.execute(
      'SELECT amount FROM expenses WHERE id = ?',
      [expenseId]
    );
    
    const totalSettled = parseFloat(settlements[0].total_settled || 0);
    const expenseAmount = parseFloat(expense[0].amount);
    
    if (totalSettled >= expenseAmount) {
      await pool.execute(
        'UPDATE expenses SET settled = TRUE WHERE id = ?',
        [expenseId]
      );
    }
    
    return await this.findById(expenseId);
  }
}

module.exports = Expense;
