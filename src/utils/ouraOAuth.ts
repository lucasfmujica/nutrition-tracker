/**
 * Oura OAuth2 helpers (frontend side).
 *
 * Flow:
 *  1. startOuraOAuth() — generates a CSRF `state`, stores it in sessionStorage
 *     and redirects to Oura's authorize endpoint. redirect_uri is the app root.
 *  2. Oura redirects back to `<origin>/?code=...&state=...`. On app load,
 *     consumePendingOuraCallback() detects it (state must match sessionStorage,
 *     prefixed with "oura_" to avoid colliding with other ?code params).
 *  3. exchangeOuraCode() posts the code to /api/oura-oauth, which holds the
 *     client secret. Tokens come back; access token is stored in the Supabase
 *     profile (same field as the legacy manual token) and refresh token +
 *     expiry in localStorage for automatic renewal.
 *
 * Env var required on the frontend: VITE_OURA_CLIENT_ID (same Client ID as
 * the serverless OURA_CLIENT_ID).
 */

import { supabase } from '../lib/supabase';

const AUTHORIZE_URL = 'https://cloud.ouraring.com/oauth/authorize';
const STATE_STORAGE_KEY = 'oura_oauth_state';
const TOKENS_STORAGE_PREFIX = 'oura_oauth_tokens';
/** Refresh the access token this many ms before it actually expires. */
const EXPIRY_MARGIN_MS = 5 * 60 * 1000;

export interface OuraOAuthTokens {
    accessToken: string;
    refreshToken: string;
    /** Epoch ms when the access token expires */
    expiresAt: number;
}

export interface OuraTokenResponse {
    access_token: string;
    refresh_token: string;
    expires_in: number;
}

const getRedirectUri = (): string => `${window.location.origin}/`;

const tokensKey = (userId?: string | null): string =>
    userId ? `${TOKENS_STORAGE_PREFIX}_${userId}` : TOKENS_STORAGE_PREFIX;

export const getOuraClientId = (): string | undefined =>
    (import.meta.env as any).VITE_OURA_CLIENT_ID;

export const isOuraOAuthAvailable = (): boolean => !!getOuraClientId();

/** Redirects the browser to Oura's authorize page. */
export const startOuraOAuth = (): void => {
    const clientId = getOuraClientId();
    if (!clientId) {
        throw new Error('VITE_OURA_CLIENT_ID is not configured');
    }

    // CSRF state, prefixed so the callback handler can tell it apart from
    // other providers that may also use ?code/?state on the root URL.
    const random = crypto
        .getRandomValues(new Uint8Array(16))
        .reduce((acc, b) => acc + b.toString(16).padStart(2, '0'), '');
    const state = `oura_${random}`;
    sessionStorage.setItem(STATE_STORAGE_KEY, state);

    const params = new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        redirect_uri: getRedirectUri(),
        scope: 'daily heartrate personal session spo2',
        state,
    });

    window.location.assign(`${AUTHORIZE_URL}?${params.toString()}`);
};

/**
 * Checks the current URL for an Oura OAuth callback (?code & ?state matching
 * our stored state). If found, returns the code and cleans the URL.
 * Returns null when the current page load is not an Oura callback.
 */
export const consumePendingOuraCallback = (): { code: string } | null => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code') ?? params.get('oura_code');
    const state = params.get('state') ?? params.get('oura_state');
    const error = params.get('error');

    const expectedState = sessionStorage.getItem(STATE_STORAGE_KEY);
    if (!expectedState || !expectedState.startsWith('oura_')) return null;

    // Only treat this as an Oura callback if state matches what we generated.
    if (!state || state !== expectedState) return null;

    sessionStorage.removeItem(STATE_STORAGE_KEY);
    cleanOAuthParamsFromUrl();

    if (error || !code) {
        console.error('[OuraOAuth] Authorization denied or failed:', error);
        return null;
    }

    return { code };
};

/** Removes OAuth query params from the address bar without reloading. */
export const cleanOAuthParamsFromUrl = (): void => {
    const url = new URL(window.location.href);
    ['code', 'state', 'error', 'oura_code', 'oura_state', 'scope'].forEach(
        (p) => url.searchParams.delete(p),
    );
    window.history.replaceState({}, document.title, url.toString());
};

const callTokenEndpoint = async (
    body: Record<string, string>,
): Promise<OuraTokenResponse> => {
    // The serverless endpoint now requires a valid Supabase JWT (it uses the
    // server's secret Oura credentials and must not be an open proxy).
    if (!supabase) {
        throw new Error('Supabase no está configurado.');
    }
    const {
        data: { session },
    } = await supabase.auth.getSession();
    const accessToken = session?.access_token;
    if (!accessToken) {
        throw new Error('No hay sesión activa para vincular Oura.');
    }

    const response = await fetch('/api/oura-oauth', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.access_token) {
        throw new Error(
            data?.error || `Oura OAuth error: ${response.status}`,
        );
    }
    return data as OuraTokenResponse;
};

/** Exchanges an authorization code for tokens via the serverless function. */
export const exchangeOuraCode = (code: string): Promise<OuraTokenResponse> =>
    callTokenEndpoint({
        grant_type: 'authorization_code',
        code,
        redirect_uri: getRedirectUri(),
    });

/** Refreshes an access token via the serverless function. */
export const refreshOuraTokens = (
    refreshToken: string,
): Promise<OuraTokenResponse> =>
    callTokenEndpoint({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
    });

/** Persists refresh token + expiry locally (access token lives in the profile). */
export const saveOuraOAuthTokens = (
    userId: string | null | undefined,
    tokens: OuraTokenResponse,
): OuraOAuthTokens => {
    const stored: OuraOAuthTokens = {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: Date.now() + tokens.expires_in * 1000,
    };
    localStorage.setItem(tokensKey(userId), JSON.stringify(stored));
    return stored;
};

export const getStoredOuraOAuthTokens = (
    userId: string | null | undefined,
): OuraOAuthTokens | null => {
    try {
        const raw =
            localStorage.getItem(tokensKey(userId)) ??
            localStorage.getItem(tokensKey(null));
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed?.refreshToken) return null;
        return parsed as OuraOAuthTokens;
    } catch {
        return null;
    }
};

export const clearOuraOAuthTokens = (
    userId: string | null | undefined,
): void => {
    localStorage.removeItem(tokensKey(userId));
    localStorage.removeItem(tokensKey(null));
};

/** True if the user connected via OAuth (vs. a manual personal token). */
export const isOuraOAuthConnected = (
    userId: string | null | undefined,
): boolean => !!getStoredOuraOAuthTokens(userId);

/** True if the stored OAuth access token is expired (or about to expire). */
export const isOuraAccessTokenExpired = (
    tokens: OuraOAuthTokens | null,
): boolean => !!tokens && Date.now() >= tokens.expiresAt - EXPIRY_MARGIN_MS;
