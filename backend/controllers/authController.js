const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Group = require('../models/Group');
const Expense = require('../models/Expense');
const Payment = require('../models/Payment');

// ── OTP store: email → { otp, expiresAt, sentAt, attempts } ───────────────
const otpStore = new Map();

// Sweep expired OTPs every 60 seconds to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [email, entry] of otpStore) {
    if (now > entry.expiresAt) otpStore.delete(email);
  }
}, 60_000);

// Hard cap: prevent unbounded growth under spam attacks
const OTP_MAX_ENTRIES = 1000;

// Brevo (Sendinblue) HTTP API — works on all cloud platforms, no SMTP needed
async function sendOtpEmail(to, otp) {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: 'Smart Split', email: process.env.BREVO_SENDER_EMAIL },
      to: [{ email: to }],
      subject: `${otp} is your Smart Split verification code`,
      htmlContent: `<div style="font-family:Arial,sans-serif;max-width:420px;margin:0 auto;padding:24px;">
  <h2 style="margin:0 0 8px;color:#111;font-size:20px;">Verify your email</h2>
  <p style="color:#555;font-size:14px;margin:0 0 20px;">Use the code below to complete your Smart Split sign-up. It expires in <strong>10 minutes</strong>.</p>
  <div style="font-size:40px;font-weight:900;letter-spacing:10px;color:#ec4899;padding:20px 0;text-align:center;">${otp}</div>
  <p style="color:#888;font-size:12px;margin-top:24px;">If you didn't request this, you can safely ignore this email.</p>
</div>`,
    }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Brevo error ${res.status}`);
  }
}

const REFRESH_COOKIE_NAME = 'refreshToken';
const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

const generateAccessToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '15m' });

const _hashToken = (raw) =>
  crypto.createHash('sha256').update(raw).digest('hex');

const _setRefreshCookie = (res, raw) => {
  res.cookie(REFRESH_COOKIE_NAME, raw, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: REFRESH_TTL_MS,
    path: '/',
  });
};

const _clearRefreshCookie = (res) => {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
  });
};

const _issueTokens = async (res, userId) => {
  const accessToken = generateAccessToken(userId);
  const rawRefresh = crypto.randomBytes(64).toString('hex');
  const hash = _hashToken(rawRefresh);
  const expiry = new Date(Date.now() + REFRESH_TTL_MS);
  await User.updateById(userId, { refreshTokenHash: hash, refreshTokenExpiry: expiry });
  _setRefreshCookie(res, rawRefresh);
  return accessToken;
};

// Google OAuth — verifies the access_token by calling Google's userinfo endpoint
exports.googleAuth = async (req, res) => {
  try {
    const { access_token } = req.body;
    if (!access_token) return res.status(400).json({ message: 'No access token provided' });

    // Verify with Google and get user profile (retry once on network failure)
    let googleRes;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${access_token}` },
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (googleRes.ok) break;
      } catch (fetchErr) {
        if (attempt === 1) throw fetchErr;
        await new Promise(r => setTimeout(r, 500));
      }
    }
    if (!googleRes || !googleRes.ok) {
      const status = googleRes?.status;
      const msg = status === 401 ? 'Google token expired. Please try again.'
        : status >= 500 ? 'Google servers are temporarily unavailable. Try again.'
        : 'Could not verify Google token. Please try again.';
      return res.status(401).json({ message: msg });
    }

    const { sub: googleId, email, name, picture } = await googleRes.json();
    if (!email) return res.status(401).json({ message: 'Google did not return an email. Check your Google account permissions.' });

    // 1. Look up by googleId
    let user = await User.findByGoogleId(googleId);

    if (!user) {
      // 2. Email already registered? Link google to that account
      const existing = await User.findByEmail(email);
      if (existing) {
        await User.updateById(existing._id || existing.id, { googleId });
        user = await User.findById(existing._id || existing.id);
      } else {
        // 3. Brand-new user — create without password
        user = await User.createWithGoogle({ email, name, googleId, pfp: picture || '' });
      }
    }

    const token = await _issueTokens(res, user._id || user.id);
    res.json({
      message: 'Google auth successful',
      token,
      user: {
        id: user._id || user.id,
        email: user.email,
        name: user.name,
        username: user.username,
        pfp: user.pfp || picture || '',
        upiId: user.upiId || '',
        monthlyBudget: user.monthlyBudget || 0,
      },
    });
  } catch (error) {
    console.error('Google auth error:', error.message, error.stack);
    const msg = error.name === 'AbortError'
      ? 'Google verification timed out. Check your connection and try again.'
      : error.message?.includes('fetch')
      ? 'Network error during Google sign-in. Check your connection.'
      : 'Google sign-in failed. Please try again.';
    res.status(401).json({ message: msg });
  }
};

// POST /auth/send-otp — send 6-digit code to email before signup
exports.sendOtp = async (req, res) => {
  const { email } = req.body;
  try {
    if (!process.env.BREVO_API_KEY || !process.env.BREVO_SENDER_EMAIL) {
      return res.status(503).json({ message: 'Email service is not configured. Please contact support.' });
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'A valid email address is required.' });
    }

    const existing = await User.findByEmail(email);
    if (existing) {
      return res.status(400).json({ message: 'This email is already registered. Please log in instead.' });
    }

    // 60-second cooldown between sends
    const prev = otpStore.get(email);
    if (prev && Date.now() < prev.sentAt + 60_000) {
      const wait = Math.ceil((prev.sentAt + 60_000 - Date.now()) / 1000);
      return res.status(429).json({ message: `Please wait ${wait}s before requesting another code.` });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    // Prevent unbounded map growth under spam
    if (otpStore.size >= OTP_MAX_ENTRIES) {
      const now = Date.now();
      for (const [k, v] of otpStore) { if (now > v.expiresAt) otpStore.delete(k); }
      if (otpStore.size >= OTP_MAX_ENTRIES) {
        return res.status(503).json({ message: 'Service busy, please try again in a minute.' });
      }
    }
    otpStore.set(email, { otp, expiresAt: Date.now() + 10 * 60_000, sentAt: Date.now(), attempts: 0 });

    await sendOtpEmail(email, otp);

    res.json({ message: 'Verification code sent to your email.' });
  } catch (error) {
    console.error('sendOtp error:', error.message);
    otpStore.delete(email);
    res.status(500).json({ message: error.message || 'Failed to send verification code. Please try again.' });
  }
};

// Signup
exports.signup = async (req, res) => {
  try {
    const { email, password, name, otp } = req.body;

    // Verify OTP before creating account
    if (!otp) {
      return res.status(400).json({ message: 'Verification code is required.' });
    }
    const stored = otpStore.get(email);
    if (!stored) {
      return res.status(400).json({ message: 'No code found for this email. Please request a new one.' });
    }
    if (Date.now() > stored.expiresAt) {
      otpStore.delete(email);
      return res.status(400).json({ message: 'Verification code has expired. Please request a new one.' });
    }
    stored.attempts += 1;
    if (stored.attempts > 5) {
      otpStore.delete(email);
      return res.status(429).json({ message: 'Too many failed attempts. Please request a new code.' });
    }
    if (stored.otp !== String(otp)) {
      return res.status(400).json({ message: 'Incorrect verification code. Please try again.' });
    }
    otpStore.delete(email); // consume — single use

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({ email, password, name });
    const token = await _issueTokens(res, user._id);

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
        monthlyBudget: user.monthlyBudget || 0,
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

    // Google-only users have no password — guide them to use Google Sign-In
    if (!user.password && user.googleId) {
      return res.status(401).json({
        message: 'This account uses Google Sign-In. Please tap "Continue with Google" to log in.',
        code: 'GOOGLE_ACCOUNT',
      });
    }

    const isMatch = await User.comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = await _issueTokens(res, user._id);

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
        monthlyBudget: user.monthlyBudget || 0,
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
    const { name, email, password, username, pfp, upiId, phone, monthlyBudget, currentPassword } = req.body;

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

    const updatedUser = await User.updateById(userId, { name, email, password, username, pfp, upiId, phone, monthlyBudget });

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id,
        email: updatedUser.email,
        name: updatedUser.name,
        username: updatedUser.username,
        pfp: updatedUser.pfp || '',
        upiId: updatedUser.upiId || '',
        phone: updatedUser.phone || '',
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/refresh — use httpOnly cookie to issue a new 15-min access token
exports.refreshToken = async (req, res) => {
  try {
    const rawToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!rawToken) return res.status(401).json({ message: 'No refresh token' });

    const hash = _hashToken(rawToken);
    const user = await User.findByRefreshHash(hash);
    if (!user) {
      _clearRefreshCookie(res);
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    if (!user.refreshTokenExpiry || Date.now() > new Date(user.refreshTokenExpiry).getTime()) {
      await User.updateById(user._id || user.id, { refreshTokenHash: null, refreshTokenExpiry: null });
      _clearRefreshCookie(res);
      return res.status(401).json({ message: 'Refresh token expired' });
    }

    // Rotate: issue a new access + refresh token pair
    const accessToken = await _issueTokens(res, user._id || user.id);
    res.json({ token: accessToken });
  } catch (err) {
    console.error('Refresh token error:', err.message);
    _clearRefreshCookie(res);
    res.status(401).json({ message: 'Refresh failed' });
  }
};

// POST /api/auth/logout — invalidate the refresh token and clear the cookie
exports.logout = async (req, res) => {
  try {
    const rawToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (rawToken) {
      const hash = _hashToken(rawToken);
      const user = await User.findByRefreshHash(hash);
      if (user) {
        await User.updateById(user._id || user.id, { refreshTokenHash: null, refreshTokenExpiry: null });
      }
    }
    _clearRefreshCookie(res);
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err.message);
    _clearRefreshCookie(res);
    res.status(500).json({ message: 'Logout failed' });
  }
};

// POST /api/auth/phone/send-otp — send OTP to the email associated with a phone number
exports.sendPhoneOtp = async (req, res) => {
  const { phone } = req.body;
  try {
    if (!phone || phone.replace(/[^0-9]/g, '').length < 10) {
      return res.status(400).json({ message: 'A valid phone number is required.' });
    }

    const user = await User.findByPhone(phone);
    if (!user) {
      return res.status(404).json({ message: 'No account found with this phone number. Please sign up first and add your phone in Profile.' });
    }

    // Reuse the same OTP store with phone as key
    const key = `phone:${phone.replace(/[^0-9+]/g, '')}`;
    const prev = otpStore.get(key);
    if (prev && Date.now() < prev.sentAt + 60_000) {
      const wait = Math.ceil((prev.sentAt + 60_000 - Date.now()) / 1000);
      return res.status(429).json({ message: `Please wait ${wait}s before requesting another code.` });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    if (otpStore.size >= OTP_MAX_ENTRIES) {
      const now = Date.now();
      for (const [k, v] of otpStore) { if (now > v.expiresAt) otpStore.delete(k); }
    }
    otpStore.set(key, { otp, expiresAt: Date.now() + 10 * 60_000, sentAt: Date.now(), attempts: 0, userId: user._id || user.id });

    // Send OTP to the user's email
    await sendOtpEmail(user.email, otp);

    // Mask email for privacy
    const parts = user.email.split('@');
    const masked = parts[0].slice(0, 2) + '***@' + parts[1];

    res.json({ message: `Verification code sent to ${masked}`, maskedEmail: masked });
  } catch (error) {
    console.error('sendPhoneOtp error:', error.message);
    res.status(500).json({ message: 'Failed to send verification code.' });
  }
};

// POST /api/auth/phone/verify — verify phone OTP and login
exports.verifyPhoneOtp = async (req, res) => {
  const { phone, otp } = req.body;
  try {
    if (!phone || !otp) {
      return res.status(400).json({ message: 'Phone and verification code are required.' });
    }

    const key = `phone:${phone.replace(/[^0-9+]/g, '')}`;
    const stored = otpStore.get(key);

    if (!stored) {
      return res.status(400).json({ message: 'No code found. Please request a new one.' });
    }
    if (Date.now() > stored.expiresAt) {
      otpStore.delete(key);
      return res.status(400).json({ message: 'Code expired. Please request a new one.' });
    }
    stored.attempts += 1;
    if (stored.attempts > 5) {
      otpStore.delete(key);
      return res.status(429).json({ message: 'Too many failed attempts. Please request a new code.' });
    }
    if (stored.otp !== String(otp)) {
      return res.status(400).json({ message: 'Incorrect code. Please try again.' });
    }

    otpStore.delete(key);

    const user = await User.findById(stored.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const token = await _issueTokens(res, user._id || user.id);
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id || user.id,
        email: user.email,
        name: user.name,
        username: user.username,
        pfp: user.pfp || '',
        upiId: user.upiId || '',
        phone: user.phone || '',
        monthlyBudget: user.monthlyBudget || 0,
      },
    });
  } catch (error) {
    console.error('verifyPhoneOtp error:', error.message);
    res.status(500).json({ message: 'Login failed.' });
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