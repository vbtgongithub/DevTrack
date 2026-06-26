// src/shared/fetchWithTimeout.ts — Shared fetch wrapper with AbortController timeout.
// Eliminates duplicated timeout boilerplate across platform adapters.

const DEFAULT_TIMEOUT = 15_000;

export async function fetchWithTimeout(
  url: string,
  init?: RequestInit & { timeoutMs?: number },
): Promise<globalThis.Response> {
  const { timeoutMs = DEFAULT_TIMEOUT, ...fetchInit } = init ?? {};
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { ...fetchInit, signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}
