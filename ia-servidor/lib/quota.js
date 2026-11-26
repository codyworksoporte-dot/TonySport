// Fixed-window quotas kept in memory. Best effort: each Vercel instance has its
// own counters, so they slow down abuse but are not a billing guarantee.
// Set a spending limit for AI Gateway in the Vercel dashboard as well.
import {fail} from './http.js';

const windows = new Map();
const MAX_KEYS = 20_000;

function sweep(now) {
  if (windows.size < 2000) return;
  for (const [key, entry] of windows) if (entry.reset <= now) windows.delete(key);
  if (windows.size > MAX_KEYS) windows.clear();
}

/**
 * Consumes one unit of every rule, or none if any rule is exhausted.
 * rules: [{key, limit, seconds, message}]
 */
export function consume(rules, now = Date.now()) {
  sweep(now);
  for (const rule of rules) {
    const entry = windows.get(rule.key);
    if (entry && entry.reset > now && entry.count >= rule.limit) {
      fail(429, 'rate_limit', rule.message, {retryAfter: Math.max(1, Math.ceil((entry.reset - now) / 1000))});
    }
  }
  for (const rule of rules) {
    const entry = windows.get(rule.key);
    if (!entry || entry.reset <= now) windows.set(rule.key, {count: 1, reset: now + rule.seconds * 1000});
    else entry.count++;
  }
}

export function resetQuotas() {
  windows.clear();
}
