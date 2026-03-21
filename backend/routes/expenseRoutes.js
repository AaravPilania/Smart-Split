const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { suggestCategorySchema, updateExpenseSchema } = require('../validators/expenseSchema');
const {
  addExpense,
  getExpenses,
  getBalances,
  getSettlements,
  settleExpense,
  recordPayment,
  getPayments,
  deleteExpense,
  suggestCategory,
  updateExpense,
} = require('../controllers/expenseController');

router.post('/group/:groupId', auth, addExpense);
router.get('/group/:groupId', auth, getExpenses);
router.get('/group/:groupId/balances', auth, getBalances);
router.get('/group/:groupId/settlements', auth, getSettlements);
router.post('/group/:groupId/payment', auth, recordPayment);
router.get('/group/:groupId/payments', auth, getPayments);
router.post('/:expenseId/settle', auth, settleExpense);
router.delete('/:expenseId', auth, deleteExpense);
router.post('/suggest-category', auth, validate(suggestCategorySchema), suggestCategory);
router.put('/:expenseId', auth, validate(updateExpenseSchema), updateExpense);

module.exports = router;
