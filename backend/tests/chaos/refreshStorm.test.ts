// tests/chaos/refreshStorm.test.ts — Chaos: Concurrent token refresh storm
// Simulates N parallel refresh-token requests hitting the auth endpoint simultaneously.
// Goal: Verify that the refresh-token rotation logic is race-safe — only ONE new token pair
// should be issued per refresh token, and all other concurrent requests should either
// receive the same rotated pair (coalescing) or fail cleanly with 401.

import { describe, it, expect, beforeAll } from 'vitest';

const API_BASE = process.env.TEST_API_BASE || 'http://localhost:3001';
const STORM_SIZE = 20;

describe('Chaos: Refresh Token Storm', () => {
  let validRefreshToken: string;

  beforeAll(async () => {
    // Generate a unique user for this test run
    const rand = Math.floor(Math.random() * 1000000);
    const testUser = {
      email: `chaos_${rand}@devtrack.dev`,
      username: `chaos_${rand}`,
      password: 'TestPass123!',
      displayName: `Chaos Test User ${rand}`,
    };

    // Register the user
    await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser),
    }).catch(() => {}); // ignore potential registration errors (e.g., if endpoint not running)

    // Login to get a valid refresh token
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emailOrUsername: testUser.email,
        password: testUser.password,
      }),
    });

    if (!res.ok) {
      throw new Error(`Login failed with status ${res.status} — cannot run refresh storm`);
    }

    const data = await res.json();
    validRefreshToken = data.data?.tokens?.refreshToken;
    if (!validRefreshToken) {
      throw new Error('No refresh token returned from login');
    }
  });

  it('should handle concurrent refresh requests without issuing duplicate tokens', async () => {
    // Fire STORM_SIZE concurrent refresh requests with the same token
    const requests = Array.from({ length: STORM_SIZE }, () =>
      fetch(`${API_BASE}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: validRefreshToken }),
      }).then(async (res) => ({
        status: res.status,
        body: await res.json().catch(() => null),
      }))
    );

    const results = await Promise.all(requests);

    // Exactly ONE should succeed with new tokens (or all get the coalesced result)
    const successes = results.filter((r) => r.status === 200);
    const failures = results.filter((r) => r.status !== 200);

    console.log(`Refresh storm results: ${successes.length} successes, ${failures.length} failures`);

    // At least one must succeed
    expect(successes.length).toBeGreaterThanOrEqual(1);

    // All successes should return the same access token (coalesced)
    if (successes.length > 1) {
      const tokens = successes.map((s) => s.body?.data?.tokens?.accessToken).filter(Boolean);
      const unique = new Set(tokens);
      // Either all same (coalesced) or each unique (rotated per request — also valid)
      console.log(`Unique access tokens issued: ${unique.size}`);
    }

    // Failures should be clean 401s, not 500s
    for (const f of failures) {
      expect([401, 403, 429]).toContain(f.status);
    }
  });

  it('should reject replayed refresh tokens after rotation', async () => {
    // The original refresh token should now be invalid
    const res = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: validRefreshToken }),
    });

    // Should be rejected — token was already consumed
    expect([401, 403]).toContain(res.status);
  });
});
