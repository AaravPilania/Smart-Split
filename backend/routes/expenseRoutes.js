const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  addExpense,
  getExpenses,
  getBalances,
  getSettlements,
  settleExpense,
  recordPayment,
  getPayments,
  deleteExpense
} = require('../controllers/expenseController');

router.post('/group/:groupId', auth, addExpense);
router.get('/group/:groupId', auth, getExpenses);
router.get('/group/:groupId/balances', auth, getBalances);
router.get('/group/:groupId/settlements', auth, getSettlements);
router.post('/group/:groupId/payment', auth, recordPayment);
router.get('/group/:groupId/payments', auth, getPayments);
router.post('/:expenseId/settle', auth, settleExpense);
router.delete('/:expenseId', auth, deleteExpense);

module.exports = router;
