const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  addExpense,
  getExpenses,
  getBalances,
  getSettlements,
  settleExpense
} = require('../controllers/expenseController');

router.post('/group/:groupId', auth, addExpense);
router.get('/group/:groupId', auth, getExpenses);
router.get('/group/:groupId/balances', auth, getBalances);
router.get('/group/:groupId/settlements', auth, getSettlements);
router.post('/:expenseId/settle', auth, settleExpense);

module.exports = router;
