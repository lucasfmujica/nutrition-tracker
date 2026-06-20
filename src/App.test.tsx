import { describe, expect, it } from 'vitest';
import {
    createHealthSyncToken,
    verifyHealthSyncToken,
} from '../api/health-sync-token';
import { addDaysToDate, getMondayOfWeek } from './utils/dateUtils';

describe('health sync tokens', () => {
    const userId = '123e4567-e89b-42d3-a456-426614174000';
    const secret = 'test-secret';

    it('accepts a valid token and rejects tampering', () => {
        const token = createHealthSyncToken(userId, secret);
        const verified = verifyHealthSyncToken(token, secret);
        expect(verified).toMatchObject({ v: 2, sub: userId });
        expect(verified).toHaveProperty('iat');
        expect(verified).toHaveProperty('exp');
        expect(verifyHealthSyncToken(`${token}x`, secret)).toBeNull();
        expect(verifyHealthSyncToken(token, 'wrong-secret')).toBeNull();
    });

    it('rejects an expired token', () => {
        // Issued ~181 days ago (TTL is 180 days) → already expired.
        const issuedAt = Date.now() - 181 * 24 * 60 * 60 * 1000;
        const token = createHealthSyncToken(userId, secret, issuedAt);
        expect(verifyHealthSyncToken(token, secret)).toBeNull();
    });
});

describe('date helpers', () => {
    it('handles week boundaries without UTC day drift', () => {
        expect(getMondayOfWeek('2026-01-04')).toBe('2025-12-29');
        expect(addDaysToDate('2025-12-31', 1)).toBe('2026-01-01');
    });
});
