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

module.exports = { classifyExpenseCategory };
