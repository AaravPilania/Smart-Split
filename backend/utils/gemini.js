/**
 * Gemini 1.5 Flash — AI helpers for Smart Split.
 * Features: regex-first routing, response caching, context trimming.
 */

const crypto = require('crypto');
let AaruCache;
try { AaruCache = require('../models/AaruCache'); } catch { AaruCache = null; }

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

const VALID_CATEGORIES = [
  'food', 'travel', 'home', 'entertainment',
  'shopping', 'health', 'utilities', 'other',
];

/* ── Cache helpers ─────────────────────────────────────────── */
function cacheKey(endpoint, input) {
  return crypto.createHash('sha256').update(`${endpoint}:${input}`).digest('hex');
}

async function getCache(endpoint, input) {
  if (!AaruCache) return null;
  try {
    const doc = await AaruCache.findOne({ hash: cacheKey(endpoint, input) });
    return doc?.response ?? null;
  } catch { return null; }
}

async function setCache(endpoint, input, response) {
  if (!AaruCache) return;
  try {
    await AaruCache.findOneAndUpdate(
      { hash: cacheKey(endpoint, input) },
      { hash: cacheKey(endpoint, input), endpoint, response, createdAt: new Date() },
      { upsert: true }
    );
  } catch { /* ignore cache write failures */ }
}

/**
 * Classify an expense into one of 8 categories.
 * Strategy: regex keyword match first → Gemini only if no match.
 */
async function classifyExpenseCategory(title = '', ocrText = '') {
  // Try regex-based category detection first (zero API cost)
  const hay = (title + ' ' + ocrText).toLowerCase();
  const catMap = [
    ['food',          /pizza|food|lunch|dinner|breakfast|meal|restaurant|cafe|coffee|tea|biryani|burger|noodle|chai|snack|eat|drink|swiggy|zomato|dominos?|bakery|ice\s?cream|juice|thali/],
    ['travel',        /uber|ola|taxi|cab|fuel|petrol|diesel|bus|train|flight|metro|auto|travel|trip|rapido|rickshaw|toll|parking|airport/],
    ['entertainment', /movie|film|netflix|spotify|game|cricket|concert|show|ticket|ott|prime|hotstar|cinema|youtube|music|disney/],
    ['shopping',      /shopping|amazon|clothes|shirt|shoes|grocery|groceries|mall|store|flipkart|myntra|market|saree|kurti|jeans/],
    ['health',        /medicine|doctor|hospital|medical|pharmacy|gym|fitness|chemist|clinic|dental|therapy|yoga/],
    ['utilities',     /electricity|water|wifi|internet|phone|recharge|gas|bill|jio|airtel|bsnl|broadband|mobile|postpaid|prepaid/],
    ['home',          /rent|flat|house|apartment|room|maintenance|furniture|repair|plumber|electrician|maid|cook|pg/],
  ];
  for (const [cat, re] of catMap) {
    if (re.test(hay)) return cat;
  }

  // No regex match — check cache
  const cached = await getCache('category', hay.slice(0, 200));
  if (cached) return cached;

  // Fall back to Gemini
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const prompt =
    `Classify this expense into EXACTLY one of these categories: food, travel, home, entertainment, shopping, health, utilities, other.\n` +
    `Expense title: "${title.slice(0, 120)}"\n` +
    (ocrText ? `Receipt context: "${ocrText.slice(0, 400)}"\n` : '') +
    `Reply with ONLY the single category key word, nothing else.`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 8,
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) return null;

    const data = await res.json();
    const raw = (
      data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
    ).trim().toLowerCase().replace(/[^a-z]/g, '');

    const result = VALID_CATEGORIES.includes(raw) ? raw : null;
    if (result) setCache('category', hay.slice(0, 200), result);
    return result;
  } catch {
    // Timeout, network error, or bad response — fall back gracefully
    return null;
  }
}

/**
 * Analyze a receipt image using Gemini Vision (multimodal).
 * Returns { title, amount, category } or null on failure.
 */
async function analyzeReceiptImage(imageBuffer, mimeType) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const base64 = imageBuffer.toString('base64');
  const prompt =
    'Look at this receipt image and extract the key expense details.\n' +
    'Reply with ONLY valid JSON in this exact format (no markdown, no explanation):\n' +
    '{"title":"<merchant name or main item>","amount":<final total as number>,"category":"<one of: food,travel,home,entertainment,shopping,health,utilities,other>","items":[{"name":"<item>","price":<number>}]}\n' +
    'Use the grand total/final amount (not subtotals). Leave amount as 0 if not visible.\n' +
    'Include up to 10 line items in the "items" array. Omit "items" if none visible.';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inlineData: { mimeType, data: base64 } },
            { text: prompt },
          ],
        }],
        generationConfig: { temperature: 0, maxOutputTokens: 128 },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    if (!res.ok) return null;

    const data = await res.json();
    const raw = (data?.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return null;

    const parsed = JSON.parse(match[0]);
    const title = (parsed.title || '').trim();
    const amount = parseFloat(parsed.amount) || 0;
    const category = VALID_CATEGORIES.includes(parsed.category) ? parsed.category : 'other';
    const items = Array.isArray(parsed.items)
      ? parsed.items.filter(i => i.name && typeof i.price === 'number').slice(0, 10)
      : [];

    if (!title || amount <= 0) return null;
    return { title, amount, category, ...(items.length > 0 && { items }) };
  } catch {
    return null;
  }
}

/**
 * Local regex-based expense parser — no AI needed.
 * Handles patterns like:
 *   "pizza rs 500 with aarushi"
 *   "Pizza ₹400 split with Aarushi and Rahul"
 *   "Movie tickets 800 split 3 ways"
 */
function localParseExpense(text) {
  let s = text.trim();

  // Normalise currency words → ₹ prefix so amount detection is uniform
  s = s.replace(/\b(rs\.?|inr|rupees?)\s*(\d)/gi, '₹$2');
  s = s.replace(/(\d)\s*(rs\.?|inr|rupees?)\b/gi, '$1');

  // Extract amount (first number that looks like money)
  const amountMatch = s.match(/₹\s*(\d+(?:\.\d{1,2})?)|(\d+(?:\.\d{1,2})?)/);
  const amount = amountMatch ? parseFloat(amountMatch[1] || amountMatch[2]) : null;
  if (!amount || amount <= 0) return null;

  // Extract split count: "split 3 ways" / "3 ways"
  const splitMatch = s.match(/(?:split\s+)?(\d+)\s+ways?/i);
  const splitCount = splitMatch ? parseInt(splitMatch[1]) : null;

  // Extract people listed after "with / for / between"
  let people = [];
  const withMatch = s.match(/(?:with|for|between)\s+([a-zA-Z][a-zA-Z ,&and]*)(?=\s*(?:₹|\d|split|$))/i);
  if (withMatch) {
    people = withMatch[1]
      .split(/\s+and\s+|\s*[,&]\s*/i)
      .map(p => p.replace(/\b(split|ways?|me|myself)\b/gi, '').trim())
      .filter(p => p.length > 1);
  }

  // Title: everything before the first number/₹ AND before "with/split/for"
  let title = s
    .replace(/(?:with|for|between)\s.*/i, '')
    .replace(/\bsplit\b.*/i, '')
    .replace(/₹\s*\d+(?:\.\d+)?/g, '')
    .replace(/\b\d+(?:\.\d+)?\b/g, '')
    .replace(/\s+/g, ' ')
    .replace(/[,.\s]+$/, '')
    .trim();
  if (!title) return null;

  // Guess category from full text
  const hay = (title + ' ' + text).toLowerCase();
  const catMap = [
    ['food',          /pizza|food|lunch|dinner|breakfast|meal|restaurant|cafe|coffee|tea|biryani|burger|noodle|chai|snack|eat|drink|swiggy|zomato|dominos?/],
    ['travel',        /uber|ola|taxi|cab|fuel|petrol|diesel|bus|train|flight|metro|auto|travel|trip|rapido|rickshaw/],
    ['entertainment', /movie|film|netflix|spotify|game|cricket|concert|show|ticket|ott|prime|hotstar|cinema/],
    ['shopping',      /shopping|amazon|clothes|shirt|shoes|grocery|groceries|mall|store|flipkart|myntra|market/],
    ['health',        /medicine|doctor|hospital|medical|pharmacy|gym|fitness|chemist|clinic/],
    ['utilities',     /electricity|water|wifi|internet|phone|recharge|gas|bill|jio|airtel|bsnl/],
    ['home',          /rent|flat|house|apartment|room|maintenance|furniture|repair/],
  ];
  let category = 'other';
  for (const [cat, re] of catMap) {
    if (re.test(hay)) { category = cat; break; }
  }

  return { title, amount, category, splitCount, people };
}

/**
 * Parse a natural-language expense description.
 * Strategy: regex first (if high confidence) → cache → Gemini → regex fallback.
 * High confidence = regex found both amount AND category (not 'other').
 */
async function parseNaturalLanguageExpense(text, friends = []) {
  // Regex-first: if regex extracts amount + known category, skip Gemini
  const regexResult = localParseExpense(text);
  if (regexResult && regexResult.amount && regexResult.category !== 'other') {
    return regexResult;
  }

  // Check cache
  const cached = await getCache('parse', text.slice(0, 200));
  if (cached) return cached;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return regexResult || localParseExpense(text);

  const friendHint = friends.length
    ? `Some of the user's friends are: ${friends.slice(0, 10).join(', ')}.\n`
    : '';

  // Use a two-shot example so the model knows exactly what output shape we want.
  // Avoid angle-bracket placeholders inside JSON — they make Gemini produce invalid JSON.
  const prompt =
    friendHint +
    'Extract expense details from the description below and reply with ONLY a raw JSON object, ' +
    'no markdown, no explanation, no code fences.\n' +
    'JSON shape (use null when a field cannot be determined):\n' +
    '{"title":"string","amount":number_or_null,"category":"food|travel|home|entertainment|shopping|health|utilities|other","splitCount":number_or_null,"people":["string"]}\n' +
    'Example input: "Pizza 500 split with Priya and Rahul"\n' +
    'Example output: {"title":"Pizza","amount":500,"category":"food","splitCount":3,"people":["Priya","Rahul"]}\n' +
    `Description: "${text.slice(0, 300)}"`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 200,
          responseMimeType: 'application/json',
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    if (!res.ok) return localParseExpense(text);

    const data = await res.json();
    const raw = (data?.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();

    // With responseMimeType:json, raw IS valid JSON — parse directly
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Fallback: extract first JSON object in case of extra text
      const match = raw.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/);
      if (!match) return localParseExpense(text);
      parsed = JSON.parse(match[0]);
    }
    const title = (parsed.title || '').trim();
    if (!title) return localParseExpense(text); // Gemini gave us nothing useful

    const result = {
      title,
      amount: parsed.amount != null && !isNaN(parseFloat(parsed.amount)) ? parseFloat(parsed.amount) : null,
      category: VALID_CATEGORIES.includes(parsed.category) ? parsed.category : 'other',
      splitCount: parsed.splitCount ? parseInt(parsed.splitCount) : null,
      people: Array.isArray(parsed.people) ? parsed.people : [],
    };
    setCache('parse', text.slice(0, 200), result);
    return result;
  } catch {
    return localParseExpense(text);
  }
}

/**
 * Generate a helpful expense/budget advice response for Aaru chatbot.
 * Returns a plain-text message string, or null on failure.
 */
async function generateAaruAdvice(text, context = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  // Context trimming: limit text and group names
  const trimmedText = text.slice(0, 200);
  const groupNames = (context.groupNames || []).slice(0, 5);

  // Cache check
  const cached = await getCache('advice', trimmedText);
  if (cached) return cached;

  const groupInfo = groupNames.length
    ? `User is in ${context.groupCount} group(s): ${groupNames.join(', ')}.`
    : 'User has no groups yet.';

  const prompt =
    `You are Aaru, a friendly and helpful expense assistant inside "Smart Split" — an expense-sharing app for friend groups.\n` +
    `${groupInfo}\n` +
    `Answer the user's question helpfully in 1-3 short sentences. Be warm, practical, and concise.\n` +
    `Do NOT make up specific numbers you don't know. If you don't have enough data, suggest the user check their Dashboard.\n` +
    `User question: "${trimmedText}"`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 150 },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    if (!res.ok) return null;

    const data = await res.json();
    const result = (data?.candidates?.[0]?.content?.parts?.[0]?.text || '').trim() || null;
    if (result) setCache('advice', trimmedText, result);
    return result;
  } catch {
    return null;
  }
}

module.exports = { classifyExpenseCategory, analyzeReceiptImage, parseNaturalLanguageExpense, generateAaruAdvice };
