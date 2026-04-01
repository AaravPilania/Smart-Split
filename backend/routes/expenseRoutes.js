const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const auth = require('../middleware/auth');
const { requireGroupMember } = require('../middleware/auth');
const aaruRateLimit = require('../middleware/aaruRateLimit');
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
  analyzeReceipt,
  parseExpenseText,
  aaruAdvice,
} = require('../controllers/expenseController');

router.post('/group/:groupId', auth, requireGroupMember, addExpense);
router.get('/group/:groupId', auth, requireGroupMember, getExpenses);
router.get('/group/:groupId/balances', auth, requireGroupMember, getBalances);
router.get('/group/:groupId/settlements', auth, requireGroupMember, getSettlements);
router.post('/group/:groupId/payment', auth, requireGroupMember, recordPayment);
router.get('/group/:groupId/payments', auth, requireGroupMember, getPayments);
router.post('/analyze-receipt', auth, aaruRateLimit, upload.single('image'), analyzeReceipt);
router.post('/parse-text', auth, aaruRateLimit, parseExpenseText);
router.post('/aaru-advice', auth, aaruRateLimit, aaruAdvice);
router.post('/:expenseId/settle', auth, settleExpense);
router.delete('/:expenseId', auth, deleteExpense);
router.post('/suggest-category', auth, aaruRateLimit, validate(suggestCategorySchema), suggestCategory);
router.put('/:expenseId', auth, validate(updateExpenseSchema), updateExpense);

module.exports = router;
