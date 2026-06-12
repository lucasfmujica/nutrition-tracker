import { createHmac, timingSafeEqual } from 'crypto';

interface HealthSyncTokenPayload {
    v: 1;
    sub: string;
}

const encode = (value: string): string =>
    Buffer.from(value, 'utf8').toString('base64url');

const sign = (payload: string, secret: string): string =>
    createHmac('sha256', secret).update(payload).digest('base64url');

export const createHealthSyncToken = (userId: string, secret: string): string => {
    const payload = encode(JSON.stringify({ v: 1, sub: userId }));
    return `${payload}.${sign(payload, secret)}`;
};

export const verifyHealthSyncToken = (
    token: string,
    secret: string,
): HealthSyncTokenPayload | null => {
    const [payload, providedSignature, extra] = token.split('.');
    if (!payload || !providedSignature || extra) return null;

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
        ) as Partial<HealthSyncTokenPayload>;
        if (
            parsed.v !== 1 ||
            typeof parsed.sub !== 'string' ||
            !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
                parsed.sub,
            )
        ) {
            return null;
        }
        return parsed as HealthSyncTokenPayload;
    } catch {
        return null;
    }
};
