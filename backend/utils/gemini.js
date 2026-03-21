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
    ? `Known friends in the user's group: ${friends.slice(0, 10).join(', ')}.\n`
    : '';

  const prompt =
    friendHint +
    'Parse this expense description and reply with ONLY valid JSON (no markdown):\n' +
    '{"title":"<short expense title>","amount":<number or null>,"category":"<food|travel|home|entertainment|shopping|health|utilities|other>","splitCount":<number of people or null>,"people":[<names mentioned>]}\n' +
    `Expense description: "${text.slice(0, 300)}"`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 200 },
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
    return {
      title: (parsed.title || '').trim(),
      amount: parsed.amount != null ? parseFloat(parsed.amount) : null,
      category: VALID_CATEGORIES.includes(parsed.category) ? parsed.category : 'other',
      splitCount: parsed.splitCount ? parseInt(parsed.splitCount) : null,
      people: Array.isArray(parsed.people) ? parsed.people : [],
    };
  } catch {
    return null;
  }
}

module.exports = { classifyExpenseCategory, analyzeReceiptImage, parseNaturalLanguageExpense };
