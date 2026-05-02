import { spawn } from 'node:child_process';
import { chmod, mkdir, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { homedir } from 'node:os';
import path from 'node:path';

import {
  normalizeEmailCampaignContent,
  type EmailCampaignContent
} from '../dkcms/campaign.ts';
import { decodeDkCmsCliAccessToken } from '../dkcms/cli-auth.ts';
import { isRecord, readJsonResponse, type JsonGuard } from '../json-boundary.ts';

import type { CliIO, FlagMap } from './cli.ts';

type CmsOutputFormat = 'json' | 'text';
type CmsArtifactFormat = 'html' | 'json' | 'text';

type CmsUser = {
  userId: string;
  email: string;
  displayName: string;
};

type CmsSession = {
  accessToken: string;
  authMode?: 'legacy' | 'oidc-device';
  baseUrl: string;
  expiresAt?: number | null;
  refreshToken?: string | null;
  scope?: string;
  tokenEndpoint?: string;
  updatedAt: string;
  user: CmsUser;
};

type CmsSite = {
  id: string;
  slug: string;
  name: string;
  query: string;
  theme: {
    baseColorInput: string;
    ratioName: string;
    motionPreset: string;
    mode: 'light' | 'dark';
  };
  ownerUserId: string;
  ownerEmail: string;
  ownerDisplayName: string;
};

type CmsPage = {
  id: string;
  siteId: string;
  slug: string;
  title: string;
  summary: string | null;
  contentType: string;
  content: EmailCampaignContent;
  publishedBuildId: string | null;
};

type CmsBuild = {
  id: string;
  pageId: string;
  siteId: string;
  status: 'queued' | 'running' | 'complete' | 'errored';
  iterations: number;
  embeddingMode: string;
  embeddingModel: string;
  refinementMode: string;
  result: {
    email: {
      subject: string;
      preheader: string;
      html: string;
      text: string;
    };
  } | null;
  error: string | null;
};

type CmsSubmitResponse = {
  build: CmsBuild;
  createdPage: boolean;
  page: CmsPage;
  pageUrl: string;
  publicUrl: string | null;
  site: CmsSite;
  emailUrl: string;
  statusUrl: string;
};

type CmsCliSessionResponse = {
  accessToken: string;
  refreshToken: string;
  user: CmsUser;
};

type OAuthServerMetadata = {
  device_authorization_endpoint?: string;
  issuer?: string;
  scopes_supported?: string[];
  token_endpoint?: string;
};

type OAuthDeviceAuthorizationResponse = {
  device_code: string;
  expires_in?: number;
  interval?: number;
  user_code: string;
  verification_uri: string;
  verification_uri_complete?: string;
};

type OAuthTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
};

function isOAuthServerMetadata(value: unknown): value is OAuthServerMetadata {
  return isRecord(value);
}

function isOAuthDeviceAuthorizationResponse(value: unknown): value is OAuthDeviceAuthorizationResponse {
  return (
    isRecord(value) &&
    typeof value.device_code === 'string' &&
    typeof value.user_code === 'string' &&
    typeof value.verification_uri === 'string'
  );
}

function isOAuthTokenResponse(value: unknown): value is OAuthTokenResponse {
  return isRecord(value);
}

const CMS_DEFAULT_BASE_URL = 'https://dkcli.com';
const CMS_DEFAULT_CALLBACK_PORT = 8973;
const CMS_LOGIN_TIMEOUT_MS = 2 * 60 * 1000;
const CMS_SESSION_FILE_NAME = 'dkcms-session.json';

class CmsCliError extends Error {
  helpCommand?: string;

  constructor(message: string, helpCommand = 'cms') {
    super(message);
    this.name = 'CmsCliError';
    this.helpCommand = helpCommand;
  }
}

function fail(message: string, helpCommand = 'cms'): never {
  throw new CmsCliError(message, helpCommand);
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

function getStringFlag(flags: FlagMap, name: string): string | undefined {
  const value = flags[name] as string | boolean | undefined;
  if (value === undefined) {
    return undefined;
  }
  if (typeof value === 'boolean') {
    fail(`Flag --${name} requires a value.`);
  }
  return value;
}

function getIntegerFlag(flags: FlagMap, name: string, fallback: number): number {
  const value = getStringFlag(flags, name);
  if (value === undefined) {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    fail(`Flag --${name} must be a number. Received "${value}".`);
  }

  return Math.round(parsed);
}

function resolveOutputFormat(flags: FlagMap): CmsOutputFormat {
  const format = flags.format as string | boolean | undefined;
  if (format === undefined) {
    return 'text';
  }
  if (format === 'json') {
    return 'json';
  }
  fail('dk cms supports only text output by default, or JSON with --json.');
}

function resolveArtifactFormat(flags: FlagMap): CmsArtifactFormat {
  const format = getStringFlag(flags, 'format') ?? 'html';
  if (format === 'html' || format === 'text' || format === 'json') {
    return format;
  }
  fail('Email export format must be one of: html, text, json.');
}

function resolveBaseUrl(flags: FlagMap, io: CliIO, session?: CmsSession | null): string {
  const configured =
    getStringFlag(flags, 'base-url') ??
    session?.baseUrl ??
    io.getEnv?.('DKCMS_BASE_URL') ??
    process.env.DKCMS_BASE_URL ??
    CMS_DEFAULT_BASE_URL;

  try {
    return trimTrailingSlash(new URL(configured).toString());
  } catch {
    fail(`Invalid CMS base URL "${configured}".`);
  }
}

function resolveConfigDir(io: CliIO): string {
  return io.getEnv?.('DKCMS_CLI_CONFIG_DIR') ?? process.env.DKCMS_CLI_CONFIG_DIR ?? path.join(homedir(), '.designkit');
}

function resolveSessionPath(io: CliIO): string {
  return path.join(resolveConfigDir(io), CMS_SESSION_FILE_NAME);
}

async function readSession(io: CliIO): Promise<CmsSession | null> {
  try {
    const raw = await readFile(resolveSessionPath(io), 'utf8');
    return JSON.parse(raw) as CmsSession;
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      typeof (error as { code?: unknown }).code === 'string' &&
      (error as { code: string }).code === 'ENOENT'
    ) {
      return null;
    }
    throw error;
  }
}

async function writeSession(io: CliIO, session: CmsSession): Promise<void> {
  const sessionPath = resolveSessionPath(io);
  await mkdir(path.dirname(sessionPath), { recursive: true });
  await writeFile(sessionPath, `${JSON.stringify(session, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
  await chmod(sessionPath, 0o600);
}

function describeAuthRequirement(): never {
  fail('No CMS session found. Run `dk cms login` first.');
}

async function loadSession(io: CliIO, flags: FlagMap): Promise<CmsSession> {
  const session = await readSession(io);
  if (!session) {
    describeAuthRequirement();
  }

  const baseUrl = resolveBaseUrl(flags, io, session);
  return session.baseUrl === baseUrl ? session : { ...session, baseUrl };
}

async function readEmailCampaignContent(io: CliIO, filePath: string): Promise<EmailCampaignContent> {
  const absolutePath = path.resolve(io.cwd, filePath);
  const raw = await io.readFile(absolutePath);

  try {
    return normalizeEmailCampaignContent(JSON.parse(raw));
  } catch (error) {
    fail(
      `Could not parse email campaign JSON from ${filePath}: ${error instanceof Error ? error.message : 'unknown error'}.`
    );
  }
}

async function parseResponse<T>(response: Response, guard: JsonGuard<T>): Promise<T> {
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return readJsonResponse(response, 'CMS response', guard);
  }
  const text = await response.text();
  if (guard(text)) {
    return text;
  }
  throw new Error('CMS response returned an unexpected text shape.');
}

function extractResponseError(payload: unknown, status: number): string {
  if (payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string') {
    return payload.error;
  }
  if (
    payload &&
    typeof payload === 'object' &&
    'error' in payload &&
    payload.error &&
    typeof payload.error === 'object' &&
    'message' in payload.error &&
    typeof payload.error.message === 'string'
  ) {
    return payload.error.message;
  }
  if (typeof payload === 'string' && payload.trim()) {
    return payload.trim();
  }
  return `Request failed with status ${status}.`;
}

function decodeJwtExpiration(token: string): number | null {
  const parts = token.split('.');
  const payload = parts.length === 3 ? parts[1] : parts[0];
  if (!payload) {
    return null;
  }

  try {
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { exp?: unknown };
    return typeof claims.exp === 'number' ? claims.exp : null;
  } catch {
    return null;
  }
}

function shouldRefreshSession(session: CmsSession): boolean {
  const claims = decodeDkCmsCliAccessToken(session.accessToken);
  const expiresAt =
    session.expiresAt ??
    (typeof claims?.exp === 'number' ? claims.exp : decodeJwtExpiration(session.accessToken));
  if (!expiresAt) {
    return true;
  }
  return expiresAt <= Math.floor(Date.now() / 1000) + 30;
}

function buildRequestInit(method: string, accessToken: string | null, body?: unknown): RequestInit {
  const headers = new Headers();
  if (accessToken) {
    headers.set('authorization', `Bearer ${accessToken}`);
  }

  let requestBody: BodyInit | undefined;
  if (typeof body === 'string') {
    headers.set('content-type', 'text/plain; charset=utf-8');
    requestBody = body;
  } else if (body !== undefined) {
    headers.set('content-type', 'application/json');
    requestBody = JSON.stringify(body);
  }

  return {
    method,
    headers,
    body: method === 'GET' || method === 'HEAD' ? undefined : requestBody
  };
}

async function cmsFetch<T>(
  io: CliIO,
  baseUrl: string,
  pathname: string,
  options: {
    accessToken?: string | null;
    body?: unknown;
    method?: string;
  } = {}
): Promise<T> {
  const fetchImpl = io.fetch ?? fetch;
  const response = await fetchImpl(new URL(pathname, baseUrl), buildRequestInit(options.method ?? 'GET', options.accessToken ?? null, options.body));
  const payload = await parseResponse<T | { error?: string }>(
    response,
    (value): value is T | { error?: string } => value !== undefined
  );

  if (!response.ok) {
    fail(extractResponseError(payload, response.status));
  }

  return payload as T;
}

function buildFormRequestInit(body: Record<string, string | undefined>): RequestInit {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(body)) {
    if (value !== undefined) {
      params.set(key, value);
    }
  }

  return {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/x-www-form-urlencoded'
    },
    body: params.toString()
  };
}

async function oauthFetch<T>(
  io: CliIO,
  url: string,
  guard: JsonGuard<T>,
  init?: RequestInit
): Promise<{ payload: T; response: Response }> {
  const fetchImpl = io.fetch ?? fetch;
  const response = await fetchImpl(url, init);
  const payload = await parseResponse(response, guard);
  return { payload, response };
}

function decodeJwtClaims(token: string): Record<string, unknown> | null {
  const parts = token.split('.');
  if (parts.length !== 3 || !parts[1]) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function userFromJwt(token: string): CmsUser {
  const claims = decodeJwtClaims(token);
  const userId = typeof claims?.sub === 'string' ? claims.sub : 'oidc-user';
  const email = typeof claims?.email === 'string' ? claims.email : 'unknown@example.com';
  const displayName =
    typeof claims?.name === 'string' && claims.name.trim().length > 0
      ? claims.name
      : email;

  return { userId, email, displayName };
}

function expirationFromJwt(token: string): number | null {
  const claims = decodeJwtClaims(token);
  return typeof claims?.exp === 'number' ? claims.exp : null;
}

async function discoverOAuthMetadata(io: CliIO, baseUrl: string): Promise<OAuthServerMetadata | null> {
  try {
  const { payload, response } = await oauthFetch<OAuthServerMetadata>(
    io,
    new URL('/.well-known/oauth-authorization-server', baseUrl).toString(),
    isOAuthServerMetadata
  );
    if (!response.ok) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

function defaultDkCmsScope(metadata: OAuthServerMetadata): string {
  const supported = new Set(metadata.scopes_supported ?? []);
  const requested = ['openid', 'profile', 'email', 'dkcms:read', 'dkcms:write'].filter(
    (scope) => supported.size === 0 || supported.has(scope)
  );
  return requested.join(' ');
}

async function exchangeSession(
  io: CliIO,
  baseUrl: string,
  body: { code?: string; refreshToken?: string },
  endpoint: '/api/cli/v1/auth/exchange' | '/api/cli/v1/auth/refresh'
): Promise<CmsSession> {
  const response = await cmsFetch<CmsCliSessionResponse>(io, baseUrl, endpoint, {
    method: 'POST',
    body
  });

  return {
    accessToken: response.accessToken,
    authMode: 'legacy',
    baseUrl,
    refreshToken: response.refreshToken,
    expiresAt: decodeJwtExpiration(response.accessToken),
    updatedAt: new Date().toISOString(),
    user: response.user
  };
}

async function refreshSession(io: CliIO, session: CmsSession): Promise<CmsSession> {
  if (session.authMode === 'oidc-device') {
    if (!session.refreshToken || !session.tokenEndpoint) {
      fail('CMS OIDC session has expired. Run `dk cms login` again.');
    }

    const { payload, response } = await oauthFetch<OAuthTokenResponse>(
      io,
      session.tokenEndpoint,
      isOAuthTokenResponse,
      buildFormRequestInit({
        grant_type: 'refresh_token',
        refresh_token: session.refreshToken,
        client_id: 'dkcms-cli'
      })
    );
    if (!response.ok || !payload.access_token) {
      fail(extractResponseError(payload, response.status));
    }

    const nextSession: CmsSession = {
      ...session,
      accessToken: payload.access_token,
      expiresAt: expirationFromJwt(payload.access_token),
      refreshToken: payload.refresh_token ?? session.refreshToken,
      scope: payload.scope ?? session.scope,
      updatedAt: new Date().toISOString(),
      user: userFromJwt(payload.access_token)
    };
    await writeSession(io, nextSession);
    return nextSession;
  }

  if (!session.refreshToken) {
    fail('CMS session has expired. Run `dk cms login` again.');
  }

  const nextSession = await exchangeSession(io, session.baseUrl, { refreshToken: session.refreshToken }, '/api/cli/v1/auth/refresh');
  await writeSession(io, nextSession);
  return nextSession;
}

async function authorizedCmsFetch(
  io: CliIO,
  session: CmsSession,
  pathname: string,
  options: {
    body?: unknown;
    method?: string;
  } = {}
): Promise<{ payload: unknown; session: CmsSession }> {
  let activeSession = shouldRefreshSession(session) ? await refreshSession(io, session) : session;
  const fetchImpl = io.fetch ?? fetch;
  const requestUrl = new URL(pathname, activeSession.baseUrl);

  const send = async (accessToken: string): Promise<Response> =>
    fetchImpl(requestUrl, buildRequestInit(options.method ?? 'GET', accessToken, options.body));

  let response = await send(activeSession.accessToken);
  if (response.status === 401) {
    activeSession = await refreshSession(io, activeSession);
    response = await send(activeSession.accessToken);
  }

  const payload = await parseResponse(response, (value): value is unknown => value !== undefined);
  if (!response.ok) {
    fail(extractResponseError(payload, response.status));
  }

  if (activeSession !== session) {
    await writeSession(io, activeSession);
  }

  return { payload, session: activeSession };
}

function formatPayload(text: string, payload: unknown, format: CmsOutputFormat): string {
  return format === 'json' ? JSON.stringify(payload, null, 2) : text;
}

function formatSites(sites: CmsSite[]): string {
  if (sites.length === 0) {
    return 'No CMS sites yet.';
  }

  return ['dk cms sites', ...sites.map((site) => `${site.id}  ${site.slug}  ${site.name}`)].join('\n');
}

function formatPages(site: CmsSite, pages: CmsPage[]): string {
  if (pages.length === 0) {
    return `No pages yet for ${site.name}.`;
  }

  return [
    `dk cms pages (${site.slug})`,
    ...pages.map((page) =>
      `${page.id}  ${page.slug}  ${page.title}${page.publishedBuildId ? `  published=${page.publishedBuildId}` : ''}`
    )
  ].join('\n');
}

async function resolveSiteReference(
  io: CliIO,
  session: CmsSession,
  siteRef: string
): Promise<{ site: CmsSite; session: CmsSession }> {
  const { payload: rawPayload, session: nextSession } = await authorizedCmsFetch(io, session, '/api/dkcms/sites');
  const payload = rawPayload as { sites: CmsSite[] };
  const site = payload.sites.find((entry) => entry.id === siteRef || entry.slug === siteRef);
  if (!site) {
    fail(`Site "${siteRef}" was not found.`);
  }
  return { site, session: nextSession };
}

async function resolvePageReference(
  io: CliIO,
  session: CmsSession,
  siteId: string,
  pageRef: string
): Promise<{ page: CmsPage; pages: CmsPage[]; session: CmsSession }> {
  const { payload: rawPayload, session: nextSession } = await authorizedCmsFetch(
    io,
    session,
    `/api/dkcms/sites/${encodeURIComponent(siteId)}/pages`
  );
  const payload = rawPayload as { pages: CmsPage[] };
  const page = payload.pages.find((entry) => entry.id === pageRef || entry.slug === pageRef);
  if (!page) {
    fail(`Page "${pageRef}" was not found for site ${siteId}.`);
  }

  return { page, pages: payload.pages, session: nextSession };
}

function maybeSlugOrId(value: string | undefined, label: string): string {
  if (!value?.trim()) {
    fail(`${label} is required.`);
  }
  return value.trim();
}

function launchBrowser(url: string): boolean {
  const platform = process.platform;

  try {
    if (platform === 'darwin') {
      spawn('open', [url], { detached: true, stdio: 'ignore' }).unref();
      return true;
    }

    if (platform === 'win32') {
      spawn('rundll32', ['url.dll,FileProtocolHandler', url], { detached: true, stdio: 'ignore' }).unref();
      return true;
    }

    spawn('xdg-open', [url], { detached: true, stdio: 'ignore' }).unref();
    return true;
  } catch {
    return false;
  }
}

async function waitForAuthCode(io: CliIO, approvalUrl: string, port: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      server.close(() => {
        reject(new Error('Timed out waiting for browser approval.'));
      });
    }, CMS_LOGIN_TIMEOUT_MS);

    const server = createServer((request, response) => {
      const requestUrl = new URL(request.url ?? '/', `http://127.0.0.1:${port}`);
      if (requestUrl.pathname !== '/callback') {
        response.statusCode = 404;
        response.end('Not found.');
        return;
      }

      const code = requestUrl.searchParams.get('code')?.trim();
      if (!code) {
        response.statusCode = 400;
        response.end('Missing code.');
        return;
      }

      clearTimeout(timeoutId);
      response.setHeader('content-type', 'text/html; charset=utf-8');
      response.end(
        '<!doctype html><html><body style="font-family: ui-monospace, SFMono-Regular, Menlo, monospace; padding: 24px;"><h1>DesignKit CLI connected</h1><p>You can return to the terminal.</p></body></html>'
      );
      server.close(() => {
        resolve(code);
      });
    });

    server.on('error', (error) => {
      clearTimeout(timeoutId);
      reject(error);
    });

    server.listen(port, '127.0.0.1', () => {
      io.stdout(`Approval URL: ${approvalUrl}`);
      const shouldOpenBrowser = (io.getEnv?.('DKCMS_CLI_NO_OPEN') ?? process.env.DKCMS_CLI_NO_OPEN) !== '1';
      if (shouldOpenBrowser && !launchBrowser(approvalUrl)) {
        io.stdout('Browser launch failed. Open the approval URL manually.');
      }
    });
  });
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function pollDeviceToken(
  io: CliIO,
  tokenEndpoint: string,
  device: OAuthDeviceAuthorizationResponse,
  scope: string
): Promise<OAuthTokenResponse> {
  let intervalMs = Math.max(0.1, device.interval ?? 5) * 1000;
  const expiresAt = Date.now() + Math.max(30, device.expires_in ?? 120) * 1000;

  while (Date.now() < expiresAt) {
    await delay(intervalMs);
    const { payload, response } = await oauthFetch<OAuthTokenResponse>(
      io,
      tokenEndpoint,
      isOAuthTokenResponse,
      buildFormRequestInit({
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
        device_code: device.device_code,
        client_id: 'dkcms-cli',
        scope
      })
    );

    if (response.ok && payload.access_token) {
      return payload;
    }

    if (payload.error === 'authorization_pending') {
      continue;
    }

    if (payload.error === 'slow_down') {
      intervalMs += 5_000;
      continue;
    }

    fail(extractResponseError(payload, response.status));
  }

  fail('Timed out waiting for device authorization.');
}

async function loginWithOidcDevice(io: CliIO, flags: FlagMap, baseUrl: string): Promise<CmsSession | null> {
  const metadata = await discoverOAuthMetadata(io, baseUrl);
  if (!metadata?.device_authorization_endpoint || !metadata.token_endpoint) {
    return null;
  }

  const scope = getStringFlag(flags, 'scope') ?? defaultDkCmsScope(metadata);
  const { payload: device, response } = await oauthFetch<OAuthDeviceAuthorizationResponse>(
    io,
    metadata.device_authorization_endpoint,
    isOAuthDeviceAuthorizationResponse,
    buildFormRequestInit({
      client_id: 'dkcms-cli',
      scope
    })
  );
  if (!response.ok) {
    fail(extractResponseError(device, response.status));
  }

  const approvalUrl = device.verification_uri_complete ?? device.verification_uri;
  io.stdout('Waiting for OIDC device approval...');
  io.stdout(`Device code: ${device.user_code}`);
  io.stdout(`Approval URL: ${approvalUrl}`);

  const shouldOpenBrowser = (io.getEnv?.('DKCMS_CLI_NO_OPEN') ?? process.env.DKCMS_CLI_NO_OPEN) !== '1';
  if (shouldOpenBrowser && !launchBrowser(approvalUrl)) {
    io.stdout('Browser launch failed. Open the approval URL manually.');
  }

  const token = await pollDeviceToken(io, metadata.token_endpoint, device, scope);
  if (!token.access_token) {
    fail('OIDC device flow did not return an access token.');
  }

  return {
    accessToken: token.access_token,
    authMode: 'oidc-device',
    baseUrl,
    expiresAt: expirationFromJwt(token.access_token),
    refreshToken: token.refresh_token ?? null,
    scope: token.scope ?? scope,
    tokenEndpoint: metadata.token_endpoint,
    updatedAt: new Date().toISOString(),
    user: userFromJwt(token.access_token)
  };
}

async function loginWithLegacyBrowserFlow(io: CliIO, flags: FlagMap, baseUrl: string): Promise<CmsSession> {
  const port = getIntegerFlag(flags, 'callback-port', CMS_DEFAULT_CALLBACK_PORT);
  const callbackUrl = `http://127.0.0.1:${port}/callback`;
  const start = await cmsFetch<{ requestId: string }>(
    io,
    baseUrl,
    `/api/cli/v1/auth/start?callback_url=${encodeURIComponent(callbackUrl)}`
  );
  const approvalUrl = new URL(
    `/api/cli/v1/auth/authorize?request=${encodeURIComponent(start.requestId)}`,
    baseUrl
  ).toString();

  io.stdout('Waiting for browser approval...');
  const code = await waitForAuthCode(io, approvalUrl, port);
  const session = await exchangeSession(io, baseUrl, { code }, '/api/cli/v1/auth/exchange');
  return session;
}

async function login(io: CliIO, flags: FlagMap): Promise<string> {
  const baseUrl = resolveBaseUrl(flags, io);
  const useLegacy = flags['legacy-auth'] === true || getStringFlag(flags, 'auth') === 'legacy';
  const session = useLegacy
    ? await loginWithLegacyBrowserFlow(io, flags, baseUrl)
    : ((await loginWithOidcDevice(io, flags, baseUrl)) ?? (await loginWithLegacyBrowserFlow(io, flags, baseUrl)));

  await writeSession(io, session);

  return [
    'dk cms login',
    `Logged in as ${session.user.displayName} <${session.user.email}>.`,
    `Session saved to ${resolveSessionPath(io)}`
  ].join('\n');
}

async function listSites(io: CliIO, flags: FlagMap): Promise<string> {
  const format = resolveOutputFormat(flags);
  const session = await loadSession(io, flags);
  const { payload: rawPayload } = await authorizedCmsFetch(io, session, '/api/dkcms/sites');
  const payload = rawPayload as { sites: CmsSite[] };
  return formatPayload(formatSites(payload.sites), payload, format);
}

async function createSite(io: CliIO, flags: FlagMap): Promise<string> {
  const format = resolveOutputFormat(flags);
  const session = await loadSession(io, flags);
  const payload = {
    slug: maybeSlugOrId(getStringFlag(flags, 'slug'), 'Site slug'),
    name: maybeSlugOrId(getStringFlag(flags, 'name'), 'Site name'),
    query: maybeSlugOrId(getStringFlag(flags, 'query'), 'Site query'),
    theme: {
      baseColorInput: getStringFlag(flags, 'base-color') ?? '#295dff',
      ratioName: getStringFlag(flags, 'ratio') ?? 'perfect-fourth',
      motionPreset: getStringFlag(flags, 'motion') ?? 'snappy',
      mode: getStringFlag(flags, 'mode') === 'dark' ? 'dark' : 'light'
    }
  };

  const { payload: rawResponse } = await authorizedCmsFetch(io, session, '/api/dkcms/sites', {
    method: 'POST',
    body: payload
  });
  const response = rawResponse as { site: CmsSite };

  return formatPayload(
    `Created site ${response.site.name} (${response.site.slug}) with id ${response.site.id}.`,
    response,
    format
  );
}

async function updateSiteCommand(io: CliIO, flags: FlagMap, positional: string[]): Promise<string> {
  const format = resolveOutputFormat(flags);
  let session = await loadSession(io, flags);
  const siteRef = maybeSlugOrId(positional[2] ?? getStringFlag(flags, 'site'), 'Site reference');
  const resolved = await resolveSiteReference(io, session, siteRef);
  session = resolved.session;

  const patch: Record<string, unknown> = {};
  const slug = getStringFlag(flags, 'slug');
  const name = getStringFlag(flags, 'name');
  const query = getStringFlag(flags, 'query');
  const baseColorInput = getStringFlag(flags, 'base-color');
  const ratioName = getStringFlag(flags, 'ratio');
  const motionPreset = getStringFlag(flags, 'motion');
  const mode = getStringFlag(flags, 'mode');

  if (slug) patch.slug = slug;
  if (name) patch.name = name;
  if (query) patch.query = query;
  if (baseColorInput || ratioName || motionPreset || mode) {
    patch.theme = {
      ...(baseColorInput ? { baseColorInput } : {}),
      ...(ratioName ? { ratioName } : {}),
      ...(motionPreset ? { motionPreset } : {}),
      ...(mode ? { mode: mode === 'dark' ? 'dark' : 'light' } : {})
    };
  }

  if (Object.keys(patch).length === 0) {
    fail('Provide at least one site field to update.');
  }

  const { payload: rawPayload } = await authorizedCmsFetch(
    io,
    session,
    `/api/dkcms/sites/${encodeURIComponent(resolved.site.id)}`,
    {
      method: 'PATCH',
      body: patch
    }
  );
  const payload = rawPayload as { site: CmsSite };

  return formatPayload(
    `Updated site ${payload.site.name} (${payload.site.slug}).`,
    payload,
    format
  );
}

async function listPages(io: CliIO, flags: FlagMap, positional: string[]): Promise<string> {
  const format = resolveOutputFormat(flags);
  let session = await loadSession(io, flags);
  const siteRef = maybeSlugOrId(positional[2] ?? getStringFlag(flags, 'site'), 'Site reference');
  const resolvedSite = await resolveSiteReference(io, session, siteRef);
  session = resolvedSite.session;
  const { payload: rawPayload } = await authorizedCmsFetch(
    io,
    session,
    `/api/dkcms/sites/${encodeURIComponent(resolvedSite.site.id)}/pages`
  );
  const payload = rawPayload as { pages: CmsPage[] };

  return formatPayload(formatPages(resolvedSite.site, payload.pages), payload, format);
}

async function createOrUpdatePage(
  io: CliIO,
  flags: FlagMap,
  positional: string[],
  mode: 'create' | 'update'
): Promise<string> {
  const format = resolveOutputFormat(flags);
  let session = await loadSession(io, flags);
  const siteRef = maybeSlugOrId(positional[2] ?? getStringFlag(flags, 'site'), 'Site reference');
  const resolvedSite = await resolveSiteReference(io, session, siteRef);
  session = resolvedSite.session;

  const contentFile = maybeSlugOrId(getStringFlag(flags, 'file'), 'Content file');
  const content = await readEmailCampaignContent(io, contentFile);
  const payload = {
    slug: maybeSlugOrId(getStringFlag(flags, 'slug'), 'Page slug'),
    title: getStringFlag(flags, 'title')?.trim() || content.headline || content.subject || 'Untitled page',
    summary: getStringFlag(flags, 'summary') ?? content.dek,
    contentType: 'email-campaign' as const,
    content
  };

  if (mode === 'create') {
    const { payload: rawResponse } = await authorizedCmsFetch(
      io,
      session,
      `/api/dkcms/sites/${encodeURIComponent(resolvedSite.site.id)}/pages`,
      {
        method: 'POST',
        body: payload
      }
    );
    const response = rawResponse as { page: CmsPage };

    return formatPayload(
      `Created page ${response.page.title} (${response.page.slug}) with id ${response.page.id}.`,
      response,
      format
    );
  }

  const pageRef = maybeSlugOrId(positional[3] ?? getStringFlag(flags, 'page'), 'Page reference');
  const resolvedPage = await resolvePageReference(io, session, resolvedSite.site.id, pageRef);
  const { payload: rawResponse } = await authorizedCmsFetch(
    io,
    resolvedPage.session,
    `/api/dkcms/sites/${encodeURIComponent(resolvedSite.site.id)}/pages/${encodeURIComponent(resolvedPage.page.id)}`,
    {
      method: 'PATCH',
      body: payload
    }
  );
  const response = rawResponse as { page: CmsPage };

  return formatPayload(
    `Updated page ${response.page.title} (${response.page.slug}).`,
    response,
    format
  );
}

async function buildPage(io: CliIO, flags: FlagMap, positional: string[]): Promise<string> {
  const format = resolveOutputFormat(flags);
  let session = await loadSession(io, flags);
  const siteRef = maybeSlugOrId(positional[2] ?? getStringFlag(flags, 'site'), 'Site reference');
  const pageRef = maybeSlugOrId(positional[3] ?? getStringFlag(flags, 'page'), 'Page reference');
  const resolvedSite = await resolveSiteReference(io, session, siteRef);
  const resolvedPage = await resolvePageReference(io, resolvedSite.session, resolvedSite.site.id, pageRef);
  session = resolvedPage.session;

  const requestBody = {
    iterations: getIntegerFlag(flags, 'iterations', 3),
    embeddingMode: getStringFlag(flags, 'embedding-mode') ?? 'heuristic',
    embeddingModel: getStringFlag(flags, 'embedding-model') ?? '@cf/baai/bge-base-en-v1.5',
    refinementMode: getStringFlag(flags, 'refinement-mode') ?? 'heuristic'
  };

  const { payload: rawPayload } = await authorizedCmsFetch(
    io,
    session,
    `/api/dkcms/sites/${encodeURIComponent(resolvedSite.site.id)}/pages/${encodeURIComponent(resolvedPage.page.id)}/builds`,
    {
      method: 'POST',
      body: requestBody
    }
  );
  const payload = rawPayload as {
    buildId: string;
    statusUrl: string;
    pageUrl: string;
    emailUrl: string;
  };

  return formatPayload(
    [
      `Queued build ${payload.buildId} for ${resolvedPage.page.title}.`,
      `Status: ${new URL(payload.statusUrl, session.baseUrl).toString()}`,
      `Hosted page: ${new URL(payload.pageUrl, session.baseUrl).toString()}`,
      `Email artifact: ${new URL(payload.emailUrl, session.baseUrl).toString()}`
    ].join('\n'),
    payload,
    format
  );
}

async function submitPage(io: CliIO, flags: FlagMap, positional: string[]): Promise<string> {
  const format = resolveOutputFormat(flags);
  let session = await loadSession(io, flags);
  const siteRef = maybeSlugOrId(positional[2] ?? getStringFlag(flags, 'site'), 'Site reference');
  const resolvedSite = await resolveSiteReference(io, session, siteRef);
  session = resolvedSite.session;

  const contentFile = maybeSlugOrId(getStringFlag(flags, 'file'), 'Content file');
  const content = await readEmailCampaignContent(io, contentFile);
  const payload = {
    slug: maybeSlugOrId(getStringFlag(flags, 'slug'), 'Page slug'),
    title: getStringFlag(flags, 'title')?.trim() || content.headline || content.subject || 'Untitled page',
    summary: getStringFlag(flags, 'summary') ?? content.dek,
    contentType: 'email-campaign' as const,
    content,
    publish: flags.publish === true,
    build: {
      iterations: getIntegerFlag(flags, 'iterations', 3),
      embeddingMode: getStringFlag(flags, 'embedding-mode') ?? 'heuristic',
      embeddingModel: getStringFlag(flags, 'embedding-model') ?? '@cf/baai/bge-base-en-v1.5',
      refinementMode: getStringFlag(flags, 'refinement-mode') ?? 'heuristic'
    }
  };

  const { payload: rawResponse } = await authorizedCmsFetch(
    io,
    session,
    `/api/dkcms/sites/${encodeURIComponent(resolvedSite.site.id)}/pages/submit`,
    {
      method: 'POST',
      body: payload
    }
  );
  const response = rawResponse as CmsSubmitResponse;

  return formatPayload(
    [
      `${response.createdPage ? 'Created' : 'Updated'} page ${response.page.title} (${response.page.slug}).`,
      `Build ${response.build.id} is ${response.build.status}.`,
      `Hosted page: ${new URL(response.pageUrl, session.baseUrl).toString()}`,
      `Email artifact: ${new URL(response.emailUrl, session.baseUrl).toString()}`,
      ...(response.publicUrl ? [`Live URL: ${new URL(response.publicUrl, session.baseUrl).toString()}`] : [])
    ].join('\n'),
    response,
    format
  );
}

async function publishPage(io: CliIO, flags: FlagMap, positional: string[]): Promise<string> {
  const format = resolveOutputFormat(flags);
  let session = await loadSession(io, flags);
  const siteRef = maybeSlugOrId(positional[2] ?? getStringFlag(flags, 'site'), 'Site reference');
  const pageRef = maybeSlugOrId(positional[3] ?? getStringFlag(flags, 'page'), 'Page reference');
  const buildId = maybeSlugOrId(getStringFlag(flags, 'build'), 'Build id');
  const resolvedSite = await resolveSiteReference(io, session, siteRef);
  const resolvedPage = await resolvePageReference(io, resolvedSite.session, resolvedSite.site.id, pageRef);
  session = resolvedPage.session;

  const { payload: rawPayload } = await authorizedCmsFetch(
    io,
    session,
    `/api/dkcms/sites/${encodeURIComponent(resolvedSite.site.id)}/pages/${encodeURIComponent(resolvedPage.page.id)}/publish`,
    {
      method: 'POST',
      body: { buildId }
    }
  );
  const payload = rawPayload as { page: CmsPage; site: CmsSite; build: CmsBuild };

  const liveUrl = new URL(`/c/${payload.site.slug}/${payload.page.slug}`, session.baseUrl).toString();
  return formatPayload(
    `Published ${payload.page.title}. Live URL: ${liveUrl}`,
    { ...payload, liveUrl },
    format
  );
}

async function exportEmail(io: CliIO, flags: FlagMap, positional: string[]): Promise<string> {
  let session = await loadSession(io, flags);
  let buildId = getStringFlag(flags, 'build')?.trim() ?? '';

  if (!buildId) {
    const siteRef = maybeSlugOrId(positional[2] ?? getStringFlag(flags, 'site'), 'Site reference');
    const pageRef = maybeSlugOrId(positional[3] ?? getStringFlag(flags, 'page'), 'Page reference');
    const resolvedSite = await resolveSiteReference(io, session, siteRef);
    const resolvedPage = await resolvePageReference(io, resolvedSite.session, resolvedSite.site.id, pageRef);
    session = resolvedPage.session;
    buildId = resolvedPage.page.publishedBuildId ?? '';
    if (!buildId) {
      fail(`Page ${resolvedPage.page.slug} does not have a published build yet.`);
    }
  }

  const format = resolveArtifactFormat(flags);
  const { payload: rawPayload } = await authorizedCmsFetch(
    io,
    session,
    `/api/dkcms/builds/${encodeURIComponent(buildId)}/email`
  );
  const payload = rawPayload as {
    email: NonNullable<NonNullable<CmsBuild['result']>['email']>;
  };

  if (format === 'json') {
    return JSON.stringify(payload, null, 2);
  }

  return format === 'html' ? payload.email.html : payload.email.text;
}

export async function renderCmsCommand(flags: FlagMap, positional: string[], io: CliIO): Promise<string> {
  const noun = positional[0];
  const verb = positional[1];

  if (noun === 'login') {
    return login(io, flags);
  }

  if (noun === 'sites') {
    switch (verb) {
      case 'list':
        return listSites(io, flags);
      case 'create':
        return createSite(io, flags);
      case 'update':
        return updateSiteCommand(io, flags, positional);
      default:
        fail('Usage: dk cms sites <list|create|update> ...');
    }
  }

  if (noun === 'pages') {
    switch (verb) {
      case 'list':
        return listPages(io, flags, positional);
      case 'create':
        return createOrUpdatePage(io, flags, positional, 'create');
      case 'update':
        return createOrUpdatePage(io, flags, positional, 'update');
      case 'build':
        return buildPage(io, flags, positional);
      case 'publish':
        return publishPage(io, flags, positional);
      case 'submit':
        return submitPage(io, flags, positional);
      case 'export-email':
        return exportEmail(io, flags, positional);
      default:
        fail('Usage: dk cms pages <list|create|update|build|publish|submit|export-email> ...');
    }
  }

  fail('Usage: dk cms <login|sites|pages> ...');
}
