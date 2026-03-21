/**
 * Netlify Scheduled Function — keep-alive ping
 * Fires every 10 minutes to prevent the Render backend from sleeping.
 */
const BACKEND_URL =
  process.env.VITE_API_URL ||
  "https://smart-split-backend-yygp.onrender.com/api";

export default async () => {
  try {
    const res = await fetch(`${BACKEND_URL}/health`);
    console.log(`[keep-alive] ping → ${res.status}`);
  } catch (err) {
    console.error(`[keep-alive] failed: ${err.message}`);
  }
};

export const config = {
  schedule: "*/10 * * * *", // every 10 minutes
};
