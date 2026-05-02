import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

import { describe, expect, it, vi } from 'vitest';

import { CLI_COMMANDS, HELP, parseArgs, runCli } from './cli.ts';

type CapturedIo = {
  io: {
    cwd: string;
    executableName: string;
      stdout: (text: string) => void;
      stderr: (text: string) => void;
      readFile: (filePath: string) => Promise<string>;
      readStdin: () => Promise<string>;
      fetch?: typeof fetch;
      getEnv?: (name: string) => string | undefined;
    };
  readonly stdout: string;
  readonly stderr: string;
};

function makeIo(files: Record<string, string> = {}): CapturedIo {
  let stdout = '';
  let stderr = '';
  return {
    io: {
      cwd: '/virtual',
      executableName: 'dk',
      stdout: (text: string) => {
        stdout += `${text}\n`;
      },
      stderr: (text: string) => {
        stderr += `${text}\n`;
      },
      readFile: (filePath: string) => {
        if (!(filePath in files)) {
          throw new Error(`Missing fixture: ${filePath}`);
        }
        return Promise.resolve(files[filePath]);
      },
      readStdin: () => Promise.resolve(''),
      getEnv: () => undefined
    },
    get stdout() {
      return stdout;
    },
    get stderr() {
      return stderr;
    }
  };
}

function fakeJwt(claims: Record<string, unknown>): string {
  const encode = (value: unknown): string => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${encode({ alg: 'RS256', typ: 'JWT' })}.${encode(claims)}.signature`;
}

function fakeDkCmsCliAccessToken(claims: { sub: string; email: string; name: string }): string {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    ...claims,
    iat: now,
    exp: now + 900,
    typ: 'dkcms-cli-access'
  };
  return `${Buffer.from(JSON.stringify(payload)).toString('base64url')}.signature`;
}

function requestBodyText(init: RequestInit | undefined): string {
  return typeof init?.body === 'string' ? init.body : '';
}

describe('cli', () => {
  it('lists every advertised tool command in help', () => {
    expect(CLI_COMMANDS).toEqual([
      'cms',
      'components',
      'perfect',
      'palette',
      'distinct',
      'contrast',
      'glass',
      'layout',
      'compose',
      'scale',
      'optical',
      'ease',
      'jerk',
      'typeset',
      'text',
      'linebreak',
      'audit',
      'target',
      'saliency',
      'future'
    ]);
    for (const command of CLI_COMMANDS) {
      expect(HELP.main).toContain(command);
    }
  });

  it('parses long flags with space-separated values', () => {
    expect(parseArgs(['scale', '--ratio', 'golden', '--base', '16'])).toEqual({
      command: 'scale',
      flags: {
        ratio: 'golden',
        base: '16'
      },
      positional: []
    });
  });

  it('renders help for the invoked executable name', async () => {
    const capture = makeIo();
    capture.io.executableName = 'dkcli';

    const code = await runCli(['--help'], capture.io);

    expect(code).toBe(0);
    expect(capture.stdout).toContain('dkcli — Design Kit CLI');
    expect(capture.stdout).toContain('Usage: dkcli <command> [options]');
  });

  it('emits pre-wrap whitespace rules for text output', async () => {
    const capture = makeIo();

    const code = await runCli(
      ['text', '--engine', 'advanced', '--white-space', 'pre-wrap', '--text', 'foo\n  bar'],
      capture.io
    );

    expect(code).toBe(0);
    expect(capture.stdout).toContain('white-space: pre-wrap;');
    expect(capture.stdout).toContain('advanced badness');
    expect(capture.stdout).toContain('prepared');
  });

  it('renders streamed width flow for linebreak output', async () => {
    const capture = makeIo();

    const code = await runCli(
      ['linebreak', '--font', '18', '--flow', '180x2x320', '--text', 'Flow the same text through two widths.'],
      capture.io
    );

    expect(code).toBe(0);
    expect(capture.stdout).toContain('Flow (');
    expect(capture.stdout).toContain('lead 180px / 2 lines');
    expect(capture.stdout).toContain('body 320px');
  });

  it('smoke-tests the full command surface', async () => {
    const rects = JSON.stringify([
      { id: 'hero', x: 24, y: 24, width: 180, height: 180 },
      { id: 'caption', x: 230, y: 42, width: 96, height: 54 }
    ]);
    const css = '.card { color: #0f172a; background: #ffffff; font-size: 16px; padding: 16px; border-radius: 8px; }';
    const design = JSON.stringify({
      frame: { width: 960, height: 620, padding: 32, gap: 20, columns: 12 },
      elements: [
        { id: 'hero', kind: 'text', role: 'title', x: 72, y: 118, width: 404, height: 138, color: '#151321' },
        { id: 'body', kind: 'text', role: 'body', x: 72, y: 292, width: 344, height: 116, color: '#34314a' }
      ]
    });
    const futureItems = JSON.stringify([
      { id: 'title', role: 'title', label: 'Headline', text: 'A clear headline for the page.' },
      { id: 'body', role: 'body', label: 'Content', text: 'Supporting body content for the layout.' },
      { id: 'cta', role: 'cta', label: 'Action', text: 'Call to action button.' }
    ]);
    const fixtures = {
      '/virtual/rects.json': rects,
      '/virtual/app.css': css,
      '/virtual/design.json': design,
      '/virtual/items.json': futureItems
    };

    const cases: Array<{ args: string[]; expected: string }> = [
      { args: ['components', 'verify', '--name', 'button', '--theme', 'cobalt'], expected: 'dk components verify' },
      { args: ['components', 'matrix', '--name', 'button', '--theme', 'cobalt'], expected: 'dk components matrix' },
      { args: ['perfect', '--seed', '#295dff', '--ratio', 'perfect-fourth', '--motion', 'snappy'], expected: '--perfect-base-color' },
      { args: ['palette', '#3b82f6', '--mode', 'both'], expected: '/* dk palette #3b82f6 --engine=' },
      { args: ['distinct', '#295dff', '--harmony', 'split-complementary'], expected: 'dk distinct' },
      { args: ['contrast', '#fff', '#2563eb', '--size', '16'], expected: 'APCA Lc' },
      { args: ['glass', '--blur', '16', '--layers', '2', '--mode', 'light'], expected: '.glass {' },
      { args: ['layout', '--container', '960', '--gap', '24'], expected: 'dk layout' },
      { args: ['compose', '--frame', '1440x900', '--rects', 'rects.json'], expected: 'dk compose' },
      { args: ['scale', '--ratio', 'golden', '--base', '16'], expected: '/* dk scale --ratio=golden --base=16 */' },
      { args: ['optical', 'icon', '--size', '48'], expected: 'transform:' },
      { args: ['ease', '--preset', 'snappy'], expected: 'transition-timing-function' },
      { args: ['jerk', '--duration', '0.6', '--samples', '32'], expected: 'transition-duration' },
      { args: ['text', '--font', '18', '--measure', '620', '--contrast', '72'], expected: 'line-height' },
      { args: ['typeset', '--font', '18', '--measure', '620', '--contrast', '72'], expected: 'line-height' },
      { args: ['linebreak', '--chars', '22', '--lines', '3'], expected: 'Balanced' },
      { args: ['audit', '--css', 'app.css'], expected: 'dk audit' },
      { args: ['target', '--distance', '320', '--width', '44', '--choices', '9', '--modality', 'touch'], expected: 'dk target' },
      { args: ['saliency', '--input', 'design.json'], expected: 'dk saliency' },
      { args: ['future', '--items', 'items.json', '--query', 'Design a simple landing page'], expected: 'dk future' }
    ];

    for (const testCase of cases) {
      const capture = makeIo(fixtures);
      const code = await runCli(testCase.args, capture.io);
      expect(code, testCase.args.join(' ')).toBe(0);
      expect(capture.stdout, testCase.args.join(' ')).toContain(testCase.expected);
      expect(capture.stderr, testCase.args.join(' ')).toBe('');
    }
  }, 60000);

  it('renders component verification JSON for a selected component and theme', async () => {
    const capture = makeIo();

    const code = await runCli(
      ['components', 'verify', '--name', 'table', '--theme', 'ember', '--format', 'json'],
      capture.io
    );

    expect(code).toBe(0);
    const payload = JSON.parse(capture.stdout) as {
      mode: string;
      summary: { pass: boolean; componentCount: number; themeCount: number };
      runs: Array<{ slug: string; themeId: string; pass: boolean }>;
    };
    expect(payload.mode).toBe('verify');
    expect(payload.summary.pass).toBe(true);
    expect(payload.summary.componentCount).toBe(1);
    expect(payload.summary.themeCount).toBe(1);
    expect(payload.runs).toHaveLength(1);
    expect(payload.runs[0]).toMatchObject({
      slug: 'table',
      themeId: 'ember',
      pass: true
    });
  });

  it('keeps ml saliency local unless a runtime URL is configured', async () => {
    const design = JSON.stringify({
      frame: { width: 960, height: 620, padding: 32, gap: 20, columns: 12 },
      elements: [
        { id: 'hero', kind: 'text', role: 'title', x: 72, y: 118, width: 404, height: 138, color: '#151321' },
        { id: 'body', kind: 'text', role: 'body', x: 72, y: 292, width: 344, height: 116, color: '#34314a' }
      ]
    });
    const capture = makeIo({ '/virtual/design.json': design });
    const fetchMock = vi.fn();
    capture.io.fetch = fetchMock as unknown as typeof fetch;

    const code = await runCli(['saliency', '--input', 'design.json', '--importance', 'ml'], capture.io);

    expect(code).toBe(0);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(capture.stdout).toContain('dk saliency — requested ml / resolved heuristic');
    expect(capture.stdout).toContain('runtime local (No runtime URL configured; fell back to local heuristic analysis.)');
    expect(capture.stdout).toContain('hero');
  });

  it('uses the configured runtime URL for ml saliency', async () => {
    const design = JSON.stringify({
      frame: { width: 960, height: 620, padding: 32, gap: 20, columns: 12 },
      elements: [
        { id: 'hero', kind: 'text', role: 'title', x: 72, y: 118, width: 404, height: 138, color: '#151321' },
        { id: 'body', kind: 'text', role: 'body', x: 72, y: 292, width: 344, height: 116, color: '#34314a' }
      ]
    });
    const capture = makeIo({ '/virtual/design.json': design });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          mode: 'ml',
          focusRegions: [],
          elements: [
            { id: 'hero', score: 0.91, normalized: 0.62, reasons: ['runtime'], relationHints: [] },
            { id: 'body', score: 0.56, normalized: 0.38, reasons: ['runtime'], relationHints: [] }
          ]
        })
    });
    capture.io.fetch = fetchMock as unknown as typeof fetch;

    const code = await runCli(
      ['saliency', '--input', 'design.json', '--importance', 'ml', '--runtime-url', 'https://dkcli.com'],
      capture.io
    );

    expect(code).toBe(0);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://dkcli.com/api/dk/saliency',
      expect.objectContaining({ method: 'POST' })
    );
    expect(capture.stdout).toContain('runtime remote https://dkcli.com');
    expect(capture.stdout).toContain('hero');
  });

  it('logs into dkcms with OIDC device flow and persists a JWT session', async () => {
    const configDir = await mkdtemp(path.join(tmpdir(), 'dkcms-cli-'));
    const capture = makeIo();
    const env = {
      DKCMS_BASE_URL: 'https://cms.example.com',
      DKCMS_CLI_CONFIG_DIR: configDir,
      DKCMS_CLI_NO_OPEN: '1'
    };
    capture.io.getEnv = (name) => env[name as keyof typeof env];

    const accessToken = fakeJwt({
      sub: 'user-oidc',
      email: 'oidc@example.com',
      name: 'Orion',
      exp: Math.floor(Date.now() / 1000) + 900,
      scope: 'openid profile email dkcms:read dkcms:write'
    });

    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = input instanceof URL ? input.toString() : typeof input === 'string' ? input : input.url;

      if (url === 'https://cms.example.com/.well-known/oauth-authorization-server') {
        return {
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () =>
            Promise.resolve({
              issuer: 'https://mere.world',
              device_authorization_endpoint: 'https://mere.world/oauth/device_authorization',
              token_endpoint: 'https://mere.world/oauth/token',
              scopes_supported: ['openid', 'profile', 'email', 'dkcms:read', 'dkcms:write']
            })
        };
      }

      if (url === 'https://mere.world/oauth/device_authorization') {
        expect(init?.method).toBe('POST');
        expect(requestBodyText(init)).toContain('client_id=dkcms-cli');
        return {
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () =>
            Promise.resolve({
              device_code: 'device-1',
              user_code: 'ABCD-EFGH',
              verification_uri: 'https://mere.world/device',
              verification_uri_complete: 'https://mere.world/device?user_code=ABCD-EFGH',
              expires_in: 60,
              interval: 0
            })
        };
      }

      if (url === 'https://mere.world/oauth/token') {
        expect(init?.method).toBe('POST');
        expect(requestBodyText(init)).toContain('device_code=device-1');
        return {
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () =>
            Promise.resolve({
              access_token: accessToken,
              token_type: 'Bearer',
              expires_in: 900,
              scope: 'openid profile email dkcms:read dkcms:write'
            })
        };
      }

      throw new Error(`Unexpected fetch to ${url}`);
    });
    capture.io.fetch = fetchMock as unknown as typeof fetch;

    const code = await runCli(['cms', 'login'], capture.io);

    expect(code).toBe(0);
    expect(capture.stdout).toContain('Device code: ABCD-EFGH');
    expect(capture.stdout).toContain('Logged in as Orion <oidc@example.com>.');

    const session = JSON.parse(await readFile(path.join(configDir, 'dkcms-session.json'), 'utf8')) as {
      accessToken: string;
      authMode: string;
      user: { email: string };
    };
    expect(session.authMode).toBe('oidc-device');
    expect(session.accessToken).toBe(accessToken);
    expect(session.user.email).toBe('oidc@example.com');

    await rm(configDir, { recursive: true, force: true });
  });

  it('falls back to legacy dkcms login and persists a local session', async () => {
    const configDir = await mkdtemp(path.join(tmpdir(), 'dkcms-cli-'));
    const capture = makeIo();
    const env = {
      DKCMS_BASE_URL: 'https://cms.example.com',
      DKCMS_CLI_CONFIG_DIR: configDir,
      DKCMS_CLI_NO_OPEN: '1'
    };
    capture.io.getEnv = (name) => env[name as keyof typeof env];

    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = input instanceof URL ? input.toString() : typeof input === 'string' ? input : input.url;

      if (
        url ===
        'https://cms.example.com/api/cli/v1/auth/start?callback_url=http%3A%2F%2F127.0.0.1%3A9137%2Fcallback'
      ) {
        return {
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve({ requestId: 'req-1' })
        };
      }

      if (url === 'https://cms.example.com/api/cli/v1/auth/exchange') {
        expect(init?.method).toBe('POST');
        expect(JSON.parse(init?.body as string)).toEqual({ code: 'code-1' });
        return {
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () =>
            Promise.resolve({
              accessToken: 'access-token-1',
              refreshToken: 'refresh-token-1',
              user: {
                userId: 'user-1',
                email: 'hello@example.com',
                displayName: 'Casey'
              }
            })
        };
      }

      throw new Error(`Unexpected fetch to ${url}`);
    });
    capture.io.fetch = fetchMock as unknown as typeof fetch;

    const loginPromise = runCli(['cms', 'login', '--callback-port', '9137'], capture.io);
    await delay(20);
    await fetch('http://127.0.0.1:9137/callback?code=code-1');

    const code = await loginPromise;

    expect(code).toBe(0);
    expect(capture.stdout).toContain('Logged in as Casey <hello@example.com>.');

    const sessionPath = path.join(configDir, 'dkcms-session.json');
    const session = JSON.parse(await readFile(sessionPath, 'utf8')) as {
      baseUrl: string;
      refreshToken: string;
      user: { email: string };
    };
    expect(session.baseUrl).toBe('https://cms.example.com');
    expect(session.refreshToken).toBe('refresh-token-1');
    expect(session.user.email).toBe('hello@example.com');

    await rm(configDir, { recursive: true, force: true });
  });

  it('refreshes the dkcms session before listing sites when the access token is stale', async () => {
    const configDir = await mkdtemp(path.join(tmpdir(), 'dkcms-cli-'));
    const capture = makeIo();
    const env = {
      DKCMS_BASE_URL: 'https://cms.example.com',
      DKCMS_CLI_CONFIG_DIR: configDir
    };
    capture.io.getEnv = (name) => env[name as keyof typeof env];

    await writeFile(
      path.join(configDir, 'dkcms-session.json'),
      JSON.stringify({
        baseUrl: 'https://cms.example.com',
        accessToken: 'stale-token',
        refreshToken: 'refresh-token-1',
        updatedAt: new Date().toISOString(),
        user: {
          userId: 'user-1',
          email: 'hello@example.com',
          displayName: 'Casey'
        }
      }),
      'utf8'
    );

    const freshAccessToken = fakeDkCmsCliAccessToken({
      sub: 'user-1',
      email: 'hello@example.com',
      name: 'Casey'
    });

    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = input instanceof URL ? input.toString() : typeof input === 'string' ? input : input.url;

      if (url === 'https://cms.example.com/api/cli/v1/auth/refresh') {
        expect(JSON.parse(init?.body as string)).toEqual({ refreshToken: 'refresh-token-1' });
        return {
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () =>
            Promise.resolve({
              accessToken: freshAccessToken,
              refreshToken: 'refresh-token-2',
              user: {
                userId: 'user-1',
                email: 'hello@example.com',
                displayName: 'Casey'
              }
            })
        };
      }

      if (url === 'https://cms.example.com/api/dkcms/sites') {
        const headers = new Headers(init?.headers);
        expect(headers.get('authorization')).toBe(`Bearer ${freshAccessToken}`);
        return {
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () =>
            Promise.resolve({
              sites: [{ id: 'site-1', slug: 'spring-launch', name: 'Spring Launch' }]
            })
        };
      }

      throw new Error(`Unexpected fetch to ${url}`);
    });
    capture.io.fetch = fetchMock as unknown as typeof fetch;

    const code = await runCli(['cms', 'sites', 'list'], capture.io);

    expect(code).toBe(0);
    expect(capture.stdout).toContain('site-1  spring-launch  Spring Launch');

    const stored = JSON.parse(await readFile(path.join(configDir, 'dkcms-session.json'), 'utf8')) as {
      refreshToken: string;
    };
    expect(stored.refreshToken).toBe('refresh-token-2');

    await rm(configDir, { recursive: true, force: true });
  });

  it('smoke-tests the dkcms page create, build, publish, and email export commands', async () => {
    const configDir = await mkdtemp(path.join(tmpdir(), 'dkcms-cli-'));
    const fixtureDir = await mkdtemp(path.join(tmpdir(), 'dkcms-content-'));
    const capture = makeIo();
    const env = {
      DKCMS_BASE_URL: 'https://cms.example.com',
      DKCMS_CLI_CONFIG_DIR: configDir
    };
    capture.io.getEnv = (name) => env[name as keyof typeof env];

    const accessToken = fakeDkCmsCliAccessToken({
      sub: 'user-1',
      email: 'hello@example.com',
      name: 'Casey'
    });

    await writeFile(
      path.join(configDir, 'dkcms-session.json'),
      JSON.stringify({
        baseUrl: 'https://cms.example.com',
        accessToken,
        refreshToken: 'refresh-token-1',
        updatedAt: new Date().toISOString(),
        user: {
          userId: 'user-1',
          email: 'hello@example.com',
          displayName: 'Casey'
        }
      }),
      'utf8'
    );

    const contentPath = path.join(fixtureDir, 'campaign.json');
    await writeFile(
      contentPath,
      JSON.stringify({
        subject: 'Meet the April launch',
        preheader: 'A clearer story, faster shipping, one focused CTA.',
        eyebrow: 'April launch',
        headline: 'A launch story your customers can scan in seconds',
        dek: 'Give the page and the inbox message one shared story arc.',
        primaryCta: {
          label: 'See what shipped',
          href: 'https://example.com/launch',
          supportingText: 'Read the release and start your trial.'
        },
        sections: [
          {
            id: 'section-1',
            kind: 'feature',
            heading: 'Why it matters',
            body: 'Lead with the outcome first, then unpack the details.'
          }
        ],
        footerNote: 'You are receiving this update because you opted in.'
      }),
      'utf8'
    );
    capture.io.readFile = (filePath: string) => readFile(filePath, 'utf8');

    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = input instanceof URL ? input.toString() : typeof input === 'string' ? input : input.url;

      if (url === 'https://cms.example.com/api/dkcms/sites') {
        return {
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () =>
            Promise.resolve({
              sites: [{ id: 'site-1', slug: 'spring-launch', name: 'Spring Launch' }]
            })
        };
      }

      if (url === 'https://cms.example.com/api/dkcms/sites/site-1/pages' && (!init || init.method === 'GET')) {
        return {
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () =>
            Promise.resolve({
              pages: [{ id: 'page-1', slug: 'launch-01', title: 'April launch campaign', publishedBuildId: 'build-1' }]
            })
        };
      }

      if (url === 'https://cms.example.com/api/dkcms/sites/site-1/pages' && init?.method === 'POST') {
        const body = JSON.parse(init.body as string) as { slug: string; title: string };
        expect(body.slug).toBe('launch-01');
        expect(body.title).toBe('April launch campaign');
        return {
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () =>
            Promise.resolve({
              page: { id: 'page-1', slug: body.slug, title: body.title }
            })
        };
      }

      if (url === 'https://cms.example.com/api/dkcms/sites/site-1/pages/page-1/builds') {
        return {
          ok: true,
          status: 202,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () =>
            Promise.resolve({
              buildId: 'build-1',
              statusUrl: '/api/dkcms/builds/build-1',
              pageUrl: '/api/dkcms/builds/build-1/page',
              emailUrl: '/api/dkcms/builds/build-1/email'
            })
        };
      }

      if (url === 'https://cms.example.com/api/dkcms/sites/site-1/pages/page-1/publish') {
        return {
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () =>
            Promise.resolve({
              site: { slug: 'spring-launch' },
              page: { slug: 'launch-01', title: 'April launch campaign' },
              build: { id: 'build-1' }
            })
        };
      }

      if (url === 'https://cms.example.com/api/dkcms/builds/build-1/email') {
        return {
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () =>
            Promise.resolve({
              email: {
                subject: 'Meet the April launch',
                preheader: 'A clearer story, faster shipping, one focused CTA.',
                html: '<html><body><h1>Meet the April launch</h1></body></html>',
                text: 'Meet the April launch\n\nA clearer story, faster shipping, one focused CTA.'
              }
            })
        };
      }

      throw new Error(`Unexpected fetch to ${url}`);
    });
    capture.io.fetch = fetchMock as unknown as typeof fetch;

    expect(
      await runCli(
        ['cms', 'pages', 'create', 'spring-launch', '--slug', 'launch-01', '--title', 'April launch campaign', '--file', contentPath],
        capture.io
      )
    ).toBe(0);
    expect(capture.stdout).toContain('Created page April launch campaign (launch-01) with id page-1.');
    const buildIo = makeIo();
    buildIo.io.getEnv = capture.io.getEnv;
    buildIo.io.fetch = fetchMock as unknown as typeof fetch;

    const buildCode = await runCli(['cms', 'pages', 'build', 'spring-launch', 'launch-01'], buildIo.io);
    expect(buildCode).toBe(0);
    expect(buildIo.stdout).toContain('Queued build build-1 for April launch campaign.');

    const publishIo = makeIo();
    publishIo.io.getEnv = capture.io.getEnv;
    publishIo.io.fetch = fetchMock as unknown as typeof fetch;
    const publishCode = await runCli(
      ['cms', 'pages', 'publish', 'spring-launch', 'launch-01', '--build', 'build-1'],
      publishIo.io
    );
    expect(publishCode).toBe(0);
    expect(publishIo.stdout).toContain('Published April launch campaign. Live URL: https://cms.example.com/c/spring-launch/launch-01');

    const exportIo = makeIo();
    exportIo.io.getEnv = capture.io.getEnv;
    exportIo.io.fetch = fetchMock as unknown as typeof fetch;
    const exportCode = await runCli(
      ['cms', 'pages', 'export-email', '--build', 'build-1', '--format', 'text'],
      exportIo.io
    );
    expect(exportCode).toBe(0);
    expect(exportIo.stdout).toContain('Meet the April launch');

    await rm(configDir, { recursive: true, force: true });
    await rm(fixtureDir, { recursive: true, force: true });
  });

  it('submits a typed campaign in one step and returns the build URLs', async () => {
    const configDir = await mkdtemp(path.join(tmpdir(), 'dkcms-cli-'));
    const fixtureDir = await mkdtemp(path.join(tmpdir(), 'dkcms-content-'));
    const capture = makeIo();
    const env = {
      DKCMS_BASE_URL: 'https://cms.example.com',
      DKCMS_CLI_CONFIG_DIR: configDir
    };
    capture.io.getEnv = (name) => env[name as keyof typeof env];

    const accessToken = fakeDkCmsCliAccessToken({
      sub: 'user-1',
      email: 'hello@example.com',
      name: 'Casey'
    });

    await writeFile(
      path.join(configDir, 'dkcms-session.json'),
      JSON.stringify({
        baseUrl: 'https://cms.example.com',
        accessToken,
        refreshToken: 'refresh-token-1',
        updatedAt: new Date().toISOString(),
        user: {
          userId: 'user-1',
          email: 'hello@example.com',
          displayName: 'Casey'
        }
      }),
      'utf8'
    );

    const contentPath = path.join(fixtureDir, 'campaign.json');
    await writeFile(
      contentPath,
      JSON.stringify({
        subject: 'Meet the April launch',
        preheader: 'A clearer story, faster shipping, one focused CTA.',
        eyebrow: 'April launch',
        headline: 'A launch story your customers can scan in seconds',
        dek: 'Give the page and the inbox message one shared story arc.',
        primaryCta: {
          label: 'See what shipped',
          href: 'https://example.com/launch',
          supportingText: 'Read the release and start your trial.'
        },
        sections: [],
        footerNote: 'You are receiving this update because you opted in.'
      }),
      'utf8'
    );
    capture.io.readFile = (filePath: string) => readFile(filePath, 'utf8');

    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = input instanceof URL ? input.toString() : typeof input === 'string' ? input : input.url;

      if (url === 'https://cms.example.com/api/dkcms/sites') {
        return {
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () =>
            Promise.resolve({
              sites: [{ id: 'site-1', slug: 'spring-launch', name: 'Spring Launch' }]
            })
        };
      }

      if (url === 'https://cms.example.com/api/dkcms/sites/site-1/pages/submit') {
        const body = JSON.parse(init?.body as string) as { publish: boolean; slug: string; build: { iterations: number } };
        expect(body.slug).toBe('launch-01');
        expect(body.publish).toBe(true);
        expect(body.build.iterations).toBe(4);
        return {
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () =>
            Promise.resolve({
              site: { id: 'site-1', slug: 'spring-launch', name: 'Spring Launch' },
              page: { id: 'page-1', slug: 'launch-01', title: 'April launch campaign' },
              build: { id: 'build-1', status: 'complete' },
              createdPage: true,
              statusUrl: '/api/dkcms/builds/build-1',
              pageUrl: '/api/dkcms/builds/build-1/page',
              emailUrl: '/api/dkcms/builds/build-1/email',
              publicUrl: '/c/spring-launch/launch-01'
            })
        };
      }

      throw new Error(`Unexpected fetch to ${url}`);
    });
    capture.io.fetch = fetchMock as unknown as typeof fetch;

    const code = await runCli(
      [
        'cms',
        'pages',
        'submit',
        'spring-launch',
        '--slug',
        'launch-01',
        '--title',
        'April launch campaign',
        '--file',
        contentPath,
        '--iterations',
        '4',
        '--publish'
      ],
      capture.io
    );

    expect(code).toBe(0);
    expect(capture.stdout).toContain('Created page April launch campaign (launch-01).');
    expect(capture.stdout).toContain('Hosted page: https://cms.example.com/api/dkcms/builds/build-1/page');
    expect(capture.stdout).toContain('Email artifact: https://cms.example.com/api/dkcms/builds/build-1/email');
    expect(capture.stdout).toContain('Live URL: https://cms.example.com/c/spring-launch/launch-01');

    await rm(configDir, { recursive: true, force: true });
    await rm(fixtureDir, { recursive: true, force: true });
  });
});
