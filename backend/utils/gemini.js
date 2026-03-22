/**
 * Gemini 1.5 Flash — expense category classification helper.
 * The API key is read from process.env.GEMINI_API_KEY (never exposed to frontend).
 */

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

const VALID_CATEGORIES = [
  'food', 'travel', 'home', 'entertainment',
  'shopping', 'health', 'utilities', 'other',
];

/**
 * Classify an expense into one of 8 categories using Gemini 1.5 Flash.
 * Returns the category key on success, or null on failure / unconfigured.
 * Never throws.
 */
async function classifyExpenseCategory(title = '', ocrText = '') {
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

    return VALID_CATEGORIES.includes(raw) ? raw : null;
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
    '{"title":"<merchant name or main item>","amount":<final total as number>,"category":"<one of: food,travel,home,entertainment,shopping,health,utilities,other>"}\n' +
    'Use the grand total/final amount (not subtotals). Leave amount as 0 if not visible.';

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

    if (!title || amount <= 0) return null;
    return { title, amount, category };
  } catch {
    return null;
  }
}

/**
 * Parse a natural-language expense description using Gemini.
 * Returns { title, amount, category, splitCount, people } or null.
 */
async function parseNaturalLanguageExpense(text, friends = []) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

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
    if (!res.ok) return null;

    const data = await res.json();
    const raw = (data?.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();

    // With responseMimeType:json, raw IS valid JSON — parse directly
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Fallback: extract first JSON object in case of extra text
      const match = raw.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/);
      if (!match) return null;
      parsed = JSON.parse(match[0]);
    }
    const title = (parsed.title || '').trim();
    if (!title) return null; // need at least a title

    return {
      title,
      amount: parsed.amount != null && !isNaN(parseFloat(parsed.amount)) ? parseFloat(parsed.amount) : null,
      category: VALID_CATEGORIES.includes(parsed.category) ? parsed.category : 'other',
      splitCount: parsed.splitCount ? parseInt(parsed.splitCount) : null,
      people: Array.isArray(parsed.people) ? parsed.people : [],
    };
  } catch {
    return null;
  }
}

/**
 * Generate a helpful expense/budget advice response for Aaru chatbot.
 * Returns a plain-text message string, or null on failure.
 */
async function generateAaruAdvice(text, context = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const groupInfo = context.groupNames?.length
    ? `User is in ${context.groupCount} group(s): ${context.groupNames.join(', ')}.`
    : 'User has no groups yet.';

  const prompt =
    `You are Aaru, a friendly and helpful expense assistant inside "Smart Split" — an expense-sharing app for friend groups.\n` +
    `${groupInfo}\n` +
    `Answer the user's question helpfully in 1-3 short sentences. Be warm, practical, and concise.\n` +
    `Do NOT make up specific numbers you don't know. If you don't have enough data, suggest the user check their Dashboard.\n` +
    `User question: "${text.slice(0, 300)}"`;

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
    return (data?.candidates?.[0]?.content?.parts?.[0]?.text || '').trim() || null;
  } catch {
    return null;
  }
}

module.exports = { classifyExpenseCategory, analyzeReceiptImage, parseNaturalLanguageExpense, generateAaruAdvice };
