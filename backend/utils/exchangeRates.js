const EXCHANGE_API_KEY = process.env.EXCHANGE_RATE_API_KEY;
const BASE_URL = 'https://v6.exchangerate-api.com/v6';

// In-memory cache — rates update daily, so 6-hour TTL is safe
const cache = new Map();
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

/**
 * Get conversion rate from one currency to another.
 * Returns { rate, convertedAmount } or null on failure.
 */
async function convert(from, to, amount) {
  if (!EXCHANGE_API_KEY) return null;
  from = from.toUpperCase();
  to = to.toUpperCase();
  if (from === to) return { rate: 1, convertedAmount: amount };

  const cacheKey = `${from}_${to}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return { rate: cached.rate, convertedAmount: +(amount * cached.rate).toFixed(2) };
  }

  try {
    const res = await fetch(`${BASE_URL}/${EXCHANGE_API_KEY}/pair/${from}/${to}`);
    const data = await res.json();
    if (data.result !== 'success') {
      console.error('[ExchangeRate] API error:', data['error-type'] || 'unknown');
      return null;
    }
    const rate = data.conversion_rate;
    cache.set(cacheKey, { rate, ts: Date.now() });
    return { rate, convertedAmount: +(amount * rate).toFixed(2) };
  } catch (err) {
    console.error('[ExchangeRate] Fetch error:', err.message);
    return null;
  }
}

/**
 * Get all rates from a base currency (for UI currency pickers).
 * Returns { rates: { USD: 1.23, EUR: 0.91, ... } } or null.
 */
async function getAllRates(base = 'INR') {
  if (!EXCHANGE_API_KEY) return null;
  base = base.toUpperCase();

  const cacheKey = `all_${base}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return { rates: cached.rates };
  }

  try {
    const res = await fetch(`${BASE_URL}/${EXCHANGE_API_KEY}/latest/${base}`);
    const data = await res.json();
    if (data.result !== 'success') return null;
    cache.set(cacheKey, { rates: data.conversion_rates, ts: Date.now() });
    return { rates: data.conversion_rates };
  } catch {
    return null;
  }
}

module.exports = { convert, getAllRates };
