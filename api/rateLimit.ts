/**
 * Distributed rate limiter for serverless endpoints.
 *
 * Why this exists: in-memory rate limiting is evadable on Vercel because each
 * cold start / instance keeps its own Map, so a burst spread across instances
 * bypasses the limit. This helper uses Upstash Redis (durable, shared across
 * instances) when configured, and degrades gracefully to a best-effort
 * per-instance window otherwise.
 *
 * Configuration (Vercel env vars):
 *   - UPSTASH_REDIS_REST_URL
 *   - UPSTASH_REDIS_REST_TOKEN
 * When BOTH are present, the durable Redis path is used. Otherwise the
 * in-memory fallback is used.
 */

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const UPSTASH_TIMEOUT_MS = 2000;

/**
 * Module-level sliding window store for the in-memory fallback. Mirrors the
 * `consumeRateLimit` logic that previously lived in gemini-proxy: a fixed
 * window per key that resets once `windowSeconds` elapse. Per-instance only,
 * so it is best-effort on multi-instance serverless.
 */
const requestWindows = new Map<
    string,
    { startedAt: number; count: number; windowMs: number }
>();

/**
 * Fixed-window check using the per-instance in-memory Map (fallback path).
 * @returns allowed=false with retryAfter (seconds) once the limit is reached.
 */
function checkInMemory(
    key: string,
    limit: number,
    windowSeconds: number,
): { allowed: boolean; retryAfter: number } {
    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    const current = requestWindows.get(key);

    if (!current || now - current.startedAt >= current.windowMs) {
        requestWindows.set(key, { startedAt: now, count: 1, windowMs });
        return { allowed: true, retryAfter: 0 };
    }

    if (current.count >= limit) {
        const elapsed = now - current.startedAt;
        const retryAfter = Math.max(
            1,
            Math.ceil((current.windowMs - elapsed) / 1000),
        );
        return { allowed: false, retryAfter };
    }

    current.count += 1;
    return { allowed: true, retryAfter: 0 };
}

/**
 * Executes a list of Redis commands through the Upstash REST pipeline endpoint.
 * Each command is an array like `['INCR', key]`. Returns the parsed results
 * array (one entry per command) or throws on network / HTTP / Upstash error.
 *
 * @see https://upstash.com/docs/redis/features/restapi (pipeline: POST /pipeline)
 */
async function upstashPipeline(
    commands: Array<Array<string | number>>,
): Promise<Array<{ result?: unknown; error?: string }>> {
    const response = await fetch(`${UPSTASH_URL}/pipeline`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${UPSTASH_TOKEN}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(commands),
        signal: AbortSignal.timeout(UPSTASH_TIMEOUT_MS),
    });

    if (!response.ok) {
        throw new Error(`Upstash HTTP ${response.status}`);
    }

    const json = (await response.json()) as Array<{
        result?: unknown;
        error?: string;
    }>;
    if (!Array.isArray(json)) {
        throw new Error('Upstash pipeline returned a non-array response');
    }
    return json;
}

/**
 * Durable fixed-window check backed by Upstash Redis.
 *
 * Atomic pattern: `INCR key` then, only when the counter is 1 (first hit of a
 * new window), `EXPIRE key windowSeconds` so the window auto-resets. A trailing
 * `TTL key` lets us report an accurate `retryAfter`. The pipeline keeps these
 * as a single round-trip; INCR is atomic so concurrent requests across
 * instances increment the same shared counter.
 *
 * Fail-open: any network / HTTP / parse error logs and allows the request, so
 * an Upstash outage never blocks real users.
 */
async function checkUpstash(
    key: string,
    limit: number,
    windowSeconds: number,
): Promise<{ allowed: boolean; retryAfter: number }> {
    try {
        const results = await upstashPipeline([
            ['INCR', key],
            ['EXPIRE', key, windowSeconds, 'NX'],
            ['TTL', key],
        ]);

        const count = Number(results[0]?.result ?? 0);
        let ttl = Number(results[2]?.result ?? windowSeconds);

        // Safety net: if EXPIRE/TTL ever leaves the key without an expiry
        // (-1) set it again so the window can reset.
        if (count === 1 && (!Number.isFinite(ttl) || ttl < 0)) {
            await upstashPipeline([['EXPIRE', key, windowSeconds]]);
            ttl = windowSeconds;
        }

        if (count > limit) {
            const retryAfter =
                Number.isFinite(ttl) && ttl > 0 ? ttl : windowSeconds;
            return { allowed: false, retryAfter };
        }

        return { allowed: true, retryAfter: 0 };
    } catch (error: any) {
        // Fail-open: never block users because of a rate-limit infra failure.
        console.error(
            '[RateLimit] Upstash error, allowing request (fail-open):',
            error?.message || error,
        );
        return { allowed: true, retryAfter: 0 };
    }
}

/**
 * Distributed rate limiter. Uses Upstash Redis REST (env UPSTASH_REDIS_REST_URL
 * + UPSTASH_REDIS_REST_TOKEN) when configured; otherwise falls back to a
 * best-effort in-memory sliding window (per-instance).
 *
 * @param key A stable identifier to rate-limit on (e.g. `gemini:${userId}`).
 * @param limit Max requests allowed within the window.
 * @param windowSeconds Window length in seconds.
 * @returns allowed=false with retryAfter (seconds) when the limit is exceeded.
 */
export async function checkRateLimit(
    key: string,
    limit: number,
    windowSeconds: number,
): Promise<{ allowed: boolean; retryAfter: number }> {
    if (UPSTASH_URL && UPSTASH_TOKEN) {
        return checkUpstash(key, limit, windowSeconds);
    }
    return checkInMemory(key, limit, windowSeconds);
}
