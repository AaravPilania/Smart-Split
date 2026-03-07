const express = require('express');
const router = express.Router();
const {
  addExpense,
  getExpenses,
  getBalances,
  getSettlements,
  settleExpense
} = require('../controllers/expenseController');

// Add expense to group
router.post('/group/:groupId', addExpense);

// Get expenses for a group
router.get('/group/:groupId', getExpenses);

// Get balances for a group
router.get('/group/:groupId/balances', getBalances);

// Get who owes whom in a group
router.get('/group/:groupId/settlements', getSettlements);

// Mark expense as settled
router.post('/:expenseId/settle', settleExpense);

module.exports = router;
