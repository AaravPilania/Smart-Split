// Netlify Scheduled Function — runs every 8 minutes via cron.
// Pings the Render backend so it never spins down on the free tier.
// Schedule is set in netlify.toml: [functions."keep-alive"] schedule = "*/8 * * * *"

const BACKEND_HEALTH = "https://smart-split-backend-yygp.onrender.com/api/health";

export const handler = async () => {
  try {
    const res = await fetch(BACKEND_HEALTH, {
      signal: AbortSignal.timeout(12000),
    });
    console.log(`[keep-alive] ${new Date().toISOString()} → ${res.status}`);
    return { statusCode: 200, body: `ok ${res.status}` };
  } catch (err) {
    console.error(`[keep-alive] failed: ${err.message}`);
    return { statusCode: 500, body: err.message };
  }
};
