import { createHmac, timingSafeEqual } from 'crypto';

/** Tokens issued in days before exp was introduced (legacy, never expire). */
interface HealthSyncTokenPayloadV1 {
    v: 1;
    sub: string;
}

/** Current token shape: includes issued-at and expiry (epoch seconds). */
interface HealthSyncTokenPayloadV2 {
    v: 2;
    sub: string;
    iat: number;
    exp: number;
}

type HealthSyncTokenPayload =
    | HealthSyncTokenPayloadV1
    | HealthSyncTokenPayloadV2;

/** New tokens expire 180 days after issuance. */
const TOKEN_TTL_SECONDS = 180 * 24 * 60 * 60;

const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const encode = (value: string): string =>
    Buffer.from(value, 'utf8').toString('base64url');

const sign = (payload: string, secret: string): string =>
    createHmac('sha256', secret).update(payload).digest('base64url');

/**
 * Issues a signed, time-limited capability token (v2) for the given user.
 * @param userId  Supabase user id (UUID).
 * @param secret  Server-side signing secret (SYNC_API_KEY).
 * @param nowMs   Issuance time in ms (defaults to Date.now()); allows callers
 *                to pin the timestamp for testing/determinism.
 */
export const createHealthSyncToken = (
    userId: string,
    secret: string,
    nowMs: number = Date.now(),
): string => {
    const iat = Math.floor(nowMs / 1000);
    const exp = iat + TOKEN_TTL_SECONDS;
    const payload = encode(JSON.stringify({ v: 2, sub: userId, iat, exp }));
    return `${payload}.${sign(payload, secret)}`;
};

export const verifyHealthSyncToken = (
    token: string,
    secret: string,
): HealthSyncTokenPayload | null => {
    const [payload, providedSignature, extra] = token.split('.');
    if (!payload || !providedSignature || extra) return null;

    // Timing-safe signature check (verify BEFORE parsing the payload).
    const expectedSignature = sign(payload, secret);
    const providedBuffer = Buffer.from(providedSignature);
    const expectedBuffer = Buffer.from(expectedSignature);
    if (
        providedBuffer.length !== expectedBuffer.length ||
        !timingSafeEqual(providedBuffer, expectedBuffer)
    ) {
        return null;
    }

    try {
        const parsed = JSON.parse(
            Buffer.from(payload, 'base64url').toString('utf8'),
        ) as Partial<HealthSyncTokenPayloadV2>;

        if (typeof parsed.sub !== 'string' || !UUID_REGEX.test(parsed.sub)) {
            return null;
        }

        // v2: enforce expiry.
        if (parsed.v === 2) {
            if (
                typeof parsed.iat !== 'number' ||
                typeof parsed.exp !== 'number'
            ) {
                return null;
            }
            const nowSeconds = Math.floor(Date.now() / 1000);
            if (parsed.exp <= nowSeconds) {
                console.warn('[HealthSyncToken] Rejected expired token.');
                return null;
            }
            return parsed as HealthSyncTokenPayloadV2;
        }

        // v1: legacy, non-expiring token. Accepted for backward compatibility
        // with Shortcuts provisioned before expiry was introduced.
        if (parsed.v === 1) {
            console.warn(
                '[HealthSyncToken] Accepting legacy v1 token (no expiry).',
            );
            return { v: 1, sub: parsed.sub };
        }

        return null;
    } catch {
        return null;
    }
};
